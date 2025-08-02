import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Advanced Flashcard Decks with ML and AI
export const flashcardDecks = pgTable('flashcard_decks', {
  id: serial('id').primaryKey(),
  deckId: uuid('deck_id').defaultRandom().notNull().unique(),
  
  // Basic deck info
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  
  // Ownership and sharing
  createdBy: integer('created_by').references(() => users.id).notNull(),
  isPublic: boolean('is_public').default(false),
  isOfficial: boolean('is_official').default(false),
  collaborators: jsonb('collaborators').default([]),
  
  // Academic classification
  subject: varchar('subject', { length: 100 }),
  topic: varchar('topic', { length: 100 }),
  subtopic: varchar('subtopic', { length: 100 }),
  gradeLevel: varchar('grade_level', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  
  // Deck configuration
  deckType: varchar('deck_type', { length: 50 }).default('standard'), // standard, cloze, image_occlusion, audio, video
  cardFormat: varchar('card_format', { length: 50 }).default('front_back'), // front_back, cloze_deletion, multiple_choice
  languagePair: varchar('language_pair', { length: 20 }), // For language learning (e.g., 'en-es')
  
  // Spaced repetition settings
  spacedRepetitionAlgorithm: varchar('spaced_repetition_algorithm', { length: 50 }).default('anki'), // anki, sm2, fsrs, custom
  initialInterval: integer('initial_interval').default(1), // Days
  graduatingInterval: integer('graduating_interval').default(4), // Days
  easyInterval: integer('easy_interval').default(4), // Days
  lapseInterval: decimal('lapse_interval', { precision: 5, scale: 2 }).default('0.5'), // Multiplier
  
  // AI and ML features
  aiGenerated: boolean('ai_generated').default(false),
  autoGenerateCards: boolean('auto_generate_cards').default(false),
  aiModel: varchar('ai_model', { length: 50 }),
  personalizedDifficulty: boolean('personalized_difficulty').default(true),
  adaptiveScheduling: boolean('adaptive_scheduling').default(true),
  
  // Study settings
  newCardsPerDay: integer('new_cards_per_day').default(20),
  maxReviewsPerDay: integer('max_reviews_per_day').default(200),
  buryRelatedCards: boolean('bury_related_cards').default(false),
  randomizeOrder: boolean('randomize_order').default(true),
  
  // Multimedia settings
  allowAudio: boolean('allow_audio').default(true),
  allowImages: boolean('allow_images').default(true),
  allowVideo: boolean('allow_video').default(false),
  textToSpeech: boolean('text_to_speech').default(false),
  ttsLanguage: varchar('tts_language', { length: 10 }).default('en'),
  
  // Gamification
  pointsPerCard: integer('points_per_card').default(1),
  streakBonus: boolean('streak_bonus').default(true),
  achievementsEnabled: boolean('achievements_enabled').default(true),
  leaderboardEligible: boolean('leaderboard_eligible').default(false),
  
  // Analytics and performance
  totalCards: integer('total_cards').default(0),
  matureCards: integer('mature_cards').default(0),
  totalStudySessions: integer('total_study_sessions').default(0),
  averageRetention: decimal('average_retention', { precision: 5, scale: 2 }),
  averageEase: decimal('average_ease', { precision: 5, scale: 2 }),
  
  // Quality metrics
  rating: decimal('rating', { precision: 3, scale: 2 }),
  usageCount: integer('usage_count').default(0),
  downloadCount: integer('download_count').default(0),
  
  // Status and metadata
  status: varchar('status', { length: 20 }).default('active'), // active, archived, suspended
  tags: jsonb('tags').default([]),
  categories: jsonb('categories').default([]),
  version: varchar('version', { length: 20 }).default('1.0'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastStudied: timestamp('last_studied')
}, (table) => ({
  createdByIdx: index('flashcard_decks_created_by_idx').on(table.createdBy),
  subjectIdx: index('flashcard_decks_subject_idx').on(table.subject),
  topicIdx: index('flashcard_decks_topic_idx').on(table.topic),
  difficultyIdx: index('flashcard_decks_difficulty_idx').on(table.difficulty),
  publicIdx: index('flashcard_decks_public_idx').on(table.isPublic),
  statusIdx: index('flashcard_decks_status_idx').on(table.status),
  lastStudiedIdx: index('flashcard_decks_last_studied_idx').on(table.lastStudied)
}));

// Enhanced Flashcards with Rich Media
export const flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  cardId: uuid('card_id').defaultRandom().notNull().unique(),
  
  deckId: integer('deck_id').references(() => flashcardDecks.id).notNull(),
  
  // Card content
  front: text('front').notNull(),
  back: text('back').notNull(),
  hint: text('hint'),
  explanation: text('explanation'),
  
  // Rich content and media
  frontMedia: jsonb('front_media').default([]), // Images, audio, video
  backMedia: jsonb('back_media').default([]),
  frontFormatting: jsonb('front_formatting').default({}), // Rich text formatting
  backFormatting: jsonb('back_formatting').default({}),
  
  // Card metadata
  cardType: varchar('card_type', { length: 50 }).default('basic'), // basic, cloze, image_occlusion, audio, reverse
  order: integer('order'),
  tags: jsonb('tags').default([]),
  
  // Difficulty and classification
  difficultyLevel: decimal('difficulty_level', { precision: 5, scale: 2 }),
  complexity: varchar('complexity', { length: 20 }), // simple, medium, complex
  cognitiveLoad: varchar('cognitive_load', { length: 20 }), // low, medium, high
  
  // Learning objectives
  learningObjectives: jsonb('learning_objectives').default([]),
  skillsTargeted: jsonb('skills_targeted').default([]),
  knowledgeArea: varchar('knowledge_area', { length: 100 }),
  
  // Spaced repetition data
  easeFactor: decimal('ease_factor', { precision: 5, scale: 2 }).default('2.5'),
  interval: integer('interval').default(0), // Days until next review
  dueDate: timestamp('due_date'),
  lastReviewed: timestamp('last_reviewed'),
  
  // Performance tracking
  totalReviews: integer('total_reviews').default(0),
  correctReviews: integer('correct_reviews').default(0),
  streakCount: integer('streak_count').default(0),
  lapseCount: integer('lapse_count').default(0),
  
  // Time tracking
  totalStudyTime: integer('total_study_time').default(0), // Seconds
  averageResponseTime: decimal('average_response_time', { precision: 8, scale: 2 }),
  fastestResponse: decimal('fastest_response', { precision: 8, scale: 2 }),
  slowestResponse: decimal('slowest_response', { precision: 8, scale: 2 }),
  
  // AI and ML features
  aiGenerated: boolean('ai_generated').default(false),
  aiModel: varchar('ai_model', { length: 50 }),
  generationPrompt: text('generation_prompt'),
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  
  // Quality metrics
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  reportCount: integer('report_count').default(0),
  flagged: boolean('flagged').default(false),
  reviewStatus: varchar('review_status', { length: 20 }).default('approved'),
  
  // Cloze deletion specific
  clozeText: text('cloze_text'),
  clozeDeletions: jsonb('cloze_deletions').default([]),
  
  // Image occlusion specific
  occlusionImage: text('occlusion_image'),
  occlusionMasks: jsonb('occlusion_masks').default([]),
  
  // Language learning specific
  pronunciation: text('pronunciation'), // IPA or phonetic
  audioUrl: text('audio_url'),
  etymology: text('etymology'),
  exampleSentences: jsonb('example_sentences').default([]),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, suspended, retired
  isTemplate: boolean('is_template').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  deckIdx: index('flashcards_deck_idx').on(table.deckId),
  orderIdx: index('flashcards_order_idx').on(table.order),
  dueDateIdx: index('flashcards_due_date_idx').on(table.dueDate),
  difficultyIdx: index('flashcards_difficulty_idx').on(table.difficultyLevel),
  typeIdx: index('flashcards_type_idx').on(table.cardType),
  statusIdx: index('flashcards_status_idx').on(table.status),
  lastReviewedIdx: index('flashcards_last_reviewed_idx').on(table.lastReviewed)
}));

