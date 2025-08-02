import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, uuid, decimal, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table with comprehensive profile data
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  profilePicture: text('profile_picture'),
  bio: text('bio'),
  learningStyle: varchar('learning_style', { length: 50 }),
  educationLevel: varchar('education_level', { length: 50 }),
  subjects: jsonb('subjects').default([]),
  preferences: jsonb('preferences').default({}),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  theme: varchar('theme', { length: 20 }).default('light'),
  isVerified: boolean('is_verified').default(false),
  isPremium: boolean('is_premium').default(false),
  points: integer('points').default(0),
  streak: integer('streak').default(0),
  lastActive: timestamp('last_active').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Folders for organizing notes
export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  parentFolderId: uuid('parent_folder_id').references(() => folders.id),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  icon: varchar('icon', { length: 50 }),
  isShared: boolean('is_shared').default(false),
  shareCode: varchar('share_code', { length: 20 }).unique(),
  position: integer('position').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Notes with rich content and handwriting support
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  folderId: uuid('folder_id').references(() => folders.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: jsonb('content').default({}), // Rich text content
  handwritingData: jsonb('handwriting_data').default([]), // Stroke data for handwriting
  attachments: jsonb('attachments').default([]),
  tags: jsonb('tags').default([]),
  isPublic: boolean('is_public').default(false),
  isTemplate: boolean('is_template').default(false),
  shareCode: varchar('share_code', { length: 20 }).unique(),
  version: integer('version').default(1),
  thumbnail: text('thumbnail'),
  wordCount: integer('word_count').default(0),
  readTime: integer('read_time').default(0),
  lastEdited: timestamp('last_edited').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('notes_user_id_idx').on(table.userId),
  folderIdIdx: index('notes_folder_id_idx').on(table.folderId)
}));

// Note versions for history tracking
export const noteVersions = pgTable('note_versions', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id').references(() => notes.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  version: integer('version').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: jsonb('content').default({}),
  handwritingData: jsonb('handwriting_data').default([]),
  changeDescription: text('change_description'),
  createdAt: timestamp('created_at').defaultNow()
});

