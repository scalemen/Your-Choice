import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Enhanced Quiz System with Adaptive Difficulty
export const enhancedQuizzes = pgTable('enhanced_quizzes', {
  id: serial('id').primaryKey(),
  quizId: uuid('quiz_id').defaultRandom().notNull().unique(),
  
  // Basic quiz info
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  
  // Creation and ownership
  createdBy: integer('created_by').references(() => users.id).notNull(),
  isPublic: boolean('is_public').default(false),
  isOfficial: boolean('is_official').default(false),
  isAIGenerated: boolean('is_ai_generated').default(false),
  
  // Academic classification
  subject: varchar('subject', { length: 100 }),
  topic: varchar('topic', { length: 100 }),
  subtopic: varchar('subtopic', { length: 100 }),
  gradeLevel: varchar('grade_level', { length: 50 }),
  curriculum: varchar('curriculum', { length: 50 }),
  
  // Quiz configuration
  quizType: varchar('quiz_type', { length: 50 }).default('practice'), // practice, assessment, exam, adaptive, timed
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('medium'),
  estimatedDuration: integer('estimated_duration'), // Minutes
  questionCount: integer('question_count').default(0),
  
  // Adaptive features
  isAdaptive: boolean('is_adaptive').default(false),
  adaptiveAlgorithm: varchar('adaptive_algorithm', { length: 50 }), // irt, simple, ml_based
  initialDifficulty: decimal('initial_difficulty', { precision: 5, scale: 2 }),
  difficultyRange: jsonb('difficulty_range').default({}), // min, max difficulty
  
  // Timing and scheduling
  timeLimit: integer('time_limit'), // Minutes
  hasTimeLimit: boolean('has_time_limit').default(false),
  timePerQuestion: integer('time_per_question'), // Seconds
  allowPause: boolean('allow_pause').default(true),
  
  // Attempt configuration
  maxAttempts: integer('max_attempts').default(3),
  shuffleQuestions: boolean('shuffle_questions').default(false),
  shuffleAnswers: boolean('shuffle_answers').default(false),
  showResults: varchar('show_results', { length: 20 }).default('immediate'), // immediate, end, never
  allowReview: boolean('allow_review').default(true),
  
  // Scoring and grading
  scoringMethod: varchar('scoring_method', { length: 50 }).default('percentage'), // percentage, points, weighted
  passingScore: decimal('passing_score', { precision: 5, scale: 2 }).default('70'),
  totalPoints: integer('total_points').default(100),
  weightedScoring: boolean('weighted_scoring').default(false),
  
  // Feedback and explanations
  showExplanations: boolean('show_explanations').default(true),
  showCorrectAnswers: boolean('show_correct_answers').default(true),
  explanationTiming: varchar('explanation_timing', { length: 20 }).default('after_submission'), // immediate, after_question, after_submission
  
  // Collaboration features
  allowCollaboration: boolean('allow_collaboration').default(false),
  teamSize: integer('team_size').default(1),
  collaborationType: varchar('collaboration_type', { length: 50 }), // individual, team, competitive
  
  // Gamification
  gamificationEnabled: boolean('gamification_enabled').default(false),
  pointsReward: integer('points_reward').default(0),
  badgesAwarded: jsonb('badges_awarded').default([]),
  leaderboardEligible: boolean('leaderboard_eligible').default(false),
  
  // Analytics and insights
  analyticsEnabled: boolean('analytics_enabled').default(true),
  detailedTracking: boolean('detailed_tracking').default(false),
  learningObjectives: jsonb('learning_objectives').default([]),
  
  // Quality metrics
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  averageDuration: decimal('average_duration', { precision: 8, scale: 2 }),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }),
  difficultyRating: decimal('difficulty_rating', { precision: 3, scale: 2 }),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  
  // Usage statistics
  totalAttempts: integer('total_attempts').default(0),
  uniqueTakers: integer('unique_takers').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  
  // Status and metadata
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived, disabled
  tags: jsonb('tags').default([]),
  categories: jsonb('categories').default([]),
  
  // Version control
  version: varchar('version', { length: 20 }).default('1.0'),
  parentQuizId: integer('parent_quiz_id').references(() => enhancedQuizzes.id),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at')
}, (table) => ({
  createdByIdx: index('enhanced_quizzes_created_by_idx').on(table.createdBy),
  subjectIdx: index('enhanced_quizzes_subject_idx').on(table.subject),
  topicIdx: index('enhanced_quizzes_topic_idx').on(table.topic),
  difficultyIdx: index('enhanced_quizzes_difficulty_idx').on(table.difficultyLevel),
  typeIdx: index('enhanced_quizzes_type_idx').on(table.quizType),
  statusIdx: index('enhanced_quizzes_status_idx').on(table.status),
  publicIdx: index('enhanced_quizzes_public_idx').on(table.isPublic),
  adaptiveIdx: index('enhanced_quizzes_adaptive_idx').on(table.isAdaptive)
}));

