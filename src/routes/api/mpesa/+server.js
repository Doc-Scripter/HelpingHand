import { json } from '@sveltejs/kit';
import mpesaService from '../../../lib/services/mpesa.js';
import db from '../../../lib/services/database.js';

/**
 * Initiate M-Pesa STK Push payment
 */
export async function POST({ request }) {
  try {
    const { project_id, amount, phone_number } = await request.json();
    
    // Validate input
    if (!project_id || !amount || !phone_number) {
      return json({ 
        success: false, 
        error: 'Missing required fields: project_id, amount, phone_number' 
      }, { status: 400 });
    }

    // Validate amount
    if (amount < 1) {
      return json({ 
        success: false, 
        error: 'Minimum donation amount is KSh 1' 
      }, { status: 400 });
    }

    // Check if project exists and is active
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND status = ?').get(project_id, 'active');
    if (!project) {
      return json({ 
        success: false, 
        error: 'Project not found or inactive' 
      }, { status: 404 });
    }

    // Generate unique transaction reference
    const transactionRef = `HH-${project_id}-${Date.now()}`;
    
    // Prepare payment data
    const paymentData = {
      phoneNumber: phone_number,
      amount: amount,
      accountReference: transactionRef,
      transactionDesc: `Donation to ${project.title}`
    };

    // Initiate STK Push
    const stkResult = await mpesaService.initiateSTKPush(paymentData);
    
    if (!stkResult.success) {
      return json({ 
        success: false, 
        error: stkResult.error,
        code: stkResult.code 
      }, { status: 400 });
    }

    // Store pending transaction in database
    const pendingTransaction = db.prepare(`
      INSERT INTO pending_transactions (
        checkout_request_id, 
        merchant_request_id, 
        project_id, 
        amount, 
        phone_number, 
        transaction_ref,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      stkResult.checkoutRequestId,
      stkResult.merchantRequestId,
      project_id,
      amount,
      phone_number,
      transactionRef,
      'pending'
    );

    return json({
      success: true,
      message: 'STK Push initiated successfully',
      checkoutRequestId: stkResult.checkoutRequestId,
      customerMessage: stkResult.customerMessage,
      transactionRef: transactionRef
    }, { status: 200 });

  } catch (error) {
    console.error('M-Pesa payment initiation error:', error);
    return json({ 
      success: false, 
      error: 'Failed to initiate payment' 
    }, { status: 500 });
  }
}

/**
 * Query STK Push transaction status
 */
export async function GET({ url }) {
  try {
    const checkoutRequestId = url.searchParams.get('checkout_request_id');
    
    if (!checkoutRequestId) {
      return json({ 
        success: false, 
        error: 'Missing checkout_request_id parameter' 
      }, { status: 400 });
    }

    // Query M-Pesa for transaction status
    const statusResult = await mpesaService.querySTKPushStatus(checkoutRequestId);
    
    if (!statusResult.success) {
      return json({ 
        success: false, 
        error: statusResult.error 
      }, { status: 400 });
    }

    // Check local database for transaction status
    const localTransaction = db.prepare(`
      SELECT * FROM pending_transactions 
      WHERE checkout_request_id = ?
    `).get(checkoutRequestId);

    return json({
      success: true,
      mpesaStatus: statusResult,
      localTransaction: localTransaction
    }, { status: 200 });

  } catch (error) {
    console.error('M-Pesa status query error:', error);
    return json({ 
      success: false, 
      error: 'Failed to query transaction status' 
    }, { status: 500 });
  }
}