import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as personalizationSchema from './personalization-schema.js';
import * as enhancedSocialSchema from './enhanced-social-schema.js';
import * as enhancedNotesSchema from './enhanced-notes-schema.js';
import * as enhancedAiSchema from './enhanced-ai-schema.js';
import * as enhancedStudyPlannerSchema from './enhanced-study-planner-schema.js';
import * as enhancedQuizSchema from './enhanced-quiz-schema.js';
import * as enhancedFlashcardSchema from './enhanced-flashcard-schema.js';
import * as enhancedGamingSchema from './enhanced-gaming-schema.js';
import * as preloadedContentSchema from './preloaded-content-schema.js';
import * as classroomSchema from './classroom-schema.js';
import * as studentAssistanceSchema from './student-assistance-schema.js';
import 'dotenv/config';

// Create the connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 1,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create drizzle instance
export const db = drizzle(client, { 
  schema: { 
    ...schema, 
    ...personalizationSchema,
    ...enhancedSocialSchema,
    ...enhancedNotesSchema,
    ...enhancedAiSchema,
    ...enhancedStudyPlannerSchema,
    ...enhancedQuizSchema,
    ...enhancedFlashcardSchema,
    ...enhancedGamingSchema,
    ...preloadedContentSchema,
    ...classroomSchema,
    ...studentAssistanceSchema
  } 
});

// Export schema for use in other files
export * from './schema.js';
export * from './personalization-schema.js';
export * from './enhanced-social-schema.js';
export * from './enhanced-notes-schema.js';
export * from './enhanced-ai-schema.js';
export * from './enhanced-study-planner-schema.js';
export * from './enhanced-quiz-schema.js';
export * from './enhanced-flashcard-schema.js';
export * from './enhanced-gaming-schema.js';
export * from './preloaded-content-schema.js';
export * from './classroom-schema.js';
export * from './student-assistance-schema.js';

// Health check function
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await client.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await client.end();
  process.exit(0);
});