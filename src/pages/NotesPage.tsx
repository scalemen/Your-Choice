import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ShareIcon,
  TrashIcon,
  StarIcon,
  TagIcon,
  PencilIcon,
  MicrophoneIcon,
  CameraIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  EyeIcon,
  UserGroupIcon,
  SparklesIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  BookmarkIcon,
  ArchiveBoxIcon,
  PrinterIcon,
  QrCodeIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  PaintBrushIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CalculatorIcon,
  MapIcon,
  ChartBarIcon,
  CubeIcon,
  AcademicCapIcon,
  LightBulbIcon,
  FireIcon,
  BoltIcon,
  HeartIcon,
  FaceSmileIcon,
  SunIcon,
  MoonIcon,
  StarIcon as StarFilledIcon,
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon,
  FireIcon as FireSolidIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { cn } from '../utils/cn';

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'handwritten' | 'mixed';
  tags: string[];
  subject: string;
  isStarred: boolean;
  isArchived: boolean;
  isLocked: boolean;
  isTemplate: boolean;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    permission: 'view' | 'edit' | 'admin';
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  drawingData?: string;
  voiceNotes: Array<{
    id: string;
    duration: number;
    url: string;
    transcript?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  version: number;
  wordCount: number;
  readingTime: number;
  aiSummary?: string;
  studyScore?: number;
  reminderAt?: string;
  folder?: {
    id: string;
    name: string;
    color: string;
  };
  linkedNotes: string[];
  flashcardCount: number;
  quizCount: number;
  studySessionCount: number;
  shareLink?: string;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  commentCount: number;
  reactions: {
    likes: number;
    loves: number;
    helpful: number;
    brilliant: number;
  };
}

interface NoteFolder {
  id: string;
  name: string;
  color: string;
  description?: string;
  noteCount: number;
  isShared: boolean;
  parentId?: string;
  children?: NoteFolder[];
  createdAt: string;
  updatedAt: string;
}

interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
  category: string;
  isOfficial: boolean;
  usageCount: number;
  rating: number;
  previewImage?: string;
}

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'writing' | 'analysis' | 'organization' | 'study' | 'creative';
  isAvailable: boolean;
  isPremium: boolean;
}

interface StudyStats {
  totalNotes: number;
  totalWords: number;
  totalStudyTime: number;
  notesThisWeek: number;
  wordsThisWeek: number;
  studyTimeThisWeek: number;
  averageWordsPerNote: number;
  mostUsedTags: Array<{ tag: string; count: number }>;
  mostActiveSubjects: Array<{ subject: string; count: number }>;
  studyStreak: number;
  longestStudySession: number;
  favoriteNoteTime: string;
  collaborationCount: number;
  flashcardsCreated: number;
  quizzesGenerated: number;
  aiInteractions: number;
  achievementBadges: string[];
}

