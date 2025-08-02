import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Intelligent Study Plans with ML Recommendations
export const studyPlans = pgTable('study_plans', {
  id: serial('id').primaryKey(),
  planId: uuid('plan_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Plan metadata
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  planType: varchar('plan_type', { length: 50 }).default('custom'), // custom, ai_generated, template, exam_prep
  
  // Academic context
  subject: varchar('subject', { length: 100 }),
  course: varchar('course', { length: 100 }),
  gradeLevel: varchar('grade_level', { length: 50 }),
  institution: varchar('institution', { length: 100 }),
  
  // Goals and objectives
  primaryGoal: varchar('primary_goal', { length: 200 }).notNull(),
  learningObjectives: jsonb('learning_objectives').default([]),
  targetGrade: varchar('target_grade', { length: 10 }),
  targetDate: timestamp('target_date'),
  
  // Scheduling and duration
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  totalPlannedHours: decimal('total_planned_hours', { precision: 8, scale: 2 }),
  dailyStudyTime: integer('daily_study_time'), // Minutes per day
  preferredStudyTimes: jsonb('preferred_study_times').default([]), // Time blocks
  
  // Difficulty and pacing
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('medium'),
  pacingStrategy: varchar('pacing_strategy', { length: 50 }).default('balanced'), // intensive, balanced, relaxed
  adaptiveScheduling: boolean('adaptive_scheduling').default(true),
  
  // AI and ML features
  aiGenerated: boolean('ai_generated').default(false),
  mlRecommendations: jsonb('ml_recommendations').default({}),
  personalizedContent: jsonb('personalized_content').default([]),
  learningPathOptimization: boolean('learning_path_optimization').default(true),
  
  // Progress tracking
  completionPercentage: decimal('completion_percentage', { precision: 5, scale: 2 }).default('0'),
  totalStudiedHours: decimal('total_studied_hours', { precision: 8, scale: 2 }).default('0'),
  currentMilestone: integer('current_milestone').default(1),
  
  // Performance metrics
  averageSessionRating: decimal('average_session_rating', { precision: 3, scale: 2 }),
  adherenceScore: decimal('adherence_score', { precision: 5, scale: 2 }).default('100'),
  effectivenessScore: decimal('effectiveness_score', { precision: 5, scale: 2 }),
  
  // Collaboration
  isShared: boolean('is_shared').default(false),
  collaborators: jsonb('collaborators').default([]),
  studyGroupId: integer('study_group_id'),
  
  // Status and metadata
  status: varchar('status', { length: 20 }).default('active'), // active, paused, completed, archived
  visibility: varchar('visibility', { length: 20 }).default('private'), // private, shared, public
  tags: jsonb('tags').default([]),
  
  // Reminders and notifications
  reminderSettings: jsonb('reminder_settings').default({}),
  notificationPreferences: jsonb('notification_preferences').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow()
}, (table) => ({
  userIdx: index('study_plans_user_idx').on(table.userId),
  subjectIdx: index('study_plans_subject_idx').on(table.subject),
  statusIdx: index('study_plans_status_idx').on(table.status),
  targetDateIdx: index('study_plans_target_date_idx').on(table.targetDate),
  completionIdx: index('study_plans_completion_idx').on(table.completionPercentage)
}));

// Study Plan Milestones and Phases
export const studyMilestones = pgTable('study_milestones', {
  id: serial('id').primaryKey(),
  milestoneId: uuid('milestone_id').defaultRandom().notNull().unique(),
  
  planId: integer('plan_id').references(() => studyPlans.id).notNull(),
  
  // Milestone details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  milestoneType: varchar('milestone_type', { length: 50 }).default('topic'), // topic, exam, assignment, review
  
  // Sequencing
  order: integer('order').notNull(),
  isRequired: boolean('is_required').default(true),
  dependencies: jsonb('dependencies').default([]), // Prerequisite milestones
  
  // Content and objectives
  learningOutcomes: jsonb('learning_outcomes').default([]),
  topics: jsonb('topics').default([]),
  resources: jsonb('resources').default([]),
  estimatedDuration: integer('estimated_duration'), // Minutes
  
  // Scheduling
  plannedStartDate: timestamp('planned_start_date'),
  plannedEndDate: timestamp('planned_end_date'),
  actualStartDate: timestamp('actual_start_date'),
  actualEndDate: timestamp('actual_end_date'),
  
  // Progress tracking
  status: varchar('status', { length: 20 }).default('not_started'), // not_started, in_progress, completed, skipped
  completionPercentage: decimal('completion_percentage', { precision: 5, scale: 2 }).default('0'),
  masteryLevel: decimal('mastery_level', { precision: 5, scale: 2 }).default('0'),
  
  // Assessment and validation
  assessmentType: varchar('assessment_type', { length: 50 }), // quiz, assignment, practice, self_assessment
  passingScore: decimal('passing_score', { precision: 5, scale: 2 }),
  actualScore: decimal('actual_score', { precision: 5, scale: 2 }),
  attempts: integer('attempts').default(0),
  
  // Quality metrics
  difficultyRating: integer('difficulty_rating'), // 1-5 user rating
  satisfactionRating: integer('satisfaction_rating'), // 1-5 user rating
  timeSpent: integer('time_spent').default(0), // Actual minutes spent
  
  // AI optimization
  aiOptimizations: jsonb('ai_optimizations').default({}),
  adaptiveAdjustments: jsonb('adaptive_adjustments').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  planIdx: index('study_milestones_plan_idx').on(table.planId),
  orderIdx: index('study_milestones_order_idx').on(table.order),
  statusIdx: index('study_milestones_status_idx').on(table.status),
  scheduledIdx: index('study_milestones_scheduled_idx').on(table.plannedStartDate)
}));

