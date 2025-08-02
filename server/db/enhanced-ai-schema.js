import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// AI Model Registry and Management
export const aiModels = pgTable('ai_models', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id').defaultRandom().notNull().unique(),
  
  // Model identification
  name: varchar('name', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // openai, anthropic, google, local
  
  // Model specifications
  modelType: varchar('model_type', { length: 50 }).notNull(), // gpt, claude, gemini, llama, custom
  capabilities: jsonb('capabilities').notNull(), // text, vision, audio, code, math, etc.
  maxTokens: integer('max_tokens').default(4096),
  costPerToken: decimal('cost_per_token', { precision: 10, scale: 8 }),
  
  // Performance metrics
  latency: integer('latency').default(0), // Average response time in ms
  reliability: decimal('reliability', { precision: 5, scale: 4 }).default('0.99'),
  accuracy: decimal('accuracy', { precision: 5, scale: 4 }),
  
  // Subject expertise
  subjectExpertise: jsonb('subject_expertise').default({}), // Ratings per subject
  languageSupport: jsonb('language_support').default([]),
  
  // Configuration
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  requiresApiKey: boolean('requires_api_key').default(true),
  
  // Usage tracking
  totalUsage: bigint('total_usage', { mode: 'number' }).default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 4 }).default('1.0'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  providerIdx: index('ai_models_provider_idx').on(table.provider),
  typeIdx: index('ai_models_type_idx').on(table.modelType),
  activeIdx: index('ai_models_active_idx').on(table.isActive),
  defaultIdx: index('ai_models_default_idx').on(table.isDefault)
}));

// Enhanced AI Conversations with Context Management
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  conversationId: uuid('conversation_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  modelId: integer('model_id').references(() => aiModels.id).notNull(),
  
  // Conversation metadata
  title: varchar('title', { length: 200 }),
  description: text('description'),
  conversationType: varchar('conversation_type', { length: 50 }).notNull(), // chat, homework, tutor, quiz, study_buddy
  
  // Context and personalization
  userContext: jsonb('user_context').default({}), // User's learning level, preferences, goals
  academicContext: jsonb('academic_context').default({}), // Current subjects, courses, grade level
  conversationContext: jsonb('conversation_context').default({}), // Previous topics, style, etc.
  
  // Learning objectives
  learningGoals: jsonb('learning_goals').default([]),
  currentSubject: varchar('current_subject', { length: 100 }),
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('medium'), // beginner, medium, advanced
  
  // Conversation settings
  aiPersonality: varchar('ai_personality', { length: 50 }).default('helpful'), // helpful, encouraging, challenging, etc.
  responseStyle: varchar('response_style', { length: 50 }).default('detailed'), // concise, detailed, step_by_step
  languagePreference: varchar('language_preference', { length: 10 }).default('en'),
  
  // Session management
  isActive: boolean('is_active').default(true),
  lastInteraction: timestamp('last_interaction').defaultNow(),
  totalMessages: integer('total_messages').default(0),
  
  // Performance tracking
  userSatisfaction: decimal('user_satisfaction', { precision: 3, scale: 2 }),
  helpfulnessRating: decimal('helpfulness_rating', { precision: 3, scale: 2 }),
  
  // Privacy and sharing
  isPrivate: boolean('is_private').default(true),
  shareToken: uuid('share_token'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('ai_conversations_user_idx').on(table.userId),
  modelIdx: index('ai_conversations_model_idx').on(table.modelId),
  typeIdx: index('ai_conversations_type_idx').on(table.conversationType),
  subjectIdx: index('ai_conversations_subject_idx').on(table.currentSubject),
  activeIdx: index('ai_conversations_active_idx').on(table.isActive),
  interactionIdx: index('ai_conversations_interaction_idx').on(table.lastInteraction)
}));

