import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { 
  Users, 
  MessageSquare, 
  Video, 
  Share, 
  Edit, 
  Eye, 
  MousePointer, 
  Mic, 
  MicOff,
  VideoOff,
  Screen,
  Hand,
  Heart,
  ThumbsUp,
  Laugh,
  Frown,
  AlertCircle,
  Settings,
  Crown,
  Shield,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Monitor,
  Maximize,
  Minimize,
  RotateCcw,
  Save,
  Download,
  Upload,
  FileText,
  Image,
  Link,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Types and Interfaces
export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: 'owner' | 'moderator' | 'participant' | 'viewer';
  status: 'online' | 'away' | 'busy' | 'offline';
  permissions: CollaborationPermissions;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActivity: Date;
  joinedAt: Date;
  device: DeviceInfo;
  network: NetworkInfo;
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canInvite: boolean;
  canModerate: boolean;
  canManagePermissions: boolean;
  canUseVoice: boolean;
  canUseVideo: boolean;
  canShareScreen: boolean;
  canRecord: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  timestamp: Date;
}

export interface SelectionRange {
  start: number;
  end: number;
  elementId: string;
  content?: string;
  timestamp: Date;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
}

export interface NetworkInfo {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  bandwidth: number;
  connectionType: string;
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  version: number;
  dependencies: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  position: CommentPosition;
  resolved: boolean;
  replies: CommentReply[];
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
  mentions: string[];
  attachments: Attachment[];
}

export interface CommentPosition {
  elementId: string;
  start: number;
  end: number;
  context: string;
}

export interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  reactions: Reaction[];
  mentions: string[];
}

export interface Reaction {
  type: 'like' | 'love' | 'laugh' | 'sad' | 'angry' | 'celebrate';
  userId: string;
  timestamp: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'link' | 'code' | 'emoji' | 'system';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions: Reaction[];
  mentions: string[];
  attachments: Attachment[];
  metadata?: Record<string, any>;
}

export interface VoiceChannel {
  id: string;
  name: string;
  participants: string[];
  muted: boolean;
  quality: 'low' | 'medium' | 'high';
  noise_cancellation: boolean;
  echo_cancellation: boolean;
  auto_gain_control: boolean;
}

export interface VideoCall {
  id: string;
  initiator: string;
  participants: VideoParticipant[];
  status: 'initiating' | 'ringing' | 'active' | 'ended';
  startTime?: Date;
  endTime?: Date;
  recording?: boolean;
  screenSharing?: ScreenShare;
  settings: VideoCallSettings;
}

export interface VideoParticipant {
  userId: string;
  stream?: MediaStream;
  audio: boolean;
  video: boolean;
  screenShare: boolean;
  handRaised: boolean;
  speaking: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ScreenShare {
  userId: string;
  stream: MediaStream;
  type: 'screen' | 'window' | 'tab';
  audio: boolean;
  startTime: Date;
}

export interface VideoCallSettings {
  maxParticipants: number;
  allowRecording: boolean;
  requirePermissionToJoin: boolean;
  muteOnJoin: boolean;
  disableVideoOnJoin: boolean;
  backgroundBlur: boolean;
  noiseSuppression: boolean;
  quality: 'low' | 'medium' | 'high' | 'auto';
}

export interface CollaborationDocument {
  id: string;
  title: string;
  content: string;
  version: number;
  operations: Operation[];
  cursors: Map<string, CursorPosition>;
  selections: Map<string, SelectionRange>;
  comments: Comment[];
  changeHistory: DocumentChange[];
  permissions: DocumentPermissions;
  settings: DocumentSettings;
}

export interface DocumentChange {
  id: string;
  userId: string;
  operation: Operation;
  timestamp: Date;
  description: string;
}

export interface DocumentPermissions {
  public: boolean;
  allowComments: boolean;
  allowSuggestions: boolean;
  requireApproval: boolean;
  downloadAllowed: boolean;
  printAllowed: boolean;
  copyAllowed: boolean;
}

export interface DocumentSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  versionHistory: boolean;
  trackChanges: boolean;
  showCursors: boolean;
  showComments: boolean;
  enableChat: boolean;
  enableVoice: boolean;
  enableVideo: boolean;
}