// Advanced Question Types and Content
export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  questionId: uuid('question_id').defaultRandom().notNull().unique(),
  
  quizId: integer('quiz_id').references(() => enhancedQuizzes.id).notNull(),
  
  // Question content
  questionText: text('question_text').notNull(),
  questionType: varchar('question_type', { length: 50 }).notNull(), // multiple_choice, true_false, short_answer, essay, matching, ordering, fill_blank, hotspot, drag_drop
  
  // Question metadata
  order: integer('order').notNull(),
  points: integer('points').default(1),
  weight: decimal('weight', { precision: 5, scale: 2 }).default('1.0'),
  
  // Difficulty and classification
  difficultyLevel: decimal('difficulty_level', { precision: 5, scale: 2 }),
  bloomsTaxonomy: varchar('blooms_taxonomy', { length: 50 }), // remember, understand, apply, analyze, evaluate, create
  cognitiveLoad: varchar('cognitive_load', { length: 20 }), // low, medium, high
  
  // Content and media
  questionMedia: jsonb('question_media').default([]), // Images, videos, audio, documents
  formatting: jsonb('formatting').default({}), // Rich text formatting, LaTeX
  
  // Answer configuration
  answers: jsonb('answers').notNull(), // All possible answers with metadata
  correctAnswers: jsonb('correct_answers').notNull(), // Correct answer(s)
  partialCredit: boolean('partial_credit').default(false),
  caseSensitive: boolean('case_sensitive').default(false),
  
  // Timing
  timeLimit: integer('time_limit'), // Seconds for this question
  timeToAnswer: integer('time_to_answer'), // Average time students take
  
  // Feedback and explanations
  explanation: text('explanation'),
  explanationMedia: jsonb('explanation_media').default([]),
  hint: text('hint'),
  commonMistakes: jsonb('common_mistakes').default([]),
  
  // Learning objectives
  learningObjectives: jsonb('learning_objectives').default([]),
  skillsAssessed: jsonb('skills_assessed').default([]),
  knowledgeAreas: jsonb('knowledge_areas').default([]),
  
  // Analytics and performance
  answerDistribution: jsonb('answer_distribution').default({}), // How often each answer is chosen
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  discriminationIndex: decimal('discrimination_index', { precision: 5, scale: 4 }),
  difficultyIndex: decimal('difficulty_index', { precision: 5, scale: 4 }),
  
  // Quality metrics
  qualityFlags: jsonb('quality_flags').default([]),
  reviewStatus: varchar('review_status', { length: 20 }).default('pending'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  
  // AI generation metadata
  aiGenerated: boolean('ai_generated').default(false),
  aiModel: varchar('ai_model', { length: 50 }),
  generationPrompt: text('generation_prompt'),
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  
  // Adaptive testing
  irtParameters: jsonb('irt_parameters').default({}), // IRT a, b, c parameters
  adaptiveWeight: decimal('adaptive_weight', { precision: 5, scale: 2 }).default('1.0'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  quizIdx: index('quiz_questions_quiz_idx').on(table.quizId),
  orderIdx: index('quiz_questions_order_idx').on(table.order),
  typeIdx: index('quiz_questions_type_idx').on(table.questionType),
  difficultyIdx: index('quiz_questions_difficulty_idx').on(table.difficultyLevel),
  bloomsIdx: index('quiz_questions_blooms_idx').on(table.bloomsTaxonomy),
  reviewIdx: index('quiz_questions_review_idx').on(table.reviewStatus)
}));

