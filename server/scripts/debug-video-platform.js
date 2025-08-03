#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { Pool } from 'pg';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Video Platform Debugging and Validation Script
class VideoPlatformDebugger {
  constructor() {
    this.projectRoot = join(__dirname, '..');
    this.issues = [];
    this.warnings = [];
    this.passed = [];
    this.totalChecks = 0;
    this.startTime = Date.now();
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      ERROR: '❌',
      WARN: '⚠️ ',
      INFO: 'ℹ️ ',
      SUCCESS: '✅'
    }[level] || 'ℹ️ ';

    console.log(`${prefix} [${timestamp}] ${message}`);
    if (details) {
      console.log('   Details:', details);
    }

    switch (level) {
      case 'ERROR':
        this.issues.push({ message, details, timestamp });
        break;
      case 'WARN':
        this.warnings.push({ message, details, timestamp });
        break;
      case 'SUCCESS':
        this.passed.push({ message, details, timestamp });
        break;
    }
    this.totalChecks++;
  }

  async checkDatabaseConnection() {
    this.log('INFO', 'Testing database connection...');
    
    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'studygenius',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      await pool.end();

      this.log('SUCCESS', 'Database connection successful', {
        currentTime: result.rows[0].current_time,
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'studygenius'
      });
      return true;
    } catch (error) {
      this.log('ERROR', 'Database connection failed', error.message);
      return false;
    }
  }

  async checkVideoPlatformTables() {
    this.log('INFO', 'Checking video platform database tables...');
    
    const requiredTables = [
      'channels',
      'videos', 
      'video_views',
      'video_likes',
      'video_comments',
      'subscriptions',
      'playlists',
      'playlist_videos',
      'video_analytics',
      'video_recommendations',
      'user_preferences',
      'algorithm_models'
    ];

    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'studygenius',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      const client = await pool.connect();
      
      const existingTablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY($1)
      `, [requiredTables]);

      const existingTables = existingTablesResult.rows.map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      client.release();
      await pool.end();

      if (missingTables.length === 0) {
        this.log('SUCCESS', 'All video platform tables exist', {
          totalTables: requiredTables.length,
          existingTables: existingTables.length
        });
        return true;
      } else {
        this.log('ERROR', 'Missing video platform tables', {
          missingTables,
          existingTables
        });
        return false;
      }
    } catch (error) {
      this.log('ERROR', 'Error checking video platform tables', error.message);
      return false;
    }
  }

  async checkTableStructures() {
    this.log('INFO', 'Validating table structures...');
    
    const tableChecks = {
      videos: {
        requiredColumns: ['id', 'channel_id', 'title', 'video_url', 'duration', 'category', 'view_count', 'is_educational'],
        expectedIndexes: ['videos_channel_id_idx', 'videos_category_idx', 'videos_published_at_idx']
      },
      channels: {
        requiredColumns: ['id', 'user_id', 'handle', 'name', 'subscriber_count', 'is_verified'],
        expectedIndexes: ['channels_user_id_idx', 'channels_handle_idx']
      },
      video_recommendations: {
        requiredColumns: ['id', 'user_id', 'video_id', 'recommendation_type', 'score', 'algorithm_version'],
        expectedIndexes: ['video_recommendations_user_idx', 'video_recommendations_score_idx']
      }
    };

    let allValid = true;

    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'studygenius',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      const client = await pool.connect();

      for (const [tableName, checks] of Object.entries(tableChecks)) {
        // Check columns
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);

        const existingColumns = columnsResult.rows.map(row => row.column_name);
        const missingColumns = checks.requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length === 0) {
          this.log('SUCCESS', `Table ${tableName} has all required columns`, {
            totalColumns: existingColumns.length,
            requiredColumns: checks.requiredColumns.length
          });
        } else {
          this.log('ERROR', `Table ${tableName} missing columns`, {
            missingColumns,
            existingColumns
          });
          allValid = false;
        }

        // Check indexes
        const indexesResult = await client.query(`
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = $1 AND schemaname = 'public'
        `, [tableName]);

        const existingIndexes = indexesResult.rows.map(row => row.indexname);
        const missingIndexes = checks.expectedIndexes.filter(idx => !existingIndexes.includes(idx));

        if (missingIndexes.length === 0) {
          this.log('SUCCESS', `Table ${tableName} has expected indexes`, {
            totalIndexes: existingIndexes.length
          });
        } else {
          this.log('WARN', `Table ${tableName} missing some indexes`, {
            missingIndexes,
            existingIndexes
          });
        }
      }

      client.release();
      await pool.end();

      return allValid;
    } catch (error) {
      this.log('ERROR', 'Error checking table structures', error.message);
      return false;
    }
  }

  async checkFileStructure() {
    this.log('INFO', 'Checking video platform file structure...');
    
    const requiredFiles = [
      'db/video-platform-schema.js',
      'routes/video-platform.js',
      'services/RecommendationEngine.js',
      'services/RecommendationEngineHelpers.js',
      '../src/pages/VideoPlatformPage.tsx'
    ];

    const requiredDirectories = [
      'uploads/videos',
      'uploads/thumbnails'
    ];

    let allFilesExist = true;

    // Check files
    for (const file of requiredFiles) {
      const filePath = join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        this.log('SUCCESS', `File exists: ${file}`, {
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          modified: stats.mtime.toISOString()
        });
      } catch (error) {
        this.log('ERROR', `File missing: ${file}`, error.message);
        allFilesExist = false;
      }
    }

    // Check directories
    for (const dir of requiredDirectories) {
      const dirPath = join(this.projectRoot, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        this.log('SUCCESS', `Directory ready: ${dir}`);
      } catch (error) {
        this.log('ERROR', `Directory issue: ${dir}`, error.message);
        allFilesExist = false;
      }
    }

    return allFilesExist;
  }

  async checkDependencies() {
    this.log('INFO', 'Checking video platform dependencies...');
    
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const requiredDependencies = {
        'fluent-ffmpeg': 'Video processing',
        'sharp': 'Image processing', 
        'multer': 'File uploads',
        'node-cache': 'Caching',
        'express-rate-limit': 'Rate limiting',
        'express-validator': 'Input validation'
      };

      const optionalDependencies = {
        'redis': 'Advanced caching',
        'aws-sdk': 'Cloud storage'
      };

      let allRequired = true;

      // Check required dependencies
      for (const [dep, purpose] of Object.entries(requiredDependencies)) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.log('SUCCESS', `Required dependency found: ${dep}`, {
            purpose,
            version: packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
          });
        } else {
          this.log('ERROR', `Missing required dependency: ${dep}`, { purpose });
          allRequired = false;
        }
      }

      // Check optional dependencies
      for (const [dep, purpose] of Object.entries(optionalDependencies)) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.log('SUCCESS', `Optional dependency found: ${dep}`, {
            purpose,
            version: packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
          });
        } else {
          this.log('WARN', `Optional dependency missing: ${dep}`, { purpose });
        }
      }

      return allRequired;
    } catch (error) {
      this.log('ERROR', 'Error checking dependencies', error.message);
      return false;
    }
  }

  async checkFFmpegInstallation() {
    this.log('INFO', 'Checking FFmpeg installation...');
    
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          this.log('ERROR', 'FFmpeg not available', err.message);
          resolve(false);
        } else {
          const videoFormats = Object.keys(formats).filter(format => 
            formats[format].canMux && (format.includes('mp4') || format.includes('webm'))
          );
          
          this.log('SUCCESS', 'FFmpeg is available', {
            totalFormats: Object.keys(formats).length,
            videoFormats: videoFormats.length,
            sampleFormats: videoFormats.slice(0, 5)
          });
          resolve(true);
        }
      });
    });
  }

  async testSchemaImports() {
    this.log('INFO', 'Testing video platform schema imports...');
    
    try {
      const schemaPath = join(this.projectRoot, 'db/video-platform-schema.js');
      const { videos, channels, videoRecommendations } = await import(`file://${schemaPath}`);
      
      if (videos && channels && videoRecommendations) {
        this.log('SUCCESS', 'Video platform schema imports successful', {
          tables: ['videos', 'channels', 'videoRecommendations']
        });
        return true;
      } else {
        this.log('ERROR', 'Schema imports incomplete', {
          videos: !!videos,
          channels: !!channels, 
          videoRecommendations: !!videoRecommendations
        });
        return false;
      }
    } catch (error) {
      this.log('ERROR', 'Schema import failed', error.message);
      return false;
    }
  }

  async testRecommendationEngine() {
    this.log('INFO', 'Testing recommendation engine...');
    
    try {
      const enginePath = join(this.projectRoot, 'services/RecommendationEngine.js');
      const { RecommendationEngine } = await import(`file://${enginePath}`);
      
      const engine = new RecommendationEngine();
      
      // Test engine initialization
      if (typeof engine.initialize === 'function') {
        this.log('SUCCESS', 'Recommendation engine class loaded', {
          hasInitialize: true,
          hasGenerateRecommendations: typeof engine.generateRecommendations === 'function',
          hasModelWeights: !!engine.modelWeights
        });
        return true;
      } else {
        this.log('ERROR', 'Recommendation engine missing methods', {
          hasInitialize: typeof engine.initialize === 'function'
        });
        return false;
      }
    } catch (error) {
      this.log('ERROR', 'Recommendation engine test failed', error.message);
      return false;
    }
  }

  async testBasicQueries() {
    this.log('INFO', 'Testing basic video platform queries...');
    
    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'studygenius',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      const client = await pool.connect();

      // Test basic queries
      const queries = [
        {
          name: 'Count channels',
          sql: 'SELECT COUNT(*) as count FROM channels',
          expected: 'number'
        },
        {
          name: 'Count videos',
          sql: 'SELECT COUNT(*) as count FROM videos',
          expected: 'number'
        },
        {
          name: 'Check video categories',
          sql: 'SELECT DISTINCT category FROM videos LIMIT 5',
          expected: 'array'
        }
      ];

      let allPassed = true;

      for (const query of queries) {
        try {
          const result = await client.query(query.sql);
          if (result.rows && result.rows.length >= 0) {
            this.log('SUCCESS', `Query test passed: ${query.name}`, {
              rowCount: result.rows.length,
              sampleData: result.rows[0]
            });
          } else {
            this.log('WARN', `Query returned no data: ${query.name}`);
          }
        } catch (queryError) {
          this.log('ERROR', `Query failed: ${query.name}`, queryError.message);
          allPassed = false;
        }
      }

      client.release();
      await pool.end();

      return allPassed;
    } catch (error) {
      this.log('ERROR', 'Database query test failed', error.message);
      return false;
    }
  }

  async checkEnvironmentVariables() {
    this.log('INFO', 'Checking environment variables...');
    
    const requiredEnvVars = {
      DB_HOST: 'Database host',
      DB_PORT: 'Database port', 
      DB_NAME: 'Database name',
      DB_USER: 'Database user',
      DB_PASSWORD: 'Database password'
    };

    const optionalEnvVars = {
      OPENAI_API_KEY: 'AI features',
      REDIS_URL: 'Advanced caching',
      AWS_ACCESS_KEY_ID: 'Cloud storage',
      AWS_SECRET_ACCESS_KEY: 'Cloud storage'
    };

    let allRequired = true;

    // Check required variables
    for (const [envVar, purpose] of Object.entries(requiredEnvVars)) {
      if (process.env[envVar]) {
        this.log('SUCCESS', `Environment variable set: ${envVar}`, {
          purpose,
          valueLength: process.env[envVar].length
        });
      } else {
        this.log('ERROR', `Missing environment variable: ${envVar}`, { purpose });
        allRequired = false;
      }
    }

    // Check optional variables
    for (const [envVar, purpose] of Object.entries(optionalEnvVars)) {
      if (process.env[envVar]) {
        this.log('SUCCESS', `Optional environment variable set: ${envVar}`, { purpose });
      } else {
        this.log('WARN', `Optional environment variable missing: ${envVar}`, { purpose });
      }
    }

    return allRequired;
  }

  async checkUploadDirectories() {
    this.log('INFO', 'Checking upload directories and permissions...');
    
    const uploadDirs = [
      'uploads/videos',
      'uploads/thumbnails', 
      'uploads/processed'
    ];

    let allReady = true;

    for (const dir of uploadDirs) {
      const dirPath = join(this.projectRoot, dir);
      
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });
        
        // Test write permissions with a dummy file
        const testFile = join(dirPath, '.test_write_permission');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        
        // Get directory stats
        const stats = await fs.stat(dirPath);
        
        this.log('SUCCESS', `Upload directory ready: ${dir}`, {
          exists: true,
          writable: true,
          created: stats.birthtime.toISOString()
        });
      } catch (error) {
        this.log('ERROR', `Upload directory issue: ${dir}`, error.message);
        allReady = false;
      }
    }

    return allReady;
  }

  async performanceTest() {
    this.log('INFO', 'Running performance tests...');
    
    try {
      // Test file system performance
      const testData = crypto.randomBytes(1024 * 1024); // 1MB
      const testFile = join(this.projectRoot, 'uploads/videos/.perf_test');
      
      const writeStart = Date.now();
      await fs.writeFile(testFile, testData);
      const writeTime = Date.now() - writeStart;
      
      const readStart = Date.now();
      await fs.readFile(testFile);
      const readTime = Date.now() - readStart;
      
      await fs.unlink(testFile);
      
      // Test database performance
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'studygenius',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      const client = await pool.connect();
      
      const dbStart = Date.now();
      await client.query('SELECT COUNT(*) FROM videos LIMIT 1000');
      const dbTime = Date.now() - dbStart;
      
      client.release();
      await pool.end();

      const performanceGrade = (writeTime < 100 && readTime < 50 && dbTime < 100) ? 'A' : 
                              (writeTime < 200 && readTime < 100 && dbTime < 200) ? 'B' : 'C';

      this.log('SUCCESS', 'Performance test completed', {
        fileWrite: `${writeTime}ms`,
        fileRead: `${readTime}ms`, 
        databaseQuery: `${dbTime}ms`,
        grade: performanceGrade
      });

      return performanceGrade !== 'C';
    } catch (error) {
      this.log('ERROR', 'Performance test failed', error.message);
      return false;
    }
  }

  calculateHealthScore() {
    const totalPossible = this.totalChecks;
    const successCount = this.passed.length;
    const warningCount = this.warnings.length;
    const errorCount = this.issues.length;

    // Calculate weighted score
    const score = ((successCount * 1.0) + (warningCount * 0.5) + (errorCount * 0.0)) / totalPossible;
    return Math.round(score * 100);
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const healthScore = this.calculateHealthScore();

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      healthScore: `${healthScore}%`,
      summary: {
        totalChecks: this.totalChecks,
        passed: this.passed.length,
        warnings: this.warnings.length,
        errors: this.issues.length
      },
      details: {
        passed: this.passed,
        warnings: this.warnings,
        errors: this.issues
      },
      recommendations: []
    };

    // Add recommendations based on issues
    if (this.issues.length > 0) {
      report.recommendations.push('🔧 Fix critical errors before deployment');
    }
    if (this.warnings.length > 0) {
      report.recommendations.push('⚠️  Review warnings for optimal performance');
    }
    if (healthScore >= 90) {
      report.recommendations.push('🎉 System is ready for production!');
    } else if (healthScore >= 70) {
      report.recommendations.push('✅ System is functional but needs improvements');
    } else {
      report.recommendations.push('❌ System requires significant fixes');
    }

    // Save report to file
    const reportPath = join(this.projectRoot, 'video-platform-debug-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  async runFullDiagnostic() {
    console.log('🎬 Starting StudyTube Video Platform Diagnostic...\n');

    // Environment and configuration
    await this.checkEnvironmentVariables();
    await this.checkDependencies();
    await this.checkFFmpegInstallation();

    // File system and structure
    await this.checkFileStructure();
    await this.checkUploadDirectories();

    // Database tests
    const dbConnected = await this.checkDatabaseConnection();
    if (dbConnected) {
      await this.checkVideoPlatformTables();
      await this.checkTableStructures();
      await this.testBasicQueries();
    }

    // Code and schema tests
    await this.testSchemaImports();
    await this.testRecommendationEngine();

    // Performance tests
    await this.performanceTest();

    // Generate final report
    const report = await this.generateReport();

    console.log('\n🎬 StudyTube Video Platform Diagnostic Complete!\n');
    console.log(`📊 Health Score: ${report.healthScore}`);
    console.log(`⏱️  Duration: ${report.duration}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`❌ Errors: ${report.summary.errors}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    console.log(`\n📄 Full report saved to: video-platform-debug-report.json`);

    return report;
  }
}

// Run diagnostic if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const debugger = new VideoPlatformDebugger();
  debugger.runFullDiagnostic()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

export default VideoPlatformDebugger;