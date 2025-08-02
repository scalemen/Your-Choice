import EventEmitter from 'events';
import { Worker } from 'worker_threads';
import cluster from 'cluster';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { scheduleJob, cancelJob } from 'node-schedule';
import { WebSocket } from 'ws';
import webpush from 'web-push';
import twilio from 'twilio';
import Handlebars from 'handlebars';

/**
 * Enterprise Notification System
 * Comprehensive notification platform with multiple channels, templates, and scheduling
 */
export class EnterpriseNotificationSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Email Configuration
      email: {
        enabled: config.email?.enabled !== false,
        provider: config.email?.provider || 'smtp', // smtp, sendgrid, mailgun, ses
        smtp: {
          host: config.email?.smtp?.host || process.env.SMTP_HOST,
          port: config.email?.smtp?.port || 587,
          secure: config.email?.smtp?.secure || false,
          auth: {
            user: config.email?.smtp?.user || process.env.SMTP_USER,
            pass: config.email?.smtp?.pass || process.env.SMTP_PASS
          },
          pool: config.email?.smtp?.pool !== false,
          maxConnections: config.email?.smtp?.maxConnections || 5,
          maxMessages: config.email?.smtp?.maxMessages || 100
        },
        sendgrid: {
          apiKey: config.email?.sendgrid?.apiKey || process.env.SENDGRID_API_KEY
        },
        mailgun: {
          apiKey: config.email?.mailgun?.apiKey || process.env.MAILGUN_API_KEY,
          domain: config.email?.mailgun?.domain || process.env.MAILGUN_DOMAIN
        },
        ses: {
          accessKeyId: config.email?.ses?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.email?.ses?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
          region: config.email?.ses?.region || process.env.AWS_REGION || 'us-east-1'
        },
        defaultFrom: config.email?.defaultFrom || 'noreply@studygenius.com',
        defaultReplyTo: config.email?.defaultReplyTo,
        rateLimiting: {
          enabled: config.email?.rateLimiting?.enabled !== false,
          maxPerHour: config.email?.rateLimiting?.maxPerHour || 1000,
          maxPerDay: config.email?.rateLimiting?.maxPerDay || 10000
        }
      },
      
      // SMS Configuration
      sms: {
        enabled: config.sms?.enabled || false,
        provider: config.sms?.provider || 'twilio', // twilio, nexmo, aws-sns
        twilio: {
          accountSid: config.sms?.twilio?.accountSid || process.env.TWILIO_ACCOUNT_SID,
          authToken: config.sms?.twilio?.authToken || process.env.TWILIO_AUTH_TOKEN,
          from: config.sms?.twilio?.from || process.env.TWILIO_PHONE_NUMBER
        },
        nexmo: {
          apiKey: config.sms?.nexmo?.apiKey || process.env.NEXMO_API_KEY,
          apiSecret: config.sms?.nexmo?.apiSecret || process.env.NEXMO_API_SECRET,
          from: config.sms?.nexmo?.from
        },
        awsSns: {
          accessKeyId: config.sms?.awsSns?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.sms?.awsSns?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
          region: config.sms?.awsSns?.region || 'us-east-1'
        },
        rateLimiting: {
          enabled: config.sms?.rateLimiting?.enabled !== false,
          maxPerHour: config.sms?.rateLimiting?.maxPerHour || 100,
          maxPerDay: config.sms?.rateLimiting?.maxPerDay || 500
        }
      },
      
      // Push Notification Configuration
      push: {
        enabled: config.push?.enabled !== false,
        vapid: {
          publicKey: config.push?.vapid?.publicKey || process.env.VAPID_PUBLIC_KEY,
          privateKey: config.push?.vapid?.privateKey || process.env.VAPID_PRIVATE_KEY,
          subject: config.push?.vapid?.subject || 'mailto:admin@studygenius.com'
        },
        firebase: {
          enabled: config.push?.firebase?.enabled || false,
          serverKey: config.push?.firebase?.serverKey || process.env.FIREBASE_SERVER_KEY,
          senderId: config.push?.firebase?.senderId || process.env.FIREBASE_SENDER_ID
        },
        apns: {
          enabled: config.push?.apns?.enabled || false,
          keyId: config.push?.apns?.keyId || process.env.APNS_KEY_ID,
          teamId: config.push?.apns?.teamId || process.env.APNS_TEAM_ID,
          bundleId: config.push?.apns?.bundleId || 'com.studygenius.app',
          keyFile: config.push?.apns?.keyFile
        }
      },
      
      // WebSocket Configuration
      websocket: {
        enabled: config.websocket?.enabled !== false,
        port: config.websocket?.port || 8080,
        heartbeatInterval: config.websocket?.heartbeatInterval || 30000,
        maxConnections: config.websocket?.maxConnections || 10000,
        enableCompression: config.websocket?.enableCompression !== false,
        enableBinaryMode: config.websocket?.enableBinaryMode || false
      },
      
      // Webhook Configuration
      webhooks: {
        enabled: config.webhooks?.enabled !== false,
        endpoints: config.webhooks?.endpoints || [],
        timeout: config.webhooks?.timeout || 5000,
        retries: config.webhooks?.retries || 3,
        retryDelay: config.webhooks?.retryDelay || 1000,
        enableSigning: config.webhooks?.enableSigning !== false,
        signingSecret: config.webhooks?.signingSecret || process.env.WEBHOOK_SIGNING_SECRET
      },
      
      // Template Configuration
      templates: {
        directory: config.templates?.directory || './templates',
        engine: config.templates?.engine || 'handlebars', // handlebars, mustache, ejs
        cache: config.templates?.cache !== false,
        helpers: config.templates?.helpers || {},
        partials: config.templates?.partials || {}
      },
      
      // Queue Configuration
      queue: {
        enabled: config.queue?.enabled !== false,
        provider: config.queue?.provider || 'memory', // memory, redis, rabbitmq, aws-sqs
        redis: {
          host: config.queue?.redis?.host || process.env.REDIS_HOST || 'localhost',
          port: config.queue?.redis?.port || process.env.REDIS_PORT || 6379,
          password: config.queue?.redis?.password || process.env.REDIS_PASSWORD,
          db: config.queue?.redis?.db || 1
        },
        rabbitmq: {
          url: config.queue?.rabbitmq?.url || process.env.RABBITMQ_URL
        },
        awsSqs: {
          accessKeyId: config.queue?.awsSqs?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.queue?.awsSqs?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
          region: config.queue?.awsSqs?.region || 'us-east-1',
          queueUrl: config.queue?.awsSqs?.queueUrl
        },
        maxConcurrency: config.queue?.maxConcurrency || 10,
        defaultJobTimeout: config.queue?.defaultJobTimeout || 30000,
        retryLimit: config.queue?.retryLimit || 3,
        retryDelay: config.queue?.retryDelay || 5000
      },
      
      // Analytics Configuration
      analytics: {
        enabled: config.analytics?.enabled !== false,
        trackOpens: config.analytics?.trackOpens !== false,
        trackClicks: config.analytics?.trackClicks !== false,
        trackUnsubscribes: config.analytics?.trackUnsubscribes !== false,
        retentionDays: config.analytics?.retentionDays || 90
      },
      
      // Security Configuration
      security: {
        enableEncryption: config.security?.enableEncryption !== false,
        encryptionKey: config.security?.encryptionKey || process.env.NOTIFICATION_ENCRYPTION_KEY,
        enableRateLimiting: config.security?.enableRateLimiting !== false,
        enableIPWhitelist: config.security?.enableIPWhitelist || false,
        ipWhitelist: config.security?.ipWhitelist || [],
        enableCORS: config.security?.enableCORS !== false,
        corsOrigins: config.security?.corsOrigins || ['*']
      }
    };

    // Core components
    this.emailProvider = null;
    this.smsProvider = null;
    this.pushProvider = null;
    this.websocketServer = null;
    this.queueProvider = null;
    this.templateEngine = null;
    
    // State management
    this.notifications = new Map();
    this.subscribers = new Map();
    this.templates = new Map();
    this.scheduledJobs = new Map();
    this.webhookEndpoints = new Map();
    this.rateLimiters = new Map();
    
    // Analytics
    this.analytics = {
      sent: { email: 0, sms: 0, push: 0, websocket: 0, webhook: 0 },
      delivered: { email: 0, sms: 0, push: 0, websocket: 0, webhook: 0 },
      failed: { email: 0, sms: 0, push: 0, websocket: 0, webhook: 0 },
      opened: { email: 0 },
      clicked: { email: 0 },
      unsubscribed: { email: 0 },
      bounced: { email: 0, sms: 0 },
      complaints: { email: 0 }
    };
    
    // Performance metrics
    this.metrics = {
      totalNotifications: 0,
      averageDeliveryTime: 0,
      successRate: 0,
      errorRate: 0,
      throughput: 0,
      queueSize: 0,
      activeConnections: 0
    };

    this.initialize();
  }

  async initialize() {
    try {
      console.log('🔔 Initializing Enterprise Notification System...');
      
      // Initialize providers
      await this.initializeEmailProvider();
      await this.initializeSMSProvider();
      await this.initializePushProvider();
      await this.initializeWebSocketServer();
      await this.initializeQueueProvider();
      await this.initializeTemplateEngine();
      await this.initializeWebhooks();
      
      // Load templates
      await this.loadTemplates();
      
      // Setup analytics
      await this.setupAnalytics();
      
      // Setup rate limiting
      await this.setupRateLimiting();
      
      console.log('✅ Enterprise Notification System initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize notification system:', error);
      this.emit('error', error);
    }
  }

  // Email Provider Initialization
  async initializeEmailProvider() {
    if (!this.config.email.enabled) return;
    
    try {
      switch (this.config.email.provider) {
        case 'smtp':
          this.emailProvider = nodemailer.createTransporter({
            ...this.config.email.smtp,
            pool: this.config.email.smtp.pool
          });
          break;
          
        case 'sendgrid':
          const sgMail = await import('@sendgrid/mail');
          sgMail.setApiKey(this.config.email.sendgrid.apiKey);
          this.emailProvider = sgMail;
          break;
          
        case 'mailgun':
          const mailgun = await import('mailgun-js');
          this.emailProvider = mailgun({
            apiKey: this.config.email.mailgun.apiKey,
            domain: this.config.email.mailgun.domain
          });
          break;
          
        case 'ses':
          const aws = await import('aws-sdk');
          aws.config.update({
            accessKeyId: this.config.email.ses.accessKeyId,
            secretAccessKey: this.config.email.ses.secretAccessKey,
            region: this.config.email.ses.region
          });
          this.emailProvider = new aws.SES();
          break;
      }
      
      console.log(`✅ Email provider (${this.config.email.provider}) initialized`);
      
    } catch (error) {
      console.error('❌ Failed to initialize email provider:', error);
      throw error;
    }
  }

  // SMS Provider Initialization
  async initializeSMSProvider() {
    if (!this.config.sms.enabled) return;
    
    try {
      switch (this.config.sms.provider) {
        case 'twilio':
          this.smsProvider = twilio(
            this.config.sms.twilio.accountSid,
            this.config.sms.twilio.authToken
          );
          break;
          
        case 'nexmo':
          const nexmo = await import('nexmo');
          this.smsProvider = new nexmo({
            apiKey: this.config.sms.nexmo.apiKey,
            apiSecret: this.config.sms.nexmo.apiSecret
          });
          break;
          
        case 'aws-sns':
          const aws = await import('aws-sdk');
          aws.config.update({
            accessKeyId: this.config.sms.awsSns.accessKeyId,
            secretAccessKey: this.config.sms.awsSns.secretAccessKey,
            region: this.config.sms.awsSns.region
          });
          this.smsProvider = new aws.SNS();
          break;
      }
      
      console.log(`✅ SMS provider (${this.config.sms.provider}) initialized`);
      
    } catch (error) {
      console.error('❌ Failed to initialize SMS provider:', error);
      throw error;
    }
  }

  // Push Notification Provider Initialization
  async initializePushProvider() {
    if (!this.config.push.enabled) return;
    
    try {
      // Initialize Web Push
      if (this.config.push.vapid.publicKey && this.config.push.vapid.privateKey) {
        webpush.setVapidDetails(
          this.config.push.vapid.subject,
          this.config.push.vapid.publicKey,
          this.config.push.vapid.privateKey
        );
        
        console.log('✅ Web Push (VAPID) initialized');
      }
      
      // Initialize Firebase Cloud Messaging
      if (this.config.push.firebase.enabled && this.config.push.firebase.serverKey) {
        // FCM initialization would go here
        console.log('✅ Firebase Cloud Messaging initialized');
      }
      
      // Initialize Apple Push Notification Service
      if (this.config.push.apns.enabled && this.config.push.apns.keyFile) {
        // APNS initialization would go here
        console.log('✅ Apple Push Notification Service initialized');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize push notification provider:', error);
      throw error;
    }
  }

  // WebSocket Server Initialization
  async initializeWebSocketServer() {
    if (!this.config.websocket.enabled) return;
    
    try {
      const { WebSocketServer } = await import('ws');
      
      this.websocketServer = new WebSocketServer({
        port: this.config.websocket.port,
        perMessageDeflate: this.config.websocket.enableCompression,
        maxPayload: 16 * 1024 * 1024 // 16MB
      });
      
      this.websocketServer.on('connection', (ws, request) => {
        this.handleWebSocketConnection(ws, request);
      });
      
      this.websocketServer.on('error', (error) => {
        console.error('WebSocket server error:', error);
        this.emit('websocket:error', error);
      });
      
      // Setup heartbeat
      this.setupWebSocketHeartbeat();
      
      console.log(`✅ WebSocket server initialized on port ${this.config.websocket.port}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  // Queue Provider Initialization
  async initializeQueueProvider() {
    if (!this.config.queue.enabled) return;
    
    try {
      switch (this.config.queue.provider) {
        case 'memory':
          this.queueProvider = new MemoryQueue(this.config.queue);
          break;
          
        case 'redis':
          const Redis = await import('ioredis');
          const redis = new Redis(this.config.queue.redis);
          this.queueProvider = new RedisQueue(redis, this.config.queue);
          break;
          
        case 'rabbitmq':
          const amqp = await import('amqplib');
          const connection = await amqp.connect(this.config.queue.rabbitmq.url);
          this.queueProvider = new RabbitMQQueue(connection, this.config.queue);
          break;
          
        case 'aws-sqs':
          const aws = await import('aws-sdk');
          aws.config.update({
            accessKeyId: this.config.queue.awsSqs.accessKeyId,
            secretAccessKey: this.config.queue.awsSqs.secretAccessKey,
            region: this.config.queue.awsSqs.region
          });
          const sqs = new aws.SQS();
          this.queueProvider = new SQSQueue(sqs, this.config.queue);
          break;
      }
      
      // Start queue processing
      await this.queueProvider.start();
      this.queueProvider.on('job', (job) => this.processQueueJob(job));
      
      console.log(`✅ Queue provider (${this.config.queue.provider}) initialized`);
      
    } catch (error) {
      console.error('❌ Failed to initialize queue provider:', error);
      throw error;
    }
  }

  // Template Engine Initialization
  async initializeTemplateEngine() {
    try {
      switch (this.config.templates.engine) {
        case 'handlebars':
          this.templateEngine = Handlebars.create();
          
          // Register helpers
          Object.entries(this.config.templates.helpers).forEach(([name, helper]) => {
            this.templateEngine.registerHelper(name, helper);
          });
          
          // Register built-in helpers
          this.registerHandlebarsHelpers();
          break;
          
        case 'mustache':
          this.templateEngine = await import('mustache');
          break;
          
        case 'ejs':
          this.templateEngine = await import('ejs');
          break;
      }
      
      console.log(`✅ Template engine (${this.config.templates.engine}) initialized`);
      
    } catch (error) {
      console.error('❌ Failed to initialize template engine:', error);
      throw error;
    }
  }

  // Webhook Initialization
  async initializeWebhooks() {
    if (!this.config.webhooks.enabled) return;
    
    try {
      // Register webhook endpoints
      this.config.webhooks.endpoints.forEach(endpoint => {
        this.webhookEndpoints.set(endpoint.id || uuidv4(), {
          ...endpoint,
          retries: 0,
          lastAttempt: null,
          status: 'active'
        });
      });
      
      console.log(`✅ ${this.webhookEndpoints.size} webhook endpoints registered`);
      
    } catch (error) {
      console.error('❌ Failed to initialize webhooks:', error);
      throw error;
    }
  }

  // Template Loading
  async loadTemplates() {
    try {
      const templateDir = this.config.templates.directory;
      
      // Ensure template directory exists
      try {
        await fs.mkdir(templateDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      // Load template files
      const files = await fs.readdir(templateDir, { recursive: true });
      
      for (const file of files) {
        if (file.endsWith('.hbs') || file.endsWith('.html') || file.endsWith('.txt')) {
          const templatePath = path.join(templateDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const templateName = path.basename(file, path.extname(file));
          
          this.templates.set(templateName, {
            content: templateContent,
            compiled: this.compileTemplate(templateContent),
            path: templatePath,
            lastModified: (await fs.stat(templatePath)).mtime
          });
        }
      }
      
      // Create default templates if none exist
      if (this.templates.size === 0) {
        await this.createDefaultTemplates();
      }
      
      console.log(`✅ ${this.templates.size} templates loaded`);
      
    } catch (error) {
      console.error('❌ Failed to load templates:', error);
      throw error;
    }
  }

  // Analytics Setup
  async setupAnalytics() {
    if (!this.config.analytics.enabled) return;
    
    try {
      // Setup periodic analytics aggregation
      setInterval(() => {
        this.aggregateAnalytics();
      }, 60000); // Every minute
      
      // Setup analytics cleanup
      setInterval(() => {
        this.cleanupAnalytics();
      }, 24 * 60 * 60 * 1000); // Daily
      
      console.log('✅ Analytics tracking initialized');
      
    } catch (error) {
      console.error('❌ Failed to setup analytics:', error);
      throw error;
    }
  }

  // Rate Limiting Setup
  async setupRateLimiting() {
    if (!this.config.security.enableRateLimiting) return;
    
    try {
      // Setup rate limiters for each channel
      if (this.config.email.rateLimiting.enabled) {
        this.rateLimiters.set('email', new RateLimiter({
          maxPerHour: this.config.email.rateLimiting.maxPerHour,
          maxPerDay: this.config.email.rateLimiting.maxPerDay
        }));
      }
      
      if (this.config.sms.rateLimiting.enabled) {
        this.rateLimiters.set('sms', new RateLimiter({
          maxPerHour: this.config.sms.rateLimiting.maxPerHour,
          maxPerDay: this.config.sms.rateLimiting.maxPerDay
        }));
      }
      
      console.log('✅ Rate limiting initialized');
      
    } catch (error) {
      console.error('❌ Failed to setup rate limiting:', error);
      throw error;
    }
  }

  // Core Notification Methods
  async sendNotification(notification) {
    const startTime = performance.now();
    
    try {
      // Validate notification
      this.validateNotification(notification);
      
      // Generate notification ID
      const notificationId = notification.id || uuidv4();
      notification.id = notificationId;
      notification.timestamp = new Date();
      notification.status = 'processing';
      
      // Store notification
      this.notifications.set(notificationId, notification);
      
      // Emit notification event
      this.emit('notification:created', notification);
      
      // Process notification based on channels
      const results = await Promise.allSettled(
        notification.channels.map(channel => this.sendToChannel(notification, channel))
      );
      
      // Update notification status
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      notification.status = failed === 0 ? 'sent' : (successful > 0 ? 'partial' : 'failed');
      notification.results = results;
      notification.deliveryTime = performance.now() - startTime;
      
      // Update analytics
      this.updateAnalytics(notification, results);
      
      // Emit completion event
      this.emit('notification:completed', notification);
      
      return {
        id: notificationId,
        status: notification.status,
        successful,
        failed,
        deliveryTime: notification.deliveryTime,
        results: results.map(r => ({
          status: r.status,
          value: r.status === 'fulfilled' ? r.value : null,
          reason: r.status === 'rejected' ? r.reason.message : null
        }))
      };
      
    } catch (error) {
      console.error('Failed to send notification:', error);
      this.emit('notification:error', { notification, error });
      throw error;
    }
  }

  async sendToChannel(notification, channel) {
    try {
      // Check rate limits
      if (this.rateLimiters.has(channel.type)) {
        const rateLimiter = this.rateLimiters.get(channel.type);
        if (!rateLimiter.checkLimit(notification.recipient)) {
          throw new Error(`Rate limit exceeded for ${channel.type}`);
        }
      }
      
      switch (channel.type) {
        case 'email':
          return await this.sendEmail(notification, channel);
        case 'sms':
          return await this.sendSMS(notification, channel);
        case 'push':
          return await this.sendPushNotification(notification, channel);
        case 'websocket':
          return await this.sendWebSocketMessage(notification, channel);
        case 'webhook':
          return await this.sendWebhook(notification, channel);
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }
      
    } catch (error) {
      console.error(`Failed to send to ${channel.type}:`, error);
      throw error;
    }
  }

  // Email Sending
  async sendEmail(notification, channel) {
    if (!this.emailProvider) {
      throw new Error('Email provider not initialized');
    }
    
    try {
      // Prepare email data
      const emailData = await this.prepareEmailData(notification, channel);
      
      // Send based on provider
      let result;
      switch (this.config.email.provider) {
        case 'smtp':
          result = await this.emailProvider.sendMail(emailData);
          break;
        case 'sendgrid':
          result = await this.emailProvider.send(emailData);
          break;
        case 'mailgun':
          result = await this.emailProvider.messages().send(emailData);
          break;
        case 'ses':
          result = await this.emailProvider.sendEmail(emailData).promise();
          break;
      }
      
      // Update analytics
      this.analytics.sent.email++;
      
      return {
        messageId: result.messageId || result.id,
        provider: this.config.email.provider,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.analytics.failed.email++;
      throw error;
    }
  }

  async prepareEmailData(notification, channel) {
    // Render template if specified
    let subject = notification.subject;
    let content = notification.content;
    
    if (notification.template) {
      const template = this.templates.get(notification.template);
      if (template) {
        const context = {
          ...notification.data,
          recipient: notification.recipient,
          timestamp: new Date(),
          unsubscribeUrl: this.generateUnsubscribeUrl(notification.recipient),
          trackingPixel: this.generateTrackingPixel(notification.id)
        };
        
        subject = this.renderTemplate(notification.subject || template.subject, context);
        content = this.renderTemplate(template.content, context);
      }
    }
    
    // Prepare attachments
    const attachments = [];
    if (notification.attachments) {
      for (const attachment of notification.attachments) {
        if (attachment.path) {
          attachments.push({
            filename: attachment.filename,
            path: attachment.path,
            contentType: attachment.contentType
          });
        } else if (attachment.content) {
          attachments.push({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType
          });
        }
      }
    }
    
    return {
      from: channel.from || this.config.email.defaultFrom,
      to: notification.recipient,
      subject,
      html: content,
      text: this.htmlToText(content),
      replyTo: channel.replyTo || this.config.email.defaultReplyTo,
      attachments,
      headers: {
        'X-Notification-ID': notification.id,
        'X-Message-Source': 'StudyGenius'
      }
    };
  }

  // SMS Sending
  async sendSMS(notification, channel) {
    if (!this.smsProvider) {
      throw new Error('SMS provider not initialized');
    }
    
    try {
      // Prepare SMS data
      const smsData = await this.prepareSMSData(notification, channel);
      
      // Send based on provider
      let result;
      switch (this.config.sms.provider) {
        case 'twilio':
          result = await this.smsProvider.messages.create(smsData);
          break;
        case 'nexmo':
          result = await new Promise((resolve, reject) => {
            this.smsProvider.message.sendSms(
              smsData.from,
              smsData.to,
              smsData.body,
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              }
            );
          });
          break;
        case 'aws-sns':
          result = await this.smsProvider.publish(smsData).promise();
          break;
      }
      
      // Update analytics
      this.analytics.sent.sms++;
      
      return {
        messageId: result.sid || result.messageId || result.MessageId,
        provider: this.config.sms.provider,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.analytics.failed.sms++;
      throw error;
    }
  }

  async prepareSMSData(notification, channel) {
    // Render template if specified
    let content = notification.content;
    
    if (notification.template) {
      const template = this.templates.get(notification.template);
      if (template) {
        const context = {
          ...notification.data,
          recipient: notification.recipient,
          timestamp: new Date()
        };
        
        content = this.renderTemplate(template.content, context);
      }
    }
    
    // Truncate content for SMS (160 characters for single SMS)
    if (content.length > 160 && !channel.allowLongMessages) {
      content = content.substring(0, 157) + '...';
    }
    
    switch (this.config.sms.provider) {
      case 'twilio':
        return {
          from: channel.from || this.config.sms.twilio.from,
          to: notification.recipient,
          body: content
        };
        
      case 'nexmo':
        return {
          from: channel.from || this.config.sms.nexmo.from,
          to: notification.recipient,
          text: content
        };
        
      case 'aws-sns':
        return {
          PhoneNumber: notification.recipient,
          Message: content,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        };
    }
  }

  // Push Notification Sending
  async sendPushNotification(notification, channel) {
    try {
      // Prepare push data
      const pushData = await this.preparePushData(notification, channel);
      
      let result;
      
      if (channel.platform === 'web') {
        // Web Push
        result = await webpush.sendNotification(
          channel.subscription,
          JSON.stringify(pushData)
        );
      } else if (channel.platform === 'android' && this.config.push.firebase.enabled) {
        // Firebase Cloud Messaging for Android
        result = await this.sendFirebaseNotification(pushData, channel);
      } else if (channel.platform === 'ios' && this.config.push.apns.enabled) {
        // Apple Push Notification Service
        result = await this.sendAPNSNotification(pushData, channel);
      }
      
      // Update analytics
      this.analytics.sent.push++;
      
      return {
        messageId: result.messageId || uuidv4(),
        platform: channel.platform,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.analytics.failed.push++;
      throw error;
    }
  }

  async preparePushData(notification, channel) {
    // Render template if specified
    let title = notification.title || notification.subject;
    let body = notification.content;
    
    if (notification.template) {
      const template = this.templates.get(notification.template);
      if (template) {
        const context = {
          ...notification.data,
          recipient: notification.recipient,
          timestamp: new Date()
        };
        
        title = this.renderTemplate(notification.title || template.title, context);
        body = this.renderTemplate(template.content, context);
      }
    }
    
    return {
      title,
      body,
      icon: channel.icon || '/icons/icon-192x192.png',
      badge: channel.badge || '/icons/badge-72x72.png',
      data: {
        notificationId: notification.id,
        url: channel.url,
        ...notification.data
      },
      actions: channel.actions || [],
      silent: channel.silent || false,
      timestamp: Date.now()
    };
  }

  // WebSocket Message Sending
  async sendWebSocketMessage(notification, channel) {
    if (!this.websocketServer) {
      throw new Error('WebSocket server not initialized');
    }
    
    try {
      // Prepare WebSocket data
      const wsData = await this.prepareWebSocketData(notification, channel);
      
      let sent = 0;
      let failed = 0;
      
      // Send to all connected clients or specific recipient
      this.websocketServer.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          const clientId = ws.clientId;
          
          // Check if message is for this client
          if (!channel.recipient || channel.recipient === clientId || channel.recipient === 'all') {
            try {
              ws.send(JSON.stringify(wsData));
              sent++;
            } catch (error) {
              failed++;
              console.error('Failed to send WebSocket message to client:', error);
            }
          }
        }
      });
      
      // Update analytics
      this.analytics.sent.websocket += sent;
      this.analytics.failed.websocket += failed;
      
      return {
        sent,
        failed,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.analytics.failed.websocket++;
      throw error;
    }
  }

  async prepareWebSocketData(notification, channel) {
    // Render template if specified
    let content = notification.content;
    
    if (notification.template) {
      const template = this.templates.get(notification.template);
      if (template) {
        const context = {
          ...notification.data,
          recipient: notification.recipient,
          timestamp: new Date()
        };
        
        content = this.renderTemplate(template.content, context);
      }
    }
    
    return {
      type: 'notification',
      id: notification.id,
      title: notification.title || notification.subject,
      content,
      priority: notification.priority || 'normal',
      category: notification.category,
      data: notification.data,
      timestamp: new Date().toISOString()
    };
  }

  // Webhook Sending
  async sendWebhook(notification, channel) {
    try {
      // Prepare webhook data
      const webhookData = await this.prepareWebhookData(notification, channel);
      
      // Add signature if enabled
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'StudyGenius-Webhook/1.0',
        'X-Notification-ID': notification.id,
        'X-Timestamp': Date.now().toString()
      };
      
      if (this.config.webhooks.enableSigning && this.config.webhooks.signingSecret) {
        const signature = this.generateWebhookSignature(webhookData, this.config.webhooks.signingSecret);
        headers['X-Signature'] = signature;
      }
      
      // Send webhook
      const result = await axios({
        method: channel.method || 'POST',
        url: channel.url,
        data: webhookData,
        headers: {
          ...headers,
          ...channel.headers
        },
        timeout: this.config.webhooks.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });
      
      // Update analytics
      this.analytics.sent.webhook++;
      
      return {
        statusCode: result.status,
        headers: result.headers,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.analytics.failed.webhook++;
      
      // Handle retries
      if (channel.retries < this.config.webhooks.retries) {
        channel.retries++;
        
        setTimeout(() => {
          this.sendWebhook(notification, channel);
        }, this.config.webhooks.retryDelay * channel.retries);
      }
      
      throw error;
    }
  }

  async prepareWebhookData(notification, channel) {
    return {
      event: 'notification.sent',
      notification: {
        id: notification.id,
        type: notification.type,
        subject: notification.subject,
        content: notification.content,
        recipient: notification.recipient,
        timestamp: notification.timestamp,
        data: notification.data
      },
      channel: {
        type: channel.type,
        ...channel.metadata
      }
    };
  }

  // Scheduled Notifications
  async scheduleNotification(notification, schedule) {
    try {
      const jobId = notification.id || uuidv4();
      
      // Parse schedule
      let cronPattern;
      if (typeof schedule === 'string') {
        cronPattern = schedule;
      } else if (schedule.cron) {
        cronPattern = schedule.cron;
      } else if (schedule.date) {
        cronPattern = new Date(schedule.date);
      } else if (schedule.delay) {
        cronPattern = new Date(Date.now() + schedule.delay);
      }
      
      // Schedule job
      const job = scheduleJob(jobId, cronPattern, async () => {
        try {
          await this.sendNotification(notification);
          
          // Remove job if it's not recurring
          if (!schedule.recurring) {
            this.scheduledJobs.delete(jobId);
          }
          
        } catch (error) {
          console.error('Scheduled notification failed:', error);
          this.emit('scheduled:error', { jobId, notification, error });
        }
      });
      
      // Store job reference
      this.scheduledJobs.set(jobId, {
        job,
        notification,
        schedule,
        createdAt: new Date()
      });
      
      this.emit('scheduled:created', { jobId, notification, schedule });
      
      return jobId;
      
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  cancelScheduledNotification(jobId) {
    try {
      const scheduledJob = this.scheduledJobs.get(jobId);
      
      if (scheduledJob) {
        cancelJob(scheduledJob.job);
        this.scheduledJobs.delete(jobId);
        
        this.emit('scheduled:cancelled', { jobId });
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Failed to cancel scheduled notification:', error);
      throw error;
    }
  }

  // Bulk Notifications
  async sendBulkNotification(notifications, options = {}) {
    try {
      const batchSize = options.batchSize || 100;
      const delay = options.delay || 100; // ms between batches
      const results = [];
      
      // Process in batches
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        const batchPromises = batch.map(notification => 
          this.sendNotification(notification).catch(error => ({
            error: error.message,
            notification
          }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Delay between batches
        if (i + batchSize < notifications.length && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Aggregate results
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      
      return {
        total: notifications.length,
        successful,
        failed,
        results
      };
      
    } catch (error) {
      console.error('Bulk notification failed:', error);
      throw error;
    }
  }

  // Template Management
  compileTemplate(content) {
    try {
      switch (this.config.templates.engine) {
        case 'handlebars':
          return this.templateEngine.compile(content);
        case 'mustache':
          return (context) => this.templateEngine.render(content, context);
        case 'ejs':
          return this.templateEngine.compile(content);
        default:
          return (context) => content;
      }
    } catch (error) {
      console.error('Template compilation failed:', error);
      throw error;
    }
  }

  renderTemplate(template, context) {
    try {
      if (typeof template === 'string') {
        const compiled = this.compileTemplate(template);
        return compiled(context);
      } else if (typeof template === 'function') {
        return template(context);
      }
      
      return template;
      
    } catch (error) {
      console.error('Template rendering failed:', error);
      return template;
    }
  }

  async createTemplate(name, content, options = {}) {
    try {
      const template = {
        content,
        compiled: this.compileTemplate(content),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...options
      };
      
      this.templates.set(name, template);
      
      // Save to file if directory is specified
      if (this.config.templates.directory) {
        const filePath = path.join(this.config.templates.directory, `${name}.hbs`);
        await fs.writeFile(filePath, content);
        template.path = filePath;
      }
      
      this.emit('template:created', { name, template });
      
      return template;
      
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  async updateTemplate(name, content) {
    try {
      const template = this.templates.get(name);
      
      if (!template) {
        throw new Error(`Template '${name}' not found`);
      }
      
      template.content = content;
      template.compiled = this.compileTemplate(content);
      template.updatedAt = new Date();
      
      // Update file if it exists
      if (template.path) {
        await fs.writeFile(template.path, content);
      }
      
      this.emit('template:updated', { name, template });
      
      return template;
      
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  deleteTemplate(name) {
    try {
      const template = this.templates.get(name);
      
      if (template) {
        this.templates.delete(name);
        
        // Delete file if it exists
        if (template.path) {
          fs.unlink(template.path).catch(console.error);
        }
        
        this.emit('template:deleted', { name, template });
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  // Subscription Management
  async subscribe(channel, recipient, preferences = {}) {
    try {
      const subscriptionId = uuidv4();
      const subscription = {
        id: subscriptionId,
        channel,
        recipient,
        preferences,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store subscription
      if (!this.subscribers.has(recipient)) {
        this.subscribers.set(recipient, new Map());
      }
      
      this.subscribers.get(recipient).set(subscriptionId, subscription);
      
      this.emit('subscription:created', subscription);
      
      return subscriptionId;
      
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async unsubscribe(subscriptionId, recipient) {
    try {
      const userSubscriptions = this.subscribers.get(recipient);
      
      if (userSubscriptions && userSubscriptions.has(subscriptionId)) {
        const subscription = userSubscriptions.get(subscriptionId);
        subscription.active = false;
        subscription.unsubscribedAt = new Date();
        
        this.emit('subscription:cancelled', subscription);
        
        // Update analytics
        this.analytics.unsubscribed.email++;
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  aggregateAnalytics() {
    try {
      // Calculate metrics
      const totalSent = Object.values(this.analytics.sent).reduce((a, b) => a + b, 0);
      const totalFailed = Object.values(this.analytics.failed).reduce((a, b) => a + b, 0);
      const totalDelivered = Object.values(this.analytics.delivered).reduce((a, b) => a + b, 0);
      
      this.metrics.totalNotifications = totalSent + totalFailed;
      this.metrics.successRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      this.metrics.errorRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
      this.metrics.queueSize = this.queueProvider ? this.queueProvider.size() : 0;
      this.metrics.activeConnections = this.websocketServer ? this.websocketServer.clients.size : 0;
      
      this.emit('analytics:updated', {
        analytics: this.analytics,
        metrics: this.metrics,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Analytics aggregation failed:', error);
    }
  }

  getAnalytics(timeRange = '24h') {
    return {
      analytics: this.analytics,
      metrics: this.metrics,
      timeRange,
      timestamp: new Date()
    };
  }

  // Utility Methods
  validateNotification(notification) {
    if (!notification.recipient) {
      throw new Error('Notification recipient is required');
    }
    
    if (!notification.channels || notification.channels.length === 0) {
      throw new Error('At least one channel is required');
    }
    
    if (!notification.content && !notification.template) {
      throw new Error('Notification content or template is required');
    }
    
    // Validate channels
    notification.channels.forEach(channel => {
      if (!channel.type) {
        throw new Error('Channel type is required');
      }
      
      if (['email', 'sms', 'push', 'websocket', 'webhook'].indexOf(channel.type) === -1) {
        throw new Error(`Invalid channel type: ${channel.type}`);
      }
    });
  }

  generateUnsubscribeUrl(recipient) {
    const token = crypto.createHmac('sha256', this.config.security.encryptionKey || 'secret')
      .update(recipient)
      .digest('hex');
    
    return `${process.env.BASE_URL || 'http://localhost:3000'}/unsubscribe?token=${token}&email=${encodeURIComponent(recipient)}`;
  }

  generateTrackingPixel(notificationId) {
    return `${process.env.BASE_URL || 'http://localhost:3000'}/track/open/${notificationId}.gif`;
  }

  generateWebhookSignature(data, secret) {
    return crypto.createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Cleanup
  async dispose() {
    try {
      // Cancel all scheduled jobs
      for (const [jobId, scheduledJob] of this.scheduledJobs) {
        cancelJob(scheduledJob.job);
      }
      this.scheduledJobs.clear();
      
      // Close WebSocket server
      if (this.websocketServer) {
        this.websocketServer.close();
      }
      
      // Stop queue provider
      if (this.queueProvider) {
        await this.queueProvider.stop();
      }
      
      // Close email transporter
      if (this.emailProvider && this.emailProvider.close) {
        this.emailProvider.close();
      }
      
      this.emit('disposed');
      console.log('🧹 Enterprise Notification System disposed');
      
    } catch (error) {
      console.error('Error disposing notification system:', error);
    }
  }

  // WebSocket Helper Methods
  handleWebSocketConnection(ws, request) {
    // Generate client ID
    ws.clientId = uuidv4();
    ws.isAlive = true;
    
    // Setup heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      this.emit('websocket:disconnected', { clientId: ws.clientId });
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId: ws.clientId,
      timestamp: new Date().toISOString()
    }));
    
    this.emit('websocket:connected', { clientId: ws.clientId, request });
  }

  handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
        
      case 'subscribe':
        // Handle subscription to specific notification types
        ws.subscriptions = ws.subscriptions || new Set();
        ws.subscriptions.add(message.channel);
        break;
        
      case 'unsubscribe':
        if (ws.subscriptions) {
          ws.subscriptions.delete(message.channel);
        }
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  setupWebSocketHeartbeat() {
    setInterval(() => {
      this.websocketServer.clients.forEach((ws) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.websocket.heartbeatInterval);
  }

  // Handlebars Helpers
  registerHandlebarsHelpers() {
    this.templateEngine.registerHelper('formatDate', (date, format) => {
      return new Date(date).toLocaleDateString();
    });
    
    this.templateEngine.registerHelper('formatCurrency', (amount, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });
    
    this.templateEngine.registerHelper('eq', (a, b) => a === b);
    this.templateEngine.registerHelper('ne', (a, b) => a !== b);
    this.templateEngine.registerHelper('gt', (a, b) => a > b);
    this.templateEngine.registerHelper('lt', (a, b) => a < b);
    
    this.templateEngine.registerHelper('capitalize', (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    
    this.templateEngine.registerHelper('truncate', (str, length) => {
      return str.length > length ? str.substring(0, length) + '...' : str;
    });
  }

  // Default Templates
  async createDefaultTemplates() {
    const defaultTemplates = {
      'welcome': {
        subject: 'Welcome to StudyGenius!',
        content: `
          <h1>Welcome {{recipient}}!</h1>
          <p>Thank you for joining StudyGenius, the ultimate educational platform.</p>
          <p>You can now access:</p>
          <ul>
            <li>AI-powered learning tools</li>
            <li>Interactive study materials</li>
            <li>Collaborative features</li>
            <li>Progress tracking</li>
          </ul>
          <p><a href="{{baseUrl}}/dashboard">Get Started</a></p>
        `
      },
      
      'notification': {
        subject: 'StudyGenius Notification',
        content: `
          <h2>{{title}}</h2>
          <p>{{content}}</p>
          <p><small>Sent at {{formatDate timestamp}}</small></p>
        `
      },
      
      'reminder': {
        subject: 'Study Reminder - {{title}}',
        content: `
          <h2>Study Reminder</h2>
          <p>Don't forget about your upcoming study session:</p>
          <h3>{{title}}</h3>
          <p>{{description}}</p>
          <p><strong>Time:</strong> {{formatDate scheduledTime}}</p>
          <p><a href="{{sessionUrl}}">Join Session</a></p>
        `
      }
    };
    
    for (const [name, template] of Object.entries(defaultTemplates)) {
      await this.createTemplate(name, template.content, {
        subject: template.subject,
        type: 'default'
      });
    }
  }
}

// Queue Implementations
class MemoryQueue extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.queue = [];
    this.processing = false;
    this.workers = 0;
  }
  
  async start() {
    this.processing = true;
    this.processQueue();
  }
  
  async stop() {
    this.processing = false;
  }
  
  async add(job) {
    this.queue.push({
      id: uuidv4(),
      data: job,
      attempts: 0,
      createdAt: new Date()
    });
  }
  
  size() {
    return this.queue.length;
  }
  
  async processQueue() {
    while (this.processing && this.workers < this.config.maxConcurrency) {
      const job = this.queue.shift();
      if (job) {
        this.workers++;
        this.processJob(job).finally(() => {
          this.workers--;
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  async processJob(job) {
    try {
      this.emit('job', job);
    } catch (error) {
      job.attempts++;
      if (job.attempts < this.config.retryLimit) {
        setTimeout(() => {
          this.queue.push(job);
        }, this.config.retryDelay);
      }
    }
  }
}

// Rate Limiter Implementation
class RateLimiter {
  constructor(options) {
    this.maxPerHour = options.maxPerHour;
    this.maxPerDay = options.maxPerDay;
    this.hourlyCounter = new Map();
    this.dailyCounter = new Map();
    
    // Cleanup counters periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }
  
  checkLimit(identifier) {
    const now = Date.now();
    const hour = Math.floor(now / (60 * 60 * 1000));
    const day = Math.floor(now / (24 * 60 * 60 * 1000));
    
    // Check hourly limit
    const hourlyKey = `${identifier}:${hour}`;
    const hourlyCount = this.hourlyCounter.get(hourlyKey) || 0;
    
    if (hourlyCount >= this.maxPerHour) {
      return false;
    }
    
    // Check daily limit
    const dailyKey = `${identifier}:${day}`;
    const dailyCount = this.dailyCounter.get(dailyKey) || 0;
    
    if (dailyCount >= this.maxPerDay) {
      return false;
    }
    
    // Increment counters
    this.hourlyCounter.set(hourlyKey, hourlyCount + 1);
    this.dailyCounter.set(dailyKey, dailyCount + 1);
    
    return true;
  }
  
  cleanup() {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const currentDay = Math.floor(now / (24 * 60 * 60 * 1000));
    
    // Clean up old hourly counters
    for (const [key] of this.hourlyCounter) {
      const hour = parseInt(key.split(':')[1]);
      if (hour < currentHour - 1) {
        this.hourlyCounter.delete(key);
      }
    }
    
    // Clean up old daily counters
    for (const [key] of this.dailyCounter) {
      const day = parseInt(key.split(':')[1]);
      if (day < currentDay - 1) {
        this.dailyCounter.delete(key);
      }
    }
  }
}

// Export the main class
export const enterpriseNotificationSystem = new EnterpriseNotificationSystem();
export default enterpriseNotificationSystem;