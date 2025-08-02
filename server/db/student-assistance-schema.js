import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, classrooms } from './index.js';

// AI Study Buddy - Personal AI Assistant for Students
export const aiStudyBuddy = pgTable('ai_study_buddy', {
  id: serial('id').primaryKey(),
  buddyId: uuid('buddy_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // AI Personality and Configuration
  name: varchar('name', { length: 100 }).default('StudyBot'),
  personality: varchar('personality', { length: 50 }).default('encouraging'), // encouraging, strict, humorous, professional, friendly
  learningStyle: varchar('learning_style', { length: 50 }), // visual, auditory, kinesthetic, reading_writing
  
  // Adaptive Learning Profile
  knowledgeAreas: jsonb('knowledge_areas').default({}), // Subject proficiency mapping
  learningPace: varchar('learning_pace', { length: 20 }).default('medium'), // slow, medium, fast
  difficultyPreference: varchar('difficulty_preference', { length: 20 }).default('adaptive'), // easy, medium, hard, adaptive
  
  // Interaction History
  totalInteractions: integer('total_interactions').default(0),
  totalStudyTime: integer('total_study_time').default(0), // Minutes
  successfulSessions: integer('successful_sessions').default(0),
  
  // AI Memory and Context
  conversationHistory: jsonb('conversation_history').default([]),
  studentPreferences: jsonb('student_preferences').default({}),
  learningInsights: jsonb('learning_insights').default({}),
  
  // Performance Tracking
  helpfulnessRating: decimal('helpfulness_rating', { precision: 3, scale: 2 }),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }),
  
  // Status and Configuration
  isActive: boolean('is_active').default(true),
  customInstructions: text('custom_instructions'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastInteractionAt: timestamp('last_interaction_at')
}, (table) => ({
  userIdx: index('ai_study_buddy_user_idx').on(table.userId),
  activeIdx: index('ai_study_buddy_active_idx').on(table.isActive),
  lastInteractionIdx: index('ai_study_buddy_last_interaction_idx').on(table.lastInteractionAt)
}));

// Study Buddy Conversations
export const studyBuddyConversations = pgTable('study_buddy_conversations', {
  id: serial('id').primaryKey(),
  conversationId: uuid('conversation_id').defaultRandom().notNull().unique(),
  
  buddyId: integer('buddy_id').references(() => aiStudyBuddy.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Conversation Context
  sessionType: varchar('session_type', { length: 50 }).notNull(), // study_help, motivation, quiz_practice, concept_explanation, stress_support
  subject: varchar('subject', { length: 100 }),
  topic: varchar('topic', { length: 200 }),
  difficulty: varchar('difficulty', { length: 20 }),
  
  // Messages
  messages: jsonb('messages').default([]),
  
  // Session Outcomes
  duration: integer('duration'), // Minutes
  helpfulnessRating: integer('helpfulness_rating'), // 1-5
  conceptsLearned: jsonb('concepts_learned').default([]),
  strugglingAreas: jsonb('struggling_areas').default([]),
  
  // AI Analysis
  emotionalState: varchar('emotional_state', { length: 30 }), // confident, frustrated, tired, motivated, confused
  learningProgress: decimal('learning_progress', { precision: 5, scale: 2 }),
  recommendedActions: jsonb('recommended_actions').default([]),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, completed, paused
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  buddyIdx: index('study_buddy_conversations_buddy_idx').on(table.buddyId),
  userIdx: index('study_buddy_conversations_user_idx').on(table.userId),
  sessionTypeIdx: index('study_buddy_conversations_session_type_idx').on(table.sessionType),
  subjectIdx: index('study_buddy_conversations_subject_idx').on(table.subject),
  createdIdx: index('study_buddy_conversations_created_idx').on(table.createdAt)
}));

