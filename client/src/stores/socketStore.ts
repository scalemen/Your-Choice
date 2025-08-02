import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketState {
  // State
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  activeUsers: number;
  
  // Note collaboration
  noteCollaborators: Map<string, any[]>;
  noteUpdates: any[];
  
  // Chat
  onlineUsers: Map<string, any>;
  typingUsers: Map<string, Set<string>>;
  unreadMessages: Map<string, number>;
  
  // Video calls
  activeVideoSessions: Map<string, any>;
  
  // Actions
  initializeSocket: (token: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Note collaboration
  joinNote: (noteId: string) => void;
  leaveNote: (noteId: string) => void;
  sendNoteUpdate: (noteId: string, content: any, operation: string, position?: any) => void;
  sendHandwritingStroke: (noteId: string, stroke: any, isComplete: boolean) => void;
  updateCursor: (noteId: string, position: any, selection?: any) => void;
  
  // Chat
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string, type?: string, replyTo?: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  
  // Video calls
  joinVideoSession: (sessionId: string, isVideo?: boolean, isAudio?: boolean) => void;
  leaveVideoSession: (sessionId: string) => void;
  toggleAudio: (sessionId: string, isAudio: boolean) => void;
  toggleVideo: (sessionId: string, isVideo: boolean) => void;
  sendVideoOffer: (sessionId: string, targetUserId: string, offer: any) => void;
  sendVideoAnswer: (targetUserId: string, answer: any) => void;
  sendIceCandidate: (targetUserId: string, candidate: any) => void;
  
  // Games
  joinGame: (gameId: string, sessionId: string) => void;
  sendGameStateUpdate: (gameId: string, sessionId: string, gameState: any) => void;
  submitGameAnswer: (gameId: string, sessionId: string, answer: any, questionId: string) => void;
  
  // Study sessions
  joinStudySession: (sessionId: string) => void;
  shareStudyMaterial: (sessionId: string, materialType: string, materialData: any) => void;
  updateStudyTimer: (sessionId: string, timeRemaining: number, isRunning: boolean) => void;
  
  // Notifications
  sendNotification: (targetUserId: string, notification: any) => void;
  
  // Utility
  clearError: () => void;
}

export const useSocketStore = create<SocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      activeUsers: 0,
      noteCollaborators: new Map(),
      noteUpdates: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
      unreadMessages: new Map(),
      activeVideoSessions: new Map(),

      // Actions
      initializeSocket: (token: string) => {
        const currentSocket = get().socket;
        if (currentSocket?.connected) {
          return; // Already connected
        }

        set({ isConnecting: true, error: null });

        try {
          const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            forceNew: true
          });

          // Connection events
          socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            set({
              socket,
              isConnected: true,
              isConnecting: false,
              error: null
            });
            toast.success('Connected to StudyGenius');
          });

          socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            set({
              isConnected: false,
              error: reason === 'io server disconnect' ? 'Server disconnected' : null
            });
            
            if (reason !== 'io client disconnect') {
              toast.error('Connection lost. Reconnecting...');
            }
          });

          socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            set({
              isConnected: false,
              isConnecting: false,
              error: error.message
            });
            toast.error('Connection failed');
          });

          socket.on('connection:established', (data) => {
            set({ activeUsers: data.activeUsers });
          });

          // Note collaboration events
          socket.on('note:user_joined', (data) => {
            console.log('User joined note:', data);
          });

          socket.on('note:user_left', (data) => {
            console.log('User left note:', data);
          });

          socket.on('note:collaborators', (collaborators) => {
            // Handle collaborators list
            console.log('Note collaborators:', collaborators);
          });

          socket.on('note:content_update', (data) => {
            const { noteUpdates } = get();
            set({ noteUpdates: [...noteUpdates, data] });
          });

          socket.on('note:handwriting_update', (data) => {
            // Handle handwriting updates
            console.log('Handwriting update:', data);
          });

          socket.on('note:cursor_position', (data) => {
            // Handle cursor position updates
            console.log('Cursor update:', data);
          });

          // Chat events
          socket.on('chat:user_online', (data) => {
            const { onlineUsers } = get();
            const newOnlineUsers = new Map(onlineUsers);
            newOnlineUsers.set(data.userId, data.user);
            set({ onlineUsers: newOnlineUsers });
          });

          socket.on('chat:user_offline', (data) => {
            const { onlineUsers } = get();
            const newOnlineUsers = new Map(onlineUsers);
            newOnlineUsers.delete(data.userId);
            set({ onlineUsers: newOnlineUsers });
          });

          socket.on('chat:new_message', (message) => {
            // Handle new message
            console.log('New message:', message);
            
            // Update unread count
            const { unreadMessages } = get();
            const newUnreadMessages = new Map(unreadMessages);
            const currentCount = newUnreadMessages.get(message.roomId) || 0;
            newUnreadMessages.set(message.roomId, currentCount + 1);
            set({ unreadMessages: newUnreadMessages });
          });

          socket.on('chat:user_typing', (data) => {
            const { typingUsers } = get();
            const newTypingUsers = new Map(typingUsers);
            if (!newTypingUsers.has(data.roomId)) {
              newTypingUsers.set(data.roomId, new Set());
            }
            newTypingUsers.get(data.roomId)?.add(data.userId);
            set({ typingUsers: newTypingUsers });

            // Auto-remove after timeout
            setTimeout(() => {
              const { typingUsers: currentTypingUsers } = get();
              const updatedTypingUsers = new Map(currentTypingUsers);
              updatedTypingUsers.get(data.roomId)?.delete(data.userId);
              set({ typingUsers: updatedTypingUsers });
            }, 3000);
          });

          socket.on('chat:user_stop_typing', (data) => {
            const { typingUsers } = get();
            const newTypingUsers = new Map(typingUsers);
            newTypingUsers.get(data.roomId)?.delete(data.userId);
            set({ typingUsers: newTypingUsers });
          });

          // Video call events
          socket.on('video:user_joined', (data) => {
            console.log('User joined video session:', data);
          });

          socket.on('video:user_left', (data) => {
            console.log('User left video session:', data);
          });

          socket.on('video:existing_participants', (participants) => {
            console.log('Existing participants:', participants);
          });

          socket.on('video:offer', (data) => {
            // Handle WebRTC offer
            console.log('Video offer received:', data);
          });

          socket.on('video:answer', (data) => {
            // Handle WebRTC answer
            console.log('Video answer received:', data);
          });

          socket.on('video:ice_candidate', (data) => {
            // Handle ICE candidate
            console.log('ICE candidate received:', data);
          });

          socket.on('video:user_audio_toggle', (data) => {
            console.log('User toggled audio:', data);
          });

          socket.on('video:user_video_toggle', (data) => {
            console.log('User toggled video:', data);
          });

          socket.on('video:screen_share_started', (data) => {
            console.log('Screen share started:', data);
          });

          socket.on('video:screen_share_stopped', (data) => {
            console.log('Screen share stopped:', data);
          });

          // Game events
          socket.on('game:player_joined', (data) => {
            console.log('Player joined game:', data);
          });

          socket.on('game:state_changed', (data) => {
            console.log('Game state changed:', data);
          });

          socket.on('game:answer_received', (data) => {
            console.log('Game answer received:', data);
          });

          // Study session events
          socket.on('study:user_joined', (data) => {
            console.log('User joined study session:', data);
          });

          socket.on('study:material_shared', (data) => {
            console.log('Study material shared:', data);
          });

          socket.on('study:timer_sync', (data) => {
            console.log('Study timer synced:', data);
          });

          // Notification events
          socket.on('notification:received', (notification) => {
            toast(notification.message, {
              icon: notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'
            });
          });

          socket.on('notification:broadcast', (notification) => {
            toast(notification.message, {
              icon: '📢'
            });
          });

          // Error handling
          socket.on('error', (error) => {
            console.error('Socket error:', error);
            set({ error: error.message });
            toast.error(error.message || 'Connection error');
          });

          set({ socket });

        } catch (error: any) {
          console.error('Socket initialization error:', error);
          set({
            isConnecting: false,
            error: error.message
          });
          toast.error('Failed to connect');
        }
      },

      disconnect: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({
            socket: null,
            isConnected: false,
            isConnecting: false,
            error: null
          });
        }
      },

      reconnect: () => {
        const { disconnect, initializeSocket } = get();
        disconnect();
        
        const token = localStorage.getItem('token');
        if (token) {
          setTimeout(() => {
            initializeSocket(token);
          }, 1000);
        }
      },

      // Note collaboration methods
      joinNote: (noteId: string) => {
        const { socket } = get();
        socket?.emit('note:join', { noteId });
      },

      leaveNote: (noteId: string) => {
        const { socket } = get();
        socket?.emit('note:leave', { noteId });
      },

      sendNoteUpdate: (noteId: string, content: any, operation: string, position?: any) => {
        const { socket } = get();
        socket?.emit('note:content_change', {
          noteId,
          content,
          operation,
          position
        });
      },

      sendHandwritingStroke: (noteId: string, stroke: any, isComplete: boolean) => {
        const { socket } = get();
        socket?.emit('note:handwriting_stroke', {
          noteId,
          stroke,
          isComplete
        });
      },

      updateCursor: (noteId: string, position: any, selection?: any) => {
        const { socket } = get();
        socket?.emit('note:cursor_update', {
          noteId,
          position,
          selection
        });
      },

      // Chat methods
      joinChatRoom: (roomId: string) => {
        const { socket } = get();
        socket?.emit('chat:join_room', { roomId });
      },

      leaveChatRoom: (roomId: string) => {
        const { socket } = get();
        socket?.emit('chat:leave_room', { roomId });
      },

      sendMessage: (roomId: string, content: string, type = 'text', replyTo?: string) => {
        const { socket } = get();
        socket?.emit('chat:send_message', {
          roomId,
          content,
          type,
          replyTo
        });
      },

      startTyping: (roomId: string) => {
        const { socket } = get();
        socket?.emit('chat:typing_start', { roomId });
      },

      stopTyping: (roomId: string) => {
        const { socket } = get();
        socket?.emit('chat:typing_stop', { roomId });
      },

      // Video call methods
      joinVideoSession: (sessionId: string, isVideo = true, isAudio = true) => {
        const { socket } = get();
        socket?.emit('video:join_session', {
          sessionId,
          isVideo,
          isAudio
        });
      },

      leaveVideoSession: (sessionId: string) => {
        const { socket } = get();
        socket?.emit('video:leave_session', { sessionId });
      },

      toggleAudio: (sessionId: string, isAudio: boolean) => {
        const { socket } = get();
        socket?.emit('video:toggle_audio', { sessionId, isAudio });
      },

      toggleVideo: (sessionId: string, isVideo: boolean) => {
        const { socket } = get();
        socket?.emit('video:toggle_video', { sessionId, isVideo });
      },

      sendVideoOffer: (sessionId: string, targetUserId: string, offer: any) => {
        const { socket } = get();
        socket?.emit('video:offer', { sessionId, targetUserId, offer });
      },

      sendVideoAnswer: (targetUserId: string, answer: any) => {
        const { socket } = get();
        socket?.emit('video:answer', { targetUserId, answer });
      },

      sendIceCandidate: (targetUserId: string, candidate: any) => {
        const { socket } = get();
        socket?.emit('video:ice_candidate', { targetUserId, candidate });
      },

      // Game methods
      joinGame: (gameId: string, sessionId: string) => {
        const { socket } = get();
        socket?.emit('game:join', { gameId, sessionId });
      },

      sendGameStateUpdate: (gameId: string, sessionId: string, gameState: any) => {
        const { socket } = get();
        socket?.emit('game:state_update', { gameId, sessionId, gameState });
      },

      submitGameAnswer: (gameId: string, sessionId: string, answer: any, questionId: string) => {
        const { socket } = get();
        socket?.emit('game:answer_submitted', { gameId, sessionId, answer, questionId });
      },

      // Study session methods
      joinStudySession: (sessionId: string) => {
        const { socket } = get();
        socket?.emit('study:join_session', { sessionId });
      },

      shareStudyMaterial: (sessionId: string, materialType: string, materialData: any) => {
        const { socket } = get();
        socket?.emit('study:share_material', { sessionId, materialType, materialData });
      },

      updateStudyTimer: (sessionId: string, timeRemaining: number, isRunning: boolean) => {
        const { socket } = get();
        socket?.emit('study:timer_update', { sessionId, timeRemaining, isRunning });
      },

      // Notification methods
      sendNotification: (targetUserId: string, notification: any) => {
        const { socket } = get();
        socket?.emit('notification:send', { targetUserId, notification });
      },

      // Utility
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'socket-store'
    }
  )
);

export default useSocketStore;