// Quiz Attempts with Detailed Tracking
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  attemptId: uuid('attempt_id').defaultRandom().notNull().unique(),
  
  quizId: integer('quiz_id').references(() => enhancedQuizzes.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Attempt metadata
  attemptNumber: integer('attempt_number').notNull(),
  status: varchar('status', { length: 20 }).default('in_progress'), // in_progress, completed, abandoned, paused
  
  // Timing information
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  pausedAt: timestamp('paused_at'),
  totalTime: integer('total_time').default(0), // Seconds
  timeRemaining: integer('time_remaining'),
  
  // Scoring and performance
  totalScore: decimal('total_score', { precision: 8, scale: 2 }).default('0'),
  maxPossibleScore: decimal('max_possible_score', { precision: 8, scale: 2 }),
  percentageScore: decimal('percentage_score', { precision: 5, scale: 2 }),
  passed: boolean('passed').default(false),
  
  // Question tracking
  questionsAnswered: integer('questions_answered').default(0),
  questionsCorrect: integer('questions_correct').default(0),
  questionsSkipped: integer('questions_skipped').default(0),
  currentQuestionIndex: integer('current_question_index').default(0),
  
  // Adaptive testing data
  estimatedAbility: decimal('estimated_ability', { precision: 8, scale: 4 }),
  abilityHistory: jsonb('ability_history').default([]),
  questionHistory: jsonb('question_history').default([]), // Ordered list of questions asked
  
  // Performance analytics
  confidenceLevel: decimal('confidence_level', { precision: 5, scale: 2 }),
  speedScore: decimal('speed_score', { precision: 5, scale: 2 }),
  accuracyScore: decimal('accuracy_score', { precision: 5, scale: 2 }),
  consistencyScore: decimal('consistency_score', { precision: 5, scale: 2 }),
  
  // Learning insights
  strengthAreas: jsonb('strength_areas').default([]),
  weaknessAreas: jsonb('weakness_areas').default([]),
  learningGaps: jsonb('learning_gaps').default([]),
  masteryAreas: jsonb('mastery_areas').default([]),
  
  // Behavioral data
  focusEvents: jsonb('focus_events').default([]), // Tab switches, window focus/blur
  interactionEvents: jsonb('interaction_events').default([]), // Clicks, scrolls, etc.
  pauseReasons: jsonb('pause_reasons').default([]),
  
  // Device and environment
  deviceInfo: jsonb('device_info').default({}),
  browserInfo: jsonb('browser_info').default({}),
  screenResolution: varchar('screen_resolution', { length: 20 }),
  timeZone: varchar('time_zone', { length: 50 }),
  
  // Collaboration data (if applicable)
  teamMembers: jsonb('team_members').default([]),
  teamScore: decimal('team_score', { precision: 8, scale: 2 }),
  individualContribution: decimal('individual_contribution', { precision: 5, scale: 2 }),
  
  // Feedback and satisfaction
  difficultyRating: integer('difficulty_rating'), // 1-5
  satisfactionRating: integer('satisfaction_rating'), // 1-5
  feedback: text('feedback'),
  
  // Cheating detection
  suspiciousActivity: jsonb('suspicious_activity').default([]),
  integrityScore: decimal('integrity_score', { precision: 5, scale: 2 }).default('100'),
  proctor: boolean('proctored').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  quizUserIdx: index('quiz_attempts_quiz_user_idx').on(table.quizId, table.userId),
  statusIdx: index('quiz_attempts_status_idx').on(table.status),
  completedIdx: index('quiz_attempts_completed_idx').on(table.completedAt),
  scoreIdx: index('quiz_attempts_score_idx').on(table.percentageScore)
}));

