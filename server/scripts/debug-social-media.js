#!/usr/bin/env node

import { db, checkDatabaseConnection } from '../db/index.js';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.cyan}🔧 ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}=== ${msg} ===${colors.reset}`)
};

class SocialMediaDebugger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  addError(error) {
    this.errors.push(error);
    log.error(error);
  }

  addWarning(warning) {
    this.warnings.push(warning);
    log.warn(warning);
  }

  addSuccess(success) {
    this.successes.push(success);
    log.success(success);
  }

  async testDatabaseConnection() {
    log.title('Testing Database Connection');
    
    try {
      const connected = await checkDatabaseConnection();
      if (connected) {
        this.addSuccess('Database connection successful');
        return true;
      } else {
        this.addError('Database connection failed');
        return false;
      }
    } catch (error) {
      this.addError(`Database connection error: ${error.message}`);
      return false;
    }
  }

  async checkDatabaseTables() {
    log.title('Checking Database Tables');

    const expectedTables = [
      'users',
      'social_posts',
      'social_stories',
      'post_likes',
      'post_comments',
      'comment_likes',
      'post_shares',
      'post_saves',
      'social_follows',
      'direct_messages',
      'conversations',
      'social_notifications',
      'trending_hashtags',
      'social_analytics',
      'social_profiles',
      'story_views',
      'enhanced_social_posts',
      'enhanced_social_stories',
      'enhanced_post_likes',
      'enhanced_post_comments',
      'enhanced_social_follows',
      'enhanced_social_notifications',
      'enhanced_social_analytics',
      'enhanced_content_moderation',
      'enhanced_search_queries'
    ];

    try {
      // Get all tables in the database
      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);

      const existingTables = result.map(row => row.table_name);
      
      for (const table of expectedTables) {
        if (existingTables.includes(table)) {
          this.addSuccess(`Table '${table}' exists`);
        } else {
          this.addWarning(`Table '${table}' is missing`);
        }
      }

      return existingTables;
    } catch (error) {
      this.addError(`Error checking tables: ${error.message}`);
      return [];
    }
  }

  async checkTableStructures() {
    log.title('Checking Table Structures');

    const criticalTables = [
      'social_posts',
      'enhanced_social_posts',
      'users'
    ];

    for (const table of criticalTables) {
      try {
        const columns = await db.execute(sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = ${table}
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `);

        if (columns.length > 0) {
          this.addSuccess(`Table '${table}' has ${columns.length} columns`);
          
          // Check for essential columns
          const columnNames = columns.map(col => col.column_name);
          
          if (table === 'users') {
            const requiredCols = ['id', 'email', 'full_name'];
            for (const col of requiredCols) {
              if (columnNames.includes(col)) {
                this.addSuccess(`Users table has required column: ${col}`);
              } else {
                this.addError(`Users table missing required column: ${col}`);
              }
            }
          }

          if (table.includes('social_posts')) {
            const requiredCols = ['id', 'user_id', 'media_type', 'created_at'];
            for (const col of requiredCols) {
              if (columnNames.includes(col)) {
                this.addSuccess(`${table} has required column: ${col}`);
              } else {
                this.addError(`${table} missing required column: ${col}`);
              }
            }
          }
        } else {
          this.addError(`Table '${table}' has no columns or doesn't exist`);
        }
      } catch (error) {
        this.addError(`Error checking table structure for '${table}': ${error.message}`);
      }
    }
  }

  async checkIndexes() {
    log.title('Checking Database Indexes');

    try {
      const indexes = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename LIKE '%social%'
        ORDER BY tablename, indexname
      `);

      const indexCount = indexes.length;
      this.addSuccess(`Found ${indexCount} indexes on social tables`);

      // Check for critical indexes
      const indexNames = indexes.map(idx => idx.indexname);
      
      const criticalIndexes = [
        'enhanced_social_posts_user_id_idx',
        'enhanced_social_posts_created_at_idx',
        'enhanced_post_likes_post_id_idx',
        'social_posts_user_id_idx'
      ];

      for (const indexName of criticalIndexes) {
        if (indexNames.some(idx => idx.includes(indexName.split('_').slice(-2).join('_')))) {
          this.addSuccess(`Critical index pattern found: ${indexName}`);
        } else {
          this.addWarning(`Critical index missing: ${indexName}`);
        }
      }

    } catch (error) {
      this.addError(`Error checking indexes: ${error.message}`);
    }
  }

  async checkFileStructure() {
    log.title('Checking File Structure');

    const expectedFiles = [
      'db/social-media-schema.js',
      'db/enhanced-social-media-schema.js',
      'routes/social-media.js',
      'routes/enhanced-social-media.js',
      'socket/socialMediaHandlers.js',
      '../src/pages/SocialMediaPage.tsx'
    ];

    const expectedDirs = [
      'uploads/social-media',
      'db',
      'routes',
      'socket',
      '../src/pages'
    ];

    // Check directories
    for (const dir of expectedDirs) {
      try {
        const fullPath = path.join(process.cwd(), dir);
        await fs.access(fullPath);
        this.addSuccess(`Directory exists: ${dir}`);
      } catch (error) {
        this.addWarning(`Directory missing: ${dir}`);
      }
    }

    // Check files
    for (const file of expectedFiles) {
      try {
        const fullPath = path.join(process.cwd(), file);
        await fs.access(fullPath);
        
        const stats = await fs.stat(fullPath);
        this.addSuccess(`File exists: ${file} (${Math.round(stats.size / 1024)}KB)`);
      } catch (error) {
        this.addError(`File missing: ${file}`);
      }
    }
  }

  async checkDependencies() {
    log.title('Checking Dependencies');

    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      const requiredDeps = [
        'express',
        'drizzle-orm',
        'postgres',
        'multer',
        'sharp',
        'express-rate-limit',
        'express-validator',
        'node-cache',
        'socket.io'
      ];

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const dep of requiredDeps) {
        if (allDeps[dep]) {
          this.addSuccess(`Dependency installed: ${dep}@${allDeps[dep]}`);
        } else {
          this.addError(`Missing dependency: ${dep}`);
        }
      }

      // Check for optional but recommended dependencies
      const optionalDeps = [
        'fluent-ffmpeg',
        'node-cron',
        'bcryptjs',
        'jsonwebtoken'
      ];

      for (const dep of optionalDeps) {
        if (allDeps[dep]) {
          this.addSuccess(`Optional dependency available: ${dep}@${allDeps[dep]}`);
        } else {
          this.addWarning(`Optional dependency missing: ${dep}`);
        }
      }

    } catch (error) {
      this.addError(`Error checking dependencies: ${error.message}`);
    }
  }

  async testSchemaImports() {
    log.title('Testing Schema Imports');

    try {
      // Test importing schemas
      const { socialPosts } = await import('../db/social-media-schema.js');
      if (socialPosts) {
        this.addSuccess('Basic social-media-schema.js imports successfully');
      } else {
        this.addError('Failed to import socialPosts from social-media-schema.js');
      }

      const { enhancedSocialPosts } = await import('../db/enhanced-social-media-schema.js');
      if (enhancedSocialPosts) {
        this.addSuccess('Enhanced social-media-schema.js imports successfully');
      } else {
        this.addError('Failed to import enhancedSocialPosts from enhanced-social-media-schema.js');
      }

    } catch (error) {
      this.addError(`Schema import error: ${error.message}`);
    }
  }

  async testBasicQueries() {
    log.title('Testing Basic Database Queries');

    try {
      // Test basic user query
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      this.addSuccess(`Users table accessible, count: ${userCount[0]?.count || 0}`);

      // Test social posts query if table exists
      try {
        const postsCount = await db.execute(sql`SELECT COUNT(*) as count FROM social_posts`);
        this.addSuccess(`Social posts table accessible, count: ${postsCount[0]?.count || 0}`);
      } catch (error) {
        this.addWarning(`Social posts table query failed: ${error.message}`);
      }

      // Test enhanced social posts query if table exists
      try {
        const enhancedPostsCount = await db.execute(sql`SELECT COUNT(*) as count FROM enhanced_social_posts`);
        this.addSuccess(`Enhanced social posts table accessible, count: ${enhancedPostsCount[0]?.count || 0}`);
      } catch (error) {
        this.addWarning(`Enhanced social posts table query failed: ${error.message}`);
      }

    } catch (error) {
      this.addError(`Database query test failed: ${error.message}`);
    }
  }

  async checkEnvironmentVariables() {
    log.title('Checking Environment Variables');

    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];

    const optionalEnvVars = [
      'NODE_ENV',
      'PORT',
      'OPENAI_API_KEY',
      'CORS_ORIGIN'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addSuccess(`Required env var set: ${envVar}`);
      } else {
        this.addError(`Missing required env var: ${envVar}`);
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.addSuccess(`Optional env var set: ${envVar}`);
      } else {
        this.addWarning(`Optional env var not set: ${envVar}`);
      }
    }
  }

  async checkUploadDirectories() {
    log.title('Checking Upload Directories');

    const uploadDirs = [
      'uploads',
      'uploads/social-media',
      'uploads/social-media/' + new Date().toISOString().split('T')[0]
    ];

    for (const dir of uploadDirs) {
      try {
        const fullPath = path.join(process.cwd(), dir);
        await fs.access(fullPath);
        this.addSuccess(`Upload directory exists: ${dir}`);
      } catch (error) {
        try {
          const fullPath = path.join(process.cwd(), dir);
          await fs.mkdir(fullPath, { recursive: true });
          this.addSuccess(`Created upload directory: ${dir}`);
        } catch (createError) {
          this.addError(`Cannot create upload directory ${dir}: ${createError.message}`);
        }
      }
    }

    // Check write permissions
    try {
      const testFile = path.join(process.cwd(), 'uploads', 'test-write.txt');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      this.addSuccess('Upload directory is writable');
    } catch (error) {
      this.addError(`Upload directory not writable: ${error.message}`);
    }
  }

  generateReport() {
    log.title('Debug Report Summary');

    console.log(`\n${colors.bright}📊 SOCIAL MEDIA DEBUG REPORT${colors.reset}`);
    console.log(`${colors.green}✅ Successes: ${this.successes.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️ Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}❌ Errors: ${this.errors.length}${colors.reset}`);

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bright}CRITICAL ISSUES:${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`${colors.red}${index + 1}. ${error}${colors.reset}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}WARNINGS:${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`${colors.yellow}${index + 1}. ${warning}${colors.reset}`);
      });
    }

    const score = (this.successes.length / (this.successes.length + this.warnings.length + this.errors.length)) * 100;
    console.log(`\n${colors.bright}🎯 Health Score: ${score.toFixed(1)}%${colors.reset}`);

    if (score >= 90) {
      console.log(`${colors.green}🎉 Excellent! Your social media platform is in great shape!${colors.reset}`);
    } else if (score >= 70) {
      console.log(`${colors.yellow}👍 Good! Minor issues to address.${colors.reset}`);
    } else if (score >= 50) {
      console.log(`${colors.yellow}⚠️ Fair. Several issues need attention.${colors.reset}`);
    } else {
      console.log(`${colors.red}💥 Critical issues detected. Immediate action required!${colors.reset}`);
    }

    return {
      score,
      successes: this.successes.length,
      warnings: this.warnings.length,
      errors: this.errors.length,
      details: {
        successes: this.successes,
        warnings: this.warnings,
        errors: this.errors
      }
    };
  }

  async runFullDiagnostic() {
    console.log(`${colors.bright}${colors.magenta}`);
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║               STUDYGRAM DEBUG DIAGNOSTIC                     ║');
    console.log('║                   Social Media Platform                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);

    // Run all diagnostic tests
    await this.checkEnvironmentVariables();
    
    const dbConnected = await this.testDatabaseConnection();
    if (dbConnected) {
      await this.checkDatabaseTables();
      await this.checkTableStructures();
      await this.checkIndexes();
      await this.testBasicQueries();
    }

    await this.checkDependencies();
    await this.checkFileStructure();
    await this.checkUploadDirectories();
    await this.testSchemaImports();

    return this.generateReport();
  }
}

// Self-executing diagnostic
async function runDiagnostic() {
  const socialDebugger = new SocialMediaDebugger();
  
  try {
    const report = await socialDebugger.runFullDiagnostic();
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'social-media-debug-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log.info(`Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(report.errors.length > 0 ? 1 : 0);
  } catch (error) {
    log.error(`Diagnostic failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostic();
}

export { SocialMediaDebugger };