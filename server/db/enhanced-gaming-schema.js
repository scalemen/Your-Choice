import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Educational Game Definitions and Configurations
export const educationalGames = pgTable('educational_games', {
  id: serial('id').primaryKey(),
  gameId: uuid('game_id').defaultRandom().notNull().unique(),
  
  // Game metadata
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 200 }),
  
  // Game classification
  category: varchar('category', { length: 50 }).notNull(), // puzzle, quiz, strategy, action, simulation, word, math, science
  gameType: varchar('game_type', { length: 50 }).notNull(), // single_player, multiplayer, cooperative, competitive, turn_based, real_time
  genre: varchar('genre', { length: 50 }), // trivia, memory, logic, speed, creativity, strategy
  
  // Academic classification
  subject: varchar('subject', { length: 100 }),
  topics: jsonb('topics').default([]),
  gradeLevel: varchar('grade_level', { length: 50 }),
  skillsTargeted: jsonb('skills_targeted').default([]),
  learningObjectives: jsonb('learning_objectives').default([]),
  
  // Game mechanics
  gameEngine: varchar('game_engine', { length: 50 }).default('web'), // web, unity, phaser, custom
  platform: varchar('platform', { length: 50 }).default('web'), // web, mobile, desktop, vr
  controls: jsonb('controls').default({}), // Input methods and controls
  
  // Difficulty and progression
  difficultyLevels: jsonb('difficulty_levels').default([]),
  adaptiveDifficulty: boolean('adaptive_difficulty').default(false),
  progressionSystem: varchar('progression_system', { length: 50 }), // linear, branching, open_world, skill_based
  unlockRequirements: jsonb('unlock_requirements').default({}),
  
  // Multiplayer configuration
  minPlayers: integer('min_players').default(1),
  maxPlayers: integer('max_players').default(1),
  teamPlay: boolean('team_play').default(false),
  crossPlatform: boolean('cross_platform').default(true),
  
  // Timing and sessions
  averagePlayTime: integer('average_play_time'), // Minutes
  minPlayTime: integer('min_play_time'), // Minutes
  maxPlayTime: integer('max_play_time'), // Minutes
  sessionBased: boolean('session_based').default(true),
  
  // Scoring and rewards
  scoringSystem: varchar('scoring_system', { length: 50 }).default('points'), // points, time, accuracy, completion, custom
  maxScore: integer('max_score'),
  pointMultipliers: jsonb('point_multipliers').default({}),
  achievements: jsonb('achievements').default([]),
  badges: jsonb('badges').default([]),
  
  // Gamification features
  hasLeaderboards: boolean('has_leaderboards').default(true),
  hasTournaments: boolean('has_tournaments').default(false),
  hasAchievements: boolean('has_achievements').default(true),
  hasProgression: boolean('has_progression').default(true),
  socialFeatures: boolean('social_features').default(false),
  
  // Content and assets
  gameAssets: jsonb('game_assets').default({}), // Images, sounds, videos, etc.
  gameConfig: jsonb('game_config').notNull(), // Game-specific configuration
  gameRules: text('game_rules'),
  instructions: text('instructions'),
  tutorial: jsonb('tutorial').default({}),
  
  // Quality and performance
  rating: decimal('rating', { precision: 3, scale: 2 }),
  playCount: integer('play_count').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }),
  
  // Technical specifications
  browserRequirements: jsonb('browser_requirements').default({}),
  performanceRequirements: jsonb('performance_requirements').default({}),
  accessibility: jsonb('accessibility').default({}),
  
  // Status and availability
  status: varchar('status', { length: 20 }).default('active'), // active, beta, maintenance, retired
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  releaseDate: timestamp('release_date'),
  
  // Versioning
  version: varchar('version', { length: 20 }).default('1.0'),
  lastUpdate: timestamp('last_update'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('educational_games_name_idx').on(table.name),
  categoryIdx: index('educational_games_category_idx').on(table.category),
  typeIdx: index('educational_games_type_idx').on(table.gameType),
  subjectIdx: index('educational_games_subject_idx').on(table.subject),
  gradeLevelIdx: index('educational_games_grade_level_idx').on(table.gradeLevel),
  statusIdx: index('educational_games_status_idx').on(table.status),
  featuredIdx: index('educational_games_featured_idx').on(table.isFeatured),
  ratingIdx: index('educational_games_rating_idx').on(table.averageRating)
}));

