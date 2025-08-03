import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, serial, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Video Platform Core Tables

// Channels - Creator channels for organizing content
export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  handle: varchar('handle', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  bannerUrl: text('banner_url'),
  trailerVideoId: uuid('trailer_video_id'),
  subscriberCount: integer('subscriber_count').default(0),
  videoCount: integer('video_count').default(0),
  totalViews: integer('total_views').default(0),
  totalWatchTime: integer('total_watch_time').default(0), // in seconds
  isVerified: boolean('is_verified').default(false),
  isPartner: boolean('is_partner').default(false),
  monetizationEnabled: boolean('monetization_enabled').default(false),
  country: varchar('country', { length: 2 }),
  language: varchar('language', { length: 5 }).default('en'),
  category: varchar('category', { length: 50 }),
  keywords: jsonb('keywords').default([]),
  socialLinks: jsonb('social_links').default({}),
  contactEmail: varchar('contact_email', { length: 255 }),
  businessEmail: varchar('business_email', { length: 255 }),
  uploadDefaults: jsonb('upload_defaults').default({}),
  analytics: jsonb('analytics').default({}),
  customization: jsonb('customization').default({}),
  branding: jsonb('branding').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('channels_user_id_idx').on(table.userId),
  handleIdx: index('channels_handle_idx').on(table.handle),
  subscriberCountIdx: index('channels_subscriber_count_idx').on(table.subscriberCount),
  categoryIdx: index('channels_category_idx').on(table.category)
}));

// Videos - Core video content with rich educational metadata
export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  videoUrl: text('video_url').notNull(),
  duration: integer('duration'), // in seconds
  fileSize: integer('file_size'), // in bytes
  resolution: varchar('resolution', { length: 20 }),
  quality: varchar('quality', { length: 20 }),
  codec: varchar('codec', { length: 50 }),
  fps: integer('fps'),
  aspectRatio: varchar('aspect_ratio', { length: 10 }),
  
  // Educational metadata
  subject: varchar('subject', { length: 100 }),
  topics: jsonb('topics').default([]),
  difficulty: varchar('difficulty', { length: 20 }),
  learningObjectives: jsonb('learning_objectives').default([]),
  prerequisites: jsonb('prerequisites').default([]),
  estimatedWatchTime: integer('estimated_watch_time'),
  skillLevel: varchar('skill_level', { length: 50 }),
  ageGroup: varchar('age_group', { length: 50 }),
  educationalCategory: varchar('educational_category', { length: 100 }),
  
  // Engagement metrics
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  dislikeCount: integer('dislike_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  saveCount: integer('save_count').default(0),
  engagementRate: numeric('engagement_rate', { precision: 5, scale: 4 }).default(0),
  averageWatchTime: integer('average_watch_time').default(0),
  watchTimePercentage: numeric('watch_time_percentage', { precision: 5, scale: 2 }).default(0),
  clickThroughRate: numeric('click_through_rate', { precision: 5, scale: 4 }).default(0),
  
  // Content settings
  visibility: varchar('visibility', { length: 20 }).default('public'), // public, unlisted, private
  isAgeRestricted: boolean('is_age_restricted').default(false),
  minimumAge: integer('minimum_age').default(13),
  contentRating: varchar('content_rating', { length: 20 }).default('general'),
  allowComments: boolean('allow_comments').default(true),
  allowRatings: boolean('allow_ratings').default(true),
  allowEmbedding: boolean('allow_embedding').default(true),
  downloadable: boolean('downloadable').default(false),
  
  // Publishing info
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  isPremiere: boolean('is_premiere').default(false),
  premiereDate: timestamp('premiere_date'),
  isLive: boolean('is_live').default(false),
  liveStreamUrl: text('live_stream_url'),
  
  // SEO and discoverability
  tags: jsonb('tags').default([]),
  category: varchar('category', { length: 50 }),
  language: varchar('language', { length: 5 }).default('en'),
  captions: jsonb('captions').default([]),
  transcript: text('transcript'),
  seoTitle: varchar('seo_title', { length: 100 }),
  seoDescription: text('seo_description'),
  
  // Analytics and AI
  trendingScore: numeric('trending_score', { precision: 10, scale: 4 }).default(0),
  qualityScore: numeric('quality_score', { precision: 5, scale: 4 }).default(0),
  relevanceScore: numeric('relevance_score', { precision: 5, scale: 4 }).default(0),
  aiSummary: text('ai_summary'),
  aiKeywords: jsonb('ai_keywords').default([]),
  contentAnalysis: jsonb('content_analysis').default({}),
  
  // Status and moderation
  status: varchar('status', { length: 20 }).default('active'), // active, deleted, banned, processing
  moderationStatus: varchar('moderation_status', { length: 20 }).default('approved'),
  moderationNotes: text('moderation_notes'),
  processingStatus: varchar('processing_status', { length: 20 }).default('completed'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  channelIdIdx: index('videos_channel_id_idx').on(table.channelId),
  publishedAtIdx: index('videos_published_at_idx').on(table.publishedAt),
  viewCountIdx: index('videos_view_count_idx').on(table.viewCount),
  trendingScoreIdx: index('videos_trending_score_idx').on(table.trendingScore),
  subjectIdx: index('videos_subject_idx').on(table.subject),
  difficultyIdx: index('videos_difficulty_idx').on(table.difficulty),
  categoryIdx: index('videos_category_idx').on(table.category),
  visibilityIdx: index('videos_visibility_idx').on(table.visibility),
  statusIdx: index('videos_status_idx').on(table.status)
}));

