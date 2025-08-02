import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Advanced note types and templates
export const noteTemplates = pgTable('note_templates', {
  id: serial('id').primaryKey(),
  templateId: uuid('template_id').defaultRandom().notNull().unique(),
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // cornell, outline, mind_map, grid, music, math, etc.
  
  // Template structure
  layout: jsonb('layout').notNull(), // Grid, lines, dots, blank, custom
  pageSize: varchar('page_size', { length: 20 }).default('a4'), // a4, letter, legal, custom
  orientation: varchar('orientation', { length: 20 }).default('portrait'),
  
  // Template assets
  backgroundImage: text('background_image'),
  overlayElements: jsonb('overlay_elements').default([]), // Headers, footers, logos, etc.
  
  // Subject-specific features
  subjectType: varchar('subject_type', { length: 50 }), // math, science, literature, music, etc.
  mathTools: jsonb('math_tools').default({}), // Equation templates, graph paper settings
  scienceTools: jsonb('science_tools').default({}), // Periodic table, diagrams
  languageTools: jsonb('language_tools').default({}), // Grammar guides, vocabulary
  
  // Collaboration and sharing
  isPublic: boolean('is_public').default(false),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  usageCount: integer('usage_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  
  // Version control
  version: varchar('version', { length: 20 }).default('1.0'),
  parentTemplateId: integer('parent_template_id').references(() => noteTemplates.id),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  categoryIdx: index('note_templates_category_idx').on(table.category),
  subjectIdx: index('note_templates_subject_idx').on(table.subjectType),
  publicIdx: index('note_templates_public_idx').on(table.isPublic),
  ratingIdx: index('note_templates_rating_idx').on(table.rating)
}));

