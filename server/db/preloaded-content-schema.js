import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Preloaded Content Categories and Subjects
export const contentCategories = pgTable('content_categories', {
  id: serial('id').primaryKey(),
  categoryId: uuid('category_id').defaultRandom().notNull().unique(),
  
  // Category details
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }).default('#6366f1'),
  
  // Hierarchy
  parentCategoryId: integer('parent_category_id').references(() => contentCategories.id),
  level: integer('level').default(0), // 0=root, 1=subject, 2=topic, 3=subtopic
  path: text('path'), // Full hierarchical path
  
  // Academic classification
  educationLevel: varchar('education_level', { length: 50 }), // elementary, middle, high, college, graduate
  subject: varchar('subject', { length: 100 }),
  curriculum: varchar('curriculum', { length: 50 }), // common_core, ib, ap, etc.
  
  // Metadata
  contentCount: integer('content_count').default(0),
  difficulty: varchar('difficulty', { length: 20 }), // beginner, intermediate, advanced
  language: varchar('language', { length: 10 }).default('en'),
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  // Ordering and display
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('content_categories_name_idx').on(table.name),
  subjectIdx: index('content_categories_subject_idx').on(table.subject),
  levelIdx: index('content_categories_level_idx').on(table.level),
  pathIdx: index('content_categories_path_idx').on(table.path),
  activeIdx: index('content_categories_active_idx').on(table.isActive)
}));

// Preloaded Flashcard Collections
export const preloadedFlashcardCollections = pgTable('preloaded_flashcard_collections', {
  id: serial('id').primaryKey(),
  collectionId: uuid('collection_id').defaultRandom().notNull().unique(),
  
  // Collection metadata
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 300 }),
  
  // Academic classification
  categoryId: integer('category_id').references(() => contentCategories.id),
  subject: varchar('subject', { length: 100 }).notNull(),
  topic: varchar('topic', { length: 100 }),
  subtopic: varchar('subtopic', { length: 100 }),
  gradeLevel: varchar('grade_level', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  
  // Content details
  cardCount: integer('card_count').default(0),
  estimatedStudyTime: integer('estimated_study_time'), // Minutes
  language: varchar('language', { length: 10 }).default('en'),
  
  // Collection configuration
  collectionType: varchar('collection_type', { length: 50 }).default('standard'), // standard, premium, curriculum_aligned
  cardFormat: varchar('card_format', { length: 50 }).default('front_back'), // front_back, cloze, multiple_choice
  hasImages: boolean('has_images').default(false),
  hasAudio: boolean('has_audio').default(false),
  hasVideo: boolean('has_video').default(false),
  
  // Quality and curation
  curatedBy: integer('curated_by').references(() => users.id),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }).default('0'),
  isVerified: boolean('is_verified').default(false),
  reviewStatus: varchar('review_status', { length: 20 }).default('pending'),
  
  // Usage and popularity
  downloadCount: integer('download_count').default(0),
  usageCount: integer('usage_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  ratingCount: integer('rating_count').default(0),
  
  // Tags and search
  tags: jsonb('tags').default([]),
  keywords: jsonb('keywords').default([]),
  searchVector: text('search_vector'),
  
  // Licensing and attribution
  license: varchar('license', { length: 50 }).default('cc_by'), // cc_by, cc_by_sa, proprietary, public_domain
  sourceAttribution: text('source_attribution'),
  copyrightInfo: text('copyright_info'),
  
  // Premium features
  isPremium: boolean('is_premium').default(false),
  price: decimal('price', { precision: 8, scale: 2 }),
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at')
}, (table) => ({
  categoryIdx: index('preloaded_flashcard_collections_category_idx').on(table.categoryId),
  subjectIdx: index('preloaded_flashcard_collections_subject_idx').on(table.subject),
  difficultyIdx: index('preloaded_flashcard_collections_difficulty_idx').on(table.difficulty),
  qualityIdx: index('preloaded_flashcard_collections_quality_idx').on(table.qualityScore),
  ratingIdx: index('preloaded_flashcard_collections_rating_idx').on(table.rating),
  featuredIdx: index('preloaded_flashcard_collections_featured_idx').on(table.isFeatured),
  activeIdx: index('preloaded_flashcard_collections_active_idx').on(table.isActive)
}));