// Game Sessions with Detailed Tracking
export const gameSessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  
  gameId: integer('game_id').references(() => educationalGames.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Session metadata
  sessionType: varchar('session_type', { length: 50 }).default('solo'), // solo, multiplayer, tournament, practice, challenge
  gameMode: varchar('game_mode', { length: 50 }), // Game-specific mode
  difficultyLevel: varchar('difficulty_level', { length: 20 }),
  
  // Timing information
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  pausedAt: timestamp('paused_at'),
  totalPlayTime: integer('total_play_time').default(0), // Seconds
  activePlayTime: integer('active_play_time').default(0), // Seconds (excluding pauses)
  
  // Performance metrics
  finalScore: integer('final_score').default(0),
  maxScore: integer('max_score'),
  scoreMultiplier: decimal('score_multiplier', { precision: 5, scale: 2 }).default('1.0'),
  percentageScore: decimal('percentage_score', { precision: 5, scale: 2 }),
  
  // Game-specific metrics
  gameMetrics: jsonb('game_metrics').default({}), // Custom metrics per game type
  levelReached: integer('level_reached'),
  levelsCompleted: integer('levels_completed').default(0),
  correctAnswers: integer('correct_answers').default(0),
  incorrectAnswers: integer('incorrect_answers').default(0),
  hintsUsed: integer('hints_used').default(0),
  
  // Performance analytics
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }),
  speed: decimal('speed', { precision: 8, scale: 2 }), // Actions per minute or similar
  efficiency: decimal('efficiency', { precision: 5, scale: 2 }),
  consistency: decimal('consistency', { precision: 5, scale: 2 }),
  
  // Learning outcomes
  skillsImproved: jsonb('skills_improved').default([]),
  conceptsMastered: jsonb('concepts_mastered').default([]),
  learningGains: jsonb('learning_gains').default([]),
  struggledAreas: jsonb('struggled_areas').default([]),
  
  // Social and competitive
  rank: integer('rank'), // Final rank in multiplayer/tournament
  opponents: jsonb('opponents').default([]), // Other players in session
  teamId: varchar('team_id', { length: 50 }),
  teamScore: integer('team_score'),
  
  // Achievements and rewards
  achievementsUnlocked: jsonb('achievements_unlocked').default([]),
  badgesEarned: jsonb('badges_earned').default([]),
  pointsEarned: integer('points_earned').default(0),
  experienceGained: integer('experience_gained').default(0),
  
  // Session events and interactions
  gameEvents: jsonb('game_events').default([]), // Detailed event log
  userInteractions: jsonb('user_interactions').default([]),
  pauseEvents: jsonb('pause_events').default([]),
  
  // Device and environment
  deviceType: varchar('device_type', { length: 50 }),
  screenResolution: varchar('screen_resolution', { length: 20 }),
  connectionQuality: varchar('connection_quality', { length: 20 }),
  
  // Completion and satisfaction
  status: varchar('status', { length: 20 }).default('in_progress'), // in_progress, completed, abandoned, crashed
  completionPercentage: decimal('completion_percentage', { precision: 5, scale: 2 }),
  enjoymentRating: integer('enjoyment_rating'), // 1-5
  difficultyRating: integer('difficulty_rating'), // 1-5
  sessionFeedback: text('session_feedback'),
  
  // Technical data
  performanceData: jsonb('performance_data').default({}), // FPS, load times, etc.
  errorLog: jsonb('error_log').default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  gameUserIdx: index('game_sessions_game_user_idx').on(table.gameId, table.userId),
  statusIdx: index('game_sessions_status_idx').on(table.status),
  startedIdx: index('game_sessions_started_idx').on(table.startedAt),
  scoreIdx: index('game_sessions_score_idx').on(table.finalScore),
  typeIdx: index('game_sessions_type_idx').on(table.sessionType)
}));

