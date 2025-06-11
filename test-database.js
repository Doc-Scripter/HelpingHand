#!/usr/bin/env node

/**
 * Test script to verify database initialization
 * Run with: node test-database.js
 */

import { existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing database initialization...\n');

try {
  // Import the database service (this will trigger the initialization)
  const { default: db, initializeDatabase, getDatabasePath } = await import('./src/lib/services/database.js');
  
  console.log('\n📊 Testing database functions:');
  
  // Test getDatabasePath function
  const dbPath = getDatabasePath();
  console.log('📍 Database path:', dbPath);
  
  // Check if database directory exists
  const databaseDir = 'database';
  const databaseExists = existsSync(databaseDir);
  console.log('📁 Database directory exists:', databaseExists ? '✅' : '❌');
  
  // Check if database file exists
  const dbFileExists = existsSync(dbPath);
  console.log('📄 Database file exists:', dbFileExists ? '✅' : '❌');
  
  // Test database connection by running a simple query
  console.log('\n🔍 Testing database connection:');
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  console.log('📈 Projects in database:', projectCount.count);
  
  const donationCount = db.prepare('SELECT COUNT(*) as count FROM donations').get();
  console.log('💰 Donations in database:', donationCount.count);
  
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  console.log('👤 Admin users in database:', adminCount.count);
  
  // Test reinitialization function
  console.log('\n🔄 Testing database reinitialization:');
  try {
    const reinitPath = initializeDatabase();
    console.log('✅ Reinitialization successful:', reinitPath);
  } catch (reinitError) {
    console.error('❌ Reinitialization failed:', reinitError);
  }
  
  console.log('\n✅ Database initialization test completed successfully!');
  
  // Close database connection
  db.close();
  
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Database initialization test failed:', errorMessage);
  console.error('Full error details:', error);
  process.exit(1);
}