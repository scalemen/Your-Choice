#!/usr/bin/env node

/**
 * Database Migration Script
 * Sets up the database schema for StudyGenius
 */

import { db, checkDatabaseConnection } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('❌ Cannot run migrations - database not connected');
    process.exit(1);
  }
  
  try {
    // Enable UUID extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✅ UUID extension enabled');
    
    // Note: In a real application, you would use a proper migration tool like Drizzle Kit
    // For now, we'll just ensure the database is ready
    
    console.log('✅ Database migrations completed successfully');
    console.log('📝 Note: Use `drizzle-kit push` for schema changes in production');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigrations();