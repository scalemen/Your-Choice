import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// User learning preferences and personality
export const userPersonalization = pgTable('user_personalization', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Learning Style Assessment
  learningStyleVisual: decimal('learning_style_visual', { precision: 5, scale: 2 }).default('0.25'),
  learningStyleAuditory: decimal('learning_style_auditory', { precision: 5, scale: 2 }).default('0.25'),
  learningStyleKinesthetic: decimal('learning_style_kinesthetic', { precision: 5, scale: 2 }).default('0.25'),
  learningStyleReading: decimal('learning_style_reading', { precision: 5, scale: 2 }).default('0.25'),
  
  // Personality Traits (Big Five Model)
  personalityOpenness: decimal('personality_openness', { precision: 5, scale: 2 }).default('0.50'),
  personalityConscientiousness: decimal('personality_conscientiousness', { precision: 5, scale: 2 }).default('0.50'),
  personalityExtraversion: decimal('personality_extraversion', { precision: 5, scale: 2 }).default('0.50'),
  personalityAgreeableness: decimal('personality_agreeableness', { precision: 5, scale: 2 }).default('0.50'),
  personalityNeuroticism: decimal('personality_neuroticism', { precision: 5, scale: 2 }).default('0.50'),
  
  // Learning Preferences
  preferredStudyTime: varchar('preferred_study_time', { length: 20 }).default('morning'), // morning, afternoon, evening, night
  preferredSessionLength: integer('preferred_session_length').default(25), // in minutes
  preferredBreakLength: integer('preferred_break_length').default(5), // in minutes
  preferredDifficulty: varchar('preferred_difficulty', { length: 20 }).default('adaptive'),
  preferredPace: varchar('preferred_pace', { length: 20 }).default('moderate'), // slow, moderate, fast
  
  // Motivation and Goals
  motivationType: varchar('motivation_type', { length: 20 }).default('achievement'), // achievement, social, mastery, curiosity
  primaryGoal: varchar('primary_goal', { length: 50 }),
  secondaryGoals: jsonb('secondary_goals').default([]),
  targetGPA: decimal('target_gpa', { precision: 3, scale: 2 }),
  graduationDate: timestamp('graduation_date'),
  careerGoals: jsonb('career_goals').default([]),
  
  // AI Tutor Personality Preferences
  tutorPersonality: varchar('tutor_personality', { length: 20 }).default('encouraging'), // encouraging, challenging, patient, enthusiastic
  tutorFormality: varchar('tutor_formality', { length: 20 }).default('casual'), // formal, casual, friendly
  feedbackStyle: varchar('feedback_style', { length: 20 }).default('constructive'), // direct, constructive, gentle, detailed
  
  // Accessibility Preferences
  fontSizeMultiplier: decimal('font_size_multiplier', { precision: 3, scale: 2 }).default('1.00'),
  highContrast: boolean('high_contrast').default(false),
  reducedMotion: boolean('reduced_motion').default(false),
  screenReaderOptimized: boolean('screen_reader_optimized').default(false),
  colorBlindMode: varchar('color_blind_mode', { length: 20 }).default('none'),
  
  // Notification Preferences
  notificationsEnabled: boolean('notifications_enabled').default(true),
  studyReminders: boolean('study_reminders').default(true),
  achievementNotifications: boolean('achievement_notifications').default(true),
  socialNotifications: boolean('social_notifications').default(true),
  weeklyReports: boolean('weekly_reports').default(true),
  
  // Privacy Settings
  profileVisibility: varchar('profile_visibility', { length: 20 }).default('friends'), // public, friends, private
  studyStatsVisible: boolean('study_stats_visible').default(true),
  achievementsVisible: boolean('achievements_visible').default(true),
  allowDataForResearch: boolean('allow_data_for_research').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Learning behavior patterns tracked by AI
export const learningPatterns = pgTable('learning_patterns', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Study Behavior Patterns
  avgStudySessionLength: decimal('avg_study_session_length', { precision: 5, scale: 2 }),
  mostProductiveHour: integer('most_productive_hour'), // 0-23
  mostProductiveDay: integer('most_productive_day'), // 0-6 (Sunday-Saturday)
  attentionSpan: integer('attention_span'), // in minutes
  procrastinationTendency: decimal('procrastination_tendency', { precision: 5, scale: 2 }),
  
  // Learning Efficiency Metrics
  comprehensionSpeed: decimal('comprehension_speed', { precision: 5, scale: 2 }),
  retentionRate: decimal('retention_rate', { precision: 5, scale: 2 }),
  applicationAbility: decimal('application_ability', { precision: 5, scale: 2 }),
  problemSolvingSpeed: decimal('problem_solving_speed', { precision: 5, scale: 2 }),
  
  // Subject-specific patterns
  strongSubjects: jsonb('strong_subjects').default([]),
  weakSubjects: jsonb('weak_subjects').default([]),
  improvingSubjects: jsonb('improving_subjects').default([]),
  preferredTopics: jsonb('preferred_topics').default([]),
  
  // Interaction Patterns
  collaborationPreference: decimal('collaboration_preference', { precision: 5, scale: 2 }),
  competitivenesLevel: decimal('competitiveness_level', { precision: 5, scale: 2 }),
  helpSeekingBehavior: decimal('help_seeking_behavior', { precision: 5, scale: 2 }),
  riskTakingInLearning: decimal('risk_taking_in_learning', { precision: 5, scale: 2 }),
  
  // Adaptive Learning Factors
  difficultyAdaptationRate: decimal('difficulty_adaptation_rate', { precision: 5, scale: 2 }),
  contentPreferenceWeights: jsonb('content_preference_weights').default({}),
  learningPathOptimization: jsonb('learning_path_optimization').default({}),
  
  // Performance Trends
  overallTrend: varchar('overall_trend', { length: 20 }), // improving, stable, declining
  streakTendency: decimal('streak_tendency', { precision: 5, scale: 2 }),
  burnoutRisk: decimal('burnout_risk', { precision: 5, scale: 2 }),
  motivationLevel: decimal('motivation_level', { precision: 5, scale: 2 }),
  
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('learning_patterns_user_id_idx').on(table.userId),
  lastAnalyzedIdx: index('learning_patterns_last_analyzed_idx').on(table.lastAnalyzed)
}));