// AI Messages with Rich Content Support
export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  messageId: uuid('message_id').defaultRandom().notNull().unique(),
  
  conversationId: integer('conversation_id').references(() => aiConversations.id).notNull(),
  
  // Message metadata
  role: varchar('role', { length: 20 }).notNull(), // user, assistant, system
  messageType: varchar('message_type', { length: 50 }).default('text'), // text, image, audio, code, math, file
  
  // Content
  content: text('content'),
  richContent: jsonb('rich_content').default({}), // Structured content with formatting
  
  // Multimedia support
  attachments: jsonb('attachments').default([]), // Images, files, audio recordings
  codeBlocks: jsonb('code_blocks').default([]), // Syntax-highlighted code
  mathExpressions: jsonb('math_expressions').default([]), // LaTeX equations
  
  // AI-specific data
  modelUsed: integer('model_used').references(() => aiModels.id),
  tokensUsed: integer('tokens_used'),
  processingTime: integer('processing_time'), // milliseconds
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  
  // Context and reasoning
  reasoning: text('reasoning'), // AI's reasoning process (for transparency)
  sources: jsonb('sources').default([]), // References and citations
  followUpSuggestions: jsonb('follow_up_suggestions').default([]),
  
  // Interactive elements
  hasInteractiveElements: boolean('has_interactive_elements').default(false),
  interactiveData: jsonb('interactive_data').default({}), // Quizzes, exercises, simulations
  
  // Feedback and learning
  userFeedback: varchar('user_feedback', { length: 20 }), // thumbs_up, thumbs_down, helpful, not_helpful
  feedbackDetails: text('feedback_details'),
  wasEdited: boolean('was_edited').default(false),
  
  // Quality metrics
  accuracyScore: decimal('accuracy_score', { precision: 5, scale: 4 }),
  relevanceScore: decimal('relevance_score', { precision: 5, scale: 4 }),
  helpfulnessScore: decimal('helpfulness_score', { precision: 5, scale: 4 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  conversationIdx: index('ai_messages_conversation_idx').on(table.conversationId),
  roleIdx: index('ai_messages_role_idx').on(table.role),
  typeIdx: index('ai_messages_type_idx').on(table.messageType),
  modelIdx: index('ai_messages_model_idx').on(table.modelUsed),
  feedbackIdx: index('ai_messages_feedback_idx').on(table.userFeedback),
  createdIdx: index('ai_messages_created_idx').on(table.createdAt)
}));

// Enhanced Homework Problem Database and Solutions (renamed to avoid conflict)
export const enhancedHomeworkProblems = pgTable('enhanced_homework_problems', {
  id: serial('id').primaryKey(),
  problemId: uuid('problem_id').defaultRandom().notNull().unique(),
  
  // Problem identification
  title: varchar('title', { length: 200 }),
  subject: varchar('subject', { length: 100 }).notNull(),
  topic: varchar('topic', { length: 100 }),
  subtopic: varchar('subtopic', { length: 100 }),
  
  // Problem content
  problemText: text('problem_text'),
  problemImage: text('problem_image'), // Base64 or URL
  problemType: varchar('problem_type', { length: 50 }), // multiple_choice, short_answer, essay, calculation, proof
  
  // Academic classification
  gradeLevel: varchar('grade_level', { length: 20 }),
  difficultyLevel: varchar('difficulty_level', { length: 20 }),
  curriculum: varchar('curriculum', { length: 50 }), // common_core, ib, ap, etc.
  
  // Solution data
  correctAnswer: text('correct_answer'),
  alternativeAnswers: jsonb('alternative_answers').default([]),
  solutionSteps: jsonb('solution_steps').default([]),
  explanations: jsonb('explanations').default([]),
  
  // Multimedia solutions
  solutionImages: jsonb('solution_images').default([]),
  solutionVideos: jsonb('solution_videos').default([]),
  interactiveSolution: jsonb('interactive_solution').default({}),
  
  // Quality metrics
  accuracyVerified: boolean('accuracy_verified').default(false),
  verifiedBy: integer('verified_by').references(() => users.id),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  
  // Usage tracking
  timesUsed: integer('times_used').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 4 }),
  averageTimeToSolve: integer('average_time_to_solve'), // seconds
  
  // Metadata
  sourceBook: varchar('source_book', { length: 200 }),
  sourceChapter: varchar('source_chapter', { length: 100 }),
  sourceExercise: varchar('source_exercise', { length: 50 }),
  keywords: jsonb('keywords').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  subjectIdx: index('homework_problems_subject_idx').on(table.subject),
  topicIdx: index('homework_problems_topic_idx').on(table.topic),
  gradeIdx: index('homework_problems_grade_idx').on(table.gradeLevel),
  difficultyIdx: index('homework_problems_difficulty_idx').on(table.difficultyLevel),
  typeIdx: index('homework_problems_type_idx').on(table.problemType),
  qualityIdx: index('homework_problems_quality_idx').on(table.qualityScore)
}));

