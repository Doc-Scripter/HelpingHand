import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
      
    console.log('M-Pesa Service initialized:', {
      environment: this.environment,
      baseUrl: this.baseUrl,
      businessShortCode: this.businessShortCode,
      hasConsumerKey: !!this.consumerKey,
      hasConsumerSecret: !!this.consumerSecret,
      hasPasskey: !!this.passkey,
      callbackUrl: this.callbackUrl,
      timeoutUrl: this.timeoutUrl
    });
  }

  /**
   * Generate OAuth token for M-Pesa API authentication
   * @returns {Promise<string>} Access token
   */
  async generateToken() {
    try {
      if (!this.consumerKey || !this.consumerSecret) {
        throw new Error('M-Pesa consumer key and secret are required');
      }
      
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      console.log('Generating M-Pesa token...');
      
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token generation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Token generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Token generated successfully');
      return data.access_token;
    } catch (error) {
      console.error('M-Pesa token generation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate M-Pesa access token: ${errorMessage}`);
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
      cleaned = '+254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      // Convert 7XXXXXXXX to 2547XXXXXXXX
      cleaned = '+254' + cleaned;
    } else if (!cleaned.startsWith('254')) {
      // Assume it's missing country code
      cleaned = '+254' + cleaned;
    }
    
    // Validate length (should be 12 digits for Kenya)
    if (cleaned.length !== 12) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Expected format: 0712345678`);
    }
    
    // Validate it's a valid Kenyan mobile number
    // const validPrefixes = ['254701', '254702', '254703', '254704', '254705', '254706', '254707', '254708', '254709', '254710', '254711', '254712', '254713', '254714', '254715', '254716', '254717', '254718', '254719', '254720', '254721', '254722', '254723', '254724', '254725', '254726', '254727', '254728', '254729'];
    // const prefix = cleaned.substring(0, 6);
    
    // if (!validPrefixes.includes(prefix)) {
    //   throw new Error(`Invalid Kenyan mobile number: ${phoneNumber}. Must be a valid Safaricom, Airtel, or Telkom number.`);
    // }
    
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
        throw new Error('Missing required payment data: phoneNumber, amount, accountReference');
      }

      if (amount < 1) {
        throw new Error('Amount must be at least 1 KSh');
      }

      if (!this.callbackUrl || !this.timeoutUrl) {
        throw new Error('Callback URLs not configured. Please set MPESA_CALLBACK_URL and MPESA_TIMEOUT_URL');
      }

      // Get access token
      console.log('Getting M-Pesa access token...');
      const accessToken = await this.generateToken();
      
      // Format phone number
      console.log('Formatting phone number:', phoneNumber);
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('Formatted phone number:', formattedPhone);
      
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

      console.log('STK Push payload:', {
        ...stkPushPayload,
        Password: '[HIDDEN]'
      });

      // Make STK Push request
      console.log('Sending STK Push request...');
      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPushPayload)
      });

      const responseData = await response.json();
      console.log('STK Push response:', responseData);

      if (!response.ok) {
        throw new Error(`STK Push failed: ${responseData.errorMessage || response.statusText}`);
      }
      
      // Check if request was successful
      if (responseData.ResponseCode !== '0') {
        throw new Error(`STK Push failed: ${responseData.ResponseDescription}`);
      }

      console.log('STK Push initiated successfully');
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
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

      console.log('Querying STK Push status for:', checkoutRequestId);

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
      console.log('STK Push query response:', responseData);
      
      return {
        success: true,
        resultCode: responseData.ResultCode,
        resultDesc: responseData.ResultDesc,
        checkoutRequestId: responseData.CheckoutRequestID,
        merchantRequestId: responseData.MerchantRequestID
      };

    } catch (error) {
      console.error('STK Push query error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Process M-Pesa callback data
   * @param {any} callbackData - Callback data from M-Pesa
   * @returns {Object} Processed callback result
   */
  processCallback(callbackData) {
    try {
      console.log('Processing M-Pesa callback:', JSON.stringify(callbackData, null, 2));
      
      const { Body } = callbackData;
      const { stkCallback } = Body;
      
      /** @type {any} */
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
        
        items.forEach(/** @param {any} item */ (item) => {
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
        
        console.log('Payment successful:', result.transactionData);
      } else {
        result.success = false;
        result.error = stkCallback.ResultDesc;
        console.log('Payment failed:', result.error);
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