// AI-generated personalized recommendations
export const personalizedRecommendations = pgTable('personalized_recommendations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Recommendation Details
  type: varchar('type', { length: 50 }).notNull(), // study_schedule, content, method, goal, social
  category: varchar('category', { length: 50 }), // time_management, subject_focus, skill_building
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  actionableSteps: jsonb('actionable_steps').default([]),
  
  // Recommendation Metadata
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, urgent
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
  expectedImpact: varchar('expected_impact', { length: 20 }), // low, medium, high
  timeToImplement: integer('time_to_implement'), // in minutes
  
  // Personalization Context
  basedOnPatterns: jsonb('based_on_patterns').default([]),
  targetMetrics: jsonb('target_metrics').default([]),
  personalizationFactors: jsonb('personalization_factors').default({}),
  
  // User Interaction
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, dismissed, completed
  userFeedback: integer('user_feedback'), // 1-5 rating
  feedbackComments: text('feedback_comments'),
  implementationDate: timestamp('implementation_date'),
  completionDate: timestamp('completion_date'),
  
  // Effectiveness Tracking
  actualImpact: decimal('actual_impact', { precision: 5, scale: 2 }),
  followUpRecommendations: jsonb('follow_up_recommendations').default([]),
  
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('personalized_recommendations_user_id_idx').on(table.userId),
  statusIdx: index('personalized_recommendations_status_idx').on(table.status),
  priorityIdx: index('personalized_recommendations_priority_idx').on(table.priority)
}));