// Tournament System for Competitive Gaming
export const gameTournaments = pgTable('game_tournaments', {
  id: serial('id').primaryKey(),
  tournamentId: uuid('tournament_id').defaultRandom().notNull().unique(),
  
  // Tournament metadata
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  gameId: integer('game_id').references(() => educationalGames.id).notNull(),
  
  // Tournament configuration
  tournamentType: varchar('tournament_type', { length: 50 }).notNull(), // single_elimination, double_elimination, round_robin, swiss, ladder
  format: varchar('format', { length: 50 }).default('individual'), // individual, team, mixed
  bracketSize: integer('bracket_size'),
  roundCount: integer('round_count'),
  
  // Participation settings
  maxParticipants: integer('max_participants').default(64),
  currentParticipants: integer('current_participants').default(0),
  entryFee: integer('entry_fee').default(0), // In points or virtual currency
  skillLevel: varchar('skill_level', { length: 20 }), // beginner, intermediate, advanced, expert
  
  // Scheduling
  registrationStart: timestamp('registration_start'),
  registrationEnd: timestamp('registration_end'),
  tournamentStart: timestamp('tournament_start'),
  tournamentEnd: timestamp('tournament_end'),
  timeZone: varchar('time_zone', { length: 50 }),
  
  // Scoring and prizes
  scoringSystem: varchar('scoring_system', { length: 50 }).default('elimination'),
  prizePool: jsonb('prize_pool').default({}),
  prizeDistribution: jsonb('prize_distribution').default({}),
  
  // Rules and settings
  gameSettings: jsonb('game_settings').default({}),
  tournamentRules: text('tournament_rules'),
  restrictions: jsonb('restrictions').default({}),
  
  // Status and management
  status: varchar('status', { length: 20 }).default('upcoming'), // upcoming, registration, active, completed, cancelled
  isPublic: boolean('is_public').default(true),
  requiresApproval: boolean('requires_approval').default(false),
  
  // Organization
  organizer: integer('organizer').references(() => users.id).notNull(),
  moderators: jsonb('moderators').default([]),
  sponsors: jsonb('sponsors').default([]),
  
  // Analytics
  viewCount: integer('view_count').default(0),
  spectatorCount: integer('spectator_count').default(0),
  streamingEnabled: boolean('streaming_enabled').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  gameIdx: index('game_tournaments_game_idx').on(table.gameId),
  typeIdx: index('game_tournaments_type_idx').on(table.tournamentType),
  statusIdx: index('game_tournaments_status_idx').on(table.status),
  organizerIdx: index('game_tournaments_organizer_idx').on(table.organizer),
  startIdx: index('game_tournaments_start_idx').on(table.tournamentStart)
}));

// Tournament Participants and Teams
export const tournamentParticipants = pgTable('tournament_participants', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').references(() => gameTournaments.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Participation details
  registeredAt: timestamp('registered_at').defaultNow(),
  status: varchar('status', { length: 20 }).default('registered'), // registered, confirmed, eliminated, winner
  seedRank: integer('seed_rank'),
  currentRound: integer('current_round').default(1),
  
  // Team information (if applicable)
  teamId: varchar('team_id', { length: 50 }),
  teamName: varchar('team_name', { length: 100 }),
  teamRole: varchar('team_role', { length: 50 }), // captain, member
  
  // Performance tracking
  matchesPlayed: integer('matches_played').default(0),
  matchesWon: integer('matches_won').default(0),
  matchesLost: integer('matches_lost').default(0),
  totalScore: bigint('total_score', { mode: 'number' }).default(0),
  averageScore: decimal('average_score', { precision: 8, scale: 2 }),
  
  // Tournament-specific stats
  bestRound: integer('best_round'),
  finalRank: integer('final_rank'),
  eliminatedIn: integer('eliminated_in'),
  prizeWon: jsonb('prize_won').default({}),
  
  // Performance metrics
  skillRating: decimal('skill_rating', { precision: 8, scale: 2 }),
  consistency: decimal('consistency', { precision: 5, scale: 2 }),
  clutchPerformance: decimal('clutch_performance', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tournamentUserIdx: index('tournament_participants_tournament_user_idx').on(table.tournamentId, table.userId),
  statusIdx: index('tournament_participants_status_idx').on(table.status),
  seedIdx: index('tournament_participants_seed_idx').on(table.seedRank),
  teamIdx: index('tournament_participants_team_idx').on(table.teamId)
}));