// Detailed Study Sessions and Reviews
export const flashcardStudySessions = pgTable('flashcard_study_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  deckId: integer('deck_id').references(() => flashcardDecks.id).notNull(),
  
  // Session metadata
  sessionType: varchar('session_type', { length: 50 }).default('review'), // review, learn, cram, test
  studyMode: varchar('study_mode', { length: 50 }).default('spaced_repetition'), // spaced_repetition, mass_practice, mixed
  
  // Timing
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  plannedDuration: integer('planned_duration'), // Minutes
  actualDuration: integer('actual_duration'), // Minutes
  
  // Session statistics
  cardsStudied: integer('cards_studied').default(0),
  cardsCorrect: integer('cards_correct').default(0),
  cardsWrong: integer('cards_wrong').default(0),
  cardsSkipped: integer('cards_skipped').default(0),
  
  // Performance metrics
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }),
  averageResponseTime: decimal('average_response_time', { precision: 8, scale: 2 }),
  focusScore: decimal('focus_score', { precision: 5, scale: 2 }),
  efficiencyScore: decimal('efficiency_score', { precision: 5, scale: 2 }),
  
  // Learning outcomes
  newCardsLearned: integer('new_cards_learned').default(0),
  cardsMastered: integer('cards_mastered').default(0),
  cardsReactivated: integer('cards_reactivated').default(0),
  knowledgeGains: jsonb('knowledge_gains').default([]),
  
  // Session configuration
  maxNewCards: integer('max_new_cards').default(20),
  maxReviews: integer('max_reviews').default(100),
  timeLimit: integer('time_limit'), // Minutes
  breakintervals: jsonb('break_intervals').default([]),
  
  // Behavioral data
  interactionEvents: jsonb('interaction_events').default([]),
  pauseCount: integer('pause_count').default(0),
  pauseDuration: integer('pause_duration').default(0), // Seconds
  
  // Device and environment
  deviceType: varchar('device_type', { length: 50 }),
  platform: varchar('platform', { length: 50 }),
  connectionQuality: varchar('connection_quality', { length: 20 }),
  
  // Satisfaction and feedback
  satisfactionRating: integer('satisfaction_rating'), // 1-5
  difficultyRating: integer('difficulty_rating'), // 1-5
  sessionFeedback: text('session_feedback'),
  
  // Achievements and rewards
  pointsEarned: integer('points_earned').default(0),
  streakUpdated: boolean('streak_updated').default(false),
  achievementsUnlocked: jsonb('achievements_unlocked').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('flashcard_study_sessions_user_idx').on(table.userId),
  deckIdx: index('flashcard_study_sessions_deck_idx').on(table.deckId),
  typeIdx: index('flashcard_study_sessions_type_idx').on(table.sessionType),
  startedIdx: index('flashcard_study_sessions_started_idx').on(table.startedAt)
}));