// Subscriptions - User channel subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  subscribedAt: timestamp('subscribed_at').defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at'),
  isActive: boolean('is_active').default(true)
}, (table) => ({
  userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
  channelIdIdx: index('subscriptions_channel_id_idx').on(table.channelId),
  userChannelUnique: uniqueIndex('subscriptions_user_channel_unique').on(table.userId, table.channelId)
}));

// Video Views - Detailed view tracking for analytics
export const videoViews = pgTable('video_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  watchTime: integer('watch_time').default(0), // in seconds
  watchPercentage: numeric('watch_percentage', { precision: 5, scale: 2 }).default(0),
  completed: boolean('completed').default(false),
  quality: varchar('quality', { length: 20 }),
  device: varchar('device', { length: 50 }),
  platform: varchar('platform', { length: 50 }),
  location: jsonb('location').default({}),
  engagementEvents: jsonb('engagement_events').default([]),
  viewedAt: timestamp('viewed_at').defaultNow()
}, (table) => ({
  videoIdIdx: index('video_views_video_id_idx').on(table.videoId),
  userIdIdx: index('video_views_user_id_idx').on(table.userId),
  viewedAtIdx: index('video_views_viewed_at_idx').on(table.viewedAt),
  sessionIdIdx: index('video_views_session_id_idx').on(table.sessionId)
}));

// Video Recommendations - AI-powered recommendation system
export const videoRecommendations = pgTable('video_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // trending, personalized, similar, etc.
  score: numeric('score', { precision: 10, scale: 6 }).notNull(),
  algorithm: varchar('algorithm', { length: 50 }).notNull(),
  reason: text('reason'),
  metadata: jsonb('metadata').default({}),
  position: integer('position'),
  clicked: boolean('clicked').default(false),
  clickedAt: timestamp('clicked_at'),
  watchTime: integer('watch_time').default(0),
  completed: boolean('completed').default(false),
  liked: boolean('liked'),
  shared: boolean('shared').default(false),
  experimentId: varchar('experiment_id', { length: 100 }),
  treatmentGroup: varchar('treatment_group', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('video_recommendations_user_id_idx').on(table.userId),
  videoIdIdx: index('video_recommendations_video_id_idx').on(table.videoId),
  typeIdx: index('video_recommendations_type_idx').on(table.recommendationType),
  scoreIdx: index('video_recommendations_score_idx').on(table.score),
  createdAtIdx: index('video_recommendations_created_at_idx').on(table.createdAt)
}));

// User Preferences - Learning preferences and AI personalization
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  preferredSubjects: jsonb('preferred_subjects').default([]),
  preferredDifficulty: varchar('preferred_difficulty', { length: 20 }),
  preferredDuration: integer('preferred_duration'), // preferred video length in seconds
  preferredCategories: jsonb('preferred_categories').default([]),
  preferredLanguages: jsonb('preferred_languages').default(['en']),
  learningGoals: jsonb('learning_goals').default([]),
  skillLevel: jsonb('skill_level').default({}),
  watchTimeGoals: integer('watch_time_goals'), // daily watch time goal in minutes
  studySchedule: jsonb('study_schedule').default({}),
  notificationSettings: jsonb('notification_settings').default({}),
  autoplay: boolean('autoplay').default(true),
  defaultQuality: varchar('default_quality', { length: 20 }).default('auto'),
  captionsEnabled: boolean('captions_enabled').default(false),
  captionsLanguage: varchar('captions_language', { length: 5 }).default('en'),
  darkMode: boolean('dark_mode').default(false),
  age: integer('age'),
  occupation: varchar('occupation', { length: 100 }),
  educationLevel: varchar('education_level', { length: 50 }),
  interests: jsonb('interests').default([]),
  blockedChannels: jsonb('blocked_channels').default([]),
  restrictedMode: boolean('restricted_mode').default(false),
  privacySettings: jsonb('privacy_settings').default({}),
  aiPersonalization: boolean('ai_personalization').default(true),
  dataSharing: boolean('data_sharing').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('user_preferences_user_id_idx').on(table.userId)
}));

