import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, MessageCircle, Phone, Video, Settings,
  Hash, Volume2, VolumeX, Mic, MicOff, ScreenShare,
  Crown, Shield, Star, Zap, Headphones, Radio,
  Search, Filter, Plus, MoreHorizontal, Send,
  Smile, Paperclip, Gift, AtSign, Coffee, Clock,
  Activity, TrendingUp, Award, Globe, Lock,
  UserCheck, UserX, Heart, MessageSquare, Bell,
  Calendar, Map, Bookmark, Download, Upload,
  Edit, Trash2, Copy, Share, Flag, Archive
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

interface User {
  id: number;
  username: string;
  discriminator: string;
  globalName?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
  customStatus?: string;
  statusEmoji?: string;
  isVerified?: boolean;
  badges?: string[];
  nitroType?: string;
}

interface Friend {
  id: number;
  user: User;
  status: 'pending' | 'accepted' | 'blocked';
  lastInteraction?: Date;
  messageCount: number;
  callTime: number;
  studyTime: number;
  nickname?: string;
  isFavorite: boolean;
}

interface Server {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  primarySubject: string;
  memberCount: number;
  maxMembers: number;
  isOwner: boolean;
  isVerified?: boolean;
  isPartnered?: boolean;
  boostLevel: number;
  unreadCount: number;
}

interface Channel {
  id: string;
  channelId: string;
  serverId: string;
  name: string;
  topic?: string;
  type: number; // 0: text, 2: voice, 4: category, 13: stage, 15: forum
  position: number;
  studyMode?: boolean;
  pomodoroTimer?: boolean;
  whiteboardEnabled?: boolean;
  messageCount: number;
}

interface Message {
  id: string;
  messageId: string;
  channelId: string;
  authorId: number;
  author: User;
  content?: string;
  attachments: any[];
  embeds: any[];
  studyContent?: any;
  sharedNote?: number;
  sharedQuiz?: number;
  createdAt: Date;
  edited: boolean;
  pinned: boolean;
  reactions: any[];
}

interface Call {
  id: string;
  callId: string;
  type: 'voice' | 'video' | 'screen_share' | 'study_session';
  hostId: number;
  participants: number[];
  maxParticipants: number;
  status: 'waiting' | 'active' | 'ended';
  studyTopic?: string;
  studySubject?: string;
  hasWhiteboard?: boolean;
  studyMode?: boolean;
}