// Operational Transform Engine
class OperationalTransform {
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const [transformed2, transformed1] = this.transformInsertDelete(op2, op1);
      return [transformed1, transformed2];
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }
    
    return [op1, op2];
  }

  private static transformInsertInsert(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ];
    } else {
      return [
        { ...op1, position: op1.position + (op2.content?.length || 0) },
        op2
      ];
    }
  }

  private static transformInsertDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ];
    } else if (op1.position >= op2.position + (op2.content?.length || 0)) {
      return [
        { ...op1, position: op1.position - (op2.content?.length || 0) },
        op2
      ];
    } else {
      // Insert is within the delete range
      return [
        { ...op1, position: op2.position },
        { ...op2, content: op2.content?.slice(0, op1.position - op2.position) + 
                           op1.content + 
                           op2.content?.slice(op1.position - op2.position) }
      ];
    }
  }

  private static transformDeleteDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    const op1End = op1.position + (op1.content?.length || 0);
    const op2End = op2.position + (op2.content?.length || 0);

    if (op1End <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position - (op1.content?.length || 0) }
      ];
    } else if (op2End <= op1.position) {
      return [
        { ...op1, position: op1.position - (op2.content?.length || 0) },
        op2
      ];
    } else {
      // Overlapping deletes - complex case
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1End, op2End);
      const overlapLength = overlapEnd - overlapStart;

      return [
        {
          ...op1,
          position: Math.min(op1.position, op2.position),
          content: op1.content?.slice(0, overlapStart - op1.position) +
                  op1.content?.slice(overlapEnd - op1.position)
        },
        {
          ...op2,
          position: Math.min(op1.position, op2.position),
          content: op2.content?.slice(0, overlapStart - op2.position) +
                  op2.content?.slice(overlapEnd - op2.position)
        }
      ];
    }
  }
}