// Game Leaderboards and Rankings
export const gameLeaderboards = pgTable('game_leaderboards', {
  id: serial('id').primaryKey(),
  leaderboardId: uuid('leaderboard_id').defaultRandom().notNull().unique(),
  
  gameId: integer('game_id').references(() => educationalGames.id).notNull(),
  
  // Leaderboard configuration
  name: varchar('name', { length: 100 }).notNull(),
  leaderboardType: varchar('leaderboard_type', { length: 50 }).notNull(), // global, weekly, monthly, tournament, class, friends
  metric: varchar('metric', { length: 50 }).notNull(), // score, time, accuracy, streak, level
  
  // Time period
  periodType: varchar('period_type', { length: 20 }).default('all_time'), // all_time, daily, weekly, monthly, yearly
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Filtering and scope
  filterCriteria: jsonb('filter_criteria').default({}),
  scope: varchar('scope', { length: 50 }).default('global'), // global, class, school, friends, custom
  gradeLevel: varchar('grade_level', { length: 50 }),
  
  // Configuration
  maxEntries: integer('max_entries').default(100),
  minGamesPlayed: integer('min_games_played').default(1),
  updateFrequency: varchar('update_frequency', { length: 20 }).default('real_time'), // real_time, hourly, daily
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  
  // Reset and maintenance
  lastReset: timestamp('last_reset'),
  nextReset: timestamp('next_reset'),
  autoReset: boolean('auto_reset').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  gameIdx: index('game_leaderboards_game_idx').on(table.gameId),
  typeIdx: index('game_leaderboards_type_idx').on(table.leaderboardType),
  periodIdx: index('game_leaderboards_period_idx').on(table.periodType),
  activeIdx: index('game_leaderboards_active_idx').on(table.isActive)
}));

// Leaderboard Entries and Rankings
export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  leaderboardId: integer('leaderboard_id').references(() => gameLeaderboards.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Ranking information
  rank: integer('rank').notNull(),
  previousRank: integer('previous_rank'),
  score: decimal('score', { precision: 15, scale: 2 }).notNull(),
  previousScore: decimal('previous_score', { precision: 15, scale: 2 }),
  
  // Performance details
  gamesPlayed: integer('games_played').default(0),
  bestScore: decimal('best_score', { precision: 15, scale: 2 }),
  averageScore: decimal('average_score', { precision: 15, scale: 2 }),
  totalPlayTime: integer('total_play_time').default(0), // Minutes
  
  // Trends and statistics
  rankChange: integer('rank_change').default(0),
  scoreChange: decimal('score_change', { precision: 15, scale: 2 }).default('0'),
  winStreak: integer('win_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  
  // Achievement milestones
  achievements: jsonb('achievements').default([]),
  milestones: jsonb('milestones').default([]),
  
  // Timing
  firstEntry: timestamp('first_entry').defaultNow(),
  lastUpdate: timestamp('last_update').defaultNow(),
  lastPlayed: timestamp('last_played'),
  
  // Metadata
  isVerified: boolean('is_verified').default(true),
  isFlagged: boolean('is_flagged').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  leaderboardUserIdx: index('leaderboard_entries_leaderboard_user_idx').on(table.leaderboardId, table.userId),
  rankIdx: index('leaderboard_entries_rank_idx').on(table.rank),
  scoreIdx: index('leaderboard_entries_score_idx').on(table.score),
  lastUpdateIdx: index('leaderboard_entries_last_update_idx').on(table.lastUpdate)
}));