// Enhanced notes with advanced features
export const enhancedNotes = pgTable('enhanced_notes', {
  id: serial('id').primaryKey(),
  noteId: uuid('note_id').defaultRandom().notNull().unique(),
  
  // Basic info
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  
  // Content structure
  contentType: varchar('content_type', { length: 50 }).default('mixed'), // text, handwriting, mixed, multimedia
  richTextContent: jsonb('rich_text_content').default({}), // Quill.js delta format
  handwritingData: jsonb('handwriting_data').default([]), // Stroke data with pressure, tilt, etc.
  
  // Apple Pencil and stylus support
  pressureSensitivity: boolean('pressure_sensitivity').default(true),
  tiltRecognition: boolean('tilt_recognition').default(true),
  palmRejection: boolean('palm_rejection').default(true),
  fingerDrawing: boolean('finger_drawing').default(false),
  
  // Handwriting recognition
  ocrText: text('ocr_text'), // Extracted text from handwriting
  ocrConfidence: decimal('ocr_confidence', { precision: 5, scale: 4 }), // 0-1 confidence score
  languageDetected: varchar('language_detected', { length: 10 }), // en, es, fr, etc.
  handwritingStyle: varchar('handwriting_style', { length: 50 }), // cursive, print, mixed
  
  // Advanced formatting
  templateId: integer('template_id').references(() => noteTemplates.id),
  customStyling: jsonb('custom_styling').default({}), // CSS-like styling
  fontSize: integer('font_size').default(14),
  fontFamily: varchar('font_family', { length: 50 }).default('Inter'),
  lineSpacing: decimal('line_spacing', { precision: 3, scale: 1 }).default('1.5'),
  
  // Multimedia integration
  attachments: jsonb('attachments').default([]), // Files, images, videos, audio
  embeddedMedia: jsonb('embedded_media').default([]), // YouTube, PDFs, web content
  drawingLayers: jsonb('drawing_layers').default([]), // Separate layers for organization
  
  // Organization and metadata
  folderId: integer('folder_id'), // References folders
  tags: jsonb('tags').default([]), // Searchable tags
  subject: varchar('subject', { length: 100 }),
  course: varchar('course', { length: 100 }),
  chapter: varchar('chapter', { length: 100 }),
  
  // Collaboration features
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  isPublic: boolean('is_public').default(false),
  allowComments: boolean('allow_comments').default(true),
  allowEditing: boolean('allow_editing').default(false),
  
  // Version control and history
  version: integer('version').default(1),
  parentNoteId: integer('parent_note_id').references(() => enhancedNotes.id),
  revisionHistory: jsonb('revision_history').default([]),
  
  // AI integration
  aiSummary: text('ai_summary'),
  aiKeyPoints: jsonb('ai_key_points').default([]),
  aiQuestions: jsonb('ai_questions').default([]),
  relatedContent: jsonb('related_content').default([]),
  
  // Analytics and engagement
  viewCount: integer('view_count').default(0),
  editCount: integer('edit_count').default(0),
  shareCount: integer('share_count').default(0),
  studyTime: integer('study_time').default(0), // Minutes spent studying this note
  
  // Academic features
  citationStyle: varchar('citation_style', { length: 20 }).default('apa'), // apa, mla, chicago
  bibliography: jsonb('bibliography').default([]),
  footnotes: jsonb('footnotes').default([]),
  
  // Export and backup
  lastExported: timestamp('last_exported'),
  exportFormats: jsonb('export_formats').default([]), // pdf, docx, html, etc.
  backupStatus: varchar('backup_status', { length: 20 }).default('pending'),
  
  // Status and timestamps
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
  lastEditedBy: integer('last_edited_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow()
}, (table) => ({
  ownerIdx: index('enhanced_notes_owner_idx').on(table.ownerId),
  folderIdx: index('enhanced_notes_folder_idx').on(table.folderId),
  subjectIdx: index('enhanced_notes_subject_idx').on(table.subject),
  statusIdx: index('enhanced_notes_status_idx').on(table.status),
  publicIdx: index('enhanced_notes_public_idx').on(table.isPublic),
  updatedIdx: index('enhanced_notes_updated_idx').on(table.updatedAt)
}));

// Real-time collaboration sessions
export const collaborationSessions = pgTable('collaboration_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  
  noteId: integer('note_id').references(() => enhancedNotes.id).notNull(),
  hostId: integer('host_id').references(() => users.id).notNull(),
  
  // Session configuration
  maxParticipants: integer('max_participants').default(50),
  allowAnonymous: boolean('allow_anonymous').default(false),
  requireApproval: boolean('require_approval').default(false),
  
  // Permissions
  defaultPermissions: jsonb('default_permissions').default({
    canEdit: false,
    canComment: true,
    canViewHistory: false,
    canExport: false
  }),
  
  // Session state
  status: varchar('status', { length: 20 }).default('active'), // active, paused, ended
  currentParticipants: integer('current_participants').default(1),
  
  // Real-time features
  cursorTracking: boolean('cursor_tracking').default(true),
  voiceChat: boolean('voice_chat').default(false),
  screenSharing: boolean('screen_sharing').default(false),
  
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  lastActivity: timestamp('last_activity').defaultNow()
}, (table) => ({
  noteIdx: index('collaboration_sessions_note_idx').on(table.noteId),
  hostIdx: index('collaboration_sessions_host_idx').on(table.hostId),
  statusIdx: index('collaboration_sessions_status_idx').on(table.status)
}));

// Collaboration participants with detailed tracking
export const collaborationParticipants = pgTable('collaboration_participants', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => collaborationSessions.id).notNull(),
  userId: integer('user_id').references(() => users.id),
  
  // Participant info
  role: varchar('role', { length: 20 }).default('participant'), // host, moderator, participant, observer
  displayName: varchar('display_name', { length: 100 }),
  isAnonymous: boolean('is_anonymous').default(false),
  
  // Permissions
  permissions: jsonb('permissions').notNull(),
  
  // Activity tracking
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  lastActivity: timestamp('last_activity').defaultNow(),
  
  // Contribution metrics
  editCount: integer('edit_count').default(0),
  commentCount: integer('comment_count').default(0),
  timeActive: integer('time_active').default(0), // Minutes
  
  // Real-time state
  currentCursor: jsonb('current_cursor'),
  isTyping: boolean('is_typing').default(false),
  currentSelection: jsonb('current_selection'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  sessionUserIdx: index('collaboration_participants_session_user_idx').on(table.sessionId, table.userId),
  roleIdx: index('collaboration_participants_role_idx').on(table.role),
  activeIdx: index('collaboration_participants_active_idx').on(table.lastActivity)
}));

