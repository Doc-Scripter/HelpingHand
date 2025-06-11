import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}));


// Mock process.env
const mockEnv = {
  MPESA_ENVIRONMENT: 'sandbox',
  MPESA_CONSUMER_KEY: 'test_consumer_key',
  MPESA_CONSUMER_SECRET: 'test_consumer_secret',
  MPESA_BUSINESS_SHORT_CODE: '174379',
  MPESA_PASSKEY: 'test_passkey',
  MPESA_CALLBACK_URL: 'https://test.com/callback',
  MPESA_TIMEOUT_URL: 'https://test.com/timeout'
};

Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true
});

// Mock fetch globally
global.fetch = vi.fn();

describe('MpesaService', () => {
  let mpesaService;
  let mockFetch;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(fetch);
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Import the service fresh for each test
    const module = await import('./mpesa.js');
    mpesaService = module.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct environment settings', () => {
      expect(mpesaService.environment).toBe('sandbox');
      expect(mpesaService.consumerKey).toBe('test_consumer_key');
      expect(mpesaService.consumerSecret).toBe('test_consumer_secret');
      expect(mpesaService.businessShortCode).toBe('174379');
      expect(mpesaService.passkey).toBe('test_passkey');
      expect(mpesaService.baseUrl).toBe('https://sandbox.safaricom.co.ke');
    });

    it('should use production URL when environment is production', async () => {
      // Create a new mock environment for production
      const originalEnv = { ...process.env };
      
      // Set production environment
      Object.defineProperty(process, 'env', {
        value: {
          ...mockEnv,
          MPESA_ENVIRONMENT: 'production'
        },
        writable: true
      });
      
      // Import fresh module with production environment
      const module = await import('./mpesa.js?prod=' + Date.now());
      const prodService = module.default;
      
      expect(prodService.baseUrl).toBe('https://api.safaricom.co.ke');
      
      // Restore original environment
      Object.defineProperty(process, 'env', {
        value: originalEnv,
        writable: true
      });
    });
  });

  describe('generateToken', () => {
    it('should generate token successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const token = await mpesaService.generateToken();

      expect(token).toBe('test_token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle token generation failure', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Invalid credentials')
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(mpesaService.generateToken()).rejects.toThrow(
        'Failed to generate M-Pesa access token: Token generation failed: 401 Unauthorized'
      );
    });

    it('should handle missing credentials', async () => {
      // Temporarily remove credentials
      const originalKey = mpesaService.consumerKey;
      const originalSecret = mpesaService.consumerSecret;
      mpesaService.consumerKey = null;
      mpesaService.consumerSecret = null;

      await expect(mpesaService.generateToken()).rejects.toThrow(
        'Failed to generate M-Pesa access token: M-Pesa consumer key and secret are required'
      );

      // Restore credentials
      mpesaService.consumerKey = originalKey;
      mpesaService.consumerSecret = originalSecret;
    });
  });

  describe('getTimestamp', () => {
    it('should return timestamp in correct format', () => {
      const timestamp = mpesaService.getTimestamp();
      
      // Should be 14 digits (YYYYMMDDHHMMSS)
      expect(timestamp).toMatch(/^\d{14}$/);
      
      // Should be a valid date format
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);
      
      expect(parseInt(year)).toBeGreaterThanOrEqual(2020);
      expect(parseInt(month)).toBeGreaterThanOrEqual(1);
      expect(parseInt(month)).toBeLessThanOrEqual(12);
      expect(parseInt(day)).toBeGreaterThanOrEqual(1);
      expect(parseInt(day)).toBeLessThanOrEqual(31);
    });
  });

  describe('generatePassword', () => {
    it('should generate base64 encoded password', () => {
      const password = mpesaService.generatePassword();
      
      // Should be base64 encoded
      expect(password).toMatch(/^[A-Za-z0-9+/]+=*$/);
      
      // Should be decodable
      const decoded = Buffer.from(password, 'base64').toString();
      expect(decoded).toContain(mpesaService.businessShortCode);
      expect(decoded).toContain(mpesaService.passkey);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Kenyan phone numbers correctly', () => {
      const testCases = [
        { input: '0712345678', expected: '+254712345678' },
        { input: '712345678', expected: '+254712345678' },
        { input: '+254712345678', expected: '+254712345678' },
        { input: '254712345678', expected: '+254712345678' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = mpesaService.formatPhoneNumber(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle phone numbers with spaces and special characters', () => {
      const result = mpesaService.formatPhoneNumber('0712 345 678');
      expect(result).toBe('+254712345678');
    });

    it('should throw error for invalid phone numbers', () => {
      const invalidNumbers = [
        '123',           // Too short
        '071234567890',  // Too long
        'abcdefghij'     // Non-numeric
      ];

      invalidNumbers.forEach(number => {
        expect(() => mpesaService.formatPhoneNumber(number)).toThrow();
      });
    });
  });

  describe('initiateSTKPush', () => {
    beforeEach(() => {
      // Mock successful token generation
      const mockTokenResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
      };
      
      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve(mockTokenResponse);
        }
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            ResponseCode: '0',
            ResponseDescription: 'Success',
            CheckoutRequestID: 'ws_CO_123456789',
            MerchantRequestID: 'mr_123456789',
            CustomerMessage: 'Success. Request accepted for processing'
          })
        });
      });
    });

    it('should initiate STK push successfully', async () => {
      const paymentData = {
        phoneNumber: '+254712345678',
        amount: 100,
        accountReference: 'TEST123',
        transactionDesc: 'Test payment'
      };

      const result = await mpesaService.initiateSTKPush(paymentData);

      expect(result.success).toBe(true);
      expect(result.checkoutRequestId).toBe('ws_CO_123456789');
      expect(result.merchantRequestId).toBe('mr_123456789');
      expect(result.responseCode).toBe('0');
    });

    it('should validate required payment data', async () => {
      const invalidPaymentData = {
        phoneNumber: '',
        amount: 0,
        accountReference: ''
      };

      const result = await mpesaService.initiateSTKPush(invalidPaymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required payment data');
    });

    it('should validate minimum amount', async () => {
      const paymentData = {
        phoneNumber: '+254712345678',
        amount: 0.5,
        accountReference: 'TEST123'
      };

      const result = await mpesaService.initiateSTKPush(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Amount must be at least 1 KSh');
    });

    it('should handle STK push API errors', async () => {
      // Mock token generation success but STK push failure
      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
          });
        }
        return Promise.resolve({
          ok: false,
          json: vi.fn().mockResolvedValue({
            ResponseCode: '1',
            ResponseDescription: 'Insufficient funds',
            errorMessage: 'Insufficient funds'
          })
        });
      });

      const paymentData = {
        phoneNumber: '+254712345678',
        amount: 100,
        accountReference: 'TEST123'
      };

      const result = await mpesaService.initiateSTKPush(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('STK Push failed');
    });
  });

  describe('querySTKPushStatus', () => {
    it('should query STK push status successfully', async () => {
      const mockTokenResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
      };
      
      const mockQueryResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          ResultCode: '0',
          ResultDesc: 'Success',
          CheckoutRequestID: 'ws_CO_123456789',
          MerchantRequestID: 'mr_123456789'
        })
      };

      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve(mockTokenResponse);
        }
        return Promise.resolve(mockQueryResponse);
      });

      const result = await mpesaService.querySTKPushStatus('ws_CO_123456789');

      expect(result.success).toBe(true);
      expect(result.resultCode).toBe('0');
      expect(result.checkoutRequestId).toBe('ws_CO_123456789');
    });

    it('should handle cancelled transactions', async () => {
      const mockTokenResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
      };
      
      const mockQueryResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          ResultCode: '1032',
          ResultDesc: 'Request cancelled by user',
          CheckoutRequestID: 'ws_CO_123456789',
          MerchantRequestID: 'mr_123456789'
        })
      };

      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve(mockTokenResponse);
        }
        return Promise.resolve(mockQueryResponse);
      });

      const result = await mpesaService.querySTKPushStatus('ws_CO_123456789');

      expect(result.success).toBe(false);
      expect(result.resultCode).toBe('TRANSACTION_CANCELLED');
      expect(result.error).toContain('cancelled or timed out');
    });

    it('should retry on server errors', async () => {
      let callCount = 0;
      
      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
          });
        }
        
        callCount++;
        if (callCount < 3) {
          // Fail first two attempts
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: vi.fn().mockResolvedValue('Server error')
          });
        }
        
        // Succeed on third attempt
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            ResultCode: '0',
            ResultDesc: 'Success',
            CheckoutRequestID: 'ws_CO_123456789'
          })
        });
      });

      const result = await mpesaService.querySTKPushStatus('ws_CO_123456789', 3, 100);

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });
  });

  describe('processCallback', () => {
    it('should process successful callback', () => {
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'mr_123456789',
            CheckoutRequestID: 'ws_CO_123456789',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 100 },
                { Name: 'MpesaReceiptNumber', Value: 'QHX7Y8Z9' },
                { Name: 'TransactionDate', Value: 20240101120000 },
                { Name: 'PhoneNumber', Value: 254712345678 }
              ]
            }
          }
        }
      };

      const result = mpesaService.processCallback(callbackData);

      expect(result.success).toBe(true);
      expect(result.merchantRequestId).toBe('mr_123456789');
      expect(result.checkoutRequestId).toBe('ws_CO_123456789');
      expect(result.transactionData.amount).toBe(100);
      expect(result.transactionData.mpesaReceiptNumber).toBe('QHX7Y8Z9');
    });

    it('should process failed callback', () => {
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'mr_123456789',
            CheckoutRequestID: 'ws_CO_123456789',
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user'
          }
        }
      };

      const result = mpesaService.processCallback(callbackData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request cancelled by user');
      expect(result.resultCode).toBe(1032);
    });

    it('should handle malformed callback data', () => {
      const malformedData = { invalid: 'data' };

      const result = mpesaService.processCallback(malformedData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to process callback data');
    });
  });
});