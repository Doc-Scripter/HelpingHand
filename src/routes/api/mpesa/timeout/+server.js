import { json } from '@sveltejs/kit';
import db from '../../../../lib/services/database.js';

/**
 * Handle M-Pesa STK Push timeout
 * This endpoint is called when a payment request times out
 */
export async function POST({ request }) {
  try {
    const timeoutData = await request.json();
    
    console.log('M-Pesa Timeout received:', JSON.stringify(timeoutData, null, 2));
    
    const { 
      CheckoutRequestID: checkoutRequestId,
      MerchantRequestID: merchantRequestId,
      ResultCode: resultCode,
      ResultDesc: resultDesc 
    } = timeoutData;

    // Update pending transaction status to timeout
    const updateResult = db.prepare(`
      UPDATE pending_transactions 
      SET status = 'timeout', 
          failure_reason = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE checkout_request_id = ? AND merchant_request_id = ?
    `).run(resultDesc, checkoutRequestId, merchantRequestId);

    if (updateResult.changes > 0) {
      console.log('Transaction marked as timeout:', {
        checkoutRequestId,
        merchantRequestId,
        resultCode,
        resultDesc
      });
    } else {
      console.warn('No pending transaction found for timeout:', {
        checkoutRequestId,
        merchantRequestId
      });
    }

    // Acknowledge receipt of timeout notification
    return json({ 
      ResultCode: 0, 
      ResultDesc: 'Timeout processed successfully' 
    });

  } catch (error) {
    console.error('M-Pesa timeout processing error:', error);
    return json({ 
      ResultCode: 1, 
      ResultDesc: 'Internal server error' 
    });
  }
}