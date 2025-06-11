import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Mock better-sqlite3 to avoid actual database operations during tests
vi.mock('better-sqlite3', () => {
  const mockDb = {
    exec: vi.fn(),
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({ count: 0 }))
    })),
    close: vi.fn()
  };
  
  return {
    default: vi.fn(() => mockDb)
  };
});

// Mock fs functions
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn()
  };
});

describe('Database Service', () => {
  let mockExistsSync;
  let mockMkdirSync;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync = vi.mocked(existsSync);
    mockMkdirSync = vi.mocked(mkdirSync);
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getErrorMessage utility function', () => {
    it('should extract message from Error objects', async () => {
      // We need to import the module to test the utility function
      // Since it's not exported, we'll test it indirectly through error handling
      const { initializeDatabase } = await import('./database.js');
      
      // Mock existsSync to throw an error
      mockExistsSync.mockImplementation(() => {
        throw new Error('Test error message');
      });
      
      expect(() => initializeDatabase()).toThrow('Failed to create database directory: Test error message');
    });

    it('should handle string errors', async () => {
      const { initializeDatabase } = await import('./database.js');
      
      // Mock existsSync to throw a string
      mockExistsSync.mockImplementation(() => {
        throw 'String error';
      });
      
      expect(() => initializeDatabase()).toThrow('Failed to create database directory: String error');
    });

    it('should handle unknown error types', async () => {
      const { initializeDatabase } = await import('./database.js');
      
      // Mock existsSync to throw an object
      mockExistsSync.mockImplementation(() => {
        throw { code: 'UNKNOWN' };
      });
      
      expect(() => initializeDatabase()).toThrow('Failed to create database directory: [object Object]');
    });
  });

  describe('ensureDatabaseExists', () => {
    it('should create database directory when it does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockReturnValue(undefined);
      
      const { initializeDatabase } = await import('./database.js');
      const result = initializeDatabase();
      
      expect(mockExistsSync).toHaveBeenCalledWith('database');
      expect(mockMkdirSync).toHaveBeenCalledWith('database', { recursive: true });
      expect(result).toBe(join('database', 'donations.db'));
    });

    it('should not create directory when it already exists', async () => {
      mockExistsSync.mockReturnValue(true);
      
      const { initializeDatabase } = await import('./database.js');
      const result = initializeDatabase();
      
      expect(mockExistsSync).toHaveBeenCalledWith('database');
      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(result).toBe(join('database', 'donations.db'));
    });

    it('should handle directory creation errors', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const { initializeDatabase } = await import('./database.js');
      
      expect(() => initializeDatabase()).toThrow('Failed to create database directory: Permission denied');
    });
  });

  describe('getDatabasePath', () => {
    it('should return correct database path', async () => {
      const { getDatabasePath } = await import('./database.js');
      const result = getDatabasePath();
      
      expect(result).toBe(join('database', 'donations.db'));
    });
  });

  describe('initializeDatabase', () => {
    it('should successfully initialize database', async () => {
      mockExistsSync.mockReturnValue(true);
      
      const { initializeDatabase } = await import('./database.js');
      const result = initializeDatabase();
      
      expect(result).toBe(join('database', 'donations.db'));
    });

    it('should handle initialization errors and re-throw them', async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('Initialization failed');
      });
      
      const { initializeDatabase } = await import('./database.js');
      
      expect(() => initializeDatabase()).toThrow('Initialization failed');
    });
  });

  describe('Database initialization on import', () => {
    it('should initialize database when module is imported', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockReturnValue(undefined);
      
      // Import the module to trigger initialization
      await import('./database.js');
      
      expect(mockExistsSync).toHaveBeenCalled();
    });
  });
});