// Note comments and annotations
export const noteComments = pgTable('note_comments', {
  id: serial('id').primaryKey(),
  commentId: uuid('comment_id').defaultRandom().notNull().unique(),
  
  noteId: integer('note_id').references(() => enhancedNotes.id).notNull(),
  authorId: integer('author_id').references(() => users.id).notNull(),
  
  // Comment content
  content: text('content').notNull(),
  commentType: varchar('comment_type', { length: 20 }).default('text'), // text, voice, drawing
  
  // Position and context
  anchorPoint: jsonb('anchor_point'), // Where the comment is anchored in the note
  selectedText: text('selected_text'), // Text that was selected when commenting
  pageNumber: integer('page_number'),
  
  // Threading
  parentCommentId: integer('parent_comment_id').references(() => noteComments.id),
  threadDepth: integer('thread_depth').default(0),
  
  // Reactions and engagement
  reactions: jsonb('reactions').default([]),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  
  // Status and moderation
  status: varchar('status', { length: 20 }).default('active'), // active, hidden, deleted
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  
  // Visibility
  isPrivate: boolean('is_private').default(false),
  visibleToRoles: jsonb('visible_to_roles').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  noteIdx: index('note_comments_note_idx').on(table.noteId),
  authorIdx: index('note_comments_author_idx').on(table.authorId),
  parentIdx: index('note_comments_parent_idx').on(table.parentCommentId),
  statusIdx: index('note_comments_status_idx').on(table.status)
}));

// Note sharing and permissions
export const noteSharing = pgTable('note_sharing', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id').references(() => enhancedNotes.id).notNull(),
  sharedWithUserId: integer('shared_with_user_id').references(() => users.id),
  sharedByUserId: integer('shared_by_user_id').references(() => users.id).notNull(),
  
  // Sharing method
  shareType: varchar('share_type', { length: 20 }).notNull(), // direct, link, qr_code, email
  shareToken: uuid('share_token').defaultRandom(),
  
  // Permissions
  canView: boolean('can_view').default(true),
  canEdit: boolean('can_edit').default(false),
  canComment: boolean('can_comment').default(true),
  canShare: boolean('can_share').default(false),
  canDownload: boolean('can_download').default(true),
  
  // Access control
  expiresAt: timestamp('expires_at'),
  maxViews: integer('max_views'),
  currentViews: integer('current_views').default(0),
  passwordProtected: boolean('password_protected').default(false),
  accessPassword: text('access_password'),
  
  // Analytics
  lastAccessedAt: timestamp('last_accessed_at'),
  accessCount: integer('access_count').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  noteIdx: index('note_sharing_note_idx').on(table.noteId),
  sharedWithIdx: index('note_sharing_shared_with_idx').on(table.sharedWithUserId),
  tokenIdx: index('note_sharing_token_idx').on(table.shareToken),
  activeIdx: index('note_sharing_active_idx').on(table.isActive)
}));