const EnhancedSocial: React.FC = () => {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  
  // State management
  const [activeView, setActiveView] = useState<'friends' | 'servers' | 'dms' | 'calls'>('friends');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  
  // Data states
  const [friends, setFriends] = useState<Friend[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Call states
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadServers();
    loadOnlineUsers();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('friend_request', handleFriendRequest);
    socket.on('friend_status_update', handleFriendStatusUpdate);
    socket.on('direct_message', handleDirectMessage);
    socket.on('channel_message', handleChannelMessage);
    socket.on('call_invitation', handleCallInvitation);
    socket.on('user_presence_update', handlePresenceUpdate);
    socket.on('server_member_update', handleServerMemberUpdate);

    return () => {
      socket.off('friend_request');
      socket.off('friend_status_update');
      socket.off('direct_message');
      socket.off('channel_message');
      socket.off('call_invitation');
      socket.off('user_presence_update');
      socket.off('server_member_update');
    };
  }, [socket]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Data loading functions
  const loadFriends = async () => {
    try {
      const response = await fetch('/api/enhanced-social/friends', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.friends);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadServers = async () => {
    try {
      const response = await fetch('/api/enhanced-social/servers', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setServers(data.data.servers);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch('/api/enhanced-social/users/online', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setOnlineUsers(data.data.users);
      }
    } catch (error) {
      console.error('Failed to load online users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChannels = async (serverId: string) => {
    try {
      const response = await fetch(`/api/enhanced-social/servers/${serverId}/channels`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setChannels(data.data.channels);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadMessages = async (channelId: string, isDirectMessage = false) => {
    try {
      const endpoint = isDirectMessage 
        ? `/api/enhanced-social/messages/dm/${channelId}`
        : `/api/enhanced-social/messages/channel/${channelId}`;
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Socket event handlers
  const handleFriendRequest = (data: any) => {
    // Show notification for new friend request
    console.log('New friend request:', data);
    loadFriends(); // Refresh friends list
  };

  const handleFriendStatusUpdate = (data: any) => {
    setFriends(prev => prev.map(friend => 
      friend.user.id === data.userId 
        ? { ...friend, user: { ...friend.user, status: data.status } }
        : friend
    ));
  };

  const handleDirectMessage = (message: Message) => {
    if (selectedFriend && (
      message.authorId === selectedFriend.user.id || 
      message.authorId === user?.id
    )) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleChannelMessage = (message: Message) => {
    if (selectedChannel && message.channelId === selectedChannel.channelId) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleCallInvitation = (data: any) => {
    // Show call invitation modal
    console.log('Call invitation:', data);
  };

  const handlePresenceUpdate = (data: any) => {
    setOnlineUsers(prev => prev.map(user => 
      user.id === data.userId 
        ? { ...user, ...data.presence }
        : user
    ));
  };

  const handleServerMemberUpdate = (data: any) => {
    if (selectedServer && data.serverId === selectedServer.serverId) {
      loadChannels(selectedServer.serverId);
    }
  };

  // Action handlers
  const addFriend = async (username: string, discriminator?: string, globalName?: string, message?: string) => {
    try {
      const response = await fetch('/api/enhanced-social/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, discriminator, globalName, message })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowAddFriend(false);
        loadFriends();
        // Show success notification
      } else {
        // Show error notification
        console.error('Failed to add friend:', data.message);
      }
    } catch (error) {
      console.error('Failed to add friend:', error);
    }
  };

  const createServer = async (serverData: any) => {
    try {
      const response = await fetch('/api/enhanced-social/servers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(serverData)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateServer(false);
        loadServers();
        // Auto-select new server
        setSelectedServer(data.data.server);
        setActiveView('servers');
      }
    } catch (error) {
      console.error('Failed to create server:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      const isDirectMessage = selectedFriend !== null;
      const payload = {
        content: messageInput,
        channelId: isDirectMessage 
          ? `dm_${Math.min(user!.id, selectedFriend!.user.id)}_${Math.max(user!.id, selectedFriend!.user.id)}`
          : selectedChannel!.channelId,
        recipientId: isDirectMessage ? selectedFriend!.user.id : undefined
      };

      const response = await fetch('/api/enhanced-social/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessageInput('');
        messageInputRef.current?.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const startCall = async (type: 'voice' | 'video' | 'study_session') => {
    try {
      const payload = {
        type,
        channelId: selectedChannel?.channelId,
        recipientId: selectedFriend?.user.id,
        studyMode: type === 'study_session'
      };

      const response = await fetch('/api/enhanced-social/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setCurrentCall(data.data);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const joinServer = async (serverId: string, inviteCode?: string) => {
    try {
      const response = await fetch(`/api/enhanced-social/servers/${serverId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteCode })
      });

      const data = await response.json();
      if (data.success) {
        loadServers();
      }
    } catch (error) {
      console.error('Failed to join server:', error);
    }
  };

  // Render components
  const renderServerList = () => (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Server Icons */}
      <div className="flex flex-col items-center py-3 space-y-2 overflow-y-auto">
        {/* Home */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setActiveView('friends');
            setSelectedServer(null);
            setSelectedChannel(null);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeView === 'friends'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          <Users className="w-6 h-6" />
        </motion.button>

        {/* Server separator */}
        <div className="w-8 h-0.5 bg-gray-700 rounded-full" />

        {/* Servers */}
        {servers.map((server) => (
          <motion.button
            key={server.serverId}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedServer(server);
              setActiveView('servers');
              loadChannels(server.serverId);
            }}
            className={`relative w-12 h-12 rounded-full overflow-hidden transition-all ${
              selectedServer?.serverId === server.serverId
                ? 'ring-2 ring-indigo-400'
                : 'hover:ring-2 hover:ring-gray-400'
            }`}
          >
            {server.icon ? (
              <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {server.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Unread indicator */}
            {server.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {server.unreadCount > 99 ? '99+' : server.unreadCount}
              </div>
            )}

            {/* Verification badge */}
            {server.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <UserCheck className="w-2 h-2 text-white" />
              </div>
            )}
          </motion.button>
        ))}

        {/* Add server */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateServer(true)}
          className="w-12 h-12 rounded-full bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );

  const renderChannelList = () => (
    <div className="w-60 bg-gray-800 flex flex-col h-full">
      {/* Server header */}
      {selectedServer && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white truncate">{selectedServer.name}</h2>
              <p className="text-xs text-gray-400">
                {selectedServer.memberCount.toLocaleString()} members
              </p>
            </div>
            {selectedServer.isVerified && <UserCheck className="w-4 h-4 text-green-400" />}
          </div>
        </div>
      )}

      {/* Friends view */}
      {activeView === 'friends' && (
        <div className="flex-1 overflow-y-auto">
          {/* Add Friend */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-full flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </button>
          </div>

          {/* Friends list */}
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1">
              Online - {friends.filter(f => f.user.status !== 'offline').length}
            </h3>
            {friends
              .filter(f => f.status === 'accepted' && f.user.status !== 'offline')
              .map((friend) => (
                <motion.button
                  key={friend.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setSelectedFriend(friend);
                    setSelectedChannel(null);
                    loadMessages(`dm_${Math.min(user!.id, friend.user.id)}_${Math.max(user!.id, friend.user.id)}`, true);
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors ${
                    selectedFriend?.id === friend.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={friend.user.avatar || `https://ui-avatars.com/api/?name=${friend.user.firstName}+${friend.user.lastName}&background=6366f1&color=ffffff`}
                      alt={friend.user.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      friend.user.status === 'online' ? 'bg-green-400' :
                      friend.user.status === 'idle' ? 'bg-yellow-400' :
                      friend.user.status === 'dnd' ? 'bg-red-400' :
                      'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-white font-medium truncate">
                      {friend.nickname || friend.user.globalName || `${friend.user.firstName} ${friend.user.lastName}`}
                    </p>
                    {friend.user.customStatus && (
                      <p className="text-xs text-gray-400 truncate">
                        {friend.user.statusEmoji} {friend.user.customStatus}
                      </p>
                    )}
                  </div>
                  {friend.isFavorite && <Star className="w-3 h-3 text-yellow-400" />}
                </motion.button>
              ))}

            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1 mt-4">
              Offline - {friends.filter(f => f.user.status === 'offline').length}
            </h3>
            {friends
              .filter(f => f.status === 'accepted' && f.user.status === 'offline')
              .slice(0, 10) // Limit offline list
              .map((friend) => (
                <motion.button
                  key={friend.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setSelectedFriend(friend);
                    setSelectedChannel(null);
                    loadMessages(`dm_${Math.min(user!.id, friend.user.id)}_${Math.max(user!.id, friend.user.id)}`, true);
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors opacity-60 ${
                    selectedFriend?.id === friend.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={friend.user.avatar || `https://ui-avatars.com/api/?name=${friend.user.firstName}+${friend.user.lastName}&background=6366f1&color=ffffff`}
                      alt={friend.user.firstName}
                      className="w-8 h-8 rounded-full grayscale"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-400 font-medium truncate">
                      {friend.nickname || friend.user.globalName || `${friend.user.firstName} ${friend.user.lastName}`}
                    </p>
                    <p className="text-xs text-gray-500">Last seen {friend.lastInteraction ? new Date(friend.lastInteraction).toLocaleDateString() : 'Never'}</p>
                  </div>
                </motion.button>
              ))}
          </div>
        </div>
      )}

      {/* Server channels */}
      {activeView === 'servers' && selectedServer && (
        <div className="flex-1 overflow-y-auto">
          {channels.map((channel) => (
            <motion.button
              key={channel.channelId}
              whileHover={{ x: 4 }}
              onClick={() => {
                setSelectedChannel(channel);
                setSelectedFriend(null);
                loadMessages(channel.channelId);
              }}
              className={`w-full flex items-center space-x-3 p-2 mx-2 rounded hover:bg-gray-700 transition-colors ${
                selectedChannel?.channelId === channel.channelId ? 'bg-gray-700' : ''
              }`}
            >
              {channel.type === 0 ? (
                <Hash className="w-4 h-4 text-gray-400" />
              ) : channel.type === 2 ? (
                <Volume2 className="w-4 h-4 text-gray-400" />
              ) : (
                <Radio className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-300 truncate">{channel.name}</span>
              {channel.studyMode && <Coffee className="w-3 h-3 text-blue-400" />}
              {channel.pomodoroTimer && <Clock className="w-3 h-3 text-red-400" />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );

  const renderChatArea = () => (
    <div className="flex-1 flex flex-col bg-gray-700">
      {/* Chat header */}
      <div className="h-16 bg-gray-800 border-b border-gray-600 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          {selectedChannel ? (
            <>
              <Hash className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-white">{selectedChannel.name}</h3>
                {selectedChannel.topic && (
                  <p className="text-xs text-gray-400">{selectedChannel.topic}</p>
                )}
              </div>
            </>
          ) : selectedFriend ? (
            <>
              <img
                src={selectedFriend.user.avatar || `https://ui-avatars.com/api/?name=${selectedFriend.user.firstName}+${selectedFriend.user.lastName}&background=6366f1&color=ffffff`}
                alt={selectedFriend.user.firstName}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-white">
                  {selectedFriend.nickname || selectedFriend.user.globalName || `${selectedFriend.user.firstName} ${selectedFriend.user.lastName}`}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedFriend.user.customStatus || `${selectedFriend.user.status}`}
                </p>
              </div>
            </>
          ) : (
            <div>
              <h3 className="font-semibold text-white">StudyGenius Social</h3>
              <p className="text-xs text-gray-400">Select a channel or friend to start chatting</p>
            </div>
          )}
        </div>

        {/* Chat actions */}
        <div className="flex items-center space-x-2">
          {(selectedChannel || selectedFriend) && (
            <>
              <button
                onClick={() => startCall('voice')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall('video')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              >
                <Video className="w-4 h-4" />
              </button>
              {selectedChannel?.studyMode && (
                <button
                  onClick={() => startCall('study_session')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.messageId} className="flex space-x-3">
            <img
              src={message.author.avatar || `https://ui-avatars.com/api/?name=${message.author.firstName}+${message.author.lastName}&background=6366f1&color=ffffff`}
              alt={message.author.firstName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-white">
                  {message.author.globalName || `${message.author.firstName} ${message.author.lastName}`}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
                {message.edited && <span className="text-xs text-gray-500">(edited)</span>}
              </div>
              <div className="text-gray-200">
                {message.content}
                {message.sharedNote && (
                  <div className="mt-2 p-3 bg-blue-900 rounded border-l-4 border-blue-400">
                    <p className="text-sm text-blue-200">📝 Shared a note</p>
                  </div>
                )}
                {message.sharedQuiz && (
                  <div className="mt-2 p-3 bg-green-900 rounded border-l-4 border-green-400">
                    <p className="text-sm text-green-200">🧠 Shared a quiz</p>
                  </div>
                )}
              </div>
              {message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions.map((reaction, index) => (
                    <button
                      key={index}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-200 transition-colors"
                    >
                      {reaction.emoji} {reaction.count}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      {(selectedChannel || selectedFriend) && (
        <div className="p-4 bg-gray-800">
          <div className="flex items-center space-x-3 bg-gray-700 rounded-lg p-3">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={messageInputRef}
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${selectedChannel ? `#${selectedChannel.name}` : selectedFriend?.user.firstName}`}
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
            />
            <button className="text-gray-400 hover:text-white transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderOnlineUsers = () => (
    <div className="w-60 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      {selectedServer && (
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Online — {onlineUsers.length}
          </h3>
          {onlineUsers.map((user) => (
            <motion.button
              key={user.id}
              whileHover={{ x: 4 }}
              onClick={() => setShowUserProfile(user)}
              className="w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="relative">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=ffffff`}
                  alt={user.firstName}
                  className="w-8 h-8 rounded-full"
                />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                  user.status === 'online' ? 'bg-green-400' :
                  user.status === 'idle' ? 'bg-yellow-400' :
                  user.status === 'dnd' ? 'bg-red-400' :
                  'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center space-x-1">
                  <p className="text-sm text-white font-medium truncate">
                    {user.globalName || `${user.firstName} ${user.lastName}`}
                  </p>
                  {user.isVerified && <UserCheck className="w-3 h-3 text-blue-400" />}
                  {user.nitroType && <Zap className="w-3 h-3 text-purple-400" />}
                </div>
                {user.customStatus && (
                  <p className="text-xs text-gray-400 truncate">
                    {user.statusEmoji} {user.customStatus}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );

  // Current call overlay
  const renderCallOverlay = () => currentCall && (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 right-4 bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-2xl z-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <div>
            <p className="text-sm font-medium text-white">
              {currentCall.type === 'study_session' ? 'Study Session' : 
               currentCall.type === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
            {currentCall.studyTopic && (
              <p className="text-xs text-gray-400">{currentCall.studyTopic}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded transition-colors ${
              isMuted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsDeafened(!isDeafened)}
            className={`p-2 rounded transition-colors ${
              isDeafened ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {currentCall.type === 'video' && (
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-2 rounded transition-colors ${
                !isVideoOn ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Video className="w-4 h-4" />
            </button>
          )}

          {currentCall.hasWhiteboard && (
            <button className="p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setCurrentCall(null)}
            className="p-2 bg-red-600 text-white hover:bg-red-700 rounded transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* Server list sidebar */}
      {renderServerList()}
      
      {/* Channel/Friends list */}
      {renderChannelList()}
      
      {/* Main chat area */}
      {renderChatArea()}
      
      {/* Online users sidebar */}
      {(selectedServer || activeView === 'friends') && renderOnlineUsers()}

      {/* Call overlay */}
      {renderCallOverlay()}

      {/* Modals */}
      <AnimatePresence>
        {showAddFriend && (
          <AddFriendModal
            onClose={() => setShowAddFriend(false)}
            onAdd={addFriend}
          />
        )}

        {showCreateServer && (
          <CreateServerModal
            onClose={() => setShowCreateServer(false)}
            onCreate={createServer}
          />
        )}

        {showUserProfile && (
          <UserProfileModal
            user={showUserProfile}
            onClose={() => setShowUserProfile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Modal Components
const AddFriendModal: React.FC<{
  onClose: () => void;
  onAdd: (username: string, discriminator?: string, globalName?: string, message?: string) => void;
}> = ({ onClose, onAdd }) => {
  const [username, setUsername] = useState('');
  const [discriminator, setDiscriminator] = useState('');
  const [globalName, setGlobalName] = useState('');
  const [message, setMessage] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'global'>('username');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'username') {
      onAdd(username, discriminator || undefined, undefined, message || undefined);
    } else {
      onAdd('', undefined, globalName, message || undefined);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">Add Friend</h2>
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setSearchType('username')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              searchType === 'username'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Username#1234
          </button>
          <button
            onClick={() => setSearchType('global')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              searchType === 'global'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Display Name
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {searchType === 'username' ? (
            <div className="flex space-x-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <input
                type="text"
                value={discriminator}
                onChange={(e) => setDiscriminator(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="#1234"
                className="w-20 bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <input
              type="text"
              value={globalName}
              onChange={(e) => setGlobalName(e.target.value)}
              placeholder="Display Name"
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message..."
            rows={3}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!((searchType === 'username' && username) || (searchType === 'global' && globalName))}
              className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send Request
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const CreateServerModal: React.FC<{
  onClose: () => void;
  onCreate: (serverData: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primarySubject: '',
    gradeLevel: '',
    isPublic: false,
    maxMembers: 100000
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">Create Study Server</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Server Name"
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Server Description"
            rows={3}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={formData.primarySubject}
            onChange={(e) => setFormData({ ...formData, primarySubject: e.target.value })}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Primary Subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Literature">Literature</option>
            <option value="History">History</option>
            <option value="Languages">Languages</option>
            <option value="Arts">Arts</option>
            <option value="General Study">General Study</option>
          </select>

          <select
            value={formData.gradeLevel}
            onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Grade Level</option>
            <option value="Elementary">Elementary</option>
            <option value="Middle School">Middle School</option>
            <option value="High School">High School</option>
            <option value="University">University</option>
            <option value="Graduate">Graduate</option>
            <option value="Professional">Professional</option>
          </select>

          <div className="flex items-center justify-between">
            <label className="text-white">Public Server</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.isPublic ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                formData.isPublic ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="text-white block mb-2">Max Members: {formData.maxMembers.toLocaleString()}</label>
            <input
              type="range"
              min="100"
              max="10000000"
              step="1000"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>100</span>
              <span>10M</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.primarySubject}
              className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Server
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const UserProfileModal: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-gray-800 rounded-lg overflow-hidden w-full max-w-sm mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Profile banner */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
      
      {/* Profile content */}
      <div className="p-4 -mt-12">
        <div className="flex items-end justify-between mb-4">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=ffffff`}
            alt={user.firstName}
            className="w-20 h-20 rounded-full border-4 border-gray-800"
          />
          <div className="flex space-x-2">
            <button className="p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors">
              <UserPlus className="w-4 h-4" />
            </button>
            <button className="p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white">
                {user.globalName || `${user.firstName} ${user.lastName}`}
              </h3>
              {user.isVerified && <UserCheck className="w-5 h-5 text-blue-400" />}
              {user.nitroType && <Zap className="w-5 h-5 text-purple-400" />}
            </div>
            <p className="text-gray-400">{user.username}#{user.discriminator}</p>
          </div>

          {user.customStatus && (
            <div className="flex items-center space-x-2">
              <span className="text-lg">{user.statusEmoji}</span>
              <span className="text-gray-300">{user.customStatus}</span>
            </div>
          )}

          {user.badges && user.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge, index) => (
                <div key={index} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  {badge}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Member Since</p>
            <p className="text-gray-300">January 2024</p>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

export default EnhancedSocial;