// Preloaded Flashcards
export const preloadedFlashcards = pgTable('preloaded_flashcards', {
  id: serial('id').primaryKey(),
  cardId: uuid('card_id').defaultRandom().notNull().unique(),
  
  collectionId: integer('collection_id').references(() => preloadedFlashcardCollections.id).notNull(),
  
  // Card content
  front: text('front').notNull(),
  back: text('back').notNull(),
  hint: text('hint'),
  explanation: text('explanation'),
  context: text('context'), // Additional context or background
  
  // Rich content and media
  frontMedia: jsonb('front_media').default([]), // Images, audio, video
  backMedia: jsonb('back_media').default([]),
  frontFormatting: jsonb('front_formatting').default({}),
  backFormatting: jsonb('back_formatting').default({}),
  
  // Card metadata
  cardType: varchar('card_type', { length: 50 }).default('basic'), // basic, cloze, image_occlusion, audio, reverse
  order: integer('order').notNull(),
  
  // Difficulty and classification
  difficultyLevel: decimal('difficulty_level', { precision: 5, scale: 2 }),
  complexity: varchar('complexity', { length: 20 }), // simple, medium, complex
  cognitiveLevel: varchar('cognitive_level', { length: 50 }), // remember, understand, apply, analyze, evaluate, create
  
  // Learning objectives
  learningObjectives: jsonb('learning_objectives').default([]),
  skillsTargeted: jsonb('skills_targeted').default([]),
  concepts: jsonb('concepts').default([]),
  
  // Language learning specific
  partOfSpeech: varchar('part_of_speech', { length: 20 }), // noun, verb, adjective, etc.
  pronunciation: text('pronunciation'), // IPA or phonetic
  etymology: text('etymology'),
  exampleSentences: jsonb('example_sentences').default([]),
  
  // Math/Science specific
  formula: text('formula'), // LaTeX formula
  equation: text('equation'),
  units: varchar('units', { length: 50 }),
  variables: jsonb('variables').default([]),
  
  // Tags and categorization
  tags: jsonb('tags').default([]),
  keywords: jsonb('keywords').default([]),
  relatedConcepts: jsonb('related_concepts').default([]),
  
  // Quality metrics
  accuracyVerified: boolean('accuracy_verified').default(false),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  
  // Usage statistics (for popular/effective cards)
  usageCount: integer('usage_count').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }),
  averageResponseTime: decimal('average_response_time', { precision: 8, scale: 2 }),
  
  // Source information
  source: varchar('source', { length: 200 }),
  sourceUrl: text('source_url'),
  author: varchar('author', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  collectionIdx: index('preloaded_flashcards_collection_idx').on(table.collectionId),
  orderIdx: index('preloaded_flashcards_order_idx').on(table.order),
  difficultyIdx: index('preloaded_flashcards_difficulty_idx').on(table.difficultyLevel),
  typeIdx: index('preloaded_flashcards_type_idx').on(table.cardType),
  qualityIdx: index('preloaded_flashcards_quality_idx').on(table.qualityScore)
}));

