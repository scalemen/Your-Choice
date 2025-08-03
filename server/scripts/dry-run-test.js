#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * StudyGenius Dry Run Testing Suite
 * Tests components that don't require database connection
 */
class DryRunTester {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: [],
      warnings: []
    };
  }

  log(level, message) {
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level] || '📋';

    console.log(`${prefix} ${message}`);
    
    if (level === 'error') {
      this.results.errors.push(message);
    } else if (level === 'warning') {
      this.results.warnings.push(message);
    }
  }

  async runTest(testName, testFunction) {
    this.results.totalTests++;
    this.log('info', `Testing: ${testName}`);
    
    try {
      await testFunction();
      this.results.passed++;
      this.log('success', `✓ ${testName}`);
      return true;
    } catch (error) {
      this.results.failed++;
      this.log('error', `✗ ${testName}: ${error.message}`);
      return false;
    }
  }

  async testFileStructure() {
    const requiredFiles = [
      // Core backend files
      '../index.js',
      '../db/index.js',
      '../db/schema.js',
      '../middleware/auth.js',
      '../middleware/errorHandler.js',
      
      // StudyTube files
      '../db/video-platform-schema.js',
      '../routes/video-platform.js',
      '../services/RecommendationEngine.js',
      '../services/RecommendationEngineHelpers.js',
      
      // StudyGram files
      '../db/social-media-schema.js',
      '../routes/studygram.js',
      
      // Frontend core files
      '../../src/App.tsx',
      '../../src/pages/VideoPlatformPage.tsx',
      '../../package.json',
      '../package.json'
    ];

    for (const file of requiredFiles) {
      const fullPath = join(__dirname, file);
      try {
        await fs.access(fullPath);
      } catch {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    this.log('info', `All ${requiredFiles.length} critical files verified`);
  }

  async testDependencies() {
    try {
      // Check backend package.json
      const backendPkg = JSON.parse(await fs.readFile(join(__dirname, '../package.json'), 'utf8'));
      const requiredBackendDeps = [
        'express', 'drizzle-orm', 'postgres', 'multer', 'sharp', 
        'express-validator', 'express-rate-limit', 'node-cache', 'helmet'
      ];

      for (const dep of requiredBackendDeps) {
        if (!backendPkg.dependencies[dep] && !backendPkg.devDependencies[dep]) {
          throw new Error(`Missing backend dependency: ${dep}`);
        }
      }

      // Check frontend package.json
      const frontendPkg = JSON.parse(await fs.readFile(join(__dirname, '../../package.json'), 'utf8'));
      const requiredFrontendDeps = [
        'react', 'react-dom', 'react-router-dom', '@tanstack/react-query',
        'zustand', 'tailwindcss', 'framer-motion', 'lucide-react'
      ];

      for (const dep of requiredFrontendDeps) {
        if (!frontendPkg.dependencies[dep] && !frontendPkg.devDependencies[dep]) {
          throw new Error(`Missing frontend dependency: ${dep}`);
        }
      }

      this.log('info', 'All required dependencies found');
    } catch (error) {
      throw new Error(`Dependency check failed: ${error.message}`);
    }
  }

  async testModuleImports() {
    try {
      // Test core modules can be imported
      const testModules = [
        '../services/RecommendationEngine.js',
        '../services/RecommendationEngineHelpers.js',
        '../db/video-platform-schema.js',
        '../db/social-media-schema.js'
      ];

      for (const modulePath of testModules) {
        try {
          await import(path.resolve(__dirname, modulePath));
        } catch (error) {
          throw new Error(`Module import failed for ${modulePath}: ${error.message}`);
        }
      }

      this.log('info', 'All critical modules can be imported');
    } catch (error) {
      throw new Error(`Module import test failed: ${error.message}`);
    }
  }

  async testDirectoryStructure() {
    const requiredDirs = [
      '../uploads',
      '../uploads/videos',
      '../uploads/social',
      '../uploads/thumbnails',
      '../../src',
      '../../src/components',
      '../../src/pages',
      '../../src/stores'
    ];

    for (const dir of requiredDirs) {
      const fullPath = join(__dirname, dir);
      try {
        await fs.access(fullPath);
      } catch {
        try {
          await fs.mkdir(fullPath, { recursive: true });
          this.log('info', `Created missing directory: ${dir}`);
        } catch (error) {
          throw new Error(`Cannot create directory ${dir}: ${error.message}`);
        }
      }
    }

    this.log('info', 'Directory structure verified');
  }

  async testConfigFiles() {
    const configFiles = [
      '../../vite.config.ts',
      '../../tailwind.config.js',
      '../../tsconfig.json',
      '../.env.example'
    ];

    let missingConfigs = [];
    
    for (const configFile of configFiles) {
      try {
        await fs.access(join(__dirname, configFile));
      } catch {
        missingConfigs.push(configFile);
      }
    }

    if (missingConfigs.length > 0) {
      this.log('warning', `Missing config files: ${missingConfigs.join(', ')}`);
    } else {
      this.log('info', 'All configuration files present');
    }
  }

  async testSchemaIntegrity() {
    try {
      // Just test that schema files are valid JavaScript/TypeScript
      const schemaFiles = [
        '../db/schema.js',
        '../db/video-platform-schema.js',
        '../db/social-media-schema.js'
      ];

      for (const schemaFile of schemaFiles) {
        const content = await fs.readFile(join(__dirname, schemaFile), 'utf8');
        
        // Basic syntax checks
        if (!content.includes('pgTable')) {
          throw new Error(`Schema file ${schemaFile} doesn't contain pgTable definitions`);
        }
        
        if (!content.includes('export')) {
          throw new Error(`Schema file ${schemaFile} doesn't export tables`);
        }
      }

      this.log('info', 'Schema files structure verified');
    } catch (error) {
      throw new Error(`Schema integrity test failed: ${error.message}`);
    }
  }

  async testAPIRouteStructure() {
    try {
      const routeFiles = [
        '../routes/video-platform.js',
        '../routes/studygram.js'
      ];

      for (const routeFile of routeFiles) {
        const content = await fs.readFile(join(__dirname, routeFile), 'utf8');
        
        // Check for essential route patterns
        if (!content.includes('router.get') && !content.includes('router.post')) {
          throw new Error(`Route file ${routeFile} doesn't contain HTTP route definitions`);
        }
        
        if (!content.includes('export default router')) {
          throw new Error(`Route file ${routeFile} doesn't export router`);
        }
      }

      this.log('info', 'API route structure verified');
    } catch (error) {
      throw new Error(`API route test failed: ${error.message}`);
    }
  }

  async runAllTests() {
    this.log('info', '🚀 Starting StudyGenius Dry Run Test Suite');
    this.log('info', '=' .repeat(50));

    await this.runTest('File Structure', () => this.testFileStructure());
    await this.runTest('Dependencies', () => this.testDependencies());
    await this.runTest('Directory Structure', () => this.testDirectoryStructure());
    await this.runTest('Configuration Files', () => this.testConfigFiles());
    await this.runTest('Schema Integrity', () => this.testSchemaIntegrity());
    await this.runTest('API Route Structure', () => this.testAPIRouteStructure());
    await this.runTest('Module Imports', () => this.testModuleImports());

    // Generate report
    const successRate = (this.results.passed / this.results.totalTests * 100).toFixed(1);
    
    this.log('info', '=' .repeat(50));
    this.log('info', '📊 DRY RUN TEST RESULTS');
    this.log('info', '=' .repeat(50));
    
    console.log(`📊 Tests Run: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    if (this.results.failed === 0) {
      this.log('success', '🎉 All dry run tests passed! System structure is healthy.');
      return true;
    } else {
      this.log('error', '❌ Some dry run tests failed. Check system structure.');
      return false;
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DryRunTester();
  tester.runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Dry run test suite failed:', error);
      process.exit(1);
    });
}

export default DryRunTester;