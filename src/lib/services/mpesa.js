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
   * Query STK Push transaction status with retry logic
   * @param {string} checkoutRequestId - Checkout request ID from STK Push
   * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} retryDelay - Delay between retries in milliseconds (default: 2000)
   * @returns {Promise<Object>} Transaction status
   */
  async querySTKPushStatus(checkoutRequestId, maxRetries = 3, retryDelay = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Querying STK Push status for: ${checkoutRequestId} (attempt ${attempt}/${maxRetries})`);
        
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

        // Handle different response scenarios
        if (response.ok) {
          const responseData = await response.json();
          console.log('STK Push query response:', responseData);
          
          // Check if transaction was cancelled or timed out (even with successful HTTP response)
          const resultCode = responseData.ResultCode;
          const resultDesc = responseData.ResultDesc || '';
          
          // M-Pesa Result Codes for cancellation/timeout:
          // 1032 = Request cancelled by user
          // 1037 = Timeout in completing transaction
          // 1001 = Insufficient funds
          // 1 = Insufficient funds
          // 2001 = Wrong PIN
          if (resultCode === '1032' || resultCode === '1037' || 
              resultDesc.toLowerCase().includes('cancelled') ||
              resultDesc.toLowerCase().includes('timeout') ||
              resultDesc.toLowerCase().includes('expired')) {
            
            console.log('Transaction was cancelled or timed out by user');
            return {
              success: false,
              error: 'Transaction was cancelled or timed out',
              resultCode: 'TRANSACTION_CANCELLED',
              resultDesc: resultDesc,
              checkoutRequestId: responseData.CheckoutRequestID,
              merchantRequestId: responseData.MerchantRequestID
            };
          }
          
          // Check for other failure result codes that should not be retried
          if (resultCode === '1001' || resultCode === '1' || resultCode === '2001' ||
              resultDesc.toLowerCase().includes('insufficient funds') ||
              resultDesc.toLowerCase().includes('wrong pin')) {
            
            console.log('Transaction failed due to user error (insufficient funds/wrong PIN)');
            return {
              success: false,
              error: 'Transaction failed',
              resultCode: 'TRANSACTION_FAILED',
              resultDesc: resultDesc,
              checkoutRequestId: responseData.CheckoutRequestID,
              merchantRequestId: responseData.MerchantRequestID
            };
          }
          
          // Success case (ResultCode 0) or still processing
          return {
            success: true,
            resultCode: responseData.ResultCode,
            resultDesc: responseData.ResultDesc,
            checkoutRequestId: responseData.CheckoutRequestID,
            merchantRequestId: responseData.MerchantRequestID
          };
        } else {
          // Handle specific HTTP error codes
          let errorData;
          const errorText = await response.text();
          
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            errorData = { errorMessage: errorText };
          }
          
          console.warn(`STK Push query failed (attempt ${attempt}): ${response.status} ${response.statusText} - ${errorText}`);
          
          // Handle M-Pesa specific error codes
          if (errorData.errorCode === '500.001.1001' || 
              (errorData.errorMessage && errorData.errorMessage.toLowerCase().includes('being processed'))) {
            // Transaction is still being processed - this is expected for pending transactions
            console.log('Transaction is still being processed, continuing to next attempt...');
            lastError = new Error('Transaction still processing');
            continue;
          }
          
          // Handle timeout or cancellation errors
          if (errorData.errorCode === '500.001.1002' || 
              (errorData.errorMessage && (
                errorData.errorMessage.toLowerCase().includes('timeout') ||
                errorData.errorMessage.toLowerCase().includes('cancelled') ||
                errorData.errorMessage.toLowerCase().includes('expired')
              ))) {
            // Transaction was cancelled or timed out
            return {
              success: false,
              error: 'Transaction was cancelled or timed out',
              resultCode: 'TRANSACTION_CANCELLED',
              resultDesc: errorData.errorMessage || 'Transaction cancelled by user or timed out'
            };
          }
          
          // Don't retry for client errors (4xx), only server errors (5xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: `Client error: ${response.status} ${response.statusText}`,
              resultCode: 'CLIENT_ERROR',
              resultDesc: errorData.errorMessage || response.statusText
            };
          }
          
          lastError = new Error(`Server error: ${response.status} ${response.statusText} - ${errorData.errorMessage || errorText}`);
        }

      } catch (error) {
        console.warn(`STK Push query error (attempt ${attempt}):`, error);
        lastError = error;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // All retries failed
    console.error('STK Push query failed after all retries:', lastError);
    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    
    // Check if the last error was due to transaction still processing
    if (errorMessage.includes('Transaction still processing')) {
      return {
        success: false,
        error: 'Transaction is taking longer than expected to process',
        resultCode: 'TRANSACTION_PENDING',
        resultDesc: 'Transaction is still being processed. Please check again later or contact support if payment was deducted.'
      };
    }
    
    return {
      success: false,
      error: `Query failed after ${maxRetries} attempts: ${errorMessage}`,
      resultCode: 'QUERY_FAILED',
      resultDesc: 'Transaction status could not be determined due to server issues'
    };
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