// User's Imported/Cloned Content
export const userContentLibrary = pgTable('user_content_library', {
  id: serial('id').primaryKey(),
  libraryId: uuid('library_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Content reference
  contentType: varchar('content_type', { length: 50 }).notNull(), // flashcard_collection, note_template, quiz_template
  sourceType: varchar('source_type', { length: 50 }).notNull(), // preloaded, imported, user_created, ai_generated
  sourceId: varchar('source_id', { length: 100 }), // Reference to original content
  
  // User's copy metadata
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  customizations: jsonb('customizations').default({}), // User modifications
  
  // Organization
  folderId: integer('folder_id'), // User's organization folder
  tags: jsonb('tags').default([]),
  notes: text('notes'), // User's personal notes about this content
  
  // Usage tracking
  lastAccessed: timestamp('last_accessed'),
  usageCount: integer('usage_count').default(0),
  isFavorite: boolean('is_favorite').default(false),
  
  // Status
  isActive: boolean('is_active').default(true),
  isModified: boolean('is_modified').default(false), // Whether user has modified from original
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('user_content_library_user_idx').on(table.userId),
  typeIdx: index('user_content_library_type_idx').on(table.contentType),
  sourceIdx: index('user_content_library_source_idx').on(table.sourceType),
  folderIdx: index('user_content_library_folder_idx').on(table.folderId),
  favoriteIdx: index('user_content_library_favorite_idx').on(table.isFavorite)
}));

// Content Import/Export History
export const contentTransferHistory = pgTable('content_transfer_history', {
  id: serial('id').primaryKey(),
  transferId: uuid('transfer_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Transfer details
  transferType: varchar('transfer_type', { length: 20 }).notNull(), // import, export
  contentType: varchar('content_type', { length: 50 }).notNull(), // flashcards, notes, quizzes, study_plans
  format: varchar('format', { length: 20 }).notNull(), // anki, quizlet, csv, json, pdf, docx
  
  // File information
  fileName: varchar('file_name', { length: 255 }),
  fileSize: bigint('file_size', { mode: 'number' }), // bytes
  filePath: text('file_path'),
  
  // Content details
  itemCount: integer('item_count').default(0), // Number of items processed
  successCount: integer('success_count').default(0),
  errorCount: integer('error_count').default(0),
  
  // Processing results
  status: varchar('status', { length: 20 }).default('pending'), // pending, processing, completed, failed, partial
  processingTime: integer('processing_time'), // milliseconds
  errors: jsonb('errors').default([]),
  warnings: jsonb('warnings').default([]),
  
  // Metadata
  sourceApplication: varchar('source_application', { length: 100 }), // anki, quizlet, notion, etc.
  metadata: jsonb('metadata').default({}), // Additional processing info
  
  // Results
  createdContentIds: jsonb('created_content_ids').default([]), // IDs of created content
  
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  userIdx: index('content_transfer_history_user_idx').on(table.userId),
  typeIdx: index('content_transfer_history_type_idx').on(table.transferType),
  statusIdx: index('content_transfer_history_status_idx').on(table.status),
  createdIdx: index('content_transfer_history_created_idx').on(table.createdAt)
}));

// Note to Flashcard Conversion Jobs
export const noteToFlashcardJobs = pgTable('note_to_flashcard_jobs', {
  id: serial('id').primaryKey(),
  jobId: uuid('job_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  noteId: varchar('note_id', { length: 100 }).notNull(), // Reference to note
  
  // Conversion settings
  conversionType: varchar('conversion_type', { length: 50 }).default('ai_generated'), // ai_generated, manual_selection, keyword_based
  targetDeckId: varchar('target_deck_id', { length: 100 }), // Destination flashcard deck
  
  // AI configuration
  aiModel: varchar('ai_model', { length: 50 }).default('gpt-4'),
  cardCount: integer('card_count').default(10), // Desired number of cards
  cardTypes: jsonb('card_types').default(['basic']), // Types of cards to generate
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('medium'),
  
  // Content processing
  sourceContent: text('source_content'), // Note content to process
  contentSections: jsonb('content_sections').default([]), // Identified sections
  keyTerms: jsonb('key_terms').default([]), // Extracted key terms
  concepts: jsonb('concepts').default([]), // Identified concepts
  
  // Generation results
  status: varchar('status', { length: 20 }).default('pending'), // pending, processing, completed, failed
  generatedCards: jsonb('generated_cards').default([]),
  acceptedCards: jsonb('accepted_cards').default([]),
  rejectedCards: jsonb('rejected_cards').default([]),
  
  // Quality metrics
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  userSatisfaction: integer('user_satisfaction'), // 1-5 rating
  
  // Processing info
  processingTime: integer('processing_time'), // milliseconds
  tokensUsed: integer('tokens_used'),
  errors: jsonb('errors').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('note_to_flashcard_jobs_user_idx').on(table.userId),
  noteIdx: index('note_to_flashcard_jobs_note_idx').on(table.noteId),
  statusIdx: index('note_to_flashcard_jobs_status_idx').on(table.status),
  createdIdx: index('note_to_flashcard_jobs_created_idx').on(table.createdAt)
}));