// Study Sessions with Detailed Tracking
export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  planId: integer('plan_id').references(() => studyPlans.id),
  milestoneId: integer('milestone_id').references(() => studyMilestones.id),
  
  // Session metadata
  title: varchar('title', { length: 200 }),
  sessionType: varchar('session_type', { length: 50 }).default('study'), // study, review, practice, break, assessment
  subject: varchar('subject', { length: 100 }),
  topics: jsonb('topics').default([]),
  
  // Timing and duration
  plannedStartTime: timestamp('planned_start_time'),
  plannedEndTime: timestamp('planned_end_time'),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  plannedDuration: integer('planned_duration'), // Minutes
  actualDuration: integer('actual_duration'), // Minutes
  
  // Session configuration
  studyMethod: varchar('study_method', { length: 50 }), // reading, practice, flashcards, video, discussion
  environment: varchar('environment', { length: 50 }), // home, library, cafe, online
  deviceUsed: varchar('device_used', { length: 50 }), // laptop, tablet, phone, paper
  
  // Focus and productivity
  pomodoroSessions: integer('pomodoro_sessions').default(0),
  breaksTaken: integer('breaks_taken').default(0),
  distractionCount: integer('distraction_count').default(0),
  focusScore: decimal('focus_score', { precision: 5, scale: 2 }),
  
  // Content and activities
  materialsUsed: jsonb('materials_used').default([]),
  activitiesCompleted: jsonb('activities_completed').default([]),
  notesCreated: integer('notes_created').default(0),
  questionsAsked: integer('questions_asked').default(0),
  
  // Performance and outcomes
  comprehensionScore: decimal('comprehension_score', { precision: 5, scale: 2 }),
  retentionScore: decimal('retention_score', { precision: 5, scale: 2 }),
  satisfactionRating: integer('satisfaction_rating'), // 1-5
  difficultyRating: integer('difficulty_rating'), // 1-5
  
  // Goals and achievements
  learningGoals: jsonb('learning_goals').default([]),
  goalsAchieved: jsonb('goals_achieved').default([]),
  keyTakeaways: jsonb('key_takeaways').default([]),
  areasForImprovement: jsonb('areas_for_improvement').default([]),
  
  // Social and collaboration
  studyPartners: jsonb('study_partners').default([]),
  isGroupSession: boolean('is_group_session').default(false),
  collaborationRating: integer('collaboration_rating'),
  
  // Status and completion
  status: varchar('status', { length: 20 }).default('planned'), // planned, active, completed, cancelled
  completionStatus: varchar('completion_status', { length: 20 }), // completed, partial, cancelled
  
  // AI insights and recommendations
  aiInsights: jsonb('ai_insights').default({}),
  nextSessionRecommendations: jsonb('next_session_recommendations').default([]),
  performancePredictions: jsonb('performance_predictions').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('study_sessions_user_idx').on(table.userId),
  planIdx: index('study_sessions_plan_idx').on(table.planId),
  milestoneIdx: index('study_sessions_milestone_idx').on(table.milestoneId),
  statusIdx: index('study_sessions_status_idx').on(table.status),
  scheduledIdx: index('study_sessions_scheduled_idx').on(table.plannedStartTime),
  subjectIdx: index('study_sessions_subject_idx').on(table.subject)
}));