// Real-time Collaboration Engine Component
export const RealTimeCollaborationEngine: React.FC = () => {
  // State Management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [collaborators, setCollaborators] = useState<Map<string, CollaborationUser>>(new Map());
  const [document, setDocument] = useState<CollaborationDocument | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const [voiceChannel, setVoiceChannel] = useState<VoiceChannel | null>(null);
  const [videoCall, setVideoCall] = useState<VideoCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<string>('');
  
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [selections, setSelections] = useState<Map<string, SelectionRange>>(new Map());
  
  const [operationQueue, setOperationQueue] = useState<Operation[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Map<string, Operation>>(new Map());
  const [documentVersion, setDocumentVersion] = useState(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const [permissions, setPermissions] = useState<CollaborationPermissions>({
    canEdit: false,
    canComment: false,
    canShare: false,
    canInvite: false,
    canModerate: false,
    canManagePermissions: false,
    canUseVoice: false,
    canUseVideo: false,
    canShareScreen: false,
    canRecord: false
  });

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionMonitorRef = useRef<NodeJS.Timeout>();

  // WebRTC Peer Connections
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const mediaConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };

  // Socket Connection Management
  useEffect(() => {
    const initializeSocket = () => {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        forceNew: true,
        autoConnect: true
      });

      // Connection Events
      newSocket.on('connect', () => {
        console.log('🔗 Connected to collaboration server');
        setIsConnected(true);
        setReconnectAttempts(0);
        setConnectionQuality('excellent');
        startConnectionMonitoring();
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from collaboration server:', reason);
        setIsConnected(false);
        stopConnectionMonitoring();
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          setTimeout(() => newSocket.connect(), 1000);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setReconnectAttempts(prev => prev + 1);
        setConnectionQuality('poor');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        setReconnectAttempts(0);
        setConnectionQuality('good');
      });

      // Collaboration Events
      newSocket.on('user_joined', handleUserJoined);
      newSocket.on('user_left', handleUserLeft);
      newSocket.on('user_updated', handleUserUpdated);
      newSocket.on('cursor_moved', handleCursorMoved);
      newSocket.on('selection_changed', handleSelectionChanged);
      
      // Document Events
      newSocket.on('operation_received', handleOperationReceived);
      newSocket.on('document_updated', handleDocumentUpdated);
      newSocket.on('version_conflict', handleVersionConflict);
      
      // Chat Events
      newSocket.on('message_received', handleMessageReceived);
      newSocket.on('user_typing', handleUserTyping);
      newSocket.on('user_stopped_typing', handleUserStoppedTyping);
      
      // Voice/Video Events
      newSocket.on('voice_channel_updated', handleVoiceChannelUpdated);
      newSocket.on('video_call_started', handleVideoCallStarted);
      newSocket.on('video_call_ended', handleVideoCallEnded);
      newSocket.on('webrtc_signal', handleWebRTCSignal);
      
      // Comment Events
      newSocket.on('comment_added', handleCommentAdded);
      newSocket.on('comment_updated', handleCommentUpdated);
      newSocket.on('comment_resolved', handleCommentResolved);

      setSocket(newSocket);
      socketRef.current = newSocket;

      return newSocket;
    };

    const socket = initializeSocket();

    return () => {
      socket.disconnect();
      stopConnectionMonitoring();
      cleanupWebRTC();
    };
  }, []);

  // Connection Quality Monitoring
  const startConnectionMonitoring = useCallback(() => {
    connectionMonitorRef.current = setInterval(() => {
      if (socket && socket.connected) {
        const startTime = Date.now();
        socket.emit('ping', startTime);
        
        socket.once('pong', (timestamp) => {
          const latency = Date.now() - timestamp;
          updateConnectionQuality(latency);
        });
      }
    }, 5000);
  }, [socket]);

  const stopConnectionMonitoring = useCallback(() => {
    if (connectionMonitorRef.current) {
      clearInterval(connectionMonitorRef.current);
    }
  }, []);

  const updateConnectionQuality = useCallback((latency: number) => {
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (latency < 50) quality = 'excellent';
    else if (latency < 100) quality = 'good';
    else if (latency < 200) quality = 'fair';
    else quality = 'poor';
    
    setConnectionQuality(quality);
  }, []);

  // User Management
  const handleUserJoined = useCallback((user: CollaborationUser) => {
    setCollaborators(prev => new Map(prev.set(user.id, user)));
    
    // Add system message
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'system',
      content: `${user.name} joined the collaboration`,
      type: 'system',
      timestamp: new Date(),
      reactions: [],
      mentions: [],
      attachments: []
    };
    
    setChatMessages(prev => [...prev, systemMessage]);
  }, []);

  const handleUserLeft = useCallback((userId: string) => {
    const user = collaborators.get(userId);
    if (user) {
      setCollaborators(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      
      setCursors(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      
      setSelections(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'system',
        content: `${user.name} left the collaboration`,
        type: 'system',
        timestamp: new Date(),
        reactions: [],
        mentions: [],
        attachments: []
      };
      
      setChatMessages(prev => [...prev, systemMessage]);
      
      // Clean up WebRTC connection
      const peerConnection = peerConnections.current.get(userId);
      if (peerConnection) {
        peerConnection.close();
        peerConnections.current.delete(userId);
      }
      
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }
  }, [collaborators]);

  const handleUserUpdated = useCallback((user: CollaborationUser) => {
    setCollaborators(prev => new Map(prev.set(user.id, user)));
  }, []);

  // Cursor and Selection Management
  const handleCursorMoved = useCallback((data: { userId: string, cursor: CursorPosition }) => {
    setCursors(prev => new Map(prev.set(data.userId, data.cursor)));
  }, []);

  const handleSelectionChanged = useCallback((data: { userId: string, selection: SelectionRange }) => {
    setSelections(prev => new Map(prev.set(data.userId, data.selection)));
  }, []);

  const emitCursorMove = useCallback((position: CursorPosition) => {
    if (socket && isConnected) {
      socket.emit('cursor_move', position);
    }
  }, [socket, isConnected]);

  const emitSelectionChange = useCallback((selection: SelectionRange) => {
    if (socket && isConnected) {
      socket.emit('selection_change', selection);
    }
  }, [socket, isConnected]);

  // Document Operations
  const handleOperationReceived = useCallback((operation: Operation) => {
    console.log('📝 Received operation:', operation);
    
    // Transform against pending operations
    let transformedOp = operation;
    for (const [id, pendingOp] of pendingOperations) {
      if (pendingOp.timestamp < operation.timestamp) {
        const [, transformed] = OperationalTransform.transform(pendingOp, transformedOp);
        transformedOp = transformed;
      }
    }
    
    // Apply operation to document
    applyOperation(transformedOp);
    setDocumentVersion(prev => prev + 1);
  }, [pendingOperations]);

  const handleDocumentUpdated = useCallback((doc: CollaborationDocument) => {
    setDocument(doc);
    setDocumentVersion(doc.version);
  }, []);

  const handleVersionConflict = useCallback((data: { serverVersion: number, operations: Operation[] }) => {
    console.warn('⚠️ Version conflict detected, resolving...');
    
    // Resolve conflict by applying server operations
    data.operations.forEach(op => applyOperation(op));
    setDocumentVersion(data.serverVersion);
    
    // Clear pending operations
    setPendingOperations(new Map());
  }, []);

  const applyOperation = useCallback((operation: Operation) => {
    if (!document) return;
    
    let newContent = document.content;
    
    switch (operation.type) {
      case 'insert':
        newContent = newContent.slice(0, operation.position) + 
                    (operation.content || '') + 
                    newContent.slice(operation.position);
        break;
      case 'delete':
        newContent = newContent.slice(0, operation.position) + 
                    newContent.slice(operation.position + (operation.content?.length || 0));
        break;
      case 'retain':
        // No content change for retain operations
        break;
    }
    
    setDocument(prev => prev ? { ...prev, content: newContent } : null);
  }, [document]);

  const createOperation = useCallback((type: Operation['type'], position: number, content?: string, attributes?: Record<string, any>): Operation => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      position,
      content,
      attributes,
      userId: currentUser?.id || '',
      timestamp: new Date(),
      version: documentVersion,
      dependencies: Array.from(pendingOperations.keys())
    };
  }, [currentUser, documentVersion, pendingOperations]);

  const sendOperation = useCallback((operation: Operation) => {
    if (!socket || !isConnected) return;
    
    // Add to pending operations
    setPendingOperations(prev => new Map(prev.set(operation.id, operation)));
    
    // Send to server
    socket.emit('operation', operation);
    
    // Apply optimistically
    applyOperation(operation);
    
    // Remove from pending after acknowledgment
    socket.once(`operation_ack_${operation.id}`, () => {
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operation.id);
        return newMap;
      });
    });
  }, [socket, isConnected, applyOperation]);

  // Chat System
  const handleMessageReceived = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
    
    if (message.senderId !== currentUser?.id) {
      setUnreadMessages(prev => prev + 1);
    }
  }, [currentUser]);

  const handleUserTyping = useCallback((userId: string) => {
    setTypingUsers(prev => new Set(prev.add(userId)));
    
    // Clear typing indicator after timeout
    setTimeout(() => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }, 3000);
  }, []);

  const handleUserStoppedTyping = useCallback((userId: string) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  const sendMessage = useCallback((content: string, type: ChatMessage['type'] = 'text') => {
    if (!socket || !isConnected || !currentUser) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content,
      type,
      timestamp: new Date(),
      reactions: [],
      mentions: extractMentions(content),
      attachments: []
    };
    
    socket.emit('send_message', message);
    setChatMessages(prev => [...prev, message]);
  }, [socket, isConnected, currentUser]);

  const extractMentions = useCallback((content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }, []);

  const handleTyping = useCallback(() => {
    if (!socket || !isConnected) return;
    
    socket.emit('typing');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopped_typing');
    }, 1000);
  }, [socket, isConnected]);

  // Voice and Video Communication
  const handleVoiceChannelUpdated = useCallback((channel: VoiceChannel) => {
    setVoiceChannel(channel);
  }, []);

  const handleVideoCallStarted = useCallback((call: VideoCall) => {
    setVideoCall(call);
  }, []);

  const handleVideoCallEnded = useCallback(() => {
    setVideoCall(null);
    cleanupWebRTC();
  }, []);

  const handleWebRTCSignal = useCallback(async (data: { from: string, signal: any, type: 'offer' | 'answer' | 'ice-candidate' }) => {
    const { from, signal, type } = data;
    
    let peerConnection = peerConnections.current.get(from);
    
    if (!peerConnection) {
      peerConnection = createPeerConnection(from);
      peerConnections.current.set(from, peerConnection);
    }
    
    try {
      switch (type) {
        case 'offer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket?.emit('webrtc_signal', {
            to: from,
            signal: answer,
            type: 'answer'
          });
          break;
          
        case 'answer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          break;
          
        case 'ice-candidate':
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal));
          break;
      }
    } catch (error) {
      console.error('WebRTC signaling error:', error);
    }
  }, [socket]);

  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Add local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc_signal', {
          to: userId,
          signal: event.candidate,
          type: 'ice-candidate'
        });
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`WebRTC connection state with ${userId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        // Clean up disconnected peer
        peerConnections.current.delete(userId);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }
    };
    
    return peerConnection;
  }, [localStream, socket]);

  const startVideoCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create offers for all connected users
      for (const [userId] of collaborators) {
        if (userId !== currentUser?.id) {
          const peerConnection = createPeerConnection(userId);
          peerConnections.current.set(userId, peerConnection);
          
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          socket?.emit('webrtc_signal', {
            to: userId,
            signal: offer,
            type: 'offer'
          });
        }
      }
      
      socket?.emit('start_video_call');
      
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  }, [collaborators, currentUser, socket, createPeerConnection]);

  const endVideoCall = useCallback(() => {
    socket?.emit('end_video_call');
    cleanupWebRTC();
  }, [socket]);

  const cleanupWebRTC = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connections
    for (const [userId, peerConnection] of peerConnections.current) {
      peerConnection.close();
    }
    peerConnections.current.clear();
    
    // Clear remote streams
    setRemoteStreams(new Map());
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  // Comments System
  const handleCommentAdded = useCallback((comment: Comment) => {
    setComments(prev => [...prev, comment]);
  }, []);

  const handleCommentUpdated = useCallback((comment: Comment) => {
    setComments(prev => prev.map(c => c.id === comment.id ? comment : c));
  }, []);

  const handleCommentResolved = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
  }, []);

  const addComment = useCallback((position: CommentPosition, content: string) => {
    if (!socket || !isConnected || !currentUser) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      content,
      position,
      resolved: false,
      replies: [],
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mentions: extractMentions(content),
      attachments: []
    };
    
    socket.emit('add_comment', comment);
    setComments(prev => [...prev, comment]);
  }, [socket, isConnected, currentUser, extractMentions]);

  // Connection Status Indicator
  const ConnectionStatus: React.FC = () => (
    <div className={cn(
      "flex items-center space-x-2 px-3 py-1 rounded-full text-xs",
      isConnected 
        ? connectionQuality === 'excellent' 
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
          : connectionQuality === 'good'
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
          : connectionQuality === 'fair'
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    )}>
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="capitalize">{connectionQuality}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </>
      )}
      {reconnectAttempts > 0 && (
        <span>({reconnectAttempts} attempts)</span>
      )}
    </div>
  );

  // Collaborators List
  const CollaboratorsList: React.FC = () => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
        <Users className="h-4 w-4 mr-2" />
        Collaborators ({collaborators.size})
      </h3>
      
      <div className="space-y-1">
        {Array.from(collaborators.values()).map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="relative">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800",
                user.status === 'online' ? "bg-green-500" :
                user.status === 'away' ? "bg-yellow-500" :
                user.status === 'busy' ? "bg-red-500" : "bg-gray-400"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                {user.role === 'owner' && <Crown className="h-3 w-3 text-yellow-500" />}
                {user.role === 'moderator' && <Shield className="h-3 w-3 text-blue-500" />}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.role}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              {user.permissions.canUseVoice && voiceChannel?.participants.includes(user.id) && (
                <Volume2 className="h-3 w-3 text-green-500" />
              )}
              {videoCall?.participants.find(p => p.userId === user.id)?.video && (
                <Video className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Chat Interface
  const ChatInterface: React.FC = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Chat
        </h3>
        {unreadMessages > 0 && (
          <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
            {unreadMessages}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {chatMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex space-x-3",
                message.senderId === currentUser?.id ? "justify-end" : "justify-start"
              )}
            >
              {message.senderId !== currentUser?.id && (
                <div className="flex-shrink-0">
                  {message.type === 'system' ? (
                    <Info className="w-6 h-6 text-gray-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {collaborators.get(message.senderId)?.name.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              )}
              
              <div className={cn(
                "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                message.senderId === currentUser?.id
                  ? "bg-blue-500 text-white"
                  : message.type === 'system'
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 italic"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              )}>
                {message.senderId !== currentUser?.id && message.type !== 'system' && (
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {collaborators.get(message.senderId)?.name}
                  </p>
                )}
                
                <p className="text-sm">{message.content}</p>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  
                  {message.reactions.length > 0 && (
                    <div className="flex space-x-1">
                      {message.reactions.map((reaction, index) => (
                        <span key={index} className="text-xs">
                          {reaction.type === 'like' ? '👍' :
                           reaction.type === 'love' ? '❤️' :
                           reaction.type === 'laugh' ? '😂' :
                           reaction.type === 'sad' ? '😢' :
                           reaction.type === 'angry' ? '😠' : '🎉'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              ))}
            </div>
            <span>
              {Array.from(typingUsers).map(userId => 
                collaborators.get(userId)?.name
              ).filter(Boolean).join(', ')} typing...
            </span>
          </motion.div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={chatInputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  sendMessage(input.value.trim());
                  input.value = '';
                }
              }
            }}
            onChange={handleTyping}
          />
          <button
            onClick={() => {
              const input = chatInputRef.current;
              if (input && input.value.trim()) {
                sendMessage(input.value.trim());
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  // Video Call Interface
  const VideoCallInterface: React.FC = () => (
    <AnimatePresence>
      {videoCall && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-5xl h-full m-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Video Call ({videoCall.participants.length} participants)
              </h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    localStream?.getAudioTracks()[0]?.enabled 
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "bg-red-500 text-white"
                  )}
                >
                  {localStream?.getAudioTracks()[0]?.enabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={toggleVideo}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    localStream?.getVideoTracks()[0]?.enabled 
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "bg-red-500 text-white"
                  )}
                >
                  {localStream?.getVideoTracks()[0]?.enabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={endVideoCall}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                {/* Local Video */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                    You
                  </div>
                </div>
                
                {/* Remote Videos */}
                {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                  <div key={userId} className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(video) => {
                        if (video) video.srcObject = stream;
                      }}
                    />
                    <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                      {collaborators.get(userId)?.name || 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Main Render
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Collaboration
            </h2>
            <ConnectionStatus />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={startVideoCall}
              disabled={!isConnected || !permissions.canUseVideo}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Video className="h-4 w-4 mr-2" />
              Video Call
            </button>
            
            <button
              disabled={!permissions.canShare}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Collaborators */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <CollaboratorsList />
        </div>
        
        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatInterface />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {document?.title || 'Untitled Document'}
              </h1>
              
              <div className="flex items-center space-x-2">
                {document && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    v{document.version}
                  </span>
                )}
                
                {pendingOperations.size > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-blue-500">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span>Syncing...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Save className="h-5 w-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Download className="h-5 w-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Document Editor */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={documentRef}
            className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-full p-8"
            contentEditable={permissions.canEdit}
            onInput={(e) => {
              if (permissions.canEdit) {
                // Handle document changes
                const target = e.target as HTMLDivElement;
                const content = target.textContent || '';
                
                // Create and send operation
                const operation = createOperation('insert', 0, content);
                sendOperation(operation);
              }
            }}
            onMouseMove={(e) => {
              const rect = documentRef.current?.getBoundingClientRect();
              if (rect) {
                const cursor: CursorPosition = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  elementId: 'document',
                  timestamp: new Date()
                };
                emitCursorMove(cursor);
              }
            }}
          >
            {document?.content || 'Start typing...'}
          </div>
          
          {/* Remote Cursors */}
          <AnimatePresence>
            {Array.from(cursors.entries()).map(([userId, cursor]) => {
              const user = collaborators.get(userId);
              if (!user || userId === currentUser?.id) return null;
              
              return (
                <motion.div
                  key={userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: cursor.x,
                    top: cursor.y,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <MousePointer className="h-4 w-4 text-blue-500" />
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                      {user.name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Video Call Overlay */}
      <VideoCallInterface />
    </div>
  );
};

export default RealTimeCollaborationEngine;