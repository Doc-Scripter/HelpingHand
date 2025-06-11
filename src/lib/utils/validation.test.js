import { describe, it, expect } from 'vitest';

// Create validation utilities to test
const validation = {
  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (Kenyan format)
   * @param {string} phone 
   * @returns {boolean}
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Validate amount (positive number)
   * @param {number|string} amount 
   * @returns {boolean}
   */
  isValidAmount(amount) {
    if (amount === null || amount === undefined || amount === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && isFinite(num) && num > 0;
  },

  /**
   * Validate project ID format
   * @param {string} projectId 
   * @returns {boolean}
   */
  isValidProjectId(projectId) {
    return typeof projectId === 'string' && projectId.length > 5 && projectId.startsWith('proj-');
  },

  /**
   * Sanitize input string
   * @param {string} input 
   * @returns {string}
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/</g, '').replace(/>/g, '');
  },

  /**
   * Validate password strength
   * @param {string} password 
   * @returns {object}
   */
  validatePassword(password) {
    const result = {
      isValid: false,
      errors: []
    };

    if (!password || password.length < 6) {
      result.errors.push('Password must be at least 6 characters long');
    }

    if (!/[A-Za-z]/.test(password)) {
      result.errors.push('Password must contain at least one letter');
    }

    if (!/\d/.test(password)) {
      result.errors.push('Password must contain at least one number');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }
};

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.ke',
        'admin+test@helpinghand.org',
        'contact@sub.domain.com'
      ];

      validEmails.forEach(email => {
        expect(validation.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user name@domain.com',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(validation.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct Kenyan phone formats', () => {
      const validPhones = [
        '0712345678',
        '0123456789',
        '+254712345678',
        '254712345678',
        '712345678',
        '0712 345 678',
        '+254 712 345 678'
      ];

      validPhones.forEach(phone => {
        expect(validation.isValidPhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '12345',
        '071234567890',
        '+1234567890',
        'abcdefghij',
        '',
        null,
        undefined,
        '0812345678' // Invalid prefix
      ];

      invalidPhones.forEach(phone => {
        expect(validation.isValidPhone(phone)).toBe(false);
      });
    });
  });

  describe('isValidAmount', () => {
    it('should validate positive numbers', () => {
      const validAmounts = [
        1,
        100,
        1000.50,
        '50',
        '100.25',
        0.01
      ];

      validAmounts.forEach(amount => {
        expect(validation.isValidAmount(amount)).toBe(true);
      });
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [
        0,
        -1,
        -100,
        'abc',
        '',
        null,
        undefined,
        NaN,
        Infinity
      ];

      invalidAmounts.forEach(amount => {
        expect(validation.isValidAmount(amount)).toBe(false);
      });
    });
  });

  describe('isValidProjectId', () => {
    it('should validate correct project ID format', () => {
      const validIds = [
        'proj-1',
        'proj-123',
        'proj-water-initiative',
        'proj-education-2024'
      ];

      validIds.forEach(id => {
        expect(validation.isValidProjectId(id)).toBe(true);
      });
    });

    it('should reject invalid project ID formats', () => {
      const invalidIds = [
        '',
        'project-1',
        '1',
        'proj',
        'proj-',
        null,
        undefined,
        123,
        'invalid-format'
      ];

      invalidIds.forEach(id => {
        expect(validation.isValidProjectId(id)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace and remove dangerous characters', () => {
      const testCases = [
        { input: '  hello world  ', expected: 'hello world' },
        { input: '<script>alert("xss")</script>', expected: 'scriptalert("xss")/script' },
        { input: 'normal text', expected: 'normal text' },
        { input: '  <div>content</div>  ', expected: 'divcontent/div' },
        { input: '', expected: '' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(validation.sanitizeInput(input)).toBe(expected);
      });
    });

    it('should handle non-string inputs', () => {
      const nonStringInputs = [null, undefined, 123, {}, []];

      nonStringInputs.forEach(input => {
        expect(validation.sanitizeInput(input)).toBe('');
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'password123',
        'admin123',
        'Test1234',
        'myPassword1'
      ];

      strongPasswords.forEach(password => {
        const result = validation.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: '123', expectedErrors: 2 }, // Too short, no letters
        { password: 'password', expectedErrors: 1 }, // No numbers
        { password: '12345678', expectedErrors: 1 }, // No letters
        { password: 'abc', expectedErrors: 2 }, // Too short, no numbers
        { password: '', expectedErrors: 2 }, // Too short, no letters, no numbers
        { password: null, expectedErrors: 2 } // Too short, no letters, no numbers
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validation.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(expectedErrors);
      });
    });

    it('should provide specific error messages', () => {
      const result = validation.validatePassword('abc');
      
      expect(result.errors).toContain('Password must be at least 6 characters long');
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});

// Export for use in other files
export default validation;