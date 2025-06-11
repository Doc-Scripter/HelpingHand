import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Utility function to safely extract error message from unknown error type
 * This handles the TypeScript/JavaScript issue where caught errors are of type 'unknown'
 * @param {unknown} error - The error object of unknown type
 * @returns {string} A string representation of the error message
 */
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * Function to ensure database directory and file exist
 * Creates the database directory if it doesn't exist and returns the full database path
 * @returns {string} The full path to the database file
 * @throws {Error} If unable to create the database directory
 */
function ensureDatabaseExists() {
  const databaseDir = 'database';
  const databasePath = join(databaseDir, 'donations.db');
  
  try {
    // Create database directory if it doesn't exist
    if (!existsSync(databaseDir)) {
      mkdirSync(databaseDir, { recursive: true });
      console.log('✅ Created database directory:', databaseDir);
    } else {
      console.log('📁 Database directory already exists:', databaseDir);
    }
    
    // Check if database file exists
    if (existsSync(databasePath)) {
      console.log('📄 Database file found:', databasePath);
    } else {
      console.log('🆕 Database file will be created:', databasePath);
    }
    
    return databasePath;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('❌ Error ensuring database directory exists:', error);
    throw new Error(`Failed to create database directory: ${errorMessage}`);
  }
}

// Initialize database with proper path
const databasePath = ensureDatabaseExists();
const db = new Database(databasePath);

console.log('🚀 Database initialized at:', databasePath);

/**
 * Export the database initialization function for testing or manual setup
 * @returns {string} The full path to the database file
 * @throws {Error} If unable to initialize the database
 */
export function initializeDatabase() {
  try {
    const path = ensureDatabaseExists();
    console.log('🔄 Database reinitialized at:', path);
    return path;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('❌ Error reinitializing database:', errorMessage);
    throw error; // Re-throw the original error
  }
}

/**
 * Export function to get current database path
 * @returns {string} The full path to the database file
 */
export function getDatabasePath() {
  return join('database', 'donations.db');
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_amount REAL NOT NULL,
    raised_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    county TEXT,
    category TEXT,
    image_url TEXT,
    beneficiaries_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY,
    amount REAL NOT NULL,
    project_id TEXT NOT NULL,
    mpesa_code TEXT,
    phone_number TEXT,
    transaction_ref TEXT,
    transaction_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  );

  CREATE TABLE IF NOT EXISTS pending_transactions (
    id INTEGER PRIMARY KEY,
    checkout_request_id TEXT UNIQUE NOT NULL,
    merchant_request_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    amount REAL NOT NULL,
    phone_number TEXT NOT NULL,
    transaction_ref TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    mpesa_receipt_number TEXT,
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default admin user (password: admin123)
db.exec(`
  INSERT OR IGNORE INTO admin_users (username, password_hash) 
  VALUES ('admin', '$2b$10$rOzJqQZJqQZJqQZJqQZJqO7yVGvFvzEQEQEQEQEQEQEQEQEQEQ')
`);

// Insert sample projects if none exist
try {
  const projectCountResult = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  const projectCount = projectCountResult && typeof projectCountResult === 'object' && 'count' in projectCountResult 
    ? projectCountResult.count 
    : 0;
    
  if (Number(projectCount) === 0) {
    db.exec(`
      INSERT INTO projects (id, title, description, target_amount, county, category, image_url, beneficiaries_count) VALUES
      ('proj-1', 'Clean Water Initiative', 'Providing clean water access to rural communities in Kenya through borehole drilling and water purification systems. This project will serve multiple villages and ensure sustainable water supply for generations.', 500000, 'Turkana', 'Water & Sanitation', '/images/water-project.jpg', 2500),
      ('proj-2', 'Education Support Program', 'Supporting underprivileged children with school supplies, uniforms, and fees. This comprehensive program includes mentorship and after-school support to ensure academic success.', 300000, 'Kibera, Nairobi', 'Education', '/images/education-project.jpg', 150),
      ('proj-3', 'Healthcare Mobile Clinic', 'Mobile healthcare services for remote areas providing basic medical care, vaccinations, and health education. The clinic will visit different communities on a rotating schedule.', 750000, 'Marsabit', 'Healthcare', '/images/healthcare-project.jpg', 5000),
      ('proj-4', 'Food Security Initiative', 'Establishing community gardens and providing agricultural training to ensure food security in drought-affected areas. Includes seeds, tools, and irrigation systems.', 400000, 'Mandera', 'Agriculture', '/images/agriculture-project.jpg', 800),
      ('proj-5', 'Youth Skills Training', 'Vocational training program for unemployed youth in urban slums, focusing on digital skills, tailoring, and entrepreneurship development.', 250000, 'Mathare, Nairobi', 'Skills Development', '/images/skills-project.jpg', 200)
    `);
    
    // Add sample donations to show progress
    db.exec(`
      INSERT OR IGNORE INTO donations (amount, project_id, mpesa_code, phone_number, transaction_ref, transaction_date) VALUES
      (15000, 'proj-1', 'QHX7Y8Z9', '254712345678', 'HH-proj-1-1704067200000', '2024-01-01 10:00:00'),
      (25000, 'proj-1', 'QHX7Y8Z0', '254723456789', 'HH-proj-1-1704153600000', '2024-01-02 14:30:00'),
      (50000, 'proj-1', 'QHX7Y8Z1', '254734567890', 'HH-proj-1-1704240000000', '2024-01-03 09:15:00'),
      (10000, 'proj-2', 'QHX7Y8Z2', '254745678901', 'HH-proj-2-1704326400000', '2024-01-04 16:45:00'),
      (30000, 'proj-2', 'QHX7Y8Z3', '254756789012', 'HH-proj-2-1704412800000', '2024-01-05 11:20:00'),
      (75000, 'proj-3', 'QHX7Y8Z4', '254767890123', 'HH-proj-3-1704499200000', '2024-01-06 13:10:00'),
      (20000, 'proj-4', 'QHX7Y8Z5', '254778901234', 'HH-proj-4-1704585600000', '2024-01-07 08:30:00'),
      (35000, 'proj-4', 'QHX7Y8Z6', '254789012345', 'HH-proj-4-1704672000000', '2024-01-08 15:45:00'),
      (12000, 'proj-5', 'QHX7Y8Z7', '254790123456', 'HH-proj-5-1704758400000', '2024-01-09 12:00:00')
    `);
  }
} catch (error) {
  const errorMessage = getErrorMessage(error);
  console.error('❌ Error checking/inserting sample projects:', errorMessage);
  console.error('Full error details:', error);
}

export default db;