// Individual Card Reviews with Detailed Tracking
export const cardReviews = pgTable('card_reviews', {
  id: serial('id').primaryKey(),
  reviewId: uuid('review_id').defaultRandom().notNull().unique(),
  
  sessionId: integer('session_id').references(() => flashcardStudySessions.id).notNull(),
  cardId: integer('card_id').references(() => flashcards.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Review metadata
  reviewType: varchar('review_type', { length: 50 }).default('normal'), // normal, learning, relearning, filtered
  previousInterval: integer('previous_interval'), // Days
  previousEase: decimal('previous_ease', { precision: 5, scale: 2 }),
  
  // User response
  userResponse: varchar('user_response', { length: 20 }).notNull(), // again, hard, good, easy, manual
  responseTime: decimal('response_time', { precision: 8, scale: 2 }).notNull(), // Seconds
  isCorrect: boolean('is_correct'),
  confidence: integer('confidence'), // 1-5 self-reported confidence
  
  // Spaced repetition calculation
  newInterval: integer('new_interval'), // Days
  newEase: decimal('new_ease', { precision: 5, scale: 2 }),
  newDueDate: timestamp('new_due_date'),
  
  // Learning phase
  learningPhase: varchar('learning_phase', { length: 20 }), // new, learning, review, relearning
  stepIndex: integer('step_index'), // For learning steps
  graduated: boolean('graduated').default(false),
  
  // Performance indicators
  streakBroken: boolean('streak_broken').default(false),
  streakExtended: boolean('streak_extended').default(false),
  masteryAchieved: boolean('mastery_achieved').default(false),
  needsReview: boolean('needs_review').default(false),
  
  // Contextual data
  timeOfDay: varchar('time_of_day', { length: 20 }),
  dayOfWeek: varchar('day_of_week', { length: 20 }),
  studyEnvironment: varchar('study_environment', { length: 50 }),
  
  // Hint and help usage
  hintRequested: boolean('hint_requested').default(false),
  hintUsed: boolean('hint_used').default(false),
  explanationViewed: boolean('explanation_viewed').default(false),
  
  // Quality feedback
  cardQualityRating: integer('card_quality_rating'), // 1-5
  reportIssue: boolean('report_issue').default(false),
  issueType: varchar('issue_type', { length: 50 }),
  
  reviewedAt: timestamp('reviewed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  sessionIdx: index('card_reviews_session_idx').on(table.sessionId),
  cardIdx: index('card_reviews_card_idx').on(table.cardId),
  userIdx: index('card_reviews_user_idx').on(table.userId),
  responseIdx: index('card_reviews_response_idx').on(table.userResponse),
  reviewedIdx: index('card_reviews_reviewed_idx').on(table.reviewedAt),
  phaseIdx: index('card_reviews_phase_idx').on(table.learningPhase)
}));

// AI Flashcard Generation System
export const aiFlashcardGeneration = pgTable('ai_flashcard_generation', {
  id: serial('id').primaryKey(),
  generationId: uuid('generation_id').defaultRandom().notNull().unique(),
  
  // Generation request
  requestedBy: integer('requested_by').references(() => users.id).notNull(),
  deckId: integer('deck_id').references(() => flashcardDecks.id),
  
  // Source material
  sourceType: varchar('source_type', { length: 50 }).notNull(), // text, pdf, url, image, audio, notes
  sourceContent: text('source_content'),
  sourceFiles: jsonb('source_files').default([]),
  sourceUrl: text('source_url'),
  
  // Generation parameters
  cardCount: integer('card_count').notNull(),
  cardTypes: jsonb('card_types').default(['basic']),
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('medium'),
  subject: varchar('subject', { length: 100 }),
  topic: varchar('topic', { length: 100 }),
  
  // AI model configuration
  aiModel: varchar('ai_model', { length: 50 }).notNull(),
  modelVersion: varchar('model_version', { length: 50 }),
  generationPrompt: text('generation_prompt'),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
  
  // Content preferences
  includeImages: boolean('include_images').default(false),
  includeAudio: boolean('include_audio').default(false),
  includeDefinitions: boolean('include_definitions').default(true),
  includeExamples: boolean('include_examples').default(true),
  languageStyle: varchar('language_style', { length: 50 }).default('academic'),
  
  // Generation results
  status: varchar('status', { length: 20 }).default('pending'), // pending, processing, completed, failed
  generatedCards: jsonb('generated_cards').default([]),
  qualityScores: jsonb('quality_scores').default([]),
  
  // Performance metrics
  processingTime: integer('processing_time'), // Seconds
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 8, scale: 4 }),
  
  // Quality assurance
  humanReviewed: boolean('human_reviewed').default(false),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'),
  rejectionReason: text('rejection_reason'),
  
  // User feedback
  userRating: integer('user_rating'), // 1-5
  userFeedback: text('user_feedback'),
  cardsAccepted: integer('cards_accepted').default(0),
  cardsRejected: integer('cards_rejected').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  requestedByIdx: index('ai_flashcard_generation_requested_by_idx').on(table.requestedBy),
  deckIdx: index('ai_flashcard_generation_deck_idx').on(table.deckId),
  statusIdx: index('ai_flashcard_generation_status_idx').on(table.status),
  subjectIdx: index('ai_flashcard_generation_subject_idx').on(table.subject),
  completedIdx: index('ai_flashcard_generation_completed_idx').on(table.completedAt)
}));