// Content Recommendation Engine
export const contentRecommendations = pgTable('content_recommendations', {
  id: serial('id').primaryKey(),
  recommendationId: uuid('recommendation_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Recommendation details
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // similar_content, complementary, next_level, review
  contentType: varchar('content_type', { length: 50 }).notNull(), // flashcard_collection, note_template, quiz
  contentId: varchar('content_id', { length: 100 }).notNull(),
  
  // Recommendation metadata
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  reason: text('reason'), // Why this is recommended
  
  // Scoring
  relevanceScore: decimal('relevance_score', { precision: 5, scale: 2 }).notNull(),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  difficultyMatch: decimal('difficulty_match', { precision: 5, scale: 2 }),
  
  // Context
  basedOnContent: jsonb('based_on_content').default([]), // What triggered this recommendation
  userActivity: jsonb('user_activity').default([]), // User's recent activity
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, viewed, accepted, dismissed
  
  // User interaction
  viewedAt: timestamp('viewed_at'),
  interactedAt: timestamp('interacted_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at')
}, (table) => ({
  userIdx: index('content_recommendations_user_idx').on(table.userId),
  typeIdx: index('content_recommendations_type_idx').on(table.recommendationType),
  scoreIdx: index('content_recommendations_score_idx').on(table.relevanceScore),
  statusIdx: index('content_recommendations_status_idx').on(table.status),
  expiresIdx: index('content_recommendations_expires_idx').on(table.expiresAt)
}));

// Define relationships
export const contentCategoriesRelations = relations(contentCategories, ({ one, many }) => ({
  parentCategory: one(contentCategories, {
    fields: [contentCategories.parentCategoryId],
    references: [contentCategories.id]
  }),
  childCategories: many(contentCategories, {
    relationName: 'parentCategory'
  }),
  flashcardCollections: many(preloadedFlashcardCollections)
}));

export const preloadedFlashcardCollectionsRelations = relations(preloadedFlashcardCollections, ({ one, many }) => ({
  category: one(contentCategories, {
    fields: [preloadedFlashcardCollections.categoryId],
    references: [contentCategories.id]
  }),
  curatedBy: one(users, {
    fields: [preloadedFlashcardCollections.curatedBy],
    references: [users.id]
  }),
  flashcards: many(preloadedFlashcards)
}));

export const preloadedFlashcardsRelations = relations(preloadedFlashcards, ({ one }) => ({
  collection: one(preloadedFlashcardCollections, {
    fields: [preloadedFlashcards.collectionId],
    references: [preloadedFlashcardCollections.id]
  })
}));

export const userContentLibraryRelations = relations(userContentLibrary, ({ one }) => ({
  user: one(users, {
    fields: [userContentLibrary.userId],
    references: [users.id]
  })
}));

export const contentTransferHistoryRelations = relations(contentTransferHistory, ({ one }) => ({
  user: one(users, {
    fields: [contentTransferHistory.userId],
    references: [users.id]
  })
}));

export const noteToFlashcardJobsRelations = relations(noteToFlashcardJobs, ({ one }) => ({
  user: one(users, {
    fields: [noteToFlashcardJobs.userId],
    references: [users.id]
  })
}));

export const contentRecommendationsRelations = relations(contentRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [contentRecommendations.userId],
    references: [users.id]
  })
}));