// Student Wellness and Stress Monitoring
export const studentWellness = pgTable('student_wellness', {
  id: serial('id').primaryKey(),
  recordId: uuid('record_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Daily Wellness Check
  date: timestamp('date').defaultNow(),
  stressLevel: integer('stress_level'), // 1-10 scale
  energyLevel: integer('energy_level'), // 1-10 scale
  motivationLevel: integer('motivation_level'), // 1-10 scale
  sleepQuality: integer('sleep_quality'), // 1-10 scale
  sleepHours: decimal('sleep_hours', { precision: 3, scale: 1 }),
  
  // Study-Related Wellness
  studyFocus: integer('study_focus'), // 1-10 scale
  workloadManageability: integer('workload_manageability'), // 1-10 scale
  assignmentAnxiety: integer('assignment_anxiety'), // 1-10 scale
  
  // Mood and Emotional State
  overallMood: varchar('overall_mood', { length: 30 }), // happy, neutral, stressed, overwhelmed, excited, tired
  emotionalTags: jsonb('emotional_tags').default([]), // Array of emotion keywords
  
  // Study Environment
  studyLocation: varchar('study_location', { length: 100 }),
  studyDistractions: jsonb('study_distractions').default([]),
  studyDuration: integer('study_duration'), // Minutes planned
  actualStudyTime: integer('actual_study_time'), // Minutes actually studied
  
  // Academic Pressure
  upcomingDeadlines: integer('upcoming_deadlines'),
  assignmentLoad: varchar('assignment_load', { length: 20 }), // light, moderate, heavy, overwhelming
  examPressure: integer('exam_pressure'), // 1-10 scale
  
  // Social and Support
  socialInteraction: integer('social_interaction'), // 1-10 scale
  supportSystemAccess: integer('support_system_access'), // 1-10 scale
  
  // Notes and Reflections
  dailyReflection: text('daily_reflection'),
  gratitudeNote: text('gratitude_note'),
  tomorrowGoals: jsonb('tomorrow_goals').default([]),
  
  // AI Analysis
  wellnessScore: decimal('wellness_score', { precision: 5, scale: 2 }),
  riskLevel: varchar('risk_level', { length: 20 }), // low, moderate, high, critical
  aiRecommendations: jsonb('ai_recommendations').default([]),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('student_wellness_user_idx').on(table.userId),
  dateIdx: index('student_wellness_date_idx').on(table.date),
  stressIdx: index('student_wellness_stress_idx').on(table.stressLevel),
  riskIdx: index('student_wellness_risk_idx').on(table.riskLevel)
}));

// Peer Tutoring Marketplace
export const peerTutoring = pgTable('peer_tutoring', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  
  tutorId: integer('tutor_id').references(() => users.id).notNull(),
  studentId: integer('student_id').references(() => users.id).notNull(),
  classroomId: integer('classroom_id').references(() => classrooms.id),
  
  // Session Details
  subject: varchar('subject', { length: 100 }).notNull(),
  topic: varchar('topic', { length: 200 }),
  difficulty: varchar('difficulty', { length: 20 }),
  sessionType: varchar('session_type', { length: 50 }), // one_on_one, group, drop_in, scheduled
  
  // Timing
  scheduledStartTime: timestamp('scheduled_start_time'),
  scheduledEndTime: timestamp('scheduled_end_time'),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  duration: integer('duration'), // Minutes
  
  // Location and Format
  format: varchar('format', { length: 30 }).notNull(), // online, in_person, hybrid
  location: varchar('location', { length: 200 }),
  meetingLink: text('meeting_link'),
  
  // Content and Resources
  sessionGoals: jsonb('session_goals').default([]),
  materialsUsed: jsonb('materials_used').default([]),
  studyGeniumContent: jsonb('study_genium_content').default([]), // Flashcards, notes, quizzes used
  
  // Session Outcomes
  conceptsCovered: jsonb('concepts_covered').default([]),
  improvementAreas: jsonb('improvement_areas').default([]),
  homeworkHelp: jsonb('homework_help').default([]),
  
  // Feedback and Ratings
  tutorRating: integer('tutor_rating'), // 1-5 from student
  studentRating: integer('student_rating'), // 1-5 from tutor
  tutorFeedback: text('tutor_feedback'),
  studentFeedback: text('student_feedback'),
  
  // Session Quality Metrics
  knowledgeGain: decimal('knowledge_gain', { precision: 5, scale: 2 }), // Pre/post session assessment
  confidenceImprovement: integer('confidence_improvement'), // 1-10 scale
  sessionEffectiveness: decimal('session_effectiveness', { precision: 5, scale: 2 }),
  
  // Points and Rewards
  pointsEarned: integer('points_earned').default(0), // Tutor points
  pointsSpent: integer('points_spent').default(0), // Student points (if any)
  
  // Status
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, in_progress, completed, cancelled, no_show
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tutorIdx: index('peer_tutoring_tutor_idx').on(table.tutorId),
  studentIdx: index('peer_tutoring_student_idx').on(table.studentId),
  classroomIdx: index('peer_tutoring_classroom_idx').on(table.classroomId),
  subjectIdx: index('peer_tutoring_subject_idx').on(table.subject),
  statusIdx: index('peer_tutoring_status_idx').on(table.status),
  scheduledIdx: index('peer_tutoring_scheduled_idx').on(table.scheduledStartTime)
}));