// Comprehensive leaderboards system
export const leaderboards = pgTable('leaderboards', {
  id: serial('id').primaryKey(),
  
  // Leaderboard Configuration
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // study_time, notes_created, quiz_scores, etc.
  subcategory: varchar('subcategory', { length: 50 }), // subject-specific, game-specific, etc.
  
  // Scope and Timing
  scope: varchar('scope', { length: 20 }).notNull(), // global, school, friends, class
  timeframe: varchar('timeframe', { length: 20 }).notNull(), // daily, weekly, monthly, yearly, all_time
  resetSchedule: varchar('reset_schedule', { length: 20 }), // daily, weekly, monthly, never
  
  // Calculation Rules
  metricType: varchar('metric_type', { length: 50 }).notNull(), // sum, average, max, count, ratio
  calculationFormula: text('calculation_formula'),
  minimumParticipation: integer('minimum_participation').default(1),
  
  // Display Settings
  maxDisplayRank: integer('max_display_rank').default(100),
  showScores: boolean('show_scores').default(true),
  showProgress: boolean('show_progress').default(true),
  showTrends: boolean('show_trends').default(true),
  
  // Rewards and Recognition
  rewardsEnabled: boolean('rewards_enabled').default(true),
  badgeSystem: jsonb('badge_system').default({}),
  pointMultipliers: jsonb('point_multipliers').default({}),
  
  // Status and Visibility
  isActive: boolean('is_active').default(true),
  isVisible: boolean('is_visible').default(true),
  requiresQualification: boolean('requires_qualification').default(false),
  qualificationCriteria: jsonb('qualification_criteria').default({}),
  
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  categoryIdx: index('leaderboards_category_idx').on(table.category),
  scopeIdx: index('leaderboards_scope_idx').on(table.scope),
  timeframeIdx: index('leaderboards_timeframe_idx').on(table.timeframe),
  activeIdx: index('leaderboards_active_idx').on(table.isActive)
}));

// Leaderboard entries for all users
export const personalizationLeaderboardEntries = pgTable('personalization_leaderboard_entries', {
  id: serial('id').primaryKey(),
  leaderboardId: integer('leaderboard_id').references(() => leaderboards.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Ranking Data
  rank: integer('rank').notNull(),
  score: decimal('score', { precision: 15, scale: 2 }).notNull(),
  previousRank: integer('previous_rank'),
  previousScore: decimal('previous_score', { precision: 15, scale: 2 }),
  
  // Detailed Metrics
  rawMetrics: jsonb('raw_metrics').default({}),
  calculatedMetrics: jsonb('calculated_metrics').default({}),
  trendData: jsonb('trend_data').default([]),
  
  // Achievement Tracking
  personalBest: boolean('personal_best').default(false),
  streakCount: integer('streak_count').default(0),
  achievementsUnlocked: jsonb('achievements_unlocked').default([]),
  
  // Participation Context
  participationStartDate: timestamp('participation_start_date'),
  lastActivity: timestamp('last_activity'),
  totalParticipationTime: integer('total_participation_time'), // in minutes
  
  // Social Features
  shareableAchievement: boolean('shareable_achievement').default(true),
  celebrationStatus: varchar('celebration_status', { length: 20 }).default('pending'),
  
  updatedAt: timestamp('updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  leaderboardUserIdx: index('leaderboard_entries_board_user_idx').on(table.leaderboardId, table.userId),
  rankIdx: index('leaderboard_entries_rank_idx').on(table.leaderboardId, table.rank),
  scoreIdx: index('leaderboard_entries_score_idx').on(table.leaderboardId, table.score),
  lastActivityIdx: index('leaderboard_entries_last_activity_idx').on(table.lastActivity)
}));

// Comprehensive achievement system
export const achievementCategories = pgTable('achievement_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const personalizationAchievements = pgTable('personalization_achievements', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => achievementCategories.id),
  
  // Achievement Details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  fullDescription: text('full_description'),
  icon: varchar('icon', { length: 100 }),
  badge: varchar('badge', { length: 100 }),
  
  // Achievement Properties
  type: varchar('type', { length: 30 }).notNull(), // milestone, streak, competitive, collaborative, mastery
  difficulty: varchar('difficulty', { length: 20 }).default('medium'), // easy, medium, hard, legendary
  rarity: varchar('rarity', { length: 20 }).default('common'), // common, uncommon, rare, epic, legendary
  
  // Unlock Criteria
  criteria: jsonb('criteria').notNull(),
  progressTrackable: boolean('progress_trackable').default(true),
  maxProgress: integer('max_progress'),
  
  // Rewards
  pointsReward: integer('points_reward').default(0),
  badgeReward: varchar('badge_reward', { length: 100 }),
  unlockables: jsonb('unlockables').default([]),
  
  // Metadata
  tags: jsonb('tags').default([]),
  prerequisites: jsonb('prerequisites').default([]),
  isSecret: boolean('is_secret').default(false),
  isActive: boolean('is_active').default(true),
  
  // Statistics
  totalUnlocks: integer('total_unlocks').default(0),
  unlockRate: decimal('unlock_rate', { precision: 5, scale: 4 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  categoryIdx: index('achievements_category_idx').on(table.categoryId),
  typeIdx: index('achievements_type_idx').on(table.type),
  difficultyIdx: index('achievements_difficulty_idx').on(table.difficulty),
  rarityIdx: index('achievements_rarity_idx').on(table.rarity)
}));

// User achievement progress and unlocks
export const userAchievementProgress = pgTable('user_achievement_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  achievementId: integer('achievement_id').references(() => personalizationAchievements.id).notNull(),
  
  // Progress Tracking
  currentProgress: integer('current_progress').default(0),
  isUnlocked: boolean('is_unlocked').default(false),
  unlockedAt: timestamp('unlocked_at'),
  progressHistory: jsonb('progress_history').default([]),
  
  // Context and Recognition
  unlockContext: jsonb('unlock_context').default({}),
  isDisplayed: boolean('is_displayed').default(true),
  isFavorite: boolean('is_favorite').default(false),
  shareCount: integer('share_count').default(0),
  celebrationViewed: boolean('celebration_viewed').default(false),
  
  updatedAt: timestamp('updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userAchievementIdx: index('user_achievement_progress_user_achievement_idx').on(table.userId, table.achievementId),
  unlockedIdx: index('user_achievement_progress_unlocked_idx').on(table.userId, table.isUnlocked),
  progressIdx: index('user_achievement_progress_progress_idx').on(table.userId, table.currentProgress)
}));