// Calendar Integration and Scheduling
export const studyCalendar = pgTable('study_calendar', {
  id: serial('id').primaryKey(),
  eventId: uuid('event_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  planId: integer('plan_id').references(() => studyPlans.id),
  sessionId: integer('session_id').references(() => studySessions.id),
  
  // Event details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 50 }).default('study'), // study, exam, assignment, deadline, break
  
  // Timing
  startDateTime: timestamp('start_date_time').notNull(),
  endDateTime: timestamp('end_date_time').notNull(),
  allDay: boolean('all_day').default(false),
  timeZone: varchar('time_zone', { length: 50 }).default('UTC'),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern').default({}), // RRULE-like pattern
  recurrenceEnd: timestamp('recurrence_end'),
  
  // Location and context
  location: varchar('location', { length: 200 }),
  isVirtual: boolean('is_virtual').default(false),
  meetingLink: text('meeting_link'),
  
  // Priority and urgency
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, critical
  urgency: integer('urgency').default(3), // 1-5 scale
  importance: integer('importance').default(3), // 1-5 scale
  
  // Reminders and notifications
  reminders: jsonb('reminders').default([]), // Array of reminder settings
  notificationsSent: jsonb('notifications_sent').default([]),
  
  // Attendees and collaboration
  attendees: jsonb('attendees').default([]),
  isGroupEvent: boolean('is_group_event').default(false),
  createdByAI: boolean('created_by_ai').default(false),
  
  // Calendar integration
  externalCalendarId: varchar('external_calendar_id', { length: 200 }),
  calendarProvider: varchar('calendar_provider', { length: 50 }), // google, outlook, apple, ics
  syncStatus: varchar('sync_status', { length: 20 }).default('pending'),
  
  // Status and metadata
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, in_progress, completed, cancelled
  visibility: varchar('visibility', { length: 20 }).default('private'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color
  
  // Adaptive scheduling
  flexibilityWindow: integer('flexibility_window').default(0), // Minutes of flexibility
  autoReschedule: boolean('auto_reschedule').default(false),
  conflictResolution: varchar('conflict_resolution', { length: 50 }).default('manual'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('study_calendar_user_idx').on(table.userId),
  planIdx: index('study_calendar_plan_idx').on(table.planId),
  sessionIdx: index('study_calendar_session_idx').on(table.sessionId),
  dateRangeIdx: index('study_calendar_date_range_idx').on(table.startDateTime, table.endDateTime),
  typeIdx: index('study_calendar_type_idx').on(table.eventType),
  statusIdx: index('study_calendar_status_idx').on(table.status)
}));

// Study Plan Templates and Presets
export const studyPlanTemplates = pgTable('study_plan_templates', {
  id: serial('id').primaryKey(),
  templateId: uuid('template_id').defaultRandom().notNull().unique(),
  
  // Template metadata
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // exam_prep, course_completion, skill_building
  
  // Academic classification
  subject: varchar('subject', { length: 100 }),
  gradeLevel: varchar('grade_level', { length: 50 }),
  duration: integer('duration'), // Days
  difficulty: varchar('difficulty', { length: 20 }),
  
  // Template structure
  planStructure: jsonb('plan_structure').notNull(), // Complete plan template
  milestones: jsonb('milestones').default([]),
  defaultSchedule: jsonb('default_schedule').default({}),
  
  // Customization options
  customizableFields: jsonb('customizable_fields').default([]),
  requiredInputs: jsonb('required_inputs').default([]),
  optionalParameters: jsonb('optional_parameters').default({}),
  
  // Quality and usage
  rating: decimal('rating', { precision: 3, scale: 2 }),
  usageCount: integer('usage_count').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }),
  
  // Authorship and verification
  createdBy: integer('created_by').references(() => users.id),
  isOfficial: boolean('is_official').default(false),
  isVerified: boolean('is_verified').default(false),
  isPublic: boolean('is_public').default(false),
  
  // AI and ML features
  aiOptimized: boolean('ai_optimized').default(false),
  adaptiveFeatures: jsonb('adaptive_features').default([]),
  mlInsights: jsonb('ml_insights').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  categoryIdx: index('study_plan_templates_category_idx').on(table.category),
  subjectIdx: index('study_plan_templates_subject_idx').on(table.subject),
  ratingIdx: index('study_plan_templates_rating_idx').on(table.rating),
  publicIdx: index('study_plan_templates_public_idx').on(table.isPublic)
}));