// Handwriting recognition and analysis
export const handwritingAnalysis = pgTable('handwriting_analysis', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id').references(() => enhancedNotes.id).notNull(),
  
  // Recognition results
  recognizedText: text('recognized_text'),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  alternativeTexts: jsonb('alternative_texts').default([]),
  
  // Handwriting characteristics
  style: varchar('style', { length: 50 }), // cursive, print, mixed
  slant: decimal('slant', { precision: 5, scale: 2 }), // Angle of handwriting
  pressure: decimal('pressure', { precision: 5, scale: 4 }), // Average pressure
  speed: decimal('speed', { precision: 8, scale: 2 }), // Writing speed
  
  // Language and content analysis
  language: varchar('language', { length: 10 }),
  readabilityScore: decimal('readability_score', { precision: 5, scale: 2 }),
  keyTerms: jsonb('key_terms').default([]),
  
  // Quality metrics
  legibilityScore: decimal('legibility_score', { precision: 5, scale: 2 }),
  strokeConsistency: decimal('stroke_consistency', { precision: 5, scale: 2 }),
  
  // Processing info
  processingModel: varchar('processing_model', { length: 50 }),
  processingTime: integer('processing_time'), // Milliseconds
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  noteIdx: index('handwriting_analysis_note_idx').on(table.noteId),
  confidenceIdx: index('handwriting_analysis_confidence_idx').on(table.confidence),
  languageIdx: index('handwriting_analysis_language_idx').on(table.language)
}));

// Advanced folder system with hierarchical organization
export const enhancedFolders = pgTable('enhanced_folders', {
  id: serial('id').primaryKey(),
  folderId: uuid('folder_id').defaultRandom().notNull().unique(),
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#6366f1'), // Hex color
  icon: varchar('icon', { length: 50 }).default('folder'),
  
  // Hierarchy
  parentFolderId: integer('parent_folder_id').references(() => enhancedFolders.id),
  path: text('path'), // Full path for easy querying
  depth: integer('depth').default(0),
  
  // Ownership and permissions
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  isShared: boolean('is_shared').default(false),
  permissions: jsonb('permissions').default({}),
  
  // Organization features
  sortOrder: varchar('sort_order', { length: 20 }).default('modified'), // name, created, modified, size
  viewType: varchar('view_type', { length: 20 }).default('grid'), // grid, list, timeline
  
  // Academic organization
  subject: varchar('subject', { length: 100 }),
  semester: varchar('semester', { length: 50 }),
  year: integer('year'),
  institution: varchar('institution', { length: 100 }),
  
  // Metadata
  noteCount: integer('note_count').default(0),
  totalSize: bigint('total_size', { mode: 'number' }).default(0), // Bytes
  
  // AI organization
  autoOrganize: boolean('auto_organize').default(false),
  suggestedTags: jsonb('suggested_tags').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  ownerIdx: index('enhanced_folders_owner_idx').on(table.ownerId),
  parentIdx: index('enhanced_folders_parent_idx').on(table.parentFolderId),
  subjectIdx: index('enhanced_folders_subject_idx').on(table.subject),
  pathIdx: index('enhanced_folders_path_idx').on(table.path)
}));

// Note search and indexing for advanced search capabilities
export const noteSearchIndex = pgTable('note_search_index', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id').references(() => enhancedNotes.id).notNull().unique(),
  
  // Searchable content
  titleVector: text('title_vector'), // For vector search
  contentVector: text('content_vector'),
  tagsVector: text('tags_vector'),
  
  // Full-text search
  searchableText: text('searchable_text'), // Combined text for FTS
  keywords: jsonb('keywords').default([]),
  
  // Content analysis
  topicModeling: jsonb('topic_modeling').default([]),
  namedEntities: jsonb('named_entities').default([]),
  sentimentScore: decimal('sentiment_score', { precision: 5, scale: 4 }),
  
  // Academic indexing
  citations: jsonb('citations').default([]),
  formulasLatex: jsonb('formulas_latex').default([]),
  concepts: jsonb('concepts').default([]),
  
  lastIndexed: timestamp('last_indexed').defaultNow(),
  indexVersion: varchar('index_version', { length: 20 }).default('1.0')
}, (table) => ({
  lastIndexedIdx: index('note_search_index_last_indexed_idx').on(table.lastIndexed)
}));

// Define relationships
export const noteTemplatesRelations = relations(noteTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [noteTemplates.createdById],
    references: [users.id]
  }),
  parentTemplate: one(noteTemplates, {
    fields: [noteTemplates.parentTemplateId],
    references: [noteTemplates.id]
  }),
  childTemplates: many(noteTemplates, {
    relationName: 'parentTemplate'
  }),
  notes: many(enhancedNotes)
}));

