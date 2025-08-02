#!/usr/bin/env node

/**
 * Development Server Startup Script
 * Handles database connection gracefully and provides helpful error messages
 */

console.log('🚀 StudyGenius Backend Server');
console.log('================================');

// Import and start the server
import('../index.js').then(async () => {
  // Import here to avoid connection errors during module loading
  const { checkDatabaseConnection } = await import('../db/index.js');
  
  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  
  if (!dbConnected) {
    console.log('⚠️  Database not connected - running in offline mode');
    console.log('📝 To connect database:');
    console.log('   1. Install PostgreSQL');
    console.log('   2. Create database: createdb studygenius');
    console.log('   3. Set DATABASE_URL environment variable');
    console.log('   4. Run: npm run db:migrate');
  }
  
  console.log('✅ Server ready for development');
}).catch(error => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});