// Study Analytics and Progress Tracking
export const studyAnalytics = pgTable('study_analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Time-based analytics
  totalStudyTime: bigint('total_study_time', { mode: 'number' }).default(0), // Minutes
  studyTimeThisWeek: integer('study_time_this_week').default(0),
  studyTimeThisMonth: integer('study_time_this_month').default(0),
  studyStreakDays: integer('study_streak_days').default(0),
  longestStudyStreak: integer('longest_study_streak').default(0),
  
  // Session analytics
  totalSessions: integer('total_sessions').default(0),
  averageSessionDuration: decimal('average_session_duration', { precision: 8, scale: 2 }),
  completedSessions: integer('completed_sessions').default(0),
  sessionCompletionRate: decimal('session_completion_rate', { precision: 5, scale: 2 }),
  
  // Performance metrics
  averageFocusScore: decimal('average_focus_score', { precision: 5, scale: 2 }),
  averageComprehensionScore: decimal('average_comprehension_score', { precision: 5, scale: 2 }),
  averageRetentionScore: decimal('average_retention_score', { precision: 5, scale: 2 }),
  overallProductivity: decimal('overall_productivity', { precision: 5, scale: 2 }),
  
  // Goal achievement
  plansCompleted: integer('plans_completed').default(0),
  milestonesAchieved: integer('milestones_achieved').default(0),
  targetsMet: integer('targets_met').default(0),
  goalAchievementRate: decimal('goal_achievement_rate', { precision: 5, scale: 2 }),
  
  // Study patterns
  preferredStudyTimes: jsonb('preferred_study_times').default([]),
  mostProductiveHours: jsonb('most_productive_hours').default([]),
  studyMethods: jsonb('study_methods').default({}), // Usage statistics per method
  subjectPerformance: jsonb('subject_performance').default({}),
  
  // Behavioral insights
  procrastinationTendency: decimal('procrastination_tendency', { precision: 5, scale: 2 }),
  consistencyScore: decimal('consistency_score', { precision: 5, scale: 2 }),
  adaptabilityScore: decimal('adaptability_score', { precision: 5, scale: 2 }),
  motivationLevel: decimal('motivation_level', { precision: 5, scale: 2 }),
  
  // Predictive analytics
  performanceTrends: jsonb('performance_trends').default({}),
  riskFactors: jsonb('risk_factors').default([]),
  successPredictors: jsonb('success_predictors').default([]),
  recommendedInterventions: jsonb('recommended_interventions').default([]),
  
  // Machine learning insights
  learningStyle: varchar('learning_style', { length: 50 }),
  cognitiveLoad: decimal('cognitive_load', { precision: 5, scale: 2 }),
  optimalStudyDuration: integer('optimal_study_duration'), // Minutes
  burnoutRisk: decimal('burnout_risk', { precision: 5, scale: 2 }),
  
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('study_analytics_user_idx').on(table.userId),
  lastAnalyzedIdx: index('study_analytics_last_analyzed_idx').on(table.lastAnalyzed)
}));

