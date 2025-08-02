import EventEmitter from 'events';
import { Worker } from 'worker_threads';
import cluster from 'cluster';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

/**
 * Enterprise Security System
 * Comprehensive security platform with authentication, authorization, and monitoring
 */
export class EnterpriseSecuritySystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Authentication Configuration
      auth: {
        jwtSecret: config.auth?.jwtSecret || process.env.JWT_SECRET || this.generateSecret(),
        jwtRefreshSecret: config.auth?.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET || this.generateSecret(),
        jwtExpiration: config.auth?.jwtExpiration || '15m',
        refreshTokenExpiration: config.auth?.refreshTokenExpiration || '7d',
        bcryptRounds: config.auth?.bcryptRounds || 12,
        passwordMinLength: config.auth?.passwordMinLength || 8,
        passwordRequireSpecialChars: config.auth?.passwordRequireSpecialChars !== false,
        passwordRequireNumbers: config.auth?.passwordRequireNumbers !== false,
        passwordRequireUppercase: config.auth?.passwordRequireUppercase !== false,
        passwordHistoryCount: config.auth?.passwordHistoryCount || 5,
        accountLockoutThreshold: config.auth?.accountLockoutThreshold || 5,
        accountLockoutDuration: config.auth?.accountLockoutDuration || 30 * 60 * 1000, // 30 minutes
        sessionTimeout: config.auth?.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
        concurrentSessionLimit: config.auth?.concurrentSessionLimit || 5
      },
      
      // Multi-Factor Authentication
      mfa: {
        enabled: config.mfa?.enabled !== false,
        issuer: config.mfa?.issuer || 'StudyGenius',
        totpWindow: config.mfa?.totpWindow || 2, // Allow 2 time windows for clock drift
        backupCodeCount: config.mfa?.backupCodeCount || 10,
        smsProvider: config.mfa?.smsProvider || 'twilio',
        emailEnabled: config.mfa?.emailEnabled !== false,
        smsEnabled: config.mfa?.smsEnabled || false,
        totpEnabled: config.mfa?.totpEnabled !== false,
        requireForAdmins: config.mfa?.requireForAdmins !== false,
        gracePeriod: config.mfa?.gracePeriod || 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      
      // Single Sign-On Configuration
      sso: {
        enabled: config.sso?.enabled || false,
        providers: {
          google: {
            enabled: config.sso?.providers?.google?.enabled || false,
            clientId: config.sso?.providers?.google?.clientId || process.env.GOOGLE_CLIENT_ID,
            clientSecret: config.sso?.providers?.google?.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: config.sso?.providers?.google?.redirectUri || 'http://localhost:3000/auth/google/callback'
          },
          microsoft: {
            enabled: config.sso?.providers?.microsoft?.enabled || false,
            clientId: config.sso?.providers?.microsoft?.clientId || process.env.MICROSOFT_CLIENT_ID,
            clientSecret: config.sso?.providers?.microsoft?.clientSecret || process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: config.sso?.providers?.microsoft?.tenantId || process.env.MICROSOFT_TENANT_ID
          },
          saml: {
            enabled: config.sso?.providers?.saml?.enabled || false,
            entryPoint: config.sso?.providers?.saml?.entryPoint,
            issuer: config.sso?.providers?.saml?.issuer,
            cert: config.sso?.providers?.saml?.cert
          },
          ldap: {
            enabled: config.sso?.providers?.ldap?.enabled || false,
            url: config.sso?.providers?.ldap?.url,
            bindDn: config.sso?.providers?.ldap?.bindDn,
            bindCredentials: config.sso?.providers?.ldap?.bindCredentials,
            searchBase: config.sso?.providers?.ldap?.searchBase,
            searchFilter: config.sso?.providers?.ldap?.searchFilter || '(uid={{username}})'
          }
        }
      },
      
      // Device Trust and Fingerprinting
      deviceTrust: {
        enabled: config.deviceTrust?.enabled !== false,
        requireVerification: config.deviceTrust?.requireVerification || false,
        trustDuration: config.deviceTrust?.trustDuration || 30 * 24 * 60 * 60 * 1000, // 30 days
        maxTrustedDevices: config.deviceTrust?.maxTrustedDevices || 10,
        fingerprintComponents: config.deviceTrust?.fingerprintComponents || [
          'userAgent', 'screen', 'timezone', 'language', 'platform', 'cookieEnabled'
        ],
        enableGeolocation: config.deviceTrust?.enableGeolocation !== false,
        geoLocationTolerance: config.deviceTrust?.geoLocationTolerance || 100 // km
      },
      
      // Session Management
      session: {
        provider: config.session?.provider || 'memory', // memory, redis, database
        secure: config.session?.secure !== false,
        httpOnly: config.session?.httpOnly !== false,
        sameSite: config.session?.sameSite || 'strict',
        domain: config.session?.domain,
        maxAge: config.session?.maxAge || 24 * 60 * 60 * 1000, // 24 hours
        rolling: config.session?.rolling !== false,
        redis: {
          host: config.session?.redis?.host || process.env.REDIS_HOST || 'localhost',
          port: config.session?.redis?.port || process.env.REDIS_PORT || 6379,
          password: config.session?.redis?.password || process.env.REDIS_PASSWORD,
          db: config.session?.redis?.db || 0
        }
      },
      
      // Role-Based Access Control
      rbac: {
        enabled: config.rbac?.enabled !== false,
        defaultRole: config.rbac?.defaultRole || 'user',
        superAdminRole: config.rbac?.superAdminRole || 'super_admin',
        hierarchical: config.rbac?.hierarchical !== false,
        inheritanceEnabled: config.rbac?.inheritanceEnabled !== false,
        dynamicPermissions: config.rbac?.dynamicPermissions !== false,
        cacheTtl: config.rbac?.cacheTtl || 5 * 60 * 1000 // 5 minutes
      },
      
      // Security Monitoring
      monitoring: {
        enabled: config.monitoring?.enabled !== false,
        logFailedAttempts: config.monitoring?.logFailedAttempts !== false,
        logSuccessfulAttempts: config.monitoring?.logSuccessfulAttempts !== false,
        alertThreshold: config.monitoring?.alertThreshold || 10,
        alertWindow: config.monitoring?.alertWindow || 5 * 60 * 1000, // 5 minutes
        blockSuspiciousIPs: config.monitoring?.blockSuspiciousIPs !== false,
        bruteForceProtection: config.monitoring?.bruteForceProtection !== false,
        geoLocationBlocking: config.monitoring?.geoLocationBlocking || false,
        allowedCountries: config.monitoring?.allowedCountries || [],
        blockedCountries: config.monitoring?.blockedCountries || []
      },
      
      // Rate Limiting
      rateLimit: {
        enabled: config.rateLimit?.enabled !== false,
        windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
        maxRequests: config.rateLimit?.maxRequests || 100,
        skipSuccessfulRequests: config.rateLimit?.skipSuccessfulRequests || false,
        skipFailedRequests: config.rateLimit?.skipFailedRequests || false,
        keyGenerator: config.rateLimit?.keyGenerator || ((req) => req.ip),
        onLimitReached: config.rateLimit?.onLimitReached
      },
      
      // Security Headers
      headers: {
        enabled: config.headers?.enabled !== false,
        contentSecurityPolicy: config.headers?.contentSecurityPolicy !== false,
        hsts: config.headers?.hsts !== false,
        noSniff: config.headers?.noSniff !== false,
        xssFilter: config.headers?.xssFilter !== false,
        referrerPolicy: config.headers?.referrerPolicy || 'same-origin',
        featurePolicy: config.headers?.featurePolicy || {}
      },
      
      // Encryption and Hashing
      encryption: {
        algorithm: config.encryption?.algorithm || 'aes-256-gcm',
        keyLength: config.encryption?.keyLength || 32,
        ivLength: config.encryption?.ivLength || 16,
        tagLength: config.encryption?.tagLength || 16,
        masterKey: config.encryption?.masterKey || process.env.MASTER_ENCRYPTION_KEY || this.generateKey(),
        keyRotationInterval: config.encryption?.keyRotationInterval || 90 * 24 * 60 * 60 * 1000, // 90 days
        enableKeyRotation: config.encryption?.enableKeyRotation !== false
      },
      
      // Audit Logging
      audit: {
        enabled: config.audit?.enabled !== false,
        logLevel: config.audit?.logLevel || 'info',
        retentionDays: config.audit?.retentionDays || 365,
        logToFile: config.audit?.logToFile !== false,
        logToDatabase: config.audit?.logToDatabase !== false,
        logDirectory: config.audit?.logDirectory || './logs/security',
        sensitiveDataMasking: config.audit?.sensitiveDataMasking !== false,
        realTimeAlerts: config.audit?.realTimeAlerts !== false
      }
    };

    // Core components
    this.userSessions = new Map();
    this.deviceFingerprints = new Map();
    this.trustedDevices = new Map();
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.activeTokens = new Map();
    this.refreshTokens = new Map();
    this.mfaTokens = new Map();
    this.passwordHistory = new Map();
    
    // RBAC components
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    this.roleHierarchy = new Map();
    this.permissionCache = new Map();
    
    // SSO providers
    this.ssoProviders = new Map();
    
    // Security metrics
    this.metrics = {
      totalLogins: 0,
      failedLogins: 0,
      successfulLogins: 0,
      mfaVerifications: 0,
      blockedAttempts: 0,
      suspiciousActivities: 0,
      activeUsers: 0,
      activeSessions: 0,
      trustedDevicesCount: 0
    };
    
    // Event tracking
    this.securityEvents = [];
    this.alerts = [];

    this.initialize();
  }

  async initialize() {
    try {
      console.log('🔐 Initializing Enterprise Security System...');
      
      // Initialize core components
      await this.initializeEncryption();
      await this.initializeRBAC();
      await this.initializeSSOProviders();
      await this.initializeDeviceTrust();
      await this.initializeSessionManagement();
      await this.initializeSecurityMiddleware();
      await this.initializeAuditLogging();
      await this.initializeSecurityMonitoring();
      
      // Setup cleanup routines
      this.setupCleanupJobs();
      
      console.log('✅ Enterprise Security System initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize security system:', error);
      this.emit('error', error);
    }
  }

  // Encryption Initialization
  async initializeEncryption() {
    try {
      // Validate encryption configuration
      if (!this.config.encryption.masterKey) {
        throw new Error('Master encryption key is required');
      }
      
      // Setup key rotation if enabled
      if (this.config.encryption.enableKeyRotation) {
        setInterval(() => {
          this.rotateEncryptionKeys();
        }, this.config.encryption.keyRotationInterval);
      }
      
      console.log('✅ Encryption system initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
      throw error;
    }
  }

  // RBAC Initialization
  async initializeRBAC() {
    if (!this.config.rbac.enabled) return;
    
    try {
      // Define default roles and permissions
      await this.createDefaultRoles();
      await this.createDefaultPermissions();
      
      console.log('✅ RBAC system initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize RBAC:', error);
      throw error;
    }
  }

  // SSO Providers Initialization
  async initializeSSOProviders() {
    if (!this.config.sso.enabled) return;
    
    try {
      // Initialize Google OAuth
      if (this.config.sso.providers.google.enabled) {
        const googleClient = new OAuth2Client(
          this.config.sso.providers.google.clientId,
          this.config.sso.providers.google.clientSecret,
          this.config.sso.providers.google.redirectUri
        );
        this.ssoProviders.set('google', googleClient);
      }
      
      // Initialize Microsoft OAuth
      if (this.config.sso.providers.microsoft.enabled) {
        // Microsoft Graph authentication setup would go here
        console.log('Microsoft SSO configured');
      }
      
      // Initialize SAML
      if (this.config.sso.providers.saml.enabled) {
        // SAML configuration would go here
        console.log('SAML SSO configured');
      }
      
      // Initialize LDAP
      if (this.config.sso.providers.ldap.enabled) {
        // LDAP configuration would go here
        console.log('LDAP SSO configured');
      }
      
      console.log(`✅ SSO providers initialized (${this.ssoProviders.size} providers)`);
      
    } catch (error) {
      console.error('❌ Failed to initialize SSO providers:', error);
      throw error;
    }
  }

  // Device Trust Initialization
  async initializeDeviceTrust() {
    if (!this.config.deviceTrust.enabled) return;
    
    try {
      // Setup device cleanup
      setInterval(() => {
        this.cleanupExpiredDevices();
      }, 24 * 60 * 60 * 1000); // Daily cleanup
      
      console.log('✅ Device trust system initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize device trust:', error);
      throw error;
    }
  }

  // Session Management Initialization
  async initializeSessionManagement() {
    try {
      // Setup session cleanup
      setInterval(() => {
        this.cleanupExpiredSessions();
      }, 15 * 60 * 1000); // Every 15 minutes
      
      console.log('✅ Session management initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize session management:', error);
      throw error;
    }
  }

  // Security Middleware Initialization
  async initializeSecurityMiddleware() {
    try {
      // Rate limiting middleware
      this.rateLimitMiddleware = rateLimit({
        windowMs: this.config.rateLimit.windowMs,
        max: this.config.rateLimit.maxRequests,
        skipSuccessfulRequests: this.config.rateLimit.skipSuccessfulRequests,
        skipFailedRequests: this.config.rateLimit.skipFailedRequests,
        keyGenerator: this.config.rateLimit.keyGenerator,
        handler: (req, res) => {
          this.logSecurityEvent('rate_limit_exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
          });
          
          if (this.config.rateLimit.onLimitReached) {
            this.config.rateLimit.onLimitReached(req, res);
          }
        }
      });
      
      // Security headers middleware
      this.securityHeadersMiddleware = helmet({
        contentSecurityPolicy: this.config.headers.contentSecurityPolicy,
        hsts: this.config.headers.hsts,
        noSniff: this.config.headers.noSniff,
        xssFilter: this.config.headers.xssFilter,
        referrerPolicy: { policy: this.config.headers.referrerPolicy },
        featurePolicy: this.config.headers.featurePolicy
      });
      
      console.log('✅ Security middleware initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize security middleware:', error);
      throw error;
    }
  }

  // Audit Logging Initialization
  async initializeAuditLogging() {
    if (!this.config.audit.enabled) return;
    
    try {
      // Ensure log directory exists
      if (this.config.audit.logToFile) {
        await fs.mkdir(this.config.audit.logDirectory, { recursive: true });
      }
      
      // Setup log rotation
      setInterval(() => {
        this.rotateAuditLogs();
      }, 24 * 60 * 60 * 1000); // Daily log rotation
      
      console.log('✅ Audit logging initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize audit logging:', error);
      throw error;
    }
  }

  // Security Monitoring Initialization
  async initializeSecurityMonitoring() {
    if (!this.config.monitoring.enabled) return;
    
    try {
      // Setup monitoring intervals
      setInterval(() => {
        this.analyzeSecurityMetrics();
      }, this.config.monitoring.alertWindow);
      
      setInterval(() => {
        this.checkSuspiciousActivity();
      }, 60 * 1000); // Every minute
      
      console.log('✅ Security monitoring initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize security monitoring:', error);
      throw error;
    }
  }

  // Authentication Methods
  async authenticate(credentials, options = {}) {
    const startTime = performance.now();
    
    try {
      const { username, password, mfaToken, deviceFingerprint, rememberDevice } = credentials;
      const { ip, userAgent, geolocation } = options;
      
      // Check if IP is blocked
      if (this.isIPBlocked(ip)) {
        this.logSecurityEvent('blocked_ip_attempt', { ip, username, userAgent });
        throw new Error('Access denied from this IP address');
      }
      
      // Check failed attempts
      if (this.hasExceededFailedAttempts(username, ip)) {
        this.logSecurityEvent('account_lockout_attempt', { username, ip, userAgent });
        throw new Error('Account temporarily locked due to too many failed attempts');
      }
      
      // Validate user credentials
      const user = await this.validateCredentials(username, password);
      if (!user) {
        await this.recordFailedAttempt(username, ip);
        this.logSecurityEvent('failed_login', { username, ip, userAgent, reason: 'invalid_credentials' });
        throw new Error('Invalid credentials');
      }
      
      // Check if account is locked
      if (user.lockedAt && user.lockedAt > Date.now() - this.config.auth.accountLockoutDuration) {
        this.logSecurityEvent('locked_account_attempt', { username, ip, userAgent });
        throw new Error('Account is temporarily locked');
      }
      
      // Verify device trust
      const deviceInfo = await this.verifyDeviceTrust(user.id, deviceFingerprint, { ip, userAgent, geolocation });
      
      // Handle MFA if required
      if (this.requiresMFA(user)) {
        if (!mfaToken) {
          const mfaChallenge = await this.initiateMFAChallenge(user);
          return {
            requiresMFA: true,
            mfaChallenge,
            temporaryToken: this.generateTemporaryToken(user.id)
          };
        }
        
        const mfaValid = await this.verifyMFA(user, mfaToken);
        if (!mfaValid) {
          await this.recordFailedAttempt(username, ip);
          this.logSecurityEvent('failed_mfa', { username, ip, userAgent, mfaMethod: 'totp' });
          throw new Error('Invalid MFA token');
        }
      }
      
      // Create session
      const session = await this.createSession(user, {
        ip,
        userAgent,
        deviceInfo,
        rememberDevice,
        geolocation
      });
      
      // Generate tokens
      const accessToken = this.generateAccessToken(user, session);
      const refreshToken = this.generateRefreshToken(user, session);
      
      // Store tokens
      this.activeTokens.set(accessToken, {
        userId: user.id,
        sessionId: session.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.parseExpiration(this.config.auth.jwtExpiration))
      });
      
      this.refreshTokens.set(refreshToken, {
        userId: user.id,
        sessionId: session.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.parseExpiration(this.config.auth.refreshTokenExpiration))
      });
      
      // Clear failed attempts
      this.clearFailedAttempts(username, ip);
      
      // Update metrics
      this.metrics.successfulLogins++;
      this.metrics.totalLogins++;
      
      // Log successful authentication
      this.logSecurityEvent('successful_login', {
        userId: user.id,
        username,
        ip,
        userAgent,
        sessionId: session.id,
        deviceTrusted: deviceInfo.trusted,
        mfaUsed: !!mfaToken,
        duration: performance.now() - startTime
      });
      
      this.emit('authentication:success', {
        user,
        session,
        tokens: { accessToken, refreshToken }
      });
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        tokens: { accessToken, refreshToken },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        },
        deviceTrusted: deviceInfo.trusted
      };
      
    } catch (error) {
      this.metrics.failedLogins++;
      this.metrics.totalLogins++;
      
      this.emit('authentication:failed', {
        username: credentials.username,
        error: error.message,
        options
      });
      
      throw error;
    }
  }

  async validateCredentials(username, password) {
    try {
      // This would typically query your user database
      // For demo purposes, we'll simulate a user lookup
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return null;
      }
      
      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return null;
      }
      
      return user;
      
    } catch (error) {
      console.error('Error validating credentials:', error);
      return null;
    }
  }

  async createSession(user, options = {}) {
    try {
      const sessionId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.auth.sessionTimeout);
      
      const session = {
        id: sessionId,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        ip: options.ip,
        userAgent: options.userAgent,
        deviceInfo: options.deviceInfo,
        geolocation: options.geolocation,
        active: true,
        lastActivity: now
      };
      
      // Check concurrent session limit
      const userSessions = Array.from(this.userSessions.values())
        .filter(s => s.userId === user.id && s.active);
      
      if (userSessions.length >= this.config.auth.concurrentSessionLimit) {
        // Terminate oldest session
        const oldestSession = userSessions
          .sort((a, b) => a.lastActivity - b.lastActivity)[0];
        await this.terminateSession(oldestSession.id);
      }
      
      // Store session
      this.userSessions.set(sessionId, session);
      
      // Trust device if requested
      if (options.rememberDevice && options.deviceInfo) {
        await this.trustDevice(user.id, options.deviceInfo);
      }
      
      this.emit('session:created', session);
      
      return session;
      
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Multi-Factor Authentication
  async initiateMFAChallenge(user) {
    try {
      const challengeId = uuidv4();
      const challenge = {
        id: challengeId,
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        methods: []
      };
      
      // Add available MFA methods
      if (user.totpSecret && this.config.mfa.totpEnabled) {
        challenge.methods.push({
          type: 'totp',
          required: true
        });
      }
      
      if (user.phoneNumber && this.config.mfa.smsEnabled) {
        const smsCode = this.generateSMSCode();
        challenge.methods.push({
          type: 'sms',
          required: false,
          masked_phone: this.maskPhoneNumber(user.phoneNumber)
        });
        
        // Send SMS code
        await this.sendSMSCode(user.phoneNumber, smsCode);
        this.mfaTokens.set(`sms_${challengeId}`, {
          code: smsCode,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
      }
      
      if (user.email && this.config.mfa.emailEnabled) {
        const emailCode = this.generateEmailCode();
        challenge.methods.push({
          type: 'email',
          required: false,
          masked_email: this.maskEmail(user.email)
        });
        
        // Send email code
        await this.sendEmailCode(user.email, emailCode);
        this.mfaTokens.set(`email_${challengeId}`, {
          code: emailCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
      }
      
      // Add backup codes
      if (user.backupCodes && user.backupCodes.length > 0) {
        challenge.methods.push({
          type: 'backup_code',
          required: false
        });
      }
      
      this.mfaTokens.set(challengeId, challenge);
      
      return challenge;
      
    } catch (error) {
      console.error('Error initiating MFA challenge:', error);
      throw error;
    }
  }

  async verifyMFA(user, token) {
    try {
      // Verify TOTP
      if (user.totpSecret) {
        const totpValid = speakeasy.totp.verify({
          secret: user.totpSecret,
          encoding: 'base32',
          token,
          window: this.config.mfa.totpWindow
        });
        
        if (totpValid) {
          this.metrics.mfaVerifications++;
          return true;
        }
      }
      
      // Verify SMS code
      for (const [key, mfaToken] of this.mfaTokens) {
        if (key.startsWith('sms_') && 
            mfaToken.code === token && 
            mfaToken.expiresAt > new Date()) {
          this.mfaTokens.delete(key);
          this.metrics.mfaVerifications++;
          return true;
        }
      }
      
      // Verify email code
      for (const [key, mfaToken] of this.mfaTokens) {
        if (key.startsWith('email_') && 
            mfaToken.code === token && 
            mfaToken.expiresAt > new Date()) {
          this.mfaTokens.delete(key);
          this.metrics.mfaVerifications++;
          return true;
        }
      }
      
      // Verify backup code
      if (user.backupCodes && user.backupCodes.includes(token)) {
        // Remove used backup code
        user.backupCodes = user.backupCodes.filter(code => code !== token);
        await this.updateUser(user.id, { backupCodes: user.backupCodes });
        
        this.metrics.mfaVerifications++;
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error verifying MFA:', error);
      return false;
    }
  }

  async setupTOTP(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const secret = speakeasy.generateSecret({
        name: user.email,
        issuer: this.config.mfa.issuer,
        length: 32
      });
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      // Store secret temporarily (user needs to verify before enabling)
      this.mfaTokens.set(`totp_setup_${userId}`, {
        secret: secret.base32,
        tempSecret: true,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };
      
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      throw error;
    }
  }

  async verifyTOTPSetup(userId, token) {
    try {
      const setupData = this.mfaTokens.get(`totp_setup_${userId}`);
      if (!setupData || setupData.expiresAt < new Date()) {
        throw new Error('TOTP setup expired or not found');
      }
      
      const verified = speakeasy.totp.verify({
        secret: setupData.secret,
        encoding: 'base32',
        token,
        window: this.config.mfa.totpWindow
      });
      
      if (!verified) {
        throw new Error('Invalid TOTP token');
      }
      
      // Enable TOTP for user
      await this.updateUser(userId, { 
        totpSecret: setupData.secret,
        mfaEnabled: true 
      });
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      await this.updateUser(userId, { backupCodes });
      
      // Clean up temporary data
      this.mfaTokens.delete(`totp_setup_${userId}`);
      
      this.logSecurityEvent('totp_enabled', { userId });
      
      return {
        success: true,
        backupCodes
      };
      
    } catch (error) {
      console.error('Error verifying TOTP setup:', error);
      throw error;
    }
  }

  // Device Trust Management
  async verifyDeviceTrust(userId, deviceFingerprint, context = {}) {
    try {
      if (!this.config.deviceTrust.enabled || !deviceFingerprint) {
        return { trusted: false, requiresVerification: false };
      }
      
      const deviceId = this.generateDeviceId(deviceFingerprint);
      const trustedDevice = this.trustedDevices.get(`${userId}:${deviceId}`);
      
      if (trustedDevice && trustedDevice.expiresAt > new Date()) {
        // Verify device characteristics haven't changed significantly
        const trustScore = this.calculateDeviceTrustScore(trustedDevice, deviceFingerprint, context);
        
        if (trustScore > 0.8) {
          // Update last seen
          trustedDevice.lastSeen = new Date();
          trustedDevice.accessCount++;
          
          return { 
            trusted: true, 
            requiresVerification: false,
            trustScore,
            deviceId: trustedDevice.id
          };
        }
      }
      
      // Device not trusted or trust score too low
      const requiresVerification = this.config.deviceTrust.requireVerification;
      
      if (requiresVerification) {
        // Send device verification notification
        await this.sendDeviceVerificationNotification(userId, {
          deviceFingerprint,
          context
        });
      }
      
      return { 
        trusted: false, 
        requiresVerification,
        deviceId
      };
      
    } catch (error) {
      console.error('Error verifying device trust:', error);
      return { trusted: false, requiresVerification: false };
    }
  }

  async trustDevice(userId, deviceInfo) {
    try {
      const deviceId = this.generateDeviceId(deviceInfo);
      const trustId = `${userId}:${deviceId}`;
      
      // Check if user has reached max trusted devices
      const userTrustedDevices = Array.from(this.trustedDevices.values())
        .filter(device => device.userId === userId);
      
      if (userTrustedDevices.length >= this.config.deviceTrust.maxTrustedDevices) {
        // Remove oldest trusted device
        const oldestDevice = userTrustedDevices
          .sort((a, b) => a.lastSeen - b.lastSeen)[0];
        this.trustedDevices.delete(`${userId}:${oldestDevice.deviceId}`);
      }
      
      const trustedDevice = {
        id: uuidv4(),
        userId,
        deviceId,
        fingerprint: deviceInfo,
        trustedAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.deviceTrust.trustDuration),
        lastSeen: new Date(),
        accessCount: 1,
        name: this.generateDeviceName(deviceInfo),
        userAgent: deviceInfo.userAgent,
        ip: deviceInfo.ip,
        location: deviceInfo.geolocation
      };
      
      this.trustedDevices.set(trustId, trustedDevice);
      this.metrics.trustedDevicesCount++;
      
      this.logSecurityEvent('device_trusted', {
        userId,
        deviceId,
        deviceName: trustedDevice.name
      });
      
      return trustedDevice;
      
    } catch (error) {
      console.error('Error trusting device:', error);
      throw error;
    }
  }

  // Role-Based Access Control
  async createRole(name, permissions = [], options = {}) {
    try {
      const roleId = uuidv4();
      const role = {
        id: roleId,
        name,
        displayName: options.displayName || name,
        description: options.description || '',
        permissions: new Set(permissions),
        isSystem: options.isSystem || false,
        isActive: options.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
        hierarchy: options.hierarchy || 0
      };
      
      this.roles.set(roleId, role);
      this.roles.set(name, role); // Also store by name for easy lookup
      
      this.logSecurityEvent('role_created', {
        roleId,
        roleName: name,
        permissionCount: permissions.length
      });
      
      return role;
      
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  async createPermission(name, resource, action, options = {}) {
    try {
      const permissionId = uuidv4();
      const permission = {
        id: permissionId,
        name,
        resource,
        action,
        displayName: options.displayName || name,
        description: options.description || '',
        isSystem: options.isSystem || false,
        conditions: options.conditions || [],
        createdAt: new Date()
      };
      
      this.permissions.set(permissionId, permission);
      this.permissions.set(name, permission); // Also store by name
      
      return permission;
      
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  async assignRole(userId, roleId) {
    try {
      const role = this.roles.get(roleId) || this.roles.get(roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      
      if (!this.userRoles.has(userId)) {
        this.userRoles.set(userId, new Set());
      }
      
      this.userRoles.get(userId).add(role.id);
      
      // Clear permission cache for user
      this.clearUserPermissionCache(userId);
      
      this.logSecurityEvent('role_assigned', {
        userId,
        roleId: role.id,
        roleName: role.name
      });
      
      return true;
      
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  async checkPermission(userId, permission, resource = null, context = {}) {
    try {
      // Check cache first
      const cacheKey = `${userId}:${permission}:${resource || 'any'}`;
      const cached = this.permissionCache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return cached.hasPermission;
      }
      
      // Get user roles
      const userRoleIds = this.userRoles.get(userId) || new Set();
      
      let hasPermission = false;
      
      // Check each role
      for (const roleId of userRoleIds) {
        const role = this.roles.get(roleId);
        if (!role || !role.isActive) continue;
        
        // Check direct permission
        if (role.permissions.has(permission)) {
          hasPermission = true;
          break;
        }
        
        // Check resource-specific permission
        if (resource) {
          const resourcePermission = `${permission}:${resource}`;
          if (role.permissions.has(resourcePermission)) {
            hasPermission = true;
            break;
          }
        }
        
        // Check hierarchical permissions if enabled
        if (this.config.rbac.hierarchical) {
          const hierarchicalPermission = this.checkHierarchicalPermission(role, permission, resource);
          if (hierarchicalPermission) {
            hasPermission = true;
            break;
          }
        }
      }
      
      // Cache result
      this.permissionCache.set(cacheKey, {
        hasPermission,
        expiresAt: Date.now() + this.config.rbac.cacheTtl
      });
      
      return hasPermission;
      
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Token Management
  generateAccessToken(user, session) {
    try {
      const payload = {
        userId: user.id,
        sessionId: session.id,
        email: user.email,
        roles: Array.from(this.userRoles.get(user.id) || []),
        deviceId: session.deviceInfo?.deviceId,
        iat: Math.floor(Date.now() / 1000)
      };
      
      return jwt.sign(payload, this.config.auth.jwtSecret, {
        expiresIn: this.config.auth.jwtExpiration,
        issuer: 'StudyGenius',
        audience: 'StudyGenius-Client'
      });
      
    } catch (error) {
      console.error('Error generating access token:', error);
      throw error;
    }
  }

  generateRefreshToken(user, session) {
    try {
      const payload = {
        userId: user.id,
        sessionId: session.id,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      };
      
      return jwt.sign(payload, this.config.auth.jwtRefreshSecret, {
        expiresIn: this.config.auth.refreshTokenExpiration,
        issuer: 'StudyGenius',
        audience: 'StudyGenius-Client'
      });
      
    } catch (error) {
      console.error('Error generating refresh token:', error);
      throw error;
    }
  }

  async validateToken(token) {
    try {
      // Check if token is in active tokens
      const tokenData = this.activeTokens.get(token);
      if (!tokenData) {
        return { valid: false, reason: 'Token not found' };
      }
      
      // Check expiration
      if (tokenData.expiresAt < new Date()) {
        this.activeTokens.delete(token);
        return { valid: false, reason: 'Token expired' };
      }
      
      // Verify JWT signature
      const decoded = jwt.verify(token, this.config.auth.jwtSecret);
      
      // Check if session is still active
      const session = this.userSessions.get(decoded.sessionId);
      if (!session || !session.active) {
        this.activeTokens.delete(token);
        return { valid: false, reason: 'Session not active' };
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      return {
        valid: true,
        payload: decoded,
        session
      };
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.activeTokens.delete(token);
        return { valid: false, reason: 'Token expired' };
      }
      
      if (error.name === 'JsonWebTokenError') {
        return { valid: false, reason: 'Invalid token' };
      }
      
      console.error('Error validating token:', error);
      return { valid: false, reason: 'Token validation failed' };
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.auth.jwtRefreshSecret);
      
      // Check if refresh token exists
      const tokenData = this.refreshTokens.get(refreshToken);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Invalid or expired refresh token');
      }
      
      // Get session and user
      const session = this.userSessions.get(decoded.sessionId);
      if (!session || !session.active) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Session not active');
      }
      
      const user = await this.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new access token
      const newAccessToken = this.generateAccessToken(user, session);
      
      // Store new token
      this.activeTokens.set(newAccessToken, {
        userId: user.id,
        sessionId: session.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.parseExpiration(this.config.auth.jwtExpiration))
      });
      
      // Update session activity
      session.lastActivity = new Date();
      
      this.logSecurityEvent('token_refreshed', {
        userId: user.id,
        sessionId: session.id
      });
      
      return {
        accessToken: newAccessToken,
        expiresIn: this.parseExpiration(this.config.auth.jwtExpiration)
      };
      
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Session Management
  async terminateSession(sessionId) {
    try {
      const session = this.userSessions.get(sessionId);
      if (!session) {
        return false;
      }
      
      // Mark session as inactive
      session.active = false;
      session.terminatedAt = new Date();
      
      // Remove associated tokens
      for (const [token, tokenData] of this.activeTokens) {
        if (tokenData.sessionId === sessionId) {
          this.activeTokens.delete(token);
        }
      }
      
      for (const [token, tokenData] of this.refreshTokens) {
        if (tokenData.sessionId === sessionId) {
          this.refreshTokens.delete(token);
        }
      }
      
      this.logSecurityEvent('session_terminated', {
        sessionId,
        userId: session.userId
      });
      
      this.emit('session:terminated', session);
      
      return true;
      
    } catch (error) {
      console.error('Error terminating session:', error);
      return false;
    }
  }

  async terminateAllUserSessions(userId) {
    try {
      const userSessions = Array.from(this.userSessions.values())
        .filter(session => session.userId === userId && session.active);
      
      let terminatedCount = 0;
      
      for (const session of userSessions) {
        const success = await this.terminateSession(session.id);
        if (success) terminatedCount++;
      }
      
      this.logSecurityEvent('all_sessions_terminated', {
        userId,
        terminatedCount
      });
      
      return terminatedCount;
      
    } catch (error) {
      console.error('Error terminating all user sessions:', error);
      return 0;
    }
  }

  // Security Monitoring
  analyzeSecurityMetrics() {
    try {
      const now = Date.now();
      const windowStart = now - this.config.monitoring.alertWindow;
      
      // Count recent failed attempts
      const recentFailures = this.securityEvents
        .filter(event => 
          event.type === 'failed_login' && 
          event.timestamp > windowStart
        ).length;
      
      // Check for suspicious activity
      if (recentFailures > this.config.monitoring.alertThreshold) {
        this.generateSecurityAlert('high_failure_rate', {
          failureCount: recentFailures,
          timeWindow: this.config.monitoring.alertWindow / 1000 / 60 // minutes
        });
      }
      
      // Check for brute force attacks
      if (this.config.monitoring.bruteForceProtection) {
        this.detectBruteForceAttacks();
      }
      
      // Update metrics
      this.updateSecurityMetrics();
      
    } catch (error) {
      console.error('Error analyzing security metrics:', error);
    }
  }

  detectBruteForceAttacks() {
    try {
      const now = Date.now();
      const windowStart = now - (5 * 60 * 1000); // 5 minutes
      
      // Group failed attempts by IP
      const ipFailures = new Map();
      
      this.securityEvents
        .filter(event => 
          event.type === 'failed_login' && 
          event.timestamp > windowStart
        )
        .forEach(event => {
          const ip = event.data.ip;
          if (!ipFailures.has(ip)) {
            ipFailures.set(ip, []);
          }
          ipFailures.get(ip).push(event);
        });
      
      // Check for IPs with excessive failures
      for (const [ip, failures] of ipFailures) {
        if (failures.length >= 10) {
          this.blockIP(ip);
          this.generateSecurityAlert('brute_force_detected', {
            ip,
            attemptCount: failures.length,
            timeWindow: 5
          });
        }
      }
      
    } catch (error) {
      console.error('Error detecting brute force attacks:', error);
    }
  }

  blockIP(ip) {
    try {
      this.blockedIPs.add(ip);
      
      // Auto-unblock after 24 hours
      setTimeout(() => {
        this.blockedIPs.delete(ip);
        this.logSecurityEvent('ip_unblocked', { ip });
      }, 24 * 60 * 60 * 1000);
      
      this.logSecurityEvent('ip_blocked', { ip });
      this.metrics.blockedAttempts++;
      
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  }

  // Utility Methods
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateKey() {
    return crypto.randomBytes(32);
  }

  generateSMSCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateEmailCode() {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  }

  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < this.config.mfa.backupCodeCount; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  generateDeviceId(deviceInfo) {
    const fingerprint = JSON.stringify(deviceInfo);
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  parseExpiration(expiration) {
    if (typeof expiration === 'number') {
      return expiration;
    }
    
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60 * 1000; // Default 15 minutes
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }

  sanitizeUser(user) {
    const { passwordHash, totpSecret, backupCodes, ...sanitized } = user;
    return sanitized;
  }

  logSecurityEvent(type, data = {}) {
    try {
      const event = {
        id: uuidv4(),
        type,
        timestamp: Date.now(),
        data
      };
      
      this.securityEvents.push(event);
      
      // Keep only recent events in memory
      if (this.securityEvents.length > 10000) {
        this.securityEvents = this.securityEvents.slice(-5000);
      }
      
      // Log to file if enabled
      if (this.config.audit.logToFile) {
        this.writeAuditLog(event);
      }
      
      this.emit('security:event', event);
      
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Cleanup Methods
  setupCleanupJobs() {
    // Clean expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 15 * 60 * 1000); // Every 15 minutes
    
    // Clean expired tokens
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 10 * 60 * 1000); // Every 10 minutes
    
    // Clean expired MFA tokens
    setInterval(() => {
      this.cleanupExpiredMFATokens();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean old security events
    setInterval(() => {
      this.cleanupOldSecurityEvents();
    }, 60 * 60 * 1000); // Every hour
  }

  cleanupExpiredSessions() {
    try {
      const now = new Date();
      let cleanedCount = 0;
      
      for (const [sessionId, session] of this.userSessions) {
        if (session.expiresAt < now) {
          this.terminateSession(sessionId);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
      }
      
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // Placeholder methods for user management (would integrate with your user service)
  async getUserByUsername(username) {
    // This would query your user database
    return null;
  }

  async getUserById(userId) {
    // This would query your user database
    return null;
  }

  async updateUser(userId, updates) {
    // This would update your user database
    return null;
  }

  // Cleanup
  async dispose() {
    try {
      // Clear all intervals
      clearInterval();
      
      // Clear all data
      this.userSessions.clear();
      this.activeTokens.clear();
      this.refreshTokens.clear();
      this.mfaTokens.clear();
      this.trustedDevices.clear();
      this.blockedIPs.clear();
      
      this.emit('disposed');
      console.log('🧹 Enterprise Security System disposed');
      
    } catch (error) {
      console.error('Error disposing security system:', error);
    }
  }
}

// Export the main class
export const enterpriseSecuritySystem = new EnterpriseSecuritySystem();
export default enterpriseSecuritySystem;