// Spaced Repetition Analytics and Optimization
export const spacedRepetitionAnalytics = pgTable('spaced_repetition_analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Overall performance metrics
  totalCardsStudied: integer('total_cards_studied').default(0),
  totalReviews: integer('total_reviews').default(0),
  totalStudyTime: bigint('total_study_time', { mode: 'number' }).default(0), // Seconds
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  
  // Retention and memory metrics
  overallRetention: decimal('overall_retention', { precision: 5, scale: 2 }),
  shortTermRetention: decimal('short_term_retention', { precision: 5, scale: 2 }), // <7 days
  mediumTermRetention: decimal('medium_term_retention', { precision: 5, scale: 2 }), // 7-30 days
  longTermRetention: decimal('long_term_retention', { precision: 5, scale: 2 }), // >30 days
  
  // Learning efficiency
  averageResponseTime: decimal('average_response_time', { precision: 8, scale: 2 }),
  learningVelocity: decimal('learning_velocity', { precision: 8, scale: 2 }), // Cards mastered per hour
  memoryStrength: decimal('memory_strength', { precision: 8, scale: 4 }),
  forgettingCurve: jsonb('forgetting_curve').default({}),
  
  // Optimal scheduling
  optimalStudyTime: integer('optimal_study_time'), // Minutes per day
  bestStudyHours: jsonb('best_study_hours').default([]),
  optimalSessionLength: integer('optimal_session_length'), // Minutes
  recommendedBreakInterval: integer('recommended_break_interval'), // Minutes
  
  // Difficulty patterns
  strengthSubjects: jsonb('strength_subjects').default([]),
  weaknessSubjects: jsonb('weakness_subjects').default([]),
  difficultyPreferences: jsonb('difficulty_preferences').default({}),
  
  // Algorithm optimization
  preferredAlgorithm: varchar('preferred_algorithm', { length: 50 }),
  algorithmParameters: jsonb('algorithm_parameters').default({}),
  customEaseFactors: jsonb('custom_ease_factors').default({}),
  intervalMultipliers: jsonb('interval_multipliers').default({}),
  
  // Behavioral insights
  studyConsistency: decimal('study_consistency', { precision: 5, scale: 2 }),
  procrastinationTendency: decimal('procrastination_tendency', { precision: 5, scale: 2 }),
  overconfidenceBias: decimal('overconfidence_bias', { precision: 5, scale: 2 }),
  speedAccuracyTradeoff: decimal('speed_accuracy_tradeoff', { precision: 5, scale: 2 }),
  
  // Predictive analytics
  burnoutRisk: decimal('burnout_risk', { precision: 5, scale: 2 }),
  motionLoss: decimal('motivation_loss', { precision: 5, scale: 2 }),
  retentionTrend: varchar('retention_trend', { length: 20 }), // improving, stable, declining
  projectedMastery: jsonb('projected_mastery').default({}),
  
  lastCalculated: timestamp('last_calculated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('spaced_repetition_analytics_user_idx').on(table.userId),
  calculatedIdx: index('spaced_repetition_analytics_calculated_idx').on(table.lastCalculated)
}));