// Adaptive Learning Recommendations
export const adaptiveLearningRecommendations = pgTable('adaptive_learning_recommendations', {
  id: serial('id').primaryKey(),
  recommendationId: uuid('recommendation_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').references(() => users.id).notNull(),
  planId: integer('plan_id').references(() => studyPlans.id),
  
  // Recommendation details
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // schedule, content, method, pace
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  
  // AI/ML metadata
  generatedBy: varchar('generated_by', { length: 50 }).default('ml_model'), // ml_model, rule_engine, manual
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  modelVersion: varchar('model_version', { length: 50 }),
  
  // Recommendation content
  actionItems: jsonb('action_items').default([]),
  suggestedChanges: jsonb('suggested_changes').default({}),
  expectedOutcome: text('expected_outcome'),
  reasoning: text('reasoning'),
  
  // Implementation
  implementationDifficulty: varchar('implementation_difficulty', { length: 20 }), // easy, medium, hard
  estimatedImpact: decimal('estimated_impact', { precision: 5, scale: 2 }),
  timeToImplement: integer('time_to_implement'), // Minutes
  
  // User interaction
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected, implemented
  userFeedback: text('user_feedback'),
  userRating: integer('user_rating'), // 1-5
  
  // Effectiveness tracking
  implementedAt: timestamp('implemented_at'),
  measuredImpact: decimal('measured_impact', { precision: 5, scale: 2 }),
  actualOutcome: text('actual_outcome'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('adaptive_learning_recommendations_user_idx').on(table.userId),
  planIdx: index('adaptive_learning_recommendations_plan_idx').on(table.planId),
  typeIdx: index('adaptive_learning_recommendations_type_idx').on(table.recommendationType),
  statusIdx: index('adaptive_learning_recommendations_status_idx').on(table.status),
  priorityIdx: index('adaptive_learning_recommendations_priority_idx').on(table.priority)
}));

// Define relationships
export const studyPlansRelations = relations(studyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.id]
  }),
  milestones: many(studyMilestones),
  sessions: many(studySessions),
  calendarEvents: many(studyCalendar),
  recommendations: many(adaptiveLearningRecommendations)
}));

export const studyMilestonesRelations = relations(studyMilestones, ({ one, many }) => ({
  plan: one(studyPlans, {
    fields: [studyMilestones.planId],
    references: [studyPlans.id]
  }),
  sessions: many(studySessions)
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id]
  }),
  plan: one(studyPlans, {
    fields: [studySessions.planId],
    references: [studyPlans.id]
  }),
  milestone: one(studyMilestones, {
    fields: [studySessions.milestoneId],
    references: [studyMilestones.id]
  }),
  calendarEvent: one(studyCalendar, {
    fields: [studySessions.id],
    references: [studyCalendar.sessionId]
  })
}));

export const studyCalendarRelations = relations(studyCalendar, ({ one }) => ({
  user: one(users, {
    fields: [studyCalendar.userId],
    references: [users.id]
  }),
  plan: one(studyPlans, {
    fields: [studyCalendar.planId],
    references: [studyPlans.id]
  }),
  session: one(studySessions, {
    fields: [studyCalendar.sessionId],
    references: [studySessions.id]
  })
}));

export const studyPlanTemplatesRelations = relations(studyPlanTemplates, ({ one }) => ({
  createdBy: one(users, {
    fields: [studyPlanTemplates.createdBy],
    references: [users.id]
  })
}));

export const studyAnalyticsRelations = relations(studyAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [studyAnalytics.userId],
    references: [users.id]
  })
}));

export const adaptiveLearningRecommendationsRelations = relations(adaptiveLearningRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [adaptiveLearningRecommendations.userId],
    references: [users.id]
  }),
  plan: one(studyPlans, {
    fields: [adaptiveLearningRecommendations.planId],
    references: [studyPlans.id]
  })
}));