// Individual Question Responses
export const questionResponses = pgTable('question_responses', {
  id: serial('id').primaryKey(),
  responseId: uuid('response_id').defaultRandom().notNull().unique(),
  
  attemptId: integer('attempt_id').references(() => quizAttempts.id).notNull(),
  questionId: integer('question_id').references(() => quizQuestions.id).notNull(),
  
  // Response content
  userAnswer: jsonb('user_answer'), // Flexible to handle any question type
  isCorrect: boolean('is_correct'),
  partialScore: decimal('partial_score', { precision: 8, scale: 2 }),
  maxScore: decimal('max_score', { precision: 8, scale: 2 }),
  
  // Timing data
  timeSpent: integer('time_spent').default(0), // Seconds
  firstResponseTime: integer('first_response_time'), // Time to first answer
  finalResponseTime: integer('final_response_time'), // Time to final answer
  
  // Response behavior
  responseChanges: integer('response_changes').default(0),
  responseHistory: jsonb('response_history').default([]), // All answer changes
  confidenceLevel: integer('confidence_level'), // 1-5 self-reported confidence
  
  // Adaptive testing
  questionDifficulty: decimal('question_difficulty', { precision: 5, scale: 2 }),
  abilityEstimate: decimal('ability_estimate', { precision: 8, scale: 4 }),
  informationValue: decimal('information_value', { precision: 8, scale: 4 }),
  
  // Learning insights
  conceptsApplied: jsonb('concepts_applied').default([]),
  skillsDemonstrated: jsonb('skills_demonstrated').default([]),
  errorType: varchar('error_type', { length: 50 }), // conceptual, procedural, careless, knowledge_gap
  
  // Feedback and hints
  hintsUsed: integer('hints_used').default(0),
  hintTexts: jsonb('hint_texts').default([]),
  feedbackShown: boolean('feedback_shown').default(false),
  
  // Question presentation
  questionOrder: integer('question_order'),
  answerOrder: jsonb('answer_order'), // Order answers were presented (if shuffled)
  questionVariation: jsonb('question_variation'), // If question has multiple versions
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  attemptIdx: index('question_responses_attempt_idx').on(table.attemptId),
  questionIdx: index('question_responses_question_idx').on(table.questionId),
  correctIdx: index('question_responses_correct_idx').on(table.isCorrect),
  timeIdx: index('question_responses_time_idx').on(table.timeSpent)
}));