// User Homework Submissions and AI Solutions
export const homeworkSubmissions = pgTable('homework_submissions', {
  id: serial('id').primaryKey(),
  submissionId: uuid('submission_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  problemId: integer('problem_id').references(() => enhancedHomeworkProblems.id),
  conversationId: integer('conversation_id').references(() => aiConversations.id),
  
  // Original submission
  originalProblem: text('original_problem'), // User's original problem text/image
  originalImage: text('original_image'),
  problemRecognition: jsonb('problem_recognition').default({}), // OCR/image recognition results
  
  // Problem classification
  detectedSubject: varchar('detected_subject', { length: 100 }),
  detectedTopic: varchar('detected_topic', { length: 100 }),
  confidenceLevel: decimal('confidence_level', { precision: 5, scale: 4 }),
  
  // AI Solution
  aiSolution: jsonb('ai_solution').notNull(),
  solutionSteps: jsonb('solution_steps').default([]),
  explanationLevel: varchar('explanation_level', { length: 20 }).default('detailed'), // brief, detailed, step_by_step
  
  // Multiple solution approaches
  alternativeSolutions: jsonb('alternative_solutions').default([]),
  recommendedApproach: varchar('recommended_approach', { length: 100 }),
  
  // Learning enhancements
  conceptsExplained: jsonb('concepts_explained').default([]),
  relatedTopics: jsonb('related_topics').default([]),
  practiceProblems: jsonb('practice_problems').default([]),
  
  // User interaction
  userAnswer: text('user_answer'),
  isCorrect: boolean('is_correct'),
  attemptsCount: integer('attempts_count').default(1),
  hintsUsed: integer('hints_used').default(0),
  
  // Time tracking
  timeToSubmit: integer('time_to_submit'), // seconds
  timeToSolve: integer('time_to_solve'), // seconds from first attempt to correct answer
  
  // Feedback and learning
  userRating: integer('user_rating'), // 1-5 stars
  feedbackText: text('feedback_text'),
  difficultyRating: integer('difficulty_rating'), // User's perceived difficulty
  
  // Academic tracking
  isHomework: boolean('is_homework').default(true),
  assignmentId: varchar('assignment_id', { length: 100 }),
  dueDate: timestamp('due_date'),
  
  // Status and completion
  status: varchar('status', { length: 20 }).default('completed'), // pending, completed, reviewed
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('homework_submissions_user_idx').on(table.userId),
  problemIdx: index('homework_submissions_problem_idx').on(table.problemId),
  conversationIdx: index('homework_submissions_conversation_idx').on(table.conversationId),
  subjectIdx: index('homework_submissions_subject_idx').on(table.detectedSubject),
  statusIdx: index('homework_submissions_status_idx').on(table.status),
  completedIdx: index('homework_submissions_completed_idx').on(table.completedAt)
}));