const NotesPage: React.FC = () => {
  // State Management
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'size'>('updated');
  const [filterBy, setFilterBy] = useState<{
    type?: 'text' | 'handwritten' | 'mixed';
    isStarred?: boolean;
    isArchived?: boolean;
    subject?: string;
    tags?: string[];
    folder?: string;
    dateRange?: { start: string; end: string };
  }>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAITools, setShowAITools] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Query Client
  const queryClient = useQueryClient();

  // API Queries
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', searchQuery, filterBy, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterBy.type) params.append('type', filterBy.type);
      if (filterBy.isStarred) params.append('starred', 'true');
      if (filterBy.isArchived) params.append('archived', 'true');
      if (filterBy.subject) params.append('subject', filterBy.subject);
      if (filterBy.tags?.length) params.append('tags', filterBy.tags.join(','));
      if (filterBy.folder) params.append('folder', filterBy.folder);
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/enhanced-notes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['note-folders'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-notes/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['note-templates'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-notes/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['note-stats'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-notes/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      const response = await fetch('/api/enhanced-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-stats'] });
      toast.success('Note created successfully!');
      setIsCreating(false);
    },
    onError: () => {
      toast.error('Failed to create note');
    },
  });

  const deleteNotesMutation = useMutation({
    mutationFn: async (noteIds: string[]) => {
      const response = await fetch('/api/enhanced-notes/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds }),
      });
      if (!response.ok) throw new Error('Failed to delete notes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-stats'] });
      toast.success('Notes deleted successfully!');
      setSelectedNotes([]);
      setIsSelectionMode(false);
    },
    onError: () => {
      toast.error('Failed to delete notes');
    },
  });

  const starNoteMutation = useMutation({
    mutationFn: async ({ noteId, starred }: { noteId: string; starred: boolean }) => {
      const response = await fetch(`/api/enhanced-notes/${noteId}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred }),
      });
      if (!response.ok) throw new Error('Failed to update note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folderData: Partial<NoteFolder>) => {
      const response = await fetch('/api/enhanced-notes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-folders'] });
      toast.success('Folder created successfully!');
    },
  });

  // AI Tools Configuration
  const aiTools: AITool[] = [
    {
      id: 'summarize',
      name: 'AI Summarizer',
      description: 'Generate concise summaries of your notes',
      icon: DocumentTextIcon,
      category: 'analysis',
      isAvailable: true,
      isPremium: false,
    },
    {
      id: 'flashcards',
      name: 'Auto Flashcards',
      description: 'Convert notes into study flashcards',
      icon: AcademicCapIcon,
      category: 'study',
      isAvailable: true,
      isPremium: false,
    },
    {
      id: 'quiz',
      name: 'Quiz Generator',
      description: 'Create quizzes from your notes',
      icon: BeakerIcon,
      category: 'study',
      isAvailable: true,
      isPremium: false,
    },
    {
      id: 'enhance',
      name: 'Content Enhancer',
      description: 'Improve and expand your notes',
      icon: SparklesIcon,
      category: 'writing',
      isAvailable: true,
      isPremium: true,
    },
    {
      id: 'translate',
      name: 'Smart Translator',
      description: 'Translate notes to any language',
      icon: ChatBubbleLeftRightIcon,
      category: 'writing',
      isAvailable: true,
      isPremium: true,
    },
    {
      id: 'mindmap',
      name: 'Mind Map Creator',
      description: 'Generate visual mind maps',
      icon: CubeIcon,
      category: 'organization',
      isAvailable: true,
      isPremium: true,
    },
    {
      id: 'study-plan',
      name: 'Study Planner',
      description: 'Create personalized study plans',
      icon: ClockIcon,
      category: 'study',
      isAvailable: true,
      isPremium: false,
    },
    {
      id: 'citation',
      name: 'Citation Generator',
      description: 'Generate proper citations',
      icon: BookmarkIcon,
      category: 'writing',
      isAvailable: true,
      isPremium: false,
    },
  ];

  // Utility Functions
  const handleNoteSelect = useCallback((noteId: string) => {
    if (isSelectionMode) {
      setSelectedNotes(prev => 
        prev.includes(noteId) 
          ? prev.filter(id => id !== noteId)
          : [...prev, noteId]
      );
    } else {
      setActiveNote(noteId);
      // Navigate to note editor
    }
  }, [isSelectionMode]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedNotes.length === 0) return;

    switch (action) {
      case 'delete':
        deleteNotesMutation.mutate(selectedNotes);
        break;
      case 'star':
        // Implement bulk star
        break;
      case 'archive':
        // Implement bulk archive
        break;
      case 'move':
        // Implement bulk move
        break;
      case 'export':
        // Implement bulk export
        break;
    }
  }, [selectedNotes, deleteNotesMutation]);

  const handleCreateNote = useCallback((templateId?: string) => {
    const template = templateId ? templates.find(t => t.id === templateId) : null;
    const noteData: Partial<Note> = {
      title: template?.name || 'Untitled Note',
      content: template?.content || '',
      type: 'text',
      tags: template?.tags || [],
      subject: '',
      isStarred: false,
      isArchived: false,
      isLocked: false,
      isTemplate: false,
      collaborators: [],
      attachments: [],
      voiceNotes: [],
      linkedNotes: [],
      isPublic: false,
      reactions: { likes: 0, loves: 0, helpful: 0, brilliant: 0 },
    };

    createNoteMutation.mutate(noteData);
  }, [templates, createNoteMutation]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note: Note) => {
      if (selectedFolder && note.folder?.id !== selectedFolder) return false;
      if (filterBy.type && note.type !== filterBy.type) return false;
      if (filterBy.isStarred && !note.isStarred) return false;
      if (filterBy.isArchived !== undefined && note.isArchived !== filterBy.isArchived) return false;
      if (filterBy.subject && note.subject !== filterBy.subject) return false;
      if (filterBy.tags?.length && !filterBy.tags.every(tag => note.tags.includes(tag))) return false;
      
      return true;
    });
  }, [notes, selectedFolder, filterBy]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'size':
          return b.wordCount - a.wordCount;
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [filteredNotes, sortBy]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setIsCreating(true);
            break;
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'a':
            e.preventDefault();
            if (isSelectionMode) {
              setSelectedNotes(notes.map((note: Note) => note.id));
            }
            break;
          case 'd':
            e.preventDefault();
            setIsSelectionMode(!isSelectionMode);
            setSelectedNotes([]);
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setIsSelectionMode(false);
        setSelectedNotes([]);
        setShowFilters(false);
        setShowAITools(false);
        setIsCreating(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, notes]);

  // Auto-save draft functionality
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-save any active drafts
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const renderNoteCard = (note: Note) => (
    <motion.div
      key={note.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
        selectedNotes.includes(note.id) && "ring-2 ring-blue-500",
        note.isStarred && "border-l-4 border-yellow-400",
        viewMode === 'list' && "flex items-center space-x-4 p-4",
        viewMode === 'grid' && "p-6"
      )}
      onClick={() => handleNoteSelect(note.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center",
            selectedNotes.includes(note.id) 
              ? "bg-blue-500 border-blue-500 text-white" 
              : "border-gray-300 dark:border-gray-600"
          )}>
            {selectedNotes.includes(note.id) && <CheckIcon className="w-3 h-3" />}
          </div>
        </div>
      )}

      {/* Note Type Indicator */}
      <div className="absolute top-3 right-3 flex items-center space-x-2">
        {note.type === 'handwritten' && (
          <PencilIcon className="w-4 h-4 text-purple-500" />
        )}
        {note.type === 'mixed' && (
          <div className="flex space-x-1">
            <DocumentTextIcon className="w-4 h-4 text-blue-500" />
            <PencilIcon className="w-4 h-4 text-purple-500" />
          </div>
        )}
        {note.isLocked && (
          <LockClosedIcon className="w-4 h-4 text-red-500" />
        )}
        {note.isStarred && (
          <StarSolidIcon className="w-4 h-4 text-yellow-500" />
        )}
      </div>

      {/* Note Content */}
      <div className={cn(
        "space-y-3",
        isSelectionMode && "ml-8"
      )}>
        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {note.title}
        </h3>

        {/* Preview Content */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {note.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
        </p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <span>{note.wordCount} words</span>
            <span>{note.readingTime} min read</span>
            {note.collaborators.length > 0 && (
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="w-3 h-3" />
                <span>{note.collaborators.length}</span>
              </div>
            )}
          </div>
          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>

        {/* Quick Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              starNoteMutation.mutate({ noteId: note.id, starred: !note.isStarred });
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {note.isStarred ? (
              <StarSolidIcon className="w-4 h-4 text-yellow-500" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ShareIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Progress Indicators */}
      {note.studyScore && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-blue-500"
            style={{ width: `${note.studyScore}%` }}
          />
        </div>
      )}
    </motion.div>
  );

  const renderFolderTree = (folders: NoteFolder[], level = 0) => (
    <div className={cn("space-y-1", level > 0 && "ml-4")}>
      {folders.map(folder => (
        <div key={folder.id}>
          <button
            onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
            className={cn(
              "w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedFolder === folder.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            )}
          >
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: folder.color }}
            />
            <span className="flex-1 text-sm font-medium">{folder.name}</span>
            <span className="text-xs text-gray-500">{folder.noteCount}</span>
          </button>
          {folder.children && folder.children.length > 0 && (
            renderFolderTree(folder.children, level + 1)
          )}
        </div>
      ))}
    </div>
  );

  if (notesLoading || foldersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading your notes..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Notes - StudyGenius</title>
        <meta name="description" content="Organize, collaborate, and enhance your notes with AI-powered tools" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  My Notes
                </h1>
                
                {isSelectionMode && selectedNotes.length > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {selectedNotes.length} selected
                    </span>
                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedNotes([]);
                      }}
                      className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="flex-1 max-w-lg mx-8">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search notes, tags, content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === 'grid' 
                        ? "bg-white dark:bg-gray-600 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === 'list' 
                        ? "bg-white dark:bg-gray-600 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === 'kanban' 
                        ? "bg-white dark:bg-gray-600 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    <ViewColumnsIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showFilters 
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>

                {/* AI Tools Toggle */}
                <button
                  onClick={() => setShowAITools(!showAITools)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showAITools 
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>

                {/* Create Note Button */}
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>New Note</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          <AnimatePresence>
            {isSelectionMode && selectedNotes.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleBulkAction('star')}
                        className="px-3 py-1.5 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                      >
                        Star All
                      </button>
                      <button
                        onClick={() => handleBulkAction('archive')}
                        className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleBulkAction('move')}
                        className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      >
                        Move
                      </button>
                      <button
                        onClick={() => handleBulkAction('export')}
                        className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <AnimatePresence>
            {showSidebar && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 space-y-6">
                  {/* Quick Stats */}
                  {stats && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                        Quick Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.totalNotes}
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                            Total Notes
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {Math.round(stats.totalWords / 1000)}k
                          </div>
                          <div className="text-xs text-green-600/70 dark:text-green-400/70">
                            Words
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.studyStreak}
                          </div>
                          <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                            Day Streak
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {stats.flashcardsCreated}
                          </div>
                          <div className="text-xs text-orange-600/70 dark:text-orange-400/70">
                            Flashcards
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Filters */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      Quick Filters
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setFilterBy({})}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                          Object.keys(filterBy).length === 0 
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span className="text-sm">All Notes</span>
                        <span className="ml-auto text-xs text-gray-500">{notes.length}</span>
                      </button>
                      <button
                        onClick={() => setFilterBy({ isStarred: true })}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                          filterBy.isStarred 
                            ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <StarIcon className="w-4 h-4" />
                        <span className="text-sm">Starred</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {notes.filter((n: Note) => n.isStarred).length}
                        </span>
                      </button>
                      <button
                        onClick={() => setFilterBy({ isArchived: true })}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                          filterBy.isArchived 
                            ? "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <ArchiveBoxIcon className="w-4 h-4" />
                        <span className="text-sm">Archived</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {notes.filter((n: Note) => n.isArchived).length}
                        </span>
                      </button>
                      <button
                        onClick={() => setFilterBy({ type: 'handwritten' })}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                          filterBy.type === 'handwritten' 
                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span className="text-sm">Handwritten</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {notes.filter((n: Note) => n.type === 'handwritten').length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Folders */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                        Folders
                      </h3>
                      <button
                        onClick={() => {
                          const name = prompt('Folder name:');
                          if (name) {
                            createFolderMutation.mutate({
                              name,
                              color: '#3B82F6',
                              description: '',
                            });
                          }
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <PlusIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    {renderFolderTree(folders)}
                  </div>

                  {/* Recent Tags */}
                  {stats?.mostUsedTags && stats.mostUsedTags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                        Popular Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {stats.mostUsedTags.slice(0, 10).map(({ tag, count }) => (
                          <button
                            key={tag}
                            onClick={() => setFilterBy({ tags: [tag] })}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            #{tag} ({count})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sort by:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="updated">Last Updated</option>
                        <option value="created">Date Created</option>
                        <option value="title">Title</option>
                        <option value="size">Size</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type:
                      </label>
                      <select
                        value={filterBy.type || ''}
                        onChange={(e) => setFilterBy(prev => ({ ...prev, type: e.target.value as any || undefined }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">All Types</option>
                        <option value="text">Text</option>
                        <option value="handwritten">Handwritten</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subject:
                      </label>
                      <select
                        value={filterBy.subject || ''}
                        onChange={(e) => setFilterBy(prev => ({ ...prev, subject: e.target.value || undefined }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">All Subjects</option>
                        {stats?.mostActiveSubjects?.map(({ subject }) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setIsSelectionMode(!isSelectionMode)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        isSelectionMode
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {isSelectionMode ? 'Exit Selection' : 'Select Mode'}
                    </button>

                    <button
                      onClick={() => setFilterBy({})}
                      className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Tools Panel */}
            <AnimatePresence>
              {showAITools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        AI-Powered Tools
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {aiTools.map(tool => {
                        const IconComponent = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 text-left group"
                            disabled={!tool.isAvailable}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                                <IconComponent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {tool.name}
                                  </h4>
                                  {tool.isPremium && (
                                    <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                                      Pro
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes Grid */}
            <div className="p-6">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-20">
                  <DocumentTextIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {searchQuery || Object.keys(filterBy).length > 0 ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || Object.keys(filterBy).length > 0 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first note to get started with your studies'
                    }
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Create Your First Note</span>
                  </button>
                </div>
              ) : (
                <div className={cn(
                  "transition-all duration-200",
                  viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
                  viewMode === 'list' && "space-y-4",
                  viewMode === 'kanban' && "flex space-x-6 overflow-x-auto pb-6"
                )}>
                  <AnimatePresence mode="popLayout">
                    {sortedNotes.map(renderNoteCard)}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Create Note Modal */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setIsCreating(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Create New Note
                    </h2>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Quick Create Options */}
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => handleCreateNote()}
                        className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                      >
                        <DocumentTextIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Blank Note
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Start from scratch
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          // Open drawing canvas
                        }}
                        className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors group"
                      >
                        <PencilIcon className="w-8 h-8 text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Handwritten
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Draw or write by hand
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setVoiceRecording(true);
                        }}
                        className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors group"
                      >
                        <MicrophoneIcon className="w-8 h-8 text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Voice Note
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Record your thoughts
                        </div>
                      </button>
                    </div>

                    {/* Templates */}
                    {templates.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                          Templates
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {templates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => handleCreateNote(template.id)}
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                      {template.name}
                                    </h4>
                                    {template.isOfficial && (
                                      <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {template.description}
                                  </p>
                                  <div className="flex items-center space-x-3 mt-2">
                                    <span className="text-xs text-gray-500">
                                      {template.usageCount} uses
                                    </span>
                                    <div className="flex items-center space-x-1">
                                      <StarSolidIcon className="w-3 h-3 text-yellow-500" />
                                      <span className="text-xs text-gray-500">
                                        {template.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            {showSidebar ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Voice Recording Modal */}
        <AnimatePresence>
          {voiceRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center"
              >
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MicrophoneIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Recording Voice Note
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Speak clearly into your microphone...
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setVoiceRecording(false)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Stop & Save
                  </button>
                  <button
                    onClick={() => setVoiceRecording(false)}
                    className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotesPage;