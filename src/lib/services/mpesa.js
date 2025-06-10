import crypto from 'crypto';

/**
 * M-Pesa API Service
 * Handles STK Push (Lipa na M-Pesa Online) integration
 */
class MpesaService {
  constructor() {
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.timeoutUrl = process.env.MPESA_TIMEOUT_URL;
    
    // M-Pesa API URLs
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Generate OAuth token for M-Pesa API authentication
   * @returns {Promise<string>} Access token
   */
  async generateToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('M-Pesa token generation error:', error);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }

  /**
   * Generate password for STK Push
   * @returns {string} Base64 encoded password
   */
  generatePassword() {
    const timestamp = this.getTimestamp();
    const password = Buffer.from(`${this.businessShortCode}${this.passkey}${timestamp}`).toString('base64');
    return password;
  }

  /**
   * Get current timestamp in M-Pesa format (YYYYMMDDHHMMSS)
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
      // Convert 07XXXXXXXX to 2547XXXXXXXX
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      // Convert 7XXXXXXXX to 2547XXXXXXXX
      cleaned = '254' + cleaned;
    } else if (!cleaned.startsWith('254')) {
      // Assume it's missing country code
      cleaned = '254' + cleaned;
    }
    
    // Validate length (should be 12 digits for Kenya)
    if (cleaned.length !== 12) {
      throw new Error('Invalid phone number format');
    }
    
    return cleaned;
  }

  /**
   * Initiate STK Push payment
   * @param {Object} paymentData - Payment information
   * @param {string} paymentData.phoneNumber - Customer phone number
   * @param {number} paymentData.amount - Amount to charge
   * @param {string} paymentData.accountReference - Account reference
   * @param {string} paymentData.transactionDesc - Transaction description
   * @returns {Promise<Object>} STK Push response
   */
  async initiateSTKPush(paymentData) {
    try {
      const { phoneNumber, amount, accountReference, transactionDesc } = paymentData;
      
      // Validate inputs
      if (!phoneNumber || !amount || !accountReference) {
        throw new Error('Missing required payment data');
      }

      if (amount < 1) {
        throw new Error('Amount must be at least 1 KSh');
      }

      // Get access token
      const accessToken = await this.generateToken();
      
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Generate password and timestamp
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();
      
      // Prepare STK Push payload
      const stkPushPayload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // Ensure integer
        PartyA: formattedPhone,
        PartyB: this.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc || `Payment for ${accountReference}`
      };

      // Make STK Push request
      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPushPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`STK Push failed: ${errorData.errorMessage || response.statusText}`);
      }

      const responseData = await response.json();
      
      // Check if request was successful
      if (responseData.ResponseCode !== '0') {
        throw new Error(`STK Push failed: ${responseData.ResponseDescription}`);
      }

      return {
        success: true,
        checkoutRequestId: responseData.CheckoutRequestID,
        merchantRequestId: responseData.MerchantRequestID,
        responseCode: responseData.ResponseCode,
        responseDescription: responseData.ResponseDescription,
        customerMessage: responseData.CustomerMessage
      };

    } catch (error) {
      console.error('STK Push error:', error);
      return {
        success: false,
        error: error.message,
        code: 'STK_PUSH_FAILED'
      };
    }
  }

  /**
   * Query STK Push transaction status
   * @param {string} checkoutRequestId - Checkout request ID from STK Push
   * @returns {Promise<Object>} Transaction status
   */
  async querySTKPushStatus(checkoutRequestId) {
    try {
      const accessToken = await this.generateToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      const queryPayload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryPayload)
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        resultCode: responseData.ResultCode,
        resultDesc: responseData.ResultDesc,
        checkoutRequestId: responseData.CheckoutRequestID,
        merchantRequestId: responseData.MerchantRequestID
      };

    } catch (error) {
      console.error('STK Push query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process M-Pesa callback data
   * @param {Object} callbackData - Callback data from M-Pesa
   * @returns {Object} Processed callback result
   */
  processCallback(callbackData) {
    try {
      const { Body } = callbackData;
      const { stkCallback } = Body;
      
      const result = {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc
      };

      // If payment was successful, extract transaction details
      if (stkCallback.ResultCode === 0) {
        const callbackMetadata = stkCallback.CallbackMetadata;
        const items = callbackMetadata.Item;
        
        result.success = true;
        result.transactionData = {};
        
        items.forEach(item => {
          switch (item.Name) {
            case 'Amount':
              result.transactionData.amount = item.Value;
              break;
            case 'MpesaReceiptNumber':
              result.transactionData.mpesaReceiptNumber = item.Value;
              break;
            case 'TransactionDate':
              result.transactionData.transactionDate = item.Value;
              break;
            case 'PhoneNumber':
              result.transactionData.phoneNumber = item.Value;
              break;
          }
        });
      } else {
        result.success = false;
        result.error = stkCallback.ResultDesc;
      }

      return result;
    } catch (error) {
      console.error('Callback processing error:', error);
      return {
        success: false,
        error: 'Failed to process callback data'
      };
    }
  }
}

export default new MpesaService();