// Quiz Analytics and Insights
export const quizAnalytics = pgTable('quiz_analytics', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => enhancedQuizzes.id).notNull().unique(),
  
  // Performance statistics
  totalAttempts: integer('total_attempts').default(0),
  uniqueUsers: integer('unique_users').default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  medianScore: decimal('median_score', { precision: 5, scale: 2 }),
  standardDeviation: decimal('standard_deviation', { precision: 5, scale: 2 }),
  
  // Time analytics
  averageDuration: decimal('average_duration', { precision: 8, scale: 2 }),
  medianDuration: decimal('median_duration', { precision: 8, scale: 2 }),
  averageTimePerQuestion: decimal('average_time_per_question', { precision: 8, scale: 2 }),
  
  // Question performance
  easiestQuestions: jsonb('easiest_questions').default([]),
  hardestQuestions: jsonb('hardest_questions').default([]),
  mostSkippedQuestions: jsonb('most_skipped_questions').default([]),
  questionPerformance: jsonb('question_performance').default({}),
  
  // Learning outcomes
  masteryByObjective: jsonb('mastery_by_objective').default({}),
  skillGaps: jsonb('skill_gaps').default([]),
  commonMistakes: jsonb('common_mistakes').default([]),
  improvementAreas: jsonb('improvement_areas').default([]),
  
  // User behavior
  dropoffPoints: jsonb('dropoff_points').default([]),
  retakeReasons: jsonb('retake_reasons').default([]),
  feedbackPatterns: jsonb('feedback_patterns').default({}),
  
  // Adaptive testing metrics
  averageAbilityEstimate: decimal('average_ability_estimate', { precision: 8, scale: 4 }),
  abilityDistribution: jsonb('ability_distribution').default({}),
  adaptiveEfficiency: decimal('adaptive_efficiency', { precision: 5, scale: 2 }),
  
  // Quality metrics
  reliability: decimal('reliability', { precision: 5, scale: 4 }), // Cronbach's alpha
  validity: decimal('validity', { precision: 5, scale: 4 }),
  discriminationIndex: decimal('discrimination_index', { precision: 5, scale: 4 }),
  
  // Recommendations
  recommendedChanges: jsonb('recommended_changes').default([]),
  contentRecommendations: jsonb('content_recommendations').default([]),
  difficultyAdjustments: jsonb('difficulty_adjustments').default([]),
  
  lastCalculated: timestamp('last_calculated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  quizIdx: index('quiz_analytics_quiz_idx').on(table.quizId),
  calculatedIdx: index('quiz_analytics_calculated_idx').on(table.lastCalculated)
}));

// Collaborative Quiz Features
export const quizCollaborations = pgTable('quiz_collaborations', {
  id: serial('id').primaryKey(),
  collaborationId: uuid('collaboration_id').defaultRandom().notNull().unique(),
  
  quizId: integer('quiz_id').references(() => enhancedQuizzes.id).notNull(),
  
  // Collaboration details
  collaborationType: varchar('collaboration_type', { length: 50 }).notNull(), // team, study_group, class, tournament
  name: varchar('name', { length: 200 }),
  description: text('description'),
  
  // Team configuration
  maxTeamSize: integer('max_team_size').default(4),
  currentTeams: integer('current_teams').default(0),
  registrationDeadline: timestamp('registration_deadline'),
  
  // Scheduling
  startDateTime: timestamp('start_date_time'),
  endDateTime: timestamp('end_date_time'),
  timeZone: varchar('time_zone', { length: 50 }),
  
  // Scoring and competition
  scoringMethod: varchar('scoring_method', { length: 50 }).default('team_average'), // team_average, team_sum, competitive
  rankingMethod: varchar('ranking_method', { length: 50 }).default('score'), // score, time, accuracy
  prizeStructure: jsonb('prize_structure').default({}),
  
  // Features
  allowCommunication: boolean('allow_communication').default(true),
  allowResourceSharing: boolean('allow_resource_sharing').default(false),
  realTimeUpdates: boolean('real_time_updates').default(true),
  showLeaderboard: boolean('show_leaderboard').default(true),
  
  // Status
  status: varchar('status', { length: 20 }).default('planning'), // planning, registration, active, completed, cancelled
  visibility: varchar('visibility', { length: 20 }).default('private'),
  
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  quizIdx: index('quiz_collaborations_quiz_idx').on(table.quizId),
  typeIdx: index('quiz_collaborations_type_idx').on(table.collaborationType),
  statusIdx: index('quiz_collaborations_status_idx').on(table.status),
  createdByIdx: index('quiz_collaborations_created_by_idx').on(table.createdBy)
}));

