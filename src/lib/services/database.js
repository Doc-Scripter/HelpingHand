import Database from 'better-sqlite3';

const db = new Database('donations.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY,
    amount REAL NOT NULL,
    project_id TEXT NOT NULL,
    mpesa_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;