// Game Achievements and Badge System
export const gameAchievements = pgTable('game_achievements', {
  id: serial('id').primaryKey(),
  achievementId: uuid('achievement_id').defaultRandom().notNull().unique(),
  
  gameId: integer('game_id').references(() => educationalGames.id),
  
  // Achievement metadata
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }), // performance, progression, social, special, secret
  
  // Achievement criteria
  criteria: jsonb('criteria').notNull(), // Complex criteria for unlocking
  requiredValue: decimal('required_value', { precision: 15, scale: 2 }),
  metric: varchar('metric', { length: 50 }), // score, games_played, streak, time, etc.
  
  // Difficulty and rarity
  difficulty: varchar('difficulty', { length: 20 }).default('medium'), // easy, medium, hard, legendary
  rarity: varchar('rarity', { length: 20 }).default('common'), // common, uncommon, rare, epic, legendary
  estimatedCompletion: decimal('estimated_completion', { precision: 5, scale: 2 }), // Percentage who complete it
  
  // Rewards
  pointsReward: integer('points_reward').default(0),
  badgeIcon: text('badge_icon'),
  badgeColor: varchar('badge_color', { length: 7 }),
  titleReward: varchar('title_reward', { length: 100 }),
  
  // Visibility and requirements
  isSecret: boolean('is_secret').default(false),
  prerequisites: jsonb('prerequisites').default([]), // Other achievements required
  isRepeatable: boolean('is_repeatable').default(false),
  
  // Statistics
  totalUnlocked: integer('total_unlocked').default(0),
  unlockRate: decimal('unlock_rate', { precision: 5, scale: 2 }),
  averageTimeToUnlock: integer('average_time_to_unlock'), // Days
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  gameIdx: index('game_achievements_game_idx').on(table.gameId),
  categoryIdx: index('game_achievements_category_idx').on(table.category),
  difficultyIdx: index('game_achievements_difficulty_idx').on(table.difficulty),
  secretIdx: index('game_achievements_secret_idx').on(table.isSecret),
  activeIdx: index('game_achievements_active_idx').on(table.isActive)
}));

// User Achievement Progress and Unlocks
export const userGameAchievements = pgTable('user_game_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  achievementId: integer('achievement_id').references(() => gameAchievements.id).notNull(),
  
  // Progress tracking
  progress: decimal('progress', { precision: 8, scale: 2 }).default('0'),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  isUnlocked: boolean('is_unlocked').default(false),
  
  // Unlock details
  unlockedAt: timestamp('unlocked_at'),
  gameSessionId: integer('game_session_id').references(() => gameSessions.id),
  unlockContext: jsonb('unlock_context').default({}),
  
  // Progress history
  progressHistory: jsonb('progress_history').default([]),
  milestones: jsonb('milestones').default([]),
  
  // Display settings
  isDisplayed: boolean('is_displayed').default(true),
  isPinned: boolean('is_pinned').default(false),
  displayOrder: integer('display_order'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userAchievementIdx: index('user_achievements_user_achievement_idx').on(table.userId, table.achievementId),
  unlockedIdx: index('user_achievements_unlocked_idx').on(table.isUnlocked),
  unlockedAtIdx: index('user_achievements_unlocked_at_idx').on(table.unlockedAt),
  progressIdx: index('user_achievements_progress_idx').on(table.progress)
}));

