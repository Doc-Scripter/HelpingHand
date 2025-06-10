import { json } from '@sveltejs/kit';
import mpesaService from '../../../lib/services/mpesa.js';
import db from '../../../lib/services/database.js';

export async function POST({ request }) {
  try {
    const { project_id, amount, phone_number } = await request.json();
    
    if (!project_id || !amount || !phone_number) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (amount < 1) {
      return json({ error: 'Minimum donation amount is KSh 1' }, { status: 400 });
    }
    
    // Verify project exists and is active
    /** @type {any} */
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND status = ?').get(project_id, 'active');
    if (!project) {
      return json({ error: 'Project not found or inactive' }, { status: 404 });
    }
    
    // Check M-Pesa configuration
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      return json({ 
        error: 'M-Pesa payment service is not configured. Please contact support.' 
      }, { status: 503 });
    }
    
    try {
      // Generate unique transaction reference
      const transactionRef = `HH-${project_id}-${Date.now()}`;
      
      // Prepare payment data
      const paymentData = {
        phoneNumber: phone_number,
        amount: amount,
        accountReference: transactionRef,
        transactionDesc: `Donation to ${project.title || 'Project'}`
      };

      console.log('Initiating M-Pesa STK Push:', {
        amount,
        phoneNumber: phone_number,
        projectId: project_id,
        projectTitle: project.title,
        transactionRef
      });

      // Initiate STK Push
      /** @type {any} */
      const stkResult = await mpesaService.initiateSTKPush(paymentData);
      
      if (!stkResult.success) {
        console.error('STK Push failed:', stkResult);
        return json({ 
          success: false, 
          error: stkResult.error || 'Failed to initiate M-Pesa payment',
          code: stkResult.code 
        }, { status: 400 });
      }

      console.log('STK Push successful:', {
        checkoutRequestId: stkResult.checkoutRequestId,
        merchantRequestId: stkResult.merchantRequestId
      });

      // Store pending transaction in database
      try {
        db.prepare(`
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

        console.log('Pending transaction stored successfully');

      } catch (dbError) {
        console.error('Database error storing pending transaction:', dbError);
        return json({ 
          success: false, 
          error: 'Failed to store transaction. Please try again.' 
        }, { status: 500 });
      }

      return json({
        success: true,
        message: 'STK Push initiated successfully. Please check your phone for M-Pesa prompt.',
        checkoutRequestId: stkResult.checkoutRequestId,
        customerMessage: stkResult.customerMessage,
        transactionRef: transactionRef,
        instructions: 'You will receive an M-Pesa prompt on your phone within 30 seconds. Enter your M-Pesa PIN to complete the donation.'
      }, { status: 200 });

    } catch (mpesaError) {
      console.error('M-Pesa integration error:', mpesaError);
      return json({ 
        success: false, 
        error: 'M-Pesa service temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Donation API error:', error);
    return json({ error: 'Failed to process donation request' }, { status: 500 });
  }
}