// Video Likes/Dislikes - User rating system
export const videoLikes = pgTable('video_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'like' or 'dislike'
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('video_likes_user_id_idx').on(table.userId),
  videoIdIdx: index('video_likes_video_id_idx').on(table.videoId),
  userVideoUnique: uniqueIndex('video_likes_user_video_unique').on(table.userId, table.videoId)
}));

// Video Comments - Comment system with threading
export const videoComments = pgTable('video_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  parentCommentId: uuid('parent_comment_id').references(() => videoComments.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  likeCount: integer('like_count').default(0),
  dislikeCount: integer('dislike_count').default(0),
  replyCount: integer('reply_count').default(0),
  isPinned: boolean('is_pinned').default(false),
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
  moderationStatus: varchar('moderation_status', { length: 20 }).default('approved'),
  moderationNotes: text('moderation_notes'),
  timestamp: integer('timestamp'), // video timestamp this comment refers to
  mentions: jsonb('mentions').default([]),
  attachments: jsonb('attachments').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  videoIdIdx: index('video_comments_video_id_idx').on(table.videoId),
  userIdIdx: index('video_comments_user_id_idx').on(table.userId),
  parentCommentIdIdx: index('video_comments_parent_comment_id_idx').on(table.parentCommentId),
  createdAtIdx: index('video_comments_created_at_idx').on(table.createdAt)
}));

// Playlists - User-created video collections
export const playlists = pgTable('playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  visibility: varchar('visibility', { length: 20 }).default('public'), // public, unlisted, private
  isStudyPlan: boolean('is_study_plan').default(false),
  subject: varchar('subject', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }),
  estimatedDuration: integer('estimated_duration'), // total duration in seconds
  videoCount: integer('video_count').default(0),
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  shareCount: integer('share_count').default(0),
  tags: jsonb('tags').default([]),
  learningObjectives: jsonb('learning_objectives').default([]),
  prerequisites: jsonb('prerequisites').default([]),
  targetAudience: varchar('target_audience', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('playlists_user_id_idx').on(table.userId),
  visibilityIdx: index('playlists_visibility_idx').on(table.visibility),
  subjectIdx: index('playlists_subject_idx').on(table.subject),
  isStudyPlanIdx: index('playlists_is_study_plan_idx').on(table.isStudyPlan)
}));

// Playlist Videos - Videos in playlists with ordering
export const playlistVideos = pgTable('playlist_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  playlistId: uuid('playlist_id').references(() => playlists.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull(),
  addedBy: uuid('added_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  isRequired: boolean('is_required').default(false), // for study plans
  estimatedStudyTime: integer('estimated_study_time'),
  completionCriteria: jsonb('completion_criteria').default({}),
  addedAt: timestamp('added_at').defaultNow()
}, (table) => ({
  playlistIdIdx: index('playlist_videos_playlist_id_idx').on(table.playlistId),
  videoIdIdx: index('playlist_videos_video_id_idx').on(table.videoId),
  positionIdx: index('playlist_videos_position_idx').on(table.position),
  playlistVideoUnique: uniqueIndex('playlist_videos_playlist_video_unique').on(table.playlistId, table.videoId)
}));

