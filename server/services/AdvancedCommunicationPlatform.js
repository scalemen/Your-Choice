import EventEmitter from 'events';
import { Worker } from 'worker_threads';
import cluster from 'cluster';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import WebSocket from 'ws';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { createCanvas, loadImage } from 'canvas';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import unzipper from 'unzipper';

/**
 * Advanced Communication Platform
 * Comprehensive real-time communication and collaboration system
 */
export class AdvancedCommunicationPlatform extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Server Configuration
      server: {
        port: config.server?.port || 3001,
        host: config.server?.host || '0.0.0.0',
        enableHTTPS: config.server?.enableHTTPS || false,
        sslCert: config.server?.sslCert,
        sslKey: config.server?.sslKey,
        corsOrigins: config.server?.corsOrigins || ['http://localhost:3000'],
        maxConnections: config.server?.maxConnections || 10000,
        pingInterval: config.server?.pingInterval || 25000,
        pingTimeout: config.server?.pingTimeout || 60000
      },
      
      // WebRTC Configuration
      webrtc: {
        enabled: config.webrtc?.enabled !== false,
        iceServers: config.webrtc?.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        turnServers: config.webrtc?.turnServers || [],
        maxBitrate: config.webrtc?.maxBitrate || 2500000, // 2.5 Mbps
        enableDataChannels: config.webrtc?.enableDataChannels !== false,
        enableRecording: config.webrtc?.enableRecording !== false,
        recordingFormat: config.webrtc?.recordingFormat || 'webm',
        maxParticipants: config.webrtc?.maxParticipants || 50
      },
      
      // Video/Audio Configuration
      media: {
        video: {
          enabled: config.media?.video?.enabled !== false,
          maxWidth: config.media?.video?.maxWidth || 1920,
          maxHeight: config.media?.video?.maxHeight || 1080,
          maxFrameRate: config.media?.video?.maxFrameRate || 30,
          codec: config.media?.video?.codec || 'VP8',
          enableSimulcast: config.media?.video?.enableSimulcast !== false,
          enableSVC: config.media?.video?.enableSVC || false
        },
        audio: {
          enabled: config.media?.audio?.enabled !== false,
          sampleRate: config.media?.audio?.sampleRate || 48000,
          channels: config.media?.audio?.channels || 2,
          codec: config.media?.audio?.codec || 'OPUS',
          enableNoiseSuppression: config.media?.audio?.enableNoiseSuppression !== false,
          enableEchoCancellation: config.media?.audio?.enableEchoCancellation !== false,
          enableAutoGainControl: config.media?.audio?.enableAutoGainControl !== false
        },
        screenShare: {
          enabled: config.media?.screenShare?.enabled !== false,
          maxWidth: config.media?.screenShare?.maxWidth || 1920,
          maxHeight: config.media?.screenShare?.maxHeight || 1080,
          maxFrameRate: config.media?.screenShare?.maxFrameRate || 15,
          includeAudio: config.media?.screenShare?.includeAudio !== false
        }
      },
      
      // Chat Configuration
      chat: {
        enabled: config.chat?.enabled !== false,
        maxMessageLength: config.chat?.maxMessageLength || 5000,
        enableFileSharing: config.chat?.enableFileSharing !== false,
        enableEmojis: config.chat?.enableEmojis !== false,
        enableReactions: config.chat?.enableReactions !== false,
        enableThreads: config.chat?.enableThreads !== false,
        enableMentions: config.chat?.enableMentions !== false,
        messageHistory: config.chat?.messageHistory || 1000,
        enableEncryption: config.chat?.enableEncryption !== false,
        typingIndicators: config.chat?.typingIndicators !== false,
        readReceipts: config.chat?.readReceipts !== false
      },
      
      // File Sharing Configuration
      fileSharing: {
        enabled: config.fileSharing?.enabled !== false,
        maxFileSize: config.fileSharing?.maxFileSize || 100 * 1024 * 1024, // 100MB
        allowedTypes: config.fileSharing?.allowedTypes || [
          'image/*', 'video/*', 'audio/*', 'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/*', 'application/json', 'application/zip'
        ],
        scanForViruses: config.fileSharing?.scanForViruses || false,
        enableVersioning: config.fileSharing?.enableVersioning !== false,
        enableCollaboration: config.fileSharing?.enableCollaboration !== false,
        storageProvider: config.fileSharing?.storageProvider || 'local',
        storagePath: config.fileSharing?.storagePath || './uploads'
      },
      
      // Whiteboard Configuration
      whiteboard: {
        enabled: config.whiteboard?.enabled !== false,
        maxCanvasSize: config.whiteboard?.maxCanvasSize || { width: 5000, height: 3000 },
        enableRealTimeSync: config.whiteboard?.enableRealTimeSync !== false,
        enableVersionHistory: config.whiteboard?.enableVersionHistory !== false,
        enableTemplates: config.whiteboard?.enableTemplates !== false,
        tools: config.whiteboard?.tools || [
          'pen', 'pencil', 'highlighter', 'eraser', 'text', 'shapes',
          'sticky_notes', 'arrows', 'lines', 'freehand'
        ],
        enableLayering: config.whiteboard?.enableLayering !== false,
        maxLayers: config.whiteboard?.maxLayers || 10,
        exportFormats: config.whiteboard?.exportFormats || ['png', 'jpg', 'svg', 'pdf']
      },
      
      // Collaboration Features
      collaboration: {
        enabled: config.collaboration?.enabled !== false,
        enablePresence: config.collaboration?.enablePresence !== false,
        enableCursors: config.collaboration?.enableCursors !== false,
        enableAnnotations: config.collaboration?.enableAnnotations !== false,
        enableComments: config.collaboration?.enableComments !== false,
        enableVoting: config.collaboration?.enableVoting !== false,
        enableBreakoutRooms: config.collaboration?.enableBreakoutRooms !== false,
        maxBreakoutRooms: config.collaboration?.maxBreakoutRooms || 20,
        enableHandRaising: config.collaboration?.enableHandRaising !== false,
        enableModerator: config.collaboration?.enableModerator !== false
      },
      
      // Recording Configuration
      recording: {
        enabled: config.recording?.enabled !== false,
        formats: config.recording?.formats || ['mp4', 'webm'],
        quality: config.recording?.quality || 'high',
        enableAudio: config.recording?.enableAudio !== false,
        enableVideo: config.recording?.enableVideo !== false,
        enableScreenShare: config.recording?.enableScreenShare !== false,
        enableChat: config.recording?.enableChat !== false,
        enableWhiteboard: config.recording?.enableWhiteboard !== false,
        autoStart: config.recording?.autoStart || false,
        maxDuration: config.recording?.maxDuration || 4 * 60 * 60 * 1000, // 4 hours
        storageProvider: config.recording?.storageProvider || 'local',
        storagePath: config.recording?.storagePath || './recordings'
      },
      
      // Security Configuration
      security: {
        enableAuthentication: config.security?.enableAuthentication !== false,
        enableAuthorization: config.security?.enableAuthorization !== false,
        enableRateLimiting: config.security?.enableRateLimiting !== false,
        maxRequestsPerMinute: config.security?.maxRequestsPerMinute || 100,
        enableEndToEndEncryption: config.security?.enableEndToEndEncryption || false,
        enableWaitingRoom: config.security?.enableWaitingRoom || false,
        enablePasswordProtection: config.security?.enablePasswordProtection || false,
        enableMeetingLock: config.security?.enableMeetingLock || false,
        enableHostControls: config.security?.enableHostControls !== false
      },
      
      // Analytics Configuration
      analytics: {
        enabled: config.analytics?.enabled !== false,
        trackUserEngagement: config.analytics?.trackUserEngagement !== false,
        trackNetworkQuality: config.analytics?.trackNetworkQuality !== false,
        trackPerformance: config.analytics?.trackPerformance !== false,
        enableRealTimeMetrics: config.analytics?.enableRealTimeMetrics !== false,
        metricsRetention: config.analytics?.metricsRetention || 30 * 24 * 60 * 60 * 1000 // 30 days
      }
    };

    // Core components
    this.server = null;
    this.io = null;
    this.rooms = new Map();
    this.users = new Map();
    this.connections = new Map();
    this.webrtcConnections = new Map();
    this.mediaStreams = new Map();
    this.whiteboards = new Map();
    this.fileShares = new Map();
    this.recordings = new Map();
    this.chatHistory = new Map();
    
    // Collaboration features
    this.presence = new Map();
    this.cursors = new Map();
    this.annotations = new Map();
    this.votes = new Map();
    this.breakoutRooms = new Map();
    this.handRaises = new Map();
    
    // Security and access control
    this.waitingRooms = new Map();
    this.roomPasswords = new Map();
    this.moderators = new Map();
    this.bannedUsers = new Set();
    
    // Performance metrics
    this.metrics = {
      totalConnections: 0,
      activeRooms: 0,
      totalMessages: 0,
      totalFileShares: 0,
      totalRecordings: 0,
      bandwidthUsage: 0,
      averageLatency: 0,
      connectionQuality: new Map(),
      userEngagement: new Map()
    };
    
    // Event handlers
    this.eventHandlers = new Map();
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🌐 Initializing Advanced Communication Platform...');
      
      // Setup HTTP server
      await this.setupServer();
      
      // Setup Socket.IO
      await this.setupSocketIO();
      
      // Setup WebRTC signaling
      await this.setupWebRTCSignaling();
      
      // Setup file sharing
      await this.setupFileSharing();
      
      // Setup whiteboard
      await this.setupWhiteboard();
      
      // Setup recording
      await this.setupRecording();
      
      // Setup event handlers
      await this.setupEventHandlers();
      
      // Setup analytics
      await this.setupAnalytics();
      
      // Start cleanup routines
      this.startCleanupRoutines();
      
      console.log('✅ Advanced Communication Platform initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize communication platform:', error);
      this.emit('error', error);
    }
  }

  // Server Setup
  async setupServer() {
    try {
      const app = express();
      this.server = createServer(app);
      
      // Middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      
      // CORS configuration
      app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (this.config.server.corsOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        next();
      });
      
      // Health check endpoint
      app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          metrics: this.getHealthMetrics()
        });
      });
      
      // API routes
      await this.setupAPIRoutes(app);
      
      // Start server
      this.server.listen(this.config.server.port, this.config.server.host, () => {
        console.log(`🚀 Communication server listening on ${this.config.server.host}:${this.config.server.port}`);
      });
      
    } catch (error) {
      console.error('❌ Failed to setup server:', error);
      throw error;
    }
  }

  // Socket.IO Setup
  async setupSocketIO() {
    try {
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: this.config.server.corsOrigins,
          credentials: true
        },
        pingInterval: this.config.server.pingInterval,
        pingTimeout: this.config.server.pingTimeout,
        maxHttpBufferSize: 1e8, // 100MB for file transfers
        transports: ['websocket', 'polling']
      });
      
      // Connection handling
      this.io.on('connection', (socket) => {
        this.handleConnection(socket);
      });
      
      // Rate limiting
      if (this.config.security.enableRateLimiting) {
        this.setupRateLimiting();
      }
      
      console.log('✅ Socket.IO server setup complete');
      
    } catch (error) {
      console.error('❌ Failed to setup Socket.IO:', error);
      throw error;
    }
  }

  // Connection Handling
  handleConnection(socket) {
    try {
      console.log(`👤 New connection: ${socket.id}`);
      this.metrics.totalConnections++;
      
      // Store connection
      const connection = {
        id: socket.id,
        userId: null,
        roomId: null,
        joinedAt: new Date(),
        lastActivity: new Date(),
        metadata: {}
      };
      
      this.connections.set(socket.id, connection);
      
      // Authentication
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });
      
      // Room management
      socket.on('join-room', (data) => {
        this.handleJoinRoom(socket, data);
      });
      
      socket.on('leave-room', (data) => {
        this.handleLeaveRoom(socket, data);
      });
      
      socket.on('create-room', (data) => {
        this.handleCreateRoom(socket, data);
      });
      
      // WebRTC signaling
      socket.on('webrtc-offer', (data) => {
        this.handleWebRTCOffer(socket, data);
      });
      
      socket.on('webrtc-answer', (data) => {
        this.handleWebRTCAnswer(socket, data);
      });
      
      socket.on('webrtc-ice-candidate', (data) => {
        this.handleWebRTCIceCandidate(socket, data);
      });
      
      // Chat
      socket.on('chat-message', (data) => {
        this.handleChatMessage(socket, data);
      });
      
      socket.on('typing-start', (data) => {
        this.handleTypingStart(socket, data);
      });
      
      socket.on('typing-stop', (data) => {
        this.handleTypingStop(socket, data);
      });
      
      // File sharing
      socket.on('file-share', (data) => {
        this.handleFileShare(socket, data);
      });
      
      socket.on('file-request', (data) => {
        this.handleFileRequest(socket, data);
      });
      
      // Whiteboard
      socket.on('whiteboard-draw', (data) => {
        this.handleWhiteboardDraw(socket, data);
      });
      
      socket.on('whiteboard-clear', (data) => {
        this.handleWhiteboardClear(socket, data);
      });
      
      // Collaboration
      socket.on('cursor-move', (data) => {
        this.handleCursorMove(socket, data);
      });
      
      socket.on('annotation-add', (data) => {
        this.handleAnnotationAdd(socket, data);
      });
      
      socket.on('hand-raise', (data) => {
        this.handleHandRaise(socket, data);
      });
      
      // Recording
      socket.on('recording-start', (data) => {
        this.handleRecordingStart(socket, data);
      });
      
      socket.on('recording-stop', (data) => {
        this.handleRecordingStop(socket, data);
      });
      
      // Disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });
      
      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
        this.emit('socket:error', { socketId: socket.id, error });
      });
      
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  // Authentication
  async handleAuthentication(socket, data) {
    try {
      const { token, userId, metadata } = data;
      
      // Validate authentication token
      const isValid = await this.validateAuthToken(token);
      if (!isValid) {
        socket.emit('auth-failed', { reason: 'Invalid token' });
        return;
      }
      
      // Update connection with user info
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.userId = userId;
        connection.metadata = metadata || {};
        
        // Store user info
        this.users.set(userId, {
          id: userId,
          socketId: socket.id,
          metadata,
          joinedAt: new Date(),
          lastActivity: new Date()
        });
        
        socket.emit('auth-success', { userId });
        this.emit('user:authenticated', { userId, socketId: socket.id });
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth-failed', { reason: 'Authentication failed' });
    }
  }

  // Room Management
  async handleCreateRoom(socket, data) {
    try {
      const { roomId, settings, password } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId) {
        socket.emit('room-create-failed', { reason: 'Not authenticated' });
        return;
      }
      
      // Check if room already exists
      if (this.rooms.has(roomId)) {
        socket.emit('room-create-failed', { reason: 'Room already exists' });
        return;
      }
      
      // Create room
      const room = {
        id: roomId,
        hostId: connection.userId,
        createdAt: new Date(),
        settings: {
          maxParticipants: settings?.maxParticipants || this.config.webrtc.maxParticipants,
          enableVideo: settings?.enableVideo !== false,
          enableAudio: settings?.enableAudio !== false,
          enableScreenShare: settings?.enableScreenShare !== false,
          enableChat: settings?.enableChat !== false,
          enableWhiteboard: settings?.enableWhiteboard !== false,
          enableRecording: settings?.enableRecording !== false,
          isPublic: settings?.isPublic !== false,
          waitingRoom: settings?.waitingRoom || false,
          ...settings
        },
        participants: new Map(),
        mediaStreams: new Map(),
        chatHistory: [],
        whiteboard: {
          strokes: [],
          objects: [],
          version: 0
        },
        recording: null,
        isLocked: false
      };
      
      this.rooms.set(roomId, room);
      
      // Set password if provided
      if (password) {
        this.roomPasswords.set(roomId, password);
      }
      
      // Set host as moderator
      this.moderators.set(roomId, new Set([connection.userId]));
      
      socket.emit('room-created', { roomId, room: this.sanitizeRoom(room) });
      this.emit('room:created', { roomId, hostId: connection.userId });
      
      // Auto-join the host to the room
      await this.handleJoinRoom(socket, { roomId, password });
      
    } catch (error) {
      console.error('Room creation error:', error);
      socket.emit('room-create-failed', { reason: 'Failed to create room' });
    }
  }

  async handleJoinRoom(socket, data) {
    try {
      const { roomId, password, metadata } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId) {
        socket.emit('room-join-failed', { reason: 'Not authenticated' });
        return;
      }
      
      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('room-join-failed', { reason: 'Room not found' });
        return;
      }
      
      // Check if room is locked
      if (room.isLocked && !this.moderators.get(roomId)?.has(connection.userId)) {
        socket.emit('room-join-failed', { reason: 'Room is locked' });
        return;
      }
      
      // Check password
      const roomPassword = this.roomPasswords.get(roomId);
      if (roomPassword && password !== roomPassword) {
        socket.emit('room-join-failed', { reason: 'Incorrect password' });
        return;
      }
      
      // Check capacity
      if (room.participants.size >= room.settings.maxParticipants) {
        socket.emit('room-join-failed', { reason: 'Room is full' });
        return;
      }
      
      // Check waiting room
      if (room.settings.waitingRoom && !this.moderators.get(roomId)?.has(connection.userId)) {
        await this.addToWaitingRoom(roomId, connection.userId);
        socket.emit('waiting-room', { roomId });
        return;
      }
      
      // Join room
      socket.join(roomId);
      connection.roomId = roomId;
      
      // Add participant
      const participant = {
        userId: connection.userId,
        socketId: socket.id,
        joinedAt: new Date(),
        metadata: metadata || {},
        mediaState: {
          video: false,
          audio: false,
          screenShare: false
        },
        permissions: {
          canSpeak: true,
          canVideo: true,
          canScreenShare: true,
          canChat: true,
          canAnnotate: true
        }
      };
      
      room.participants.set(connection.userId, participant);
      
      // Update metrics
      this.metrics.activeRooms = this.rooms.size;
      
      // Notify user
      socket.emit('room-joined', {
        roomId,
        room: this.sanitizeRoom(room),
        participant
      });
      
      // Notify other participants
      socket.to(roomId).emit('participant-joined', {
        participant: this.sanitizeParticipant(participant)
      });
      
      this.emit('room:joined', { roomId, userId: connection.userId });
      
    } catch (error) {
      console.error('Room join error:', error);
      socket.emit('room-join-failed', { reason: 'Failed to join room' });
    }
  }

  // WebRTC Signaling
  async handleWebRTCOffer(socket, data) {
    try {
      const { roomId, targetUserId, offer, mediaType } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      const targetUser = this.users.get(targetUserId);
      if (!targetUser) {
        return;
      }
      
      // Forward offer to target user
      this.io.to(targetUser.socketId).emit('webrtc-offer', {
        fromUserId: connection.userId,
        offer,
        mediaType,
        roomId
      });
      
      this.emit('webrtc:offer', {
        roomId,
        fromUserId: connection.userId,
        targetUserId,
        mediaType
      });
      
    } catch (error) {
      console.error('WebRTC offer error:', error);
    }
  }

  async handleWebRTCAnswer(socket, data) {
    try {
      const { roomId, targetUserId, answer, mediaType } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      const targetUser = this.users.get(targetUserId);
      if (!targetUser) {
        return;
      }
      
      // Forward answer to target user
      this.io.to(targetUser.socketId).emit('webrtc-answer', {
        fromUserId: connection.userId,
        answer,
        mediaType,
        roomId
      });
      
      this.emit('webrtc:answer', {
        roomId,
        fromUserId: connection.userId,
        targetUserId,
        mediaType
      });
      
    } catch (error) {
      console.error('WebRTC answer error:', error);
    }
  }

  async handleWebRTCIceCandidate(socket, data) {
    try {
      const { roomId, targetUserId, candidate } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      const targetUser = this.users.get(targetUserId);
      if (!targetUser) {
        return;
      }
      
      // Forward ICE candidate to target user
      this.io.to(targetUser.socketId).emit('webrtc-ice-candidate', {
        fromUserId: connection.userId,
        candidate,
        roomId
      });
      
    } catch (error) {
      console.error('WebRTC ICE candidate error:', error);
    }
  }

  // Chat Handling
  async handleChatMessage(socket, data) {
    try {
      const { roomId, message, type, replyTo, mentions } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      const room = this.rooms.get(roomId);
      if (!room) {
        return;
      }
      
      // Validate message
      if (!message || message.length > this.config.chat.maxMessageLength) {
        socket.emit('chat-error', { reason: 'Invalid message' });
        return;
      }
      
      // Create chat message
      const chatMessage = {
        id: uuidv4(),
        userId: connection.userId,
        roomId,
        content: message,
        type: type || 'text',
        timestamp: new Date(),
        replyTo: replyTo || null,
        mentions: mentions || [],
        reactions: new Map(),
        edited: false,
        deleted: false
      };
      
      // Encrypt message if enabled
      if (this.config.chat.enableEncryption) {
        chatMessage.content = await this.encryptMessage(chatMessage.content);
        chatMessage.encrypted = true;
      }
      
      // Store message
      room.chatHistory.push(chatMessage);
      
      // Limit chat history
      if (room.chatHistory.length > this.config.chat.messageHistory) {
        room.chatHistory = room.chatHistory.slice(-this.config.chat.messageHistory);
      }
      
      // Update metrics
      this.metrics.totalMessages++;
      
      // Broadcast message to room
      this.io.to(roomId).emit('chat-message', this.sanitizeChatMessage(chatMessage));
      
      // Handle mentions
      if (mentions && mentions.length > 0) {
        this.handleMentions(roomId, chatMessage, mentions);
      }
      
      this.emit('chat:message', { roomId, message: chatMessage });
      
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('chat-error', { reason: 'Failed to send message' });
    }
  }

  // File Sharing
  async handleFileShare(socket, data) {
    try {
      const { roomId, fileName, fileSize, fileType, fileData } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      // Validate file
      if (fileSize > this.config.fileSharing.maxFileSize) {
        socket.emit('file-share-error', { reason: 'File too large' });
        return;
      }
      
      if (!this.isFileTypeAllowed(fileType)) {
        socket.emit('file-share-error', { reason: 'File type not allowed' });
        return;
      }
      
      // Generate unique file ID
      const fileId = uuidv4();
      const filePath = path.join(this.config.fileSharing.storagePath, `${fileId}_${fileName}`);
      
      // Save file
      await this.saveFile(filePath, fileData);
      
      // Create file share record
      const fileShare = {
        id: fileId,
        fileName,
        fileSize,
        fileType,
        filePath,
        uploadedBy: connection.userId,
        uploadedAt: new Date(),
        roomId,
        downloads: 0,
        accessLevel: 'room'
      };
      
      this.fileShares.set(fileId, fileShare);
      
      // Update metrics
      this.metrics.totalFileShares++;
      
      // Notify room
      this.io.to(roomId).emit('file-shared', {
        fileId,
        fileName,
        fileSize,
        fileType,
        uploadedBy: connection.userId,
        uploadedAt: fileShare.uploadedAt
      });
      
      this.emit('file:shared', { roomId, fileShare });
      
    } catch (error) {
      console.error('File share error:', error);
      socket.emit('file-share-error', { reason: 'Failed to share file' });
    }
  }

  // Whiteboard Handling
  async handleWhiteboardDraw(socket, data) {
    try {
      const { roomId, strokeData, tool, color, size } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      const room = this.rooms.get(roomId);
      if (!room) {
        return;
      }
      
      // Create stroke object
      const stroke = {
        id: uuidv4(),
        userId: connection.userId,
        timestamp: new Date(),
        tool,
        color,
        size,
        data: strokeData
      };
      
      // Add to whiteboard
      room.whiteboard.strokes.push(stroke);
      room.whiteboard.version++;
      
      // Broadcast to room (except sender)
      socket.to(roomId).emit('whiteboard-draw', {
        stroke,
        version: room.whiteboard.version
      });
      
      this.emit('whiteboard:draw', { roomId, stroke });
      
    } catch (error) {
      console.error('Whiteboard draw error:', error);
    }
  }

  // Collaboration Features
  async handleCursorMove(socket, data) {
    try {
      const { roomId, x, y, element } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      // Update cursor position
      const cursorData = {
        userId: connection.userId,
        x,
        y,
        element,
        timestamp: new Date()
      };
      
      this.cursors.set(`${roomId}:${connection.userId}`, cursorData);
      
      // Broadcast to room (except sender)
      socket.to(roomId).emit('cursor-move', cursorData);
      
    } catch (error) {
      console.error('Cursor move error:', error);
    }
  }

  async handleHandRaise(socket, data) {
    try {
      const { roomId, raised } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      const handRaiseKey = `${roomId}:${connection.userId}`;
      
      if (raised) {
        this.handRaises.set(handRaiseKey, {
          userId: connection.userId,
          raisedAt: new Date()
        });
      } else {
        this.handRaises.delete(handRaiseKey);
      }
      
      // Notify moderators
      const moderatorList = this.moderators.get(roomId);
      if (moderatorList) {
        for (const moderatorId of moderatorList) {
          const moderator = this.users.get(moderatorId);
          if (moderator) {
            this.io.to(moderator.socketId).emit('hand-raise', {
              userId: connection.userId,
              raised
            });
          }
        }
      }
      
      this.emit('hand:raise', { roomId, userId: connection.userId, raised });
      
    } catch (error) {
      console.error('Hand raise error:', error);
    }
  }

  // Recording
  async handleRecordingStart(socket, data) {
    try {
      const { roomId, settings } = data;
      const connection = this.connections.get(socket.id);
      
      if (!connection?.userId || connection.roomId !== roomId) {
        return;
      }
      
      // Check if user is moderator
      const moderatorList = this.moderators.get(roomId);
      if (!moderatorList?.has(connection.userId)) {
        socket.emit('recording-error', { reason: 'Not authorized' });
        return;
      }
      
      const room = this.rooms.get(roomId);
      if (!room || room.recording) {
        socket.emit('recording-error', { reason: 'Recording already in progress' });
        return;
      }
      
      // Start recording
      const recording = {
        id: uuidv4(),
        roomId,
        startedBy: connection.userId,
        startedAt: new Date(),
        settings: {
          enableAudio: settings?.enableAudio !== false,
          enableVideo: settings?.enableVideo !== false,
          enableScreenShare: settings?.enableScreenShare !== false,
          enableChat: settings?.enableChat !== false,
          enableWhiteboard: settings?.enableWhiteboard !== false,
          quality: settings?.quality || this.config.recording.quality,
          format: settings?.format || 'mp4'
        },
        status: 'recording',
        streams: new Map()
      };
      
      room.recording = recording;
      this.recordings.set(recording.id, recording);
      
      // Update metrics
      this.metrics.totalRecordings++;
      
      // Notify room
      this.io.to(roomId).emit('recording-started', {
        recordingId: recording.id,
        startedBy: connection.userId,
        startedAt: recording.startedAt
      });
      
      this.emit('recording:started', { roomId, recording });
      
    } catch (error) {
      console.error('Recording start error:', error);
      socket.emit('recording-error', { reason: 'Failed to start recording' });
    }
  }

  // Utility Methods
  sanitizeRoom(room) {
    return {
      id: room.id,
      hostId: room.hostId,
      settings: room.settings,
      participantCount: room.participants.size,
      isLocked: room.isLocked,
      hasRecording: !!room.recording
    };
  }

  sanitizeParticipant(participant) {
    return {
      userId: participant.userId,
      joinedAt: participant.joinedAt,
      metadata: participant.metadata,
      mediaState: participant.mediaState,
      permissions: participant.permissions
    };
  }

  sanitizeChatMessage(message) {
    return {
      id: message.id,
      userId: message.userId,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp,
      replyTo: message.replyTo,
      mentions: message.mentions,
      reactions: Array.from(message.reactions.entries()),
      edited: message.edited
    };
  }

  isFileTypeAllowed(fileType) {
    return this.config.fileSharing.allowedTypes.some(allowed => {
      if (allowed.endsWith('/*')) {
        const category = allowed.slice(0, -2);
        return fileType.startsWith(category);
      }
      return fileType === allowed;
    });
  }

  async validateAuthToken(token) {
    // Implement your token validation logic here
    // This is a placeholder
    return token && token.length > 0;
  }

  async saveFile(filePath, fileData) {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save file
    if (typeof fileData === 'string') {
      // Base64 data
      const buffer = Buffer.from(fileData, 'base64');
      await fs.writeFile(filePath, buffer);
    } else {
      // Binary data
      await fs.writeFile(filePath, fileData);
    }
  }

  getHealthMetrics() {
    return {
      totalConnections: this.metrics.totalConnections,
      activeConnections: this.connections.size,
      activeRooms: this.metrics.activeRooms,
      totalMessages: this.metrics.totalMessages,
      totalFileShares: this.metrics.totalFileShares,
      totalRecordings: this.metrics.totalRecordings,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  // Cleanup Routines
  startCleanupRoutines() {
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000);
    
    // Clean up empty rooms every 10 minutes
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 10 * 60 * 1000);
    
    // Clean up old files every hour
    setInterval(() => {
      this.cleanupOldFiles();
    }, 60 * 60 * 1000);
    
    // Clean up old recordings every 24 hours
    setInterval(() => {
      this.cleanupOldRecordings();
    }, 24 * 60 * 60 * 1000);
  }

  cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 10 * 60 * 1000; // 10 minutes
    
    for (const [socketId, connection] of this.connections) {
      if (now - connection.lastActivity > timeout) {
        this.connections.delete(socketId);
        if (connection.userId) {
          this.users.delete(connection.userId);
        }
      }
    }
  }

  cleanupEmptyRooms() {
    for (const [roomId, room] of this.rooms) {
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
        this.roomPasswords.delete(roomId);
        this.moderators.delete(roomId);
        this.waitingRooms.delete(roomId);
      }
    }
    
    this.metrics.activeRooms = this.rooms.size;
  }

  // Disconnection Handling
  handleDisconnection(socket, reason) {
    try {
      console.log(`👤 Disconnection: ${socket.id} (${reason})`);
      
      const connection = this.connections.get(socket.id);
      if (!connection) {
        return;
      }
      
      // Remove from room if in one
      if (connection.roomId) {
        this.handleLeaveRoom(socket, { roomId: connection.roomId });
      }
      
      // Clean up user data
      if (connection.userId) {
        this.users.delete(connection.userId);
        
        // Clean up presence
        this.presence.delete(connection.userId);
        
        // Clean up cursors
        if (connection.roomId) {
          this.cursors.delete(`${connection.roomId}:${connection.userId}`);
          this.handRaises.delete(`${connection.roomId}:${connection.userId}`);
        }
      }
      
      // Remove connection
      this.connections.delete(socket.id);
      
      this.emit('user:disconnected', {
        socketId: socket.id,
        userId: connection.userId,
        reason
      });
      
    } catch (error) {
      console.error('Disconnection handling error:', error);
    }
  }

  // Disposal
  async dispose() {
    try {
      // Close server
      if (this.server) {
        this.server.close();
      }
      
      // Clean up Socket.IO
      if (this.io) {
        this.io.close();
      }
      
      // Clear all data
      this.rooms.clear();
      this.users.clear();
      this.connections.clear();
      this.recordings.clear();
      this.fileShares.clear();
      
      this.emit('disposed');
      console.log('🧹 Advanced Communication Platform disposed');
      
    } catch (error) {
      console.error('Error disposing communication platform:', error);
    }
  }
}

// Export the main class
export const advancedCommunicationPlatform = new AdvancedCommunicationPlatform();
export default advancedCommunicationPlatform;