export const enhancedNotesRelations = relations(enhancedNotes, ({ one, many }) => ({
  owner: one(users, {
    fields: [enhancedNotes.ownerId],
    references: [users.id]
  }),
  lastEditedByUser: one(users, {
    fields: [enhancedNotes.lastEditedBy],
    references: [users.id]
  }),
  template: one(noteTemplates, {
    fields: [enhancedNotes.templateId],
    references: [noteTemplates.id]
  }),
  folder: one(enhancedFolders, {
    fields: [enhancedNotes.folderId],
    references: [enhancedFolders.id]
  }),
  parentNote: one(enhancedNotes, {
    fields: [enhancedNotes.parentNoteId],
    references: [enhancedNotes.id]
  }),
  childNotes: many(enhancedNotes, {
    relationName: 'parentNote'
  }),
  collaborationSessions: many(collaborationSessions),
  comments: many(noteComments),
  shares: many(noteSharing),
  handwritingAnalysis: many(handwritingAnalysis),
  searchIndex: one(noteSearchIndex)
}));

export const collaborationSessionsRelations = relations(collaborationSessions, ({ one, many }) => ({
  note: one(enhancedNotes, {
    fields: [collaborationSessions.noteId],
    references: [enhancedNotes.id]
  }),
  host: one(users, {
    fields: [collaborationSessions.hostId],
    references: [users.id]
  }),
  participants: many(collaborationParticipants)
}));

export const collaborationParticipantsRelations = relations(collaborationParticipants, ({ one }) => ({
  session: one(collaborationSessions, {
    fields: [collaborationParticipants.sessionId],
    references: [collaborationSessions.id]
  }),
  user: one(users, {
    fields: [collaborationParticipants.userId],
    references: [users.id]
  })
}));

export const noteCommentsRelations = relations(noteComments, ({ one, many }) => ({
  note: one(enhancedNotes, {
    fields: [noteComments.noteId],
    references: [enhancedNotes.id]
  }),
  author: one(users, {
    fields: [noteComments.authorId],
    references: [users.id]
  }),
  resolvedByUser: one(users, {
    fields: [noteComments.resolvedBy],
    references: [users.id]
  }),
  parentComment: one(noteComments, {
    fields: [noteComments.parentCommentId],
    references: [noteComments.id]
  }),
  replies: many(noteComments, {
    relationName: 'parentComment'
  })
}));

export const noteSharingRelations = relations(noteSharing, ({ one }) => ({
  note: one(enhancedNotes, {
    fields: [noteSharing.noteId],
    references: [enhancedNotes.id]
  }),
  sharedWith: one(users, {
    fields: [noteSharing.sharedWithUserId],
    references: [users.id]
  }),
  sharedBy: one(users, {
    fields: [noteSharing.sharedByUserId],
    references: [users.id]
  })
}));

export const handwritingAnalysisRelations = relations(handwritingAnalysis, ({ one }) => ({
  note: one(enhancedNotes, {
    fields: [handwritingAnalysis.noteId],
    references: [enhancedNotes.id]
  })
}));

export const enhancedFoldersRelations = relations(enhancedFolders, ({ one, many }) => ({
  owner: one(users, {
    fields: [enhancedFolders.ownerId],
    references: [users.id]
  }),
  parentFolder: one(enhancedFolders, {
    fields: [enhancedFolders.parentFolderId],
    references: [enhancedFolders.id]
  }),
  childFolders: many(enhancedFolders, {
    relationName: 'parentFolder'
  }),
  notes: many(enhancedNotes)
}));

export const noteSearchIndexRelations = relations(noteSearchIndex, ({ one }) => ({
  note: one(enhancedNotes, {
    fields: [noteSearchIndex.noteId],
    references: [enhancedNotes.id]
  })
}));