// Video Analytics - Comprehensive analytics data
export const videoAnalytics = pgTable('video_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  views: integer('views').default(0),
  uniqueViews: integer('unique_views').default(0),
  watchTime: integer('watch_time').default(0), // total watch time in seconds
  averageWatchTime: integer('average_watch_time').default(0),
  likes: integer('likes').default(0),
  dislikes: integer('dislikes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  subscribersGained: integer('subscribers_gained').default(0),
  clickThroughRate: numeric('click_through_rate', { precision: 5, scale: 4 }).default(0),
  engagementRate: numeric('engagement_rate', { precision: 5, scale: 4 }).default(0),
  retentionRate: numeric('retention_rate', { precision: 5, scale: 4 }).default(0),
  bounceRate: numeric('bounce_rate', { precision: 5, scale: 4 }).default(0),
  demographicsData: jsonb('demographics_data').default({}),
  trafficSources: jsonb('traffic_sources').default({}),
  deviceData: jsonb('device_data').default({}),
  geographicData: jsonb('geographic_data').default({}),
  playbackLocations: jsonb('playback_locations').default({}),
  searchTerms: jsonb('search_terms').default([]),
  retentionGraph: jsonb('retention_graph').default([]),
  engagementMetrics: jsonb('engagement_metrics').default({})
}, (table) => ({
  videoIdIdx: index('video_analytics_video_id_idx').on(table.videoId),
  dateIdx: index('video_analytics_date_idx').on(table.date),
  videoDateUnique: uniqueIndex('video_analytics_video_date_unique').on(table.videoId, table.date)
}));

// Algorithm Models - A/B testing and ML model configurations
export const algorithmModels = pgTable('algorithm_models', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // collaborative_filtering, content_based, deep_learning, etc.
  description: text('description'),
  config: jsonb('config').notNull(),
  weights: jsonb('weights').default({}),
  hyperparameters: jsonb('hyperparameters').default({}),
  trainingData: jsonb('training_data').default({}),
  performance: jsonb('performance').default({}),
  abTestConfig: jsonb('ab_test_config').default({}),
  isActive: boolean('is_active').default(false),
  trainingStatus: varchar('training_status', { length: 20 }).default('pending'),
  accuracy: numeric('accuracy', { precision: 5, scale: 4 }),
  precision: numeric('precision', { precision: 5, scale: 4 }),
  recall: numeric('recall', { precision: 5, scale: 4 }),
  f1Score: numeric('f1_score', { precision: 5, scale: 4 }),
  deployedAt: timestamp('deployed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('algorithm_models_name_idx').on(table.name),
  typeIdx: index('algorithm_models_type_idx').on(table.type),
  isActiveIdx: index('algorithm_models_is_active_idx').on(table.isActive),
  accuracyIdx: index('algorithm_models_accuracy_idx').on(table.accuracy)
}));

// Relations
export const channelsRelations = relations(channels, ({ one, many }) => ({
  user: one(users, { fields: [channels.userId], references: [users.id] }),
  videos: many(videos),
  subscriptions: many(subscriptions)
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  channel: one(channels, { fields: [videos.channelId], references: [channels.id] }),
  views: many(videoViews),
  recommendations: many(videoRecommendations),
  likes: many(videoLikes),
  comments: many(videoComments),
  playlistVideos: many(playlistVideos),
  analytics: many(videoAnalytics)
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  channel: one(channels, { fields: [subscriptions.channelId], references: [channels.id] })
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, { fields: [videoViews.videoId], references: [videos.id] }),
  user: one(users, { fields: [videoViews.userId], references: [users.id] })
}));

export const videoRecommendationsRelations = relations(videoRecommendations, ({ one }) => ({
  user: one(users, { fields: [videoRecommendations.userId], references: [users.id] }),
  video: one(videos, { fields: [videoRecommendations.videoId], references: [videos.id] })
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] })
}));

export const videoLikesRelations = relations(videoLikes, ({ one }) => ({
  user: one(users, { fields: [videoLikes.userId], references: [users.id] }),
  video: one(videos, { fields: [videoLikes.videoId], references: [videos.id] })
}));

export const videoCommentsRelations = relations(videoComments, ({ one, many }) => ({
  video: one(videos, { fields: [videoComments.videoId], references: [videos.id] }),
  user: one(users, { fields: [videoComments.userId], references: [users.id] }),
  parentComment: one(videoComments, { fields: [videoComments.parentCommentId], references: [videoComments.id] }),
  replies: many(videoComments)
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
  playlistVideos: many(playlistVideos)
}));

export const playlistVideosRelations = relations(playlistVideos, ({ one }) => ({
  playlist: one(playlists, { fields: [playlistVideos.playlistId], references: [playlists.id] }),
  video: one(videos, { fields: [playlistVideos.videoId], references: [videos.id] }),
  addedByUser: one(users, { fields: [playlistVideos.addedBy], references: [users.id] })
}));

export const videoAnalyticsRelations = relations(videoAnalytics, ({ one }) => ({
  video: one(videos, { fields: [videoAnalytics.videoId], references: [videos.id] })
}));

export const algorithmModelsRelations = relations(algorithmModels, ({ many }) => ({
  // No direct relations, but used by recommendation system
}));