// Collaborative Flashcard Features
export const flashcardCollaborations = pgTable('flashcard_collaborations', {
  id: serial('id').primaryKey(),
  collaborationId: uuid('collaboration_id').defaultRandom().notNull().unique(),
  
  deckId: integer('deck_id').references(() => flashcardDecks.id).notNull(),
  
  // Collaboration details
  collaborationType: varchar('collaboration_type', { length: 50 }).notNull(), // study_group, class, competition, community
  name: varchar('name', { length: 200 }),
  description: text('description'),
  
  // Participation settings
  maxParticipants: integer('max_participants').default(50),
  currentParticipants: integer('current_participants').default(0),
  inviteOnly: boolean('invite_only').default(false),
  requireApproval: boolean('require_approval').default(false),
  
  // Study group features
  groupStudySessions: boolean('group_study_sessions').default(false),
  sharedProgress: boolean('shared_progress').default(true),
  peerReviews: boolean('peer_reviews').default(false),
  discussionEnabled: boolean('discussion_enabled').default(true),
  
  // Competition features
  isCompetitive: boolean('is_competitive').default(false),
  competitionType: varchar('competition_type', { length: 50 }), // speed, accuracy, retention, comprehensive
  prizeStructure: jsonb('prize_structure').default({}),
  leaderboardVisible: boolean('leaderboard_visible').default(true),
  
  // Scheduling
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  timeZone: varchar('time_zone', { length: 50 }),
  
  // Settings
  allowCardCreation: boolean('allow_card_creation').default(false),
  allowCardEditing: boolean('allow_card_editing').default(false),
  moderationRequired: boolean('moderation_required').default(true),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, paused, completed, cancelled
  visibility: varchar('visibility', { length: 20 }).default('private'),
  
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  deckIdx: index('flashcard_collaborations_deck_idx').on(table.deckId),
  typeIdx: index('flashcard_collaborations_type_idx').on(table.collaborationType),
  statusIdx: index('flashcard_collaborations_status_idx').on(table.status),
  createdByIdx: index('flashcard_collaborations_created_by_idx').on(table.createdBy)
}));