// Social comparison and friend connections
export const personalizationFriendships = pgTable('personalization_friendships', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id').references(() => users.id).notNull(),
  addresseeId: integer('addressee_id').references(() => users.id).notNull(),
  
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, blocked
  requestedAt: timestamp('requested_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  
  // Friendship Metrics
  interactionScore: decimal('interaction_score', { precision: 5, scale: 2 }).default('0.00'),
  studySessionsTogether: integer('study_sessions_together').default(0),
  competitiveMatches: integer('competitive_matches').default(0),
  helpExchanges: integer('help_exchanges').default(0),
  
  // Privacy Settings
  shareStudyStats: boolean('share_study_stats').default(true),
  shareAchievements: boolean('share_achievements').default(true),
  shareLeaderboards: boolean('share_leaderboards').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  requesterIdx: index('friendships_requester_idx').on(table.requesterId),
  addresseeIdx: index('friendships_addressee_idx').on(table.addresseeId),
  statusIdx: index('friendships_status_idx').on(table.status)
}));

// Study groups and social learning
export const studyGroups = pgTable('study_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  avatar: text('avatar'),
  
  // Group Configuration
  createdBy: integer('created_by').references(() => users.id).notNull(),
  subject: varchar('subject', { length: 100 }),
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('intermediate'),
  maxMembers: integer('max_members').default(20),
  currentMembers: integer('current_members').default(1),
  
  // Group Settings
  isPublic: boolean('is_public').default(false),
  requiresApproval: boolean('requires_approval').default(true),
  allowInvites: boolean('allow_invites').default(true),
  competitiveMode: boolean('competitive_mode').default(false),
  
  // Group Goals and Progress
  groupGoals: jsonb('group_goals').default([]),
  currentChallenges: jsonb('current_challenges').default([]),
  achievedMilestones: jsonb('achieved_milestones').default([]),
  
  // Activity Metrics
  totalStudyTime: integer('total_study_time').default(0), // in minutes
  totalSessions: integer('total_sessions').default(0),
  averageEngagement: decimal('average_engagement', { precision: 5, scale: 2 }),
  
  // Status
  isActive: boolean('is_active').default(true),
  lastActivity: timestamp('last_activity').defaultNow(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  createdByIdx: index('study_groups_created_by_idx').on(table.createdBy),
  subjectIdx: index('study_groups_subject_idx').on(table.subject),
  publicIdx: index('study_groups_public_idx').on(table.isPublic),
  activeIdx: index('study_groups_active_idx').on(table.isActive)
}));

