import { json } from '@sveltejs/kit';
import mpesaService from '../../../../lib/services/mpesa.js';
import db from '../../../../lib/services/database.js';

/**
 * Handle M-Pesa STK Push callback
 * This endpoint receives payment confirmations from Safaricom
 */
export async function POST({ request }) {
  try {
    const callbackData = await request.json();
    
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));
    
    // Process the callback data
    const processedCallback = mpesaService.processCallback(callbackData);
    
    if (!processedCallback) {
      console.error('Failed to process callback data');
      return json({ ResultCode: 1, ResultDesc: 'Failed to process callback' });
    }

    const { 
      checkoutRequestId, 
      merchantRequestId, 
      resultCode, 
      resultDesc, 
      success, 
      transactionData 
    } = processedCallback;

    // Find the pending transaction
    const pendingTransaction = db.prepare(`
      SELECT * FROM pending_transactions 
      WHERE checkout_request_id = ? AND merchant_request_id = ?
    `).get(checkoutRequestId, merchantRequestId);

    if (!pendingTransaction) {
      console.error('Pending transaction not found:', { checkoutRequestId, merchantRequestId });
      return json({ ResultCode: 1, ResultDesc: 'Transaction not found' });
    }

    if (success && resultCode === 0) {
      // Payment was successful
      try {
        // Begin transaction
        db.exec('BEGIN TRANSACTION');

        // Insert successful donation
        const donationResult = db.prepare(`
          INSERT INTO donations (
            amount, 
            project_id, 
            mpesa_code, 
            phone_number,
            transaction_ref,
            transaction_date,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          transactionData.amount,
          pendingTransaction.project_id,
          transactionData.mpesaReceiptNumber,
          transactionData.phoneNumber,
          pendingTransaction.transaction_ref,
          transactionData.transactionDate
        );

        // Update project raised amount
        db.prepare(`
          UPDATE projects 
          SET raised_amount = raised_amount + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(transactionData.amount, pendingTransaction.project_id);

        // Update pending transaction status
        db.prepare(`
          UPDATE pending_transactions 
          SET status = 'completed', 
              mpesa_receipt_number = ?,
              completed_at = CURRENT_TIMESTAMP
          WHERE checkout_request_id = ?
        `).run(transactionData.mpesaReceiptNumber, checkoutRequestId);

        // Commit transaction
        db.exec('COMMIT');

        console.log('Payment processed successfully:', {
          donationId: donationResult.lastInsertRowid,
          amount: transactionData.amount,
          projectId: pendingTransaction.project_id,
          mpesaCode: transactionData.mpesaReceiptNumber
        });

      } catch (dbError) {
        // Rollback on error
        db.exec('ROLLBACK');
        console.error('Database error processing payment:', dbError);
        return json({ ResultCode: 1, ResultDesc: 'Database error' });
      }

    } else {
      // Payment failed
      db.prepare(`
        UPDATE pending_transactions 
        SET status = 'failed', 
            failure_reason = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).run(resultDesc, checkoutRequestId);

      console.log('Payment failed:', {
        checkoutRequestId,
        resultCode,
        resultDesc
      });
    }

    // Acknowledge receipt of callback
    return json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('M-Pesa callback processing error:', error);
    return json({ 
      ResultCode: 1, 
      ResultDesc: 'Internal server error' 
    });
  }
}