// Define relationships
export const flashcardDecksRelations = relations(flashcardDecks, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [flashcardDecks.createdBy],
    references: [users.id]
  }),
  cards: many(flashcards),
  studySessions: many(flashcardStudySessions),
  aiGenerations: many(aiFlashcardGeneration),
  collaborations: many(flashcardCollaborations)
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  deck: one(flashcardDecks, {
    fields: [flashcards.deckId],
    references: [flashcardDecks.id]
  }),
  reviews: many(cardReviews)
}));

export const flashcardStudySessionsRelations = relations(flashcardStudySessions, ({ one, many }) => ({
  user: one(users, {
    fields: [flashcardStudySessions.userId],
    references: [users.id]
  }),
  deck: one(flashcardDecks, {
    fields: [flashcardStudySessions.deckId],
    references: [flashcardDecks.id]
  }),
  reviews: many(cardReviews)
}));

export const cardReviewsRelations = relations(cardReviews, ({ one }) => ({
  session: one(flashcardStudySessions, {
    fields: [cardReviews.sessionId],
    references: [flashcardStudySessions.id]
  }),
  card: one(flashcards, {
    fields: [cardReviews.cardId],
    references: [flashcards.id]
  }),
  user: one(users, {
    fields: [cardReviews.userId],
    references: [users.id]
  })
}));

export const aiFlashcardGenerationRelations = relations(aiFlashcardGeneration, ({ one }) => ({
  requestedBy: one(users, {
    fields: [aiFlashcardGeneration.requestedBy],
    references: [users.id]
  }),
  deck: one(flashcardDecks, {
    fields: [aiFlashcardGeneration.deckId],
    references: [flashcardDecks.id]
  }),
  reviewedBy: one(users, {
    fields: [aiFlashcardGeneration.reviewedBy],
    references: [users.id]
  })
}));

export const spacedRepetitionAnalyticsRelations = relations(spacedRepetitionAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [spacedRepetitionAnalytics.userId],
    references: [users.id]
  })
}));

export const flashcardCollaborationsRelations = relations(flashcardCollaborations, ({ one }) => ({
  deck: one(flashcardDecks, {
    fields: [flashcardCollaborations.deckId],
    references: [flashcardDecks.id]
  }),
  createdBy: one(users, {
    fields: [flashcardCollaborations.createdBy],
    references: [users.id]
  })
}));