// AI Chat conversations
export const aiChats = pgTable('ai_chats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  messages: jsonb('messages').default([]),
  context: jsonb('context').default({}),
  isArchived: boolean('is_archived').default(false),
  totalMessages: integer('total_messages').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Study plans and scheduling
export const studyPlans = pgTable('study_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 100 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  goals: jsonb('goals').default([]),
  schedule: jsonb('schedule').default({}),
  priority: varchar('priority', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('active'),
  progress: decimal('progress', { precision: 5, scale: 2 }).default('0.00'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours').default(0),
  reminders: jsonb('reminders').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Study sessions tracking
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  studyPlanId: uuid('study_plan_id').references(() => studyPlans.id),
  noteId: integer('note_id').references(() => notes.id),
  subject: varchar('subject', { length: 100 }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // in minutes
  focusScore: integer('focus_score'),
  breaks: jsonb('breaks').default([]),
  achievements: jsonb('achievements').default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

// Homework assignments
export const homeworkAssignments = pgTable('homework_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 100 }),
  dueDate: timestamp('due_date'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('pending'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Homework problems and solutions
export const homeworkProblems = pgTable('homework_problems', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  problemImage: text('problem_image'),
  problemText: text('problem_text'),
  solution: jsonb('solution').default({}),
  steps: jsonb('steps').default([]),
  explanation: text('explanation'),
  concepts: jsonb('concepts').default([]),
  isPublic: boolean('is_public').default(false),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'),
  feedback: jsonb('feedback').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Quizzes and assessments
export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 100 }),
  topic: varchar('topic', { length: 255 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  questions: jsonb('questions').default([]),
  timeLimit: integer('time_limit'), // in minutes
  passingScore: integer('passing_score').default(70),
  isPublic: boolean('is_public').default(false),
  tags: jsonb('tags').default([]),
  attempts: integer('attempts').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Quiz questions
export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').references(() => quizzes.id).notNull(),
  question: text('question').notNull(),
  type: varchar('type', { length: 20 }).default('multiple_choice'),
  options: jsonb('options').default([]),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  points: integer('points').default(1),
  createdAt: timestamp('created_at').defaultNow()
});

// Quiz attempts and results
export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  quizId: uuid('quiz_id').references(() => quizzes.id).notNull(),
  answers: jsonb('answers').default({}),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  timeSpent: integer('time_spent'), // in seconds
  isCompleted: boolean('is_completed').default(false),
  feedback: jsonb('feedback').default({}),
  weakAreas: jsonb('weak_areas').default([]),
  strongAreas: jsonb('strong_areas').default([]),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

// Flashcards for spaced repetition
export const flashcards = pgTable('flashcards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  deckId: uuid('deck_id').references(() => flashcardDecks.id),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  questionImage: text('question_image'),
  answerImage: text('answer_image'),
  difficulty: integer('difficulty').default(1),
  interval: integer('interval').default(1),
  repetitions: integer('repetitions').default(0),
  easeFactor: decimal('ease_factor', { precision: 4, scale: 2 }).default('2.50'),
  nextReview: timestamp('next_review'),
  lastReviewed: timestamp('last_reviewed'),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Flashcard decks
export const flashcardDecks = pgTable('flashcard_decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 100 }),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  isPublic: boolean('is_public').default(false),
  shareCode: varchar('share_code', { length: 20 }).unique(),
  cardCount: integer('card_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Learning games
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  minPlayers: integer('min_players').default(1),
  maxPlayers: integer('max_players').default(1),
  timeLimit: integer('time_limit'), // in minutes
  rules: jsonb('rules').default({}),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  popularity: integer('popularity').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Game sessions and scores
export const gameScores = pgTable('game_scores', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  gameId: integer('game_id').references(() => games.id).notNull(),
  sessionId: varchar('session_id', { length: 100 }),
  score: integer('score').notNull(),
  level: integer('level').default(1),
  duration: integer('duration'), // in seconds
  achievements: jsonb('achievements').default([]),
  stats: jsonb('stats').default({}),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Chat rooms and messaging
export const chatRooms = pgTable('chat_rooms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // 'public', 'private', 'study_group'
  subject: varchar('subject', { length: 100 }),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  maxMembers: integer('max_members').default(50),
  currentMembers: integer('current_members').default(1),
  avatar: text('avatar'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Chat messages
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => chatRooms.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).default('text'), // 'text', 'image', 'file', 'voice'
  attachments: jsonb('attachments').default([]),
  replyTo: integer('reply_to').references(() => chatMessages.id),
  reactions: jsonb('reactions').default({}),
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  roomIdIdx: index('chat_messages_room_id_idx').on(table.roomId),
  userIdIdx: index('chat_messages_user_id_idx').on(table.userId)
}));

// Room memberships
export const roomMemberships = pgTable('room_memberships', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => chatRooms.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).default('member'), // 'owner', 'admin', 'moderator', 'member'
  permissions: jsonb('permissions').default({}),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastSeen: timestamp('last_seen').defaultNow(),
  isMuted: boolean('is_muted').default(false),
  isBlocked: boolean('is_blocked').default(false)
});

// Video call sessions
export const videoSessions = pgTable('video_sessions', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => chatRooms.id),
  hostId: integer('host_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).default('study'), // 'study', 'meeting', 'tutoring'
  status: varchar('status', { length: 20 }).default('waiting'), // 'waiting', 'active', 'ended'
  participants: jsonb('participants').default([]),
  maxParticipants: integer('max_participants').default(10),
  settings: jsonb('settings').default({}),
  recordingUrl: text('recording_url'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // in minutes
  createdAt: timestamp('created_at').defaultNow()
});

// Collaborative workspaces
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).default('project'), // 'project', 'study_group', 'class'
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  subject: varchar('subject', { length: 100 }),
  avatar: text('avatar'),
  settings: jsonb('settings').default({}),
  resources: jsonb('resources').default([]),
  memberCount: integer('member_count').default(1),
  isPublic: boolean('is_public').default(false),
  inviteCode: varchar('invite_code', { length: 20 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Workspace memberships
export const workspaceMemberships = pgTable('workspace_memberships', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).default('member'), // 'owner', 'admin', 'member'
  permissions: jsonb('permissions').default({}),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastActive: timestamp('last_active').defaultNow(),
  contribution: integer('contribution').default(0)
});

// Shared documents in workspaces
export const sharedDocuments = pgTable('shared_documents', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id).notNull(),
  noteId: integer('note_id').references(() => notes.id),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).default('note'), // 'note', 'document', 'presentation'
  content: jsonb('content').default({}),
  permissions: jsonb('permissions').default({}),
  version: integer('version').default(1),
  isLocked: boolean('is_locked').default(false),
  lockedBy: integer('locked_by').references(() => users.id),
  lastEditedBy: integer('last_edited_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Research papers and citations
export const researchPapers = pgTable('research_papers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  authors: jsonb('authors').default([]),
  abstract: text('abstract'),
  doi: varchar('doi', { length: 255 }),
  url: text('url'),
  pdfUrl: text('pdf_url'),
  publishedDate: timestamp('published_date'),
  journal: varchar('journal', { length: 255 }),
  keywords: jsonb('keywords').default([]),
  subject: varchar('subject', { length: 100 }),
  citationCount: integer('citation_count').default(0),
  isBookmarked: boolean('is_bookmarked').default(false),
  notes: text('notes'),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').defaultNow()
});

// User achievements and badges
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  category: varchar('category', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).default('easy'),
  points: integer('points').default(10),
  criteria: jsonb('criteria').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// User achievement unlocks
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  achievementId: integer('achievement_id').references(() => achievements.id).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  progress: jsonb('progress').default({})
});

// Learning analytics and insights
export const learningAnalytics = pgTable('learning_analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: timestamp('date').defaultNow(),
  studyTime: integer('study_time').default(0), // in minutes
  notesCreated: integer('notes_created').default(0),
  quizzesTaken: integer('quizzes_taken').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  subjectsStudied: jsonb('subjects_studied').default([]),
  activities: jsonb('activities').default([]),
  focusScore: integer('focus_score'),
  productivity: decimal('productivity', { precision: 5, scale: 2 }),
  insights: jsonb('insights').default([]),
  recommendations: jsonb('recommendations').default([])
});

// System notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  data: jsonb('data').default({}),
  isRead: boolean('is_read').default(false),
  priority: varchar('priority', { length: 20 }).default('normal'),
  actionUrl: text('action_url'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  folders: many(folders),
  aiChats: many(aiChats),
  studyPlans: many(studyPlans),
  studySessions: many(studySessions),
  homeworkProblems: many(homeworkProblems),
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  flashcards: many(flashcards),
  flashcardDecks: many(flashcardDecks),
  gameScores: many(gameScores),
  chatMessages: many(chatMessages),
  roomMemberships: many(roomMemberships),
  videoSessions: many(videoSessions),
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMemberships),
  sharedDocuments: many(sharedDocuments),
  researchPapers: many(researchPapers),
  userAchievements: many(userAchievements),
  learningAnalytics: many(learningAnalytics),
  notifications: many(notifications)
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id]
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id]
  }),
  versions: many(noteVersions)
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id]
  }),
  parent: one(folders, {
    fields: [folders.parentFolderId],
    references: [folders.id]
  }),
  children: many(folders),
  notes: many(notes)
}));