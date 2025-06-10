import Database from 'better-sqlite3';

const db = new Database('donations.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_amount REAL NOT NULL,
    raised_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY,
    amount REAL NOT NULL,
    project_id TEXT NOT NULL,
    mpesa_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      INSERT INTO projects (id, title, description, target_amount) VALUES
      ('proj-1', 'Clean Water Initiative', 'Providing clean water access to rural communities in Kenya', 500000),
      ('proj-2', 'Education Support Program', 'Supporting underprivileged children with school supplies and fees', 300000),
      ('proj-3', 'Healthcare Mobile Clinic', 'Mobile healthcare services for remote areas', 750000)
    `);
  }
} catch (error) {
  console.error('Error checking/inserting sample projects:', error);
}

export default db;