// Game Analytics and Insights
export const gameAnalytics = pgTable('game_analytics', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => educationalGames.id).notNull().unique(),
  
  // Play statistics
  totalSessions: integer('total_sessions').default(0),
  uniquePlayers: integer('unique_players').default(0),
  totalPlayTime: bigint('total_play_time', { mode: 'number' }).default(0), // Minutes
  averageSessionLength: decimal('average_session_length', { precision: 8, scale: 2 }),
  
  // Performance metrics
  averageScore: decimal('average_score', { precision: 10, scale: 2 }),
  medianScore: decimal('median_score', { precision: 10, scale: 2 }),
  highScore: decimal('high_score', { precision: 15, scale: 2 }),
  averageAccuracy: decimal('average_accuracy', { precision: 5, scale: 2 }),
  
  // Completion and engagement
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }),
  dropoffPoints: jsonb('dropoff_points').default({}),
  retentionRates: jsonb('retention_rates').default({}),
  returningPlayerRate: decimal('returning_player_rate', { precision: 5, scale: 2 }),
  
  // Learning effectiveness
  learningGains: jsonb('learning_gains').default({}),
  skillImprovement: jsonb('skill_improvement').default({}),
  conceptMastery: jsonb('concept_mastery').default({}),
  errorPatterns: jsonb('error_patterns').default({}),
  
  // User feedback
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  totalRatings: integer('total_ratings').default(0),
  enjoymentScore: decimal('enjoyment_score', { precision: 5, scale: 2 }),
  difficultyBalance: decimal('difficulty_balance', { precision: 5, scale: 2 }),
  
  // Technical performance
  averageLoadTime: decimal('average_load_time', { precision: 8, scale: 2 }),
  errorRate: decimal('error_rate', { precision: 5, scale: 4 }),
  crashRate: decimal('crash_rate', { precision: 5, scale: 4 }),
  performanceIssues: jsonb('performance_issues').default([]),
  
  // Social and competitive
  multiplayerEngagement: decimal('multiplayer_engagement', { precision: 5, scale: 2 }),
  tournamentParticipation: decimal('tournament_participation', { precision: 5, scale: 2 }),
  leaderboardActivity: decimal('leaderboard_activity', { precision: 5, scale: 2 }),
  socialSharing: integer('social_sharing').default(0),
  
  // Recommendations
  recommendedImprovements: jsonb('recommended_improvements').default([]),
  balanceAdjustments: jsonb('balance_adjustments').default([]),
  contentSuggestions: jsonb('content_suggestions').default([]),
  
  lastCalculated: timestamp('last_calculated').defaultNow(),
  calculationPeriod: varchar('calculation_period', { length: 20 }).default('all_time'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  gameIdx: index('game_analytics_game_idx').on(table.gameId),
  calculatedIdx: index('game_analytics_calculated_idx').on(table.lastCalculated)
}));

// Define relationships
export const educationalGamesRelations = relations(educationalGames, ({ many }) => ({
  sessions: many(gameSessions),
  tournaments: many(gameTournaments),
  leaderboards: many(gameLeaderboards),
  achievements: many(gameAchievements),
  analytics: one(gameAnalytics)
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  game: one(educationalGames, {
    fields: [gameSessions.gameId],
    references: [educationalGames.id]
  }),
  user: one(users, {
    fields: [gameSessions.userId],
    references: [users.id]
  })
}));

export const gameTournamentsRelations = relations(gameTournaments, ({ one, many }) => ({
  game: one(educationalGames, {
    fields: [gameTournaments.gameId],
    references: [educationalGames.id]
  }),
  organizer: one(users, {
    fields: [gameTournaments.organizer],
    references: [users.id]
  }),
  participants: many(tournamentParticipants)
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  tournament: one(gameTournaments, {
    fields: [tournamentParticipants.tournamentId],
    references: [gameTournaments.id]
  }),
  user: one(users, {
    fields: [tournamentParticipants.userId],
    references: [users.id]
  })
}));

export const gameLeaderboardsRelations = relations(gameLeaderboards, ({ one, many }) => ({
  game: one(educationalGames, {
    fields: [gameLeaderboards.gameId],
    references: [educationalGames.id]
  }),
  entries: many(leaderboardEntries)
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  leaderboard: one(gameLeaderboards, {
    fields: [leaderboardEntries.leaderboardId],
    references: [gameLeaderboards.id]
  }),
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id]
  })
}));

export const gameAchievementsRelations = relations(gameAchievements, ({ one, many }) => ({
  game: one(educationalGames, {
    fields: [gameAchievements.gameId],
    references: [educationalGames.id]
  }),
      userAchievements: many(userGameAchievements)
}));

export const userGameAchievementsRelations = relations(userGameAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userGameAchievements.userId],
    references: [users.id]
  }),
  achievement: one(gameAchievements, {
    fields: [userGameAchievements.achievementId],
    references: [gameAchievements.id]
  }),
  gameSession: one(gameSessions, {
    fields: [userGameAchievements.gameSessionId],
    references: [gameSessions.id]
  })
}));

export const gameAnalyticsRelations = relations(gameAnalytics, ({ one }) => ({
  game: one(educationalGames, {
    fields: [gameAnalytics.gameId],
    references: [educationalGames.id]
  })
}));