// Study Streak Tracking and Gamification
export const studyStreaks = pgTable('study_streaks', {
  id: serial('id').primaryKey(),
  streakId: uuid('streak_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Streak Details
  streakType: varchar('streak_type', { length: 50 }).notNull(), // daily_study, flashcard_review, assignment_submission, note_taking, quiz_completion
  currentStreak: integer('current_streak').default(0), // Current consecutive days
  longestStreak: integer('longest_streak').default(0), // Personal best
  totalDays: integer('total_days').default(0), // Total days participated
  
  // Streak Configuration
  minimumRequirement: integer('minimum_requirement').default(15), // Minutes or count required per day
  requirementType: varchar('requirement_type', { length: 20 }).default('minutes'), // minutes, count, completion
  
  // Time Tracking
  lastActivityDate: timestamp('last_activity_date'),
  streakStartDate: timestamp('streak_start_date'),
  lastBrokenDate: timestamp('last_broken_date'),
  
  // Rewards and Milestones
  milestonesReached: jsonb('milestones_reached').default([]),
  totalPointsEarned: integer('total_points_earned').default(0),
  currentRewardTier: varchar('current_reward_tier', { length: 30 }).default('bronze'), // bronze, silver, gold, platinum, diamond
  
  // Progress Insights
  weeklyAverage: decimal('weekly_average', { precision: 5, scale: 2 }),
  monthlyAverage: decimal('monthly_average', { precision: 5, scale: 2 }),
  consistencyScore: decimal('consistency_score', { precision: 5, scale: 2 }), // How consistent the streak is
  
  // Motivation and Support
  motivationalLevel: varchar('motivational_level', { length: 20 }).default('building'), // building, maintaining, strong, champion
  reminderPreferences: jsonb('reminder_preferences').default({}),
  
  // Status
  isActive: boolean('is_active').default(true),
  isPaused: boolean('is_paused').default(false),
  pauseReason: text('pause_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('study_streaks_user_idx').on(table.userId),
  typeIdx: index('study_streaks_type_idx').on(table.streakType),
  currentStreakIdx: index('study_streaks_current_idx').on(table.currentStreak),
  activeIdx: index('study_streaks_active_idx').on(table.isActive),
  lastActivityIdx: index('study_streaks_last_activity_idx').on(table.lastActivityDate)
}));

// Learning Analytics and Insights
export const learningAnalytics = pgTable('learning_analytics', {
  id: serial('id').primaryKey(),
  analyticsId: uuid('analytics_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Time Period
  periodType: varchar('period_type', { length: 20 }).notNull(), // daily, weekly, monthly, semester
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Study Metrics
  totalStudyTime: integer('total_study_time').default(0), // Minutes
  averageDailyStudyTime: decimal('average_daily_study_time', { precision: 5, scale: 2 }),
  studySessionCount: integer('study_session_count').default(0),
  averageSessionLength: decimal('average_session_length', { precision: 5, scale: 2 }),
  
  // Content Engagement
  flashcardsStudied: integer('flashcards_studied').default(0),
  flashcardAccuracy: decimal('flashcard_accuracy', { precision: 5, scale: 2 }),
  notesCreated: integer('notes_created').default(0),
  notesReviewed: integer('notes_reviewed').default(0),
  quizzesCompleted: integer('quizzes_completed').default(0),
  quizAverageScore: decimal('quiz_average_score', { precision: 5, scale: 2 }),
  
  // Academic Performance
  assignmentsSubmitted: integer('assignments_submitted').default(0),
  assignmentAverageGrade: decimal('assignment_average_grade', { precision: 5, scale: 2 }),
  improvementTrend: varchar('improvement_trend', { length: 20 }), // improving, stable, declining
  
  // Learning Patterns
  mostActiveTimeOfDay: varchar('most_active_time_of_day', { length: 20 }),
  preferredStudyDuration: integer('preferred_study_duration'), // Minutes
  peakPerformanceDays: jsonb('peak_performance_days').default([]),
  strugglingSubjects: jsonb('struggling_subjects').default([]),
  strongSubjects: jsonb('strong_subjects').default([]),
  
  // Behavioral Insights
  procrastinationScore: decimal('procrastination_score', { precision: 5, scale: 2 }),
  consistencyScore: decimal('consistency_score', { precision: 5, scale: 2 }),
  motivationTrend: varchar('motivation_trend', { length: 20 }), // increasing, stable, decreasing
  stressTrend: varchar('stress_trend', { length: 20 }), // increasing, stable, decreasing
  
  // AI-Generated Insights
  keyInsights: jsonb('key_insights').default([]),
  recommendations: jsonb('recommendations').default([]),
  predictionAccuracy: decimal('prediction_accuracy', { precision: 5, scale: 2 }),
  
  // Comparison Metrics
  percentileRank: decimal('percentile_rank', { precision: 5, scale: 2 }), // Compared to peers
  improvementRate: decimal('improvement_rate', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('learning_analytics_user_idx').on(table.userId),
  periodIdx: index('learning_analytics_period_idx').on(table.periodType, table.periodStart),
  studyTimeIdx: index('learning_analytics_study_time_idx').on(table.totalStudyTime),
  improvementIdx: index('learning_analytics_improvement_idx').on(table.improvementTrend)
}));

// Emergency Academic Support System
export const academicSupportTickets = pgTable('academic_support_tickets', {
  id: serial('id').primaryKey(),
  ticketId: uuid('ticket_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  classroomId: integer('classroom_id').references(() => classrooms.id),
  
  // Ticket Details
  urgencyLevel: varchar('urgency_level', { length: 20 }).notNull(), // low, medium, high, emergency
  supportType: varchar('support_type', { length: 50 }).notNull(), // academic_help, technical_issue, wellness_concern, assignment_clarification, study_strategy
  subject: varchar('subject', { length: 100 }),
  
  // Problem Description
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  specificConcerns: jsonb('specific_concerns').default([]),
  attachments: jsonb('attachments').default([]),
  
  // Academic Context
  assignmentId: varchar('assignment_id', { length: 100 }),
  dueDate: timestamp('due_date'),
  currentGrade: decimal('current_grade', { precision: 5, scale: 2 }),
  strugglingAreas: jsonb('struggling_areas').default([]),
  
  // Support Provided
  responseTime: integer('response_time'), // Minutes to first response
  resolutionTime: integer('resolution_time'), // Minutes to resolution
  supportActions: jsonb('support_actions').default([]),
  resourcesProvided: jsonb('resources_provided').default([]),
  
  // Follow-up
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: timestamp('follow_up_date'),
  satisfactionRating: integer('satisfaction_rating'), // 1-5
  
  // Staff Assignment
  assignedStaffId: integer('assigned_staff_id').references(() => users.id),
  
  // Status Tracking
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, waiting_response, resolved, closed
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, critical
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at')
}, (table) => ({
  userIdx: index('academic_support_tickets_user_idx').on(table.userId),
  urgencyIdx: index('academic_support_tickets_urgency_idx').on(table.urgencyLevel),
  statusIdx: index('academic_support_tickets_status_idx').on(table.status),
  typeIdx: index('academic_support_tickets_type_idx').on(table.supportType),
  createdIdx: index('academic_support_tickets_created_idx').on(table.createdAt)
}));

// Smart Study Recommendations Engine
export const studyRecommendations = pgTable('study_recommendations', {
  id: serial('id').primaryKey(),
  recommendationId: uuid('recommendation_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Recommendation Context
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // study_method, content_review, time_management, stress_reduction, skill_building
  category: varchar('category', { length: 50 }), // flashcards, notes, quizzes, study_groups, breaks, exercise
  
  // Recommendation Details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  actionItems: jsonb('action_items').default([]),
  estimatedTimeRequired: integer('estimated_time_required'), // Minutes
  
  // Triggering Factors
  basedOnData: jsonb('based_on_data').default([]), // What data triggered this recommendation
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
  relevanceScore: decimal('relevance_score', { precision: 5, scale: 2 }),
  
  // Targeting
  subject: varchar('subject', { length: 100 }),
  skillLevel: varchar('skill_level', { length: 20 }), // beginner, intermediate, advanced
  learningStyle: varchar('learning_style', { length: 50 }),
  
  // Expected Outcomes
  expectedBenefits: jsonb('expected_benefits').default([]),
  successMetrics: jsonb('success_metrics').default([]),
  
  // User Interaction
  viewedAt: timestamp('viewed_at'),
  implementedAt: timestamp('implemented_at'),
  dismissedAt: timestamp('dismissed_at'),
  feedbackRating: integer('feedback_rating'), // 1-5
  userFeedback: text('user_feedback'),
  
  // Results Tracking
  wasImplemented: boolean('was_implemented').default(false),
  wasEffective: boolean('was_effective'),
  effectivenessScore: decimal('effectiveness_score', { precision: 5, scale: 2 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, viewed, implemented, dismissed, expired
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high
  
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('study_recommendations_user_idx').on(table.userId),
  typeIdx: index('study_recommendations_type_idx').on(table.recommendationType),
  statusIdx: index('study_recommendations_status_idx').on(table.status),
  priorityIdx: index('study_recommendations_priority_idx').on(table.priority),
  expiresIdx: index('study_recommendations_expires_idx').on(table.expiresAt)
}));

// Define relationships
export const aiStudyBuddyRelations = relations(aiStudyBuddy, ({ one, many }) => ({
  user: one(users, {
    fields: [aiStudyBuddy.userId],
    references: [users.id]
  }),
  conversations: many(studyBuddyConversations)
}));

export const studyBuddyConversationsRelations = relations(studyBuddyConversations, ({ one }) => ({
  buddy: one(aiStudyBuddy, {
    fields: [studyBuddyConversations.buddyId],
    references: [aiStudyBuddy.id]
  }),
  user: one(users, {
    fields: [studyBuddyConversations.userId],
    references: [users.id]
  })
}));

export const studentWellnessRelations = relations(studentWellness, ({ one }) => ({
  user: one(users, {
    fields: [studentWellness.userId],
    references: [users.id]
  })
}));

export const peerTutoringRelations = relations(peerTutoring, ({ one }) => ({
  tutor: one(users, {
    fields: [peerTutoring.tutorId],
    references: [users.id]
  }),
  student: one(users, {
    fields: [peerTutoring.studentId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [peerTutoring.classroomId],
    references: [classrooms.id]
  })
}));

export const studyStreaksRelations = relations(studyStreaks, ({ one }) => ({
  user: one(users, {
    fields: [studyStreaks.userId],
    references: [users.id]
  })
}));

export const learningAnalyticsRelations = relations(learningAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [learningAnalytics.userId],
    references: [users.id]
  })
}));

export const academicSupportTicketsRelations = relations(academicSupportTickets, ({ one }) => ({
  user: one(users, {
    fields: [academicSupportTickets.userId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [academicSupportTickets.classroomId],
    references: [classrooms.id]
  }),
  assignedStaff: one(users, {
    fields: [academicSupportTickets.assignedStaffId],
    references: [users.id]
  })
}));

export const studyRecommendationsRelations = relations(studyRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [studyRecommendations.userId],
    references: [users.id]
  })
}));