// AI-Generated Quiz Content
export const aiQuizGeneration = pgTable('ai_quiz_generation', {
  id: serial('id').primaryKey(),
  generationId: uuid('generation_id').defaultRandom().notNull().unique(),
  
  // Generation request
  requestedBy: integer('requested_by').references(() => users.id).notNull(),
  quizId: integer('quiz_id').references(() => enhancedQuizzes.id),
  
  // Generation parameters
  subject: varchar('subject', { length: 100 }).notNull(),
  topic: varchar('topic', { length: 100 }),
  difficultyLevel: varchar('difficulty_level', { length: 20 }),
  questionCount: integer('question_count').notNull(),
  questionTypes: jsonb('question_types').notNull(),
  
  // Content sources
  sourceMaterials: jsonb('source_materials').default([]),
  learningObjectives: jsonb('learning_objectives').default([]),
  excludeTopics: jsonb('exclude_topics').default([]),
  includeConcepts: jsonb('include_concepts').default([]),
  
  // AI model information
  aiModel: varchar('ai_model', { length: 50 }).notNull(),
  modelVersion: varchar('model_version', { length: 50 }),
  generationPrompt: text('generation_prompt'),
  
  // Generation results
  status: varchar('status', { length: 20 }).default('pending'), // pending, generating, completed, failed
  generatedContent: jsonb('generated_content').default({}),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  
  // Human review
  humanReviewed: boolean('human_reviewed').default(false),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewFeedback: text('review_feedback'),
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'),
  
  // Performance metrics
  generationTime: integer('generation_time'), // Seconds
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 8, scale: 4 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  requestedByIdx: index('ai_quiz_generation_requested_by_idx').on(table.requestedBy),
  statusIdx: index('ai_quiz_generation_status_idx').on(table.status),
  subjectIdx: index('ai_quiz_generation_subject_idx').on(table.subject),
  completedIdx: index('ai_quiz_generation_completed_idx').on(table.completedAt)
}));

// Define relationships
export const enhancedQuizzesRelations = relations(enhancedQuizzes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [enhancedQuizzes.createdBy],
    references: [users.id]
  }),
  parentQuiz: one(enhancedQuizzes, {
    fields: [enhancedQuizzes.parentQuizId],
    references: [enhancedQuizzes.id]
  }),
  childQuizzes: many(enhancedQuizzes, {
    relationName: 'parentQuiz'
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
  analytics: one(quizAnalytics),
  collaborations: many(quizCollaborations),
  aiGenerations: many(aiQuizGeneration)
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  quiz: one(enhancedQuizzes, {
    fields: [quizQuestions.quizId],
    references: [enhancedQuizzes.id]
  }),
  reviewedBy: one(users, {
    fields: [quizQuestions.reviewedBy],
    references: [users.id]
  }),
  responses: many(questionResponses)
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(enhancedQuizzes, {
    fields: [quizAttempts.quizId],
    references: [enhancedQuizzes.id]
  }),
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id]
  }),
  responses: many(questionResponses)
}));

export const questionResponsesRelations = relations(questionResponses, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [questionResponses.attemptId],
    references: [quizAttempts.id]
  }),
  question: one(quizQuestions, {
    fields: [questionResponses.questionId],
    references: [quizQuestions.id]
  })
}));

export const quizAnalyticsRelations = relations(quizAnalytics, ({ one }) => ({
  quiz: one(enhancedQuizzes, {
    fields: [quizAnalytics.quizId],
    references: [enhancedQuizzes.id]
  })
}));

export const quizCollaborationsRelations = relations(quizCollaborations, ({ one }) => ({
  quiz: one(enhancedQuizzes, {
    fields: [quizCollaborations.quizId],
    references: [enhancedQuizzes.id]
  }),
  createdBy: one(users, {
    fields: [quizCollaborations.createdBy],
    references: [users.id]
  })
}));

export const aiQuizGenerationRelations = relations(aiQuizGeneration, ({ one }) => ({
  requestedBy: one(users, {
    fields: [aiQuizGeneration.requestedBy],
    references: [users.id]
  }),
  quiz: one(enhancedQuizzes, {
    fields: [aiQuizGeneration.quizId],
    references: [enhancedQuizzes.id]
  }),
  reviewedBy: one(users, {
    fields: [aiQuizGeneration.reviewedBy],
    references: [users.id]
  })
}));