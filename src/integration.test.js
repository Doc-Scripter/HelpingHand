import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment for integration tests
const mockEnv = {
  MPESA_ENVIRONMENT: 'sandbox',
  MPESA_CONSUMER_KEY: 'test_key',
  MPESA_CONSUMER_SECRET: 'test_secret',
  MPESA_BUSINESS_SHORT_CODE: '174379',
  MPESA_PASSKEY: 'test_passkey',
  MPESA_CALLBACK_URL: 'https://test.com/callback',
  MPESA_TIMEOUT_URL: 'https://test.com/timeout'
};

Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true
});

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  const mockDb = {
    exec: vi.fn(),
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({ count: 5 })),
      all: vi.fn(() => [
        {
          id: 'proj-1',
          title: 'Test Project',
          description: 'Test Description',
          target_amount: 100000,
          raised_amount: 25000,
          status: 'active'
        }
      ])
    })),
    close: vi.fn()
  };
  
  return {
    default: vi.fn(() => mockDb)
  };
});

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn()
}));

// Mock dotenv
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Database and M-Pesa Integration', () => {
    it('should initialize database and M-Pesa service successfully', async () => {
      // Import services
      const databaseModule = await import('./lib/services/database.js');
      const mpesaModule = await import('./lib/services/mpesa.js');

      expect(databaseModule.default).toBeDefined();
      expect(mpesaModule.default).toBeDefined();
      
      // Test database path function
      const dbPath = databaseModule.getDatabasePath();
      expect(dbPath).toBe('database/donations.db');
      
      // Test M-Pesa service initialization
      expect(mpesaModule.default.environment).toBe('sandbox');
      expect(mpesaModule.default.businessShortCode).toBe('174379');
    });

    it('should handle donation flow from STK push to database storage', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Mock successful STK push
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
          });
        }
        if (url.includes('stkpush')) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              ResponseCode: '0',
              ResponseDescription: 'Success',
              CheckoutRequestID: 'ws_CO_123456789',
              MerchantRequestID: 'mr_123456789',
              CustomerMessage: 'Success'
            })
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      // Test STK push initiation
      const paymentData = {
        phoneNumber: '0712345678',
        amount: 1000,
        accountReference: 'proj-1',
        transactionDesc: 'Donation to Test Project'
      };

      const stkResult = await mpesaService.initiateSTKPush(paymentData);

      expect(stkResult.success).toBe(true);
      expect(stkResult.checkoutRequestId).toBe('ws_CO_123456789');
      expect(stkResult.merchantRequestId).toBe('mr_123456789');

      // Test callback processing
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'mr_123456789',
            CheckoutRequestID: 'ws_CO_123456789',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 1000 },
                { Name: 'MpesaReceiptNumber', Value: 'QHX7Y8Z9' },
                { Name: 'TransactionDate', Value: 20240101120000 },
                { Name: 'PhoneNumber', Value: 254712345678 }
              ]
            }
          }
        }
      };

      const callbackResult = mpesaService.processCallback(callbackData);

      expect(callbackResult.success).toBe(true);
      expect(callbackResult.transactionData.amount).toBe(1000);
      expect(callbackResult.transactionData.mpesaReceiptNumber).toBe('QHX7Y8Z9');
    });

    it('should handle failed transactions gracefully', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Mock failed STK push
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation((url) => {
        if (url.includes('oauth')) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
          });
        }
        if (url.includes('stkpush')) {
          return Promise.resolve({
            ok: false,
            json: vi.fn().mockResolvedValue({
              ResponseCode: '1',
              ResponseDescription: 'Insufficient funds',
              errorMessage: 'Insufficient funds'
            })
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const paymentData = {
        phoneNumber: '0712345678',
        amount: 1000,
        accountReference: 'proj-1'
      };

      const result = await mpesaService.initiateSTKPush(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('STK Push failed');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database initialization errors', async () => {
      // Mock fs to throw error
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const databaseModule = await import('./lib/services/database.js');
      
      expect(() => databaseModule.initializeDatabase()).toThrow('Permission denied');
    });

    it('should handle M-Pesa service errors', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Mock network error
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await mpesaService.generateToken();
      
      await expect(result).rejects.toThrow('Failed to generate M-Pesa access token');
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate phone numbers consistently across services', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Test phone number formatting
      const testNumbers = [
        '0712345678',
        '+254712345678',
        '712345678'
      ];

      testNumbers.forEach(number => {
        const formatted = mpesaService.formatPhoneNumber(number);
        expect(formatted).toBe('+254712345678');
      });

      // Test invalid numbers
      const invalidNumbers = ['123', '071234567890'];
      
      invalidNumbers.forEach(number => {
        expect(() => mpesaService.formatPhoneNumber(number)).toThrow();
      });
    });

    it('should validate amounts consistently', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Mock successful token generation
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
      });

      // Test invalid amounts
      const invalidPaymentData = {
        phoneNumber: '0712345678',
        amount: 0,
        accountReference: 'proj-1'
      };

      const result = await mpesaService.initiateSTKPush(invalidPaymentData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Amount must be at least 1 KSh');
    });
  });

  describe('Service Configuration', () => {
    it('should use correct environment settings', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      expect(mpesaService.environment).toBe('sandbox');
      expect(mpesaService.baseUrl).toBe('https://sandbox.safaricom.co.ke');
      expect(mpesaService.businessShortCode).toBe('174379');
    });

    it('should handle missing configuration gracefully', async () => {
      // Temporarily remove configuration
      const originalKey = process.env.MPESA_CONSUMER_KEY;
      delete process.env.MPESA_CONSUMER_KEY;

      // Re-import to get new instance
      delete require.cache[require.resolve('./lib/services/mpesa.js')];
      const mpesaModule = await import('./lib/services/mpesa.js?t=' + Date.now());
      const mpesaService = mpesaModule.default;

      await expect(mpesaService.generateToken()).rejects.toThrow(
        'M-Pesa consumer key and secret are required'
      );

      // Restore configuration
      process.env.MPESA_CONSUMER_KEY = originalKey;
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Mock successful responses
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ access_token: 'test_token' })
      });

      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        mpesaService.generateToken()
      );

      const results = await Promise.all(promises);
      
      results.forEach(token => {
        expect(token).toBe('test_token');
      });

      // Should have made 5 requests
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should handle timeout scenarios', async () => {
      const mpesaModule = await import('./lib/services/mpesa.js');
      const mpesaService = mpesaModule.default;

      // Mock timeout response
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(mpesaService.generateToken()).rejects.toThrow('Timeout');
    });
  });
});