// AI Tutoring Sessions with Personalized Learning
export const aiTutoringSessions = pgTable('ai_tutoring_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  conversationId: integer('conversation_id').references(() => aiConversations.id).notNull(),
  
  // Session configuration
  subject: varchar('subject', { length: 100 }).notNull(),
  topics: jsonb('topics').default([]),
  learningObjectives: jsonb('learning_objectives').default([]),
  
  // Personalization
  learningStyle: varchar('learning_style', { length: 50 }), // visual, auditory, kinesthetic, reading
  currentLevel: varchar('current_level', { length: 20 }), // beginner, intermediate, advanced
  preferredPace: varchar('preferred_pace', { length: 20 }).default('normal'), // slow, normal, fast
  
  // Session structure
  sessionType: varchar('session_type', { length: 50 }).default('adaptive'), // structured, adaptive, review, practice
  plannedDuration: integer('planned_duration'), // minutes
  actualDuration: integer('actual_duration'), // minutes
  
  // Progress tracking
  conceptsCovered: jsonb('concepts_covered').default([]),
  skillsImproved: jsonb('skills_improved').default([]),
  weaknessesIdentified: jsonb('weaknesses_identified').default([]),
  strengthsReinforced: jsonb('strengths_reinforced').default([]),
  
  // Performance metrics
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }),
  comprehensionScore: decimal('comprehension_score', { precision: 5, scale: 2 }),
  progressMade: decimal('progress_made', { precision: 5, scale: 2 }),
  
  // Adaptive learning
  difficultyAdjustments: jsonb('difficulty_adjustments').default([]),
  personalizedContent: jsonb('personalized_content').default([]),
  nextRecommendations: jsonb('next_recommendations').default([]),
  
  // Session outcomes
  goalsAchieved: jsonb('goals_achieved').default([]),
  homeworkAssigned: jsonb('homework_assigned').default([]),
  followUpRequired: boolean('follow_up_required').default(false),
  
  // Quality assessment
  sessionRating: integer('session_rating'), // 1-5 stars
  tutorEffectiveness: decimal('tutor_effectiveness', { precision: 5, scale: 2 }),
  
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('ai_tutoring_sessions_user_idx').on(table.userId),
  conversationIdx: index('ai_tutoring_sessions_conversation_idx').on(table.conversationId),
  subjectIdx: index('ai_tutoring_sessions_subject_idx').on(table.subject),
  typeIdx: index('ai_tutoring_sessions_type_idx').on(table.sessionType),
  startedIdx: index('ai_tutoring_sessions_started_idx').on(table.startedAt)
}));

// AI Knowledge Base and Learning Resources
export const aiKnowledgeBase = pgTable('ai_knowledge_base', {
  id: serial('id').primaryKey(),
  resourceId: uuid('resource_id').defaultRandom().notNull().unique(),
  
  // Resource identification
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // concept, formula, theorem, example, exercise
  
  // Academic classification
  subject: varchar('subject', { length: 100 }).notNull(),
  topic: varchar('topic', { length: 100 }),
  subtopic: varchar('subtopic', { length: 100 }),
  gradeLevel: varchar('grade_level', { length: 20 }),
  
  // Content
  content: text('content').notNull(),
  formattedContent: jsonb('formatted_content').default({}), // Rich formatting with LaTeX, etc.
  examples: jsonb('examples').default([]),
  
  // Multimedia resources
  images: jsonb('images').default([]),
  videos: jsonb('videos').default([]),
  interactiveElements: jsonb('interactive_elements').default([]),
  
  // Relationships
  prerequisites: jsonb('prerequisites').default([]), // Required knowledge
  relatedConcepts: jsonb('related_concepts').default([]),
  applications: jsonb('applications').default([]),
  
  // Learning support
  difficultyLevel: varchar('difficulty_level', { length: 20 }),
  estimatedStudyTime: integer('estimated_study_time'), // minutes
  commonMistakes: jsonb('common_mistakes').default([]),
  tipsAndTricks: jsonb('tips_and_tricks').default([]),
  
  // Quality and verification
  isVerified: boolean('is_verified').default(false),
  verifiedBy: integer('verified_by').references(() => users.id),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  
  // Usage analytics
  timesAccessed: integer('times_accessed').default(0),
  userRatings: decimal('user_ratings', { precision: 3, scale: 2 }),
  helpfulnessVotes: integer('helpfulness_votes').default(0),
  
  // Metadata
  sourceUrl: text('source_url'),
  author: varchar('author', { length: 100 }),
  lastReviewed: timestamp('last_reviewed'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  subjectIdx: index('ai_knowledge_base_subject_idx').on(table.subject),
  topicIdx: index('ai_knowledge_base_topic_idx').on(table.topic),
  typeIdx: index('ai_knowledge_base_type_idx').on(table.resourceType),
  gradeIdx: index('ai_knowledge_base_grade_idx').on(table.gradeLevel),
  qualityIdx: index('ai_knowledge_base_quality_idx').on(table.qualityScore),
  verifiedIdx: index('ai_knowledge_base_verified_idx').on(table.isVerified)
}));