// Study group memberships
export const studyGroupMemberships = pgTable('study_group_memberships', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').references(() => studyGroups.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  role: varchar('role', { length: 20 }).default('member'), // owner, admin, moderator, member
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, banned
  
  // Member Contribution
  contributionScore: decimal('contribution_score', { precision: 5, scale: 2 }).default('0.00'),
  studyTimeContribution: integer('study_time_contribution').default(0),
  helpfulness: decimal('helpfulness', { precision: 5, scale: 2 }).default('0.00'),
  
  // Participation Metrics
  sessionsAttended: integer('sessions_attended').default(0),
  questionsAsked: integer('questions_asked').default(0),
  answersProvided: integer('answers_provided').default(0),
  resourcesShared: integer('resources_shared').default(0),
  
  joinedAt: timestamp('joined_at').defaultNow(),
  lastActive: timestamp('last_active').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  groupUserIdx: index('study_group_memberships_group_user_idx').on(table.groupId, table.userId),
  roleIdx: index('study_group_memberships_role_idx').on(table.role),
  statusIdx: index('study_group_memberships_status_idx').on(table.status)
}));

// Define relationships
export const userPersonalizationRelations = relations(userPersonalization, ({ one }) => ({
  user: one(users, {
    fields: [userPersonalization.userId],
    references: [users.id]
  })
}));

export const learningPatternsRelations = relations(learningPatterns, ({ one }) => ({
  user: one(users, {
    fields: [learningPatterns.userId],
    references: [users.id]
  })
}));

export const personalizedRecommendationsRelations = relations(personalizedRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [personalizedRecommendations.userId],
    references: [users.id]
  })
}));

export const personalizationLeaderboardEntriesRelations = relations(personalizationLeaderboardEntries, ({ one }) => ({
      leaderboard: one(leaderboards, {
      fields: [personalizationLeaderboardEntries.leaderboardId],
      references: [leaderboards.id]
    }),
    user: one(users, {
      fields: [personalizationLeaderboardEntries.userId],
      references: [users.id]
    })
}));

export const personalizationAchievementsRelations = relations(personalizationAchievements, ({ one, many }) => ({
  category: one(achievementCategories, {
    fields: [personalizationAchievements.categoryId],
    references: [achievementCategories.id]
  }),
  userProgress: many(userAchievementProgress)
}));

export const userAchievementProgressRelations = relations(userAchievementProgress, ({ one }) => ({
  user: one(users, {
    fields: [userAchievementProgress.userId],
    references: [users.id]
  }),
  achievement: one(personalizationAchievements, {
    fields: [userAchievementProgress.achievementId],
    references: [personalizationAchievements.id]
  })
}));

export const personalizationFriendshipsRelations = relations(personalizationFriendships, ({ one }) => ({
  requester: one(users, {
    fields: [personalizationFriendships.requesterId],
    references: [users.id]
  }),
  addressee: one(users, {
    fields: [personalizationFriendships.addresseeId],
    references: [users.id]
  })
}));

export const studyGroupsRelations = relations(studyGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [studyGroups.createdBy],
    references: [users.id]
  }),
  memberships: many(studyGroupMemberships)
}));

export const studyGroupMembershipsRelations = relations(studyGroupMemberships, ({ one }) => ({
  group: one(studyGroups, {
    fields: [studyGroupMemberships.groupId],
    references: [studyGroups.id]
  }),
  user: one(users, {
    fields: [studyGroupMemberships.userId],
    references: [users.id]
  })
}));