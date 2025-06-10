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
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND status = ?').get(project_id, 'active');
    if (!project) {
      return json({ error: 'Project not found or inactive' }, { status: 404 });
    }
    
    // Check if M-Pesa is properly configured
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      console.warn('M-Pesa not configured, using simulation mode');
      
      // Simulate M-Pesa payment for development/demo
      const mpesa_code = 'SIM' + Date.now().toString().slice(-8);
      
      // Insert donation record directly
      const result = db.prepare(`
        INSERT INTO donations (amount, project_id, mpesa_code, phone_number, transaction_ref)
        VALUES (?, ?, ?, ?, ?)
      `).run(amount, project_id, mpesa_code, phone_number, `HH-${project_id}-${Date.now()}`);
      
      // Update project raised amount
      db.prepare(`
        UPDATE projects 
        SET raised_amount = raised_amount + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(amount, project_id);
      
      return json({
        success: true,
        donation_id: result.lastInsertRowid,
        mpesa_code,
        message: 'Donation processed successfully (simulation mode)',
        simulation: true
      }, { status: 201 });
    }
    
    // Use real M-Pesa integration
    try {
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

      return json({
        success: true,
        message: 'STK Push initiated successfully. Please check your phone for M-Pesa prompt.',
        checkoutRequestId: stkResult.checkoutRequestId,
        customerMessage: stkResult.customerMessage,
        transactionRef: transactionRef,
        instructions: 'You will receive an M-Pesa prompt on your phone. Enter your M-Pesa PIN to complete the donation.'
      }, { status: 200 });

    } catch (mpesaError) {
      console.error('M-Pesa integration error:', mpesaError);
      return json({ 
        success: false, 
        error: 'Failed to process M-Pesa payment. Please try again.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Donation error:', error);
    return json({ error: 'Failed to process donation' }, { status: 500 });
  }
}