// User Learning Analytics and AI Insights
export const aiLearningAnalytics = pgTable('ai_learning_analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Learning style analysis
  detectedLearningStyle: varchar('detected_learning_style', { length: 50 }),
  learningStyleConfidence: decimal('learning_style_confidence', { precision: 5, scale: 4 }),
  preferredContentTypes: jsonb('preferred_content_types').default([]),
  
  // Knowledge mapping
  knowledgeMap: jsonb('knowledge_map').default({}), // Subject -> Topic -> Mastery level
  skillsAssessment: jsonb('skills_assessment').default({}),
  learningGaps: jsonb('learning_gaps').default([]),
  
  // Performance patterns
  studyPatterns: jsonb('study_patterns').default({}), // Time preferences, session length, etc.
  difficultyProgression: jsonb('difficulty_progression').default({}),
  topicPreferences: jsonb('topic_preferences').default({}),
  
  // AI interaction analysis
  questionTypes: jsonb('question_types').default({}), // What types of questions user asks
  helpSeeking: jsonb('help_seeking').default({}), // How and when user seeks help
  feedbackPatterns: jsonb('feedback_patterns').default({}),
  
  // Predictive insights
  strengthAreas: jsonb('strength_areas').default([]),
  improvementAreas: jsonb('improvement_areas').default([]),
  riskFactors: jsonb('risk_factors').default([]),
  successPredictors: jsonb('success_predictors').default([]),
  
  // Recommendations
  personalizedRecommendations: jsonb('personalized_recommendations').default([]),
  nextLearningPaths: jsonb('next_learning_paths').default([]),
  resourceSuggestions: jsonb('resource_suggestions').default([]),
  
  // Metrics
  overallProgress: decimal('overall_progress', { precision: 5, scale: 2 }),
  engagementLevel: decimal('engagement_level', { precision: 5, scale: 2 }),
  retentionRate: decimal('retention_rate', { precision: 5, scale: 4 }),
  
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('learning_analytics_user_idx').on(table.userId),
  analyzedIdx: index('learning_analytics_analyzed_idx').on(table.lastAnalyzed)
}));

// Define relationships
export const aiModelsRelations = relations(aiModels, ({ many }) => ({
  conversations: many(aiConversations),
  messages: many(aiMessages)
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id]
  }),
  model: one(aiModels, {
    fields: [aiConversations.modelId],
    references: [aiModels.id]
  }),
  messages: many(aiMessages),
  homeworkSubmissions: many(homeworkSubmissions),
  tutoringSessions: many(aiTutoringSessions)
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id]
  }),
  model: one(aiModels, {
    fields: [aiMessages.modelUsed],
    references: [aiModels.id]
  })
}));

export const enhancedHomeworkProblemsRelations = relations(enhancedHomeworkProblems, ({ one, many }) => ({
  verifiedBy: one(users, {
    fields: [enhancedHomeworkProblems.verifiedBy],
    references: [users.id]
  }),
  submissions: many(homeworkSubmissions)
}));

export const homeworkSubmissionsRelations = relations(homeworkSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [homeworkSubmissions.userId],
    references: [users.id]
  }),
  problem: one(enhancedHomeworkProblems, {
    fields: [homeworkSubmissions.problemId],
    references: [enhancedHomeworkProblems.id]
  }),
  conversation: one(aiConversations, {
    fields: [homeworkSubmissions.conversationId],
    references: [aiConversations.id]
  })
}));

export const aiTutoringSessionsRelations = relations(aiTutoringSessions, ({ one }) => ({
  user: one(users, {
    fields: [aiTutoringSessions.userId],
    references: [users.id]
  }),
  conversation: one(aiConversations, {
    fields: [aiTutoringSessions.conversationId],
    references: [aiConversations.id]
  })
}));

export const aiKnowledgeBaseRelations = relations(aiKnowledgeBase, ({ one }) => ({
  verifiedBy: one(users, {
    fields: [aiKnowledgeBase.verifiedBy],
    references: [users.id]
  })
}));

export const aiLearningAnalyticsRelations = relations(aiLearningAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [aiLearningAnalytics.userId],
    references: [users.id]
  })
}));