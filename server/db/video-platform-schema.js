import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, serial, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Video Platform Core Tables
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
  totalWatchTime: integer('total_watch_time').default(0),
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

export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  customThumbnails: jsonb('custom_thumbnails').default([]),
  videoUrl: text('video_url').notNull(),
  duration: integer('duration').notNull(), // in seconds
  fileSize: integer('file_size'),
  resolution: varchar('resolution', { length: 10 }),
  frameRate: integer('frame_rate'),
  bitrate: integer('bitrate'),
  codecVideo: varchar('codec_video', { length: 20 }),
  codecAudio: varchar('codec_audio', { length: 20 }),
  aspectRatio: varchar('aspect_ratio', { length: 10 }),
  
  // Content metadata
  category: varchar('category', { length: 50 }),
  tags: jsonb('tags').default([]),
  language: varchar('language', { length: 5 }),
  caption: text('caption'),
  subtitles: jsonb('subtitles').default([]),
  chapters: jsonb('chapters').default([]),
  
  // Visibility and restrictions
  visibility: varchar('visibility', { length: 20 }).default('public'), // public, unlisted, private, scheduled
  isLive: boolean('is_live').default(false),
  isShort: boolean('is_short').default(false),
  isPremiere: boolean('is_premiere').default(false),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  
  // Age and content restrictions
  isAgeRestricted: boolean('is_age_restricted').default(false),
  minimumAge: integer('minimum_age').default(13),
  contentRating: varchar('content_rating', { length: 10 }).default('G'),
  contentWarnings: jsonb('content_warnings').default([]),
  
  // Educational content
  isEducational: boolean('is_educational').default(false),
  subject: varchar('subject', { length: 100 }),
  topics: jsonb('topics').default([]),
  difficulty: varchar('difficulty', { length: 20 }),
  studyLevel: varchar('study_level', { length: 50 }),
  learningObjectives: jsonb('learning_objectives').default([]),
  prerequisites: jsonb('prerequisites').default([]),
  resources: jsonb('resources').default([]),
  quiz: jsonb('quiz').default({}),
  
  // Engagement metrics
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  dislikeCount: integer('dislike_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  saveCount: integer('save_count').default(0),
  
  // Advanced metrics
  engagementRate: numeric('engagement_rate', { precision: 5, scale: 4 }).default(0),
  retentionRate: numeric('retention_rate', { precision: 5, scale: 4 }).default(0),
  averageWatchTime: integer('average_watch_time').default(0),
  impressions: integer('impressions').default(0),
  clickThroughRate: numeric('click_through_rate', { precision: 5, scale: 4 }).default(0),
  
  // Monetization
  monetizationEnabled: boolean('monetization_enabled').default(false),
  adRevenue: numeric('ad_revenue', { precision: 10, scale: 2 }).default(0),
  sponsorRevenue: numeric('sponsor_revenue', { precision: 10, scale: 2 }).default(0),
  donationRevenue: numeric('donation_revenue', { precision: 10, scale: 2 }).default(0),
  
  // Processing status
  processingStatus: varchar('processing_status', { length: 20 }).default('uploaded'), // uploaded, processing, processed, failed
  qualityVersions: jsonb('quality_versions').default({}), // 144p, 240p, 360p, 480p, 720p, 1080p, 1440p, 2160p
  
  // SEO and discovery
  seoTitle: varchar('seo_title', { length: 100 }),
  seoDescription: text('seo_description'),
  keywords: jsonb('keywords').default([]),
  
  // Platform metrics
  recommendationScore: numeric('recommendation_score', { precision: 5, scale: 4 }).default(0),
  trendingScore: numeric('trending_score', { precision: 5, scale: 4 }).default(0),
  qualityScore: numeric('quality_score', { precision: 5, scale: 4 }).default(0),
  
  // Status flags
  isBlocked: boolean('is_blocked').default(false),
  isCopyrightClaimed: boolean('is_copyright_claimed').default(false),
  isDemonetized: boolean('is_demonetized').default(false),
  isArchived: boolean('is_archived').default(false),
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  channelIdIdx: index('videos_channel_id_idx').on(table.channelId),
  categoryIdx: index('videos_category_idx').on(table.category),
  subjectIdx: index('videos_subject_idx').on(table.subject),
  visibilityIdx: index('videos_visibility_idx').on(table.visibility),
  publishedAtIdx: index('videos_published_at_idx').on(table.publishedAt),
  viewCountIdx: index('videos_view_count_idx').on(table.viewCount),
  engagementRateIdx: index('videos_engagement_rate_idx').on(table.engagementRate),
  recommendationScoreIdx: index('videos_recommendation_score_idx').on(table.recommendationScore),
  trendingScoreIdx: index('videos_trending_score_idx').on(table.trendingScore),
  isEducationalIdx: index('videos_is_educational_idx').on(table.isEducational),
  isShortIdx: index('videos_is_short_idx').on(table.isShort),
  processingStatusIdx: index('videos_processing_status_idx').on(table.processingStatus)
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriberId: uuid('subscriber_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),
  subscriptionType: varchar('subscription_type', { length: 20 }).default('free'), // free, premium, member
  notificationsEnabled: boolean('notifications_enabled').default(true),
  notificationSettings: jsonb('notification_settings').default({}),
  membershipLevel: varchar('membership_level', { length: 50 }),
  membershipPrice: numeric('membership_price', { precision: 8, scale: 2 }),
  membershipBenefits: jsonb('membership_benefits').default([]),
  autoRenew: boolean('auto_renew').default(true),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  subscriberChannelIdx: uniqueIndex('subscriptions_subscriber_channel_idx').on(table.subscriberId, table.channelId),
  subscriberIdIdx: index('subscriptions_subscriber_id_idx').on(table.subscriberId),
  channelIdIdx: index('subscriptions_channel_id_idx').on(table.channelId),
  subscriptionTypeIdx: index('subscriptions_type_idx').on(table.subscriptionType)
}));

export const videoViews = pgTable('video_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // View details
  watchTime: integer('watch_time').default(0), // seconds watched
  watchPercentage: numeric('watch_percentage', { precision: 5, scale: 2 }).default(0),
  qualityWatched: varchar('quality_watched', { length: 10 }),
  deviceType: varchar('device_type', { length: 20 }),
  platform: varchar('platform', { length: 20 }),
  referrer: text('referrer'),
  country: varchar('country', { length: 2 }),
  region: varchar('region', { length: 100 }),
  city: varchar('city', { length: 100 }),
  
  // Engagement tracking
  liked: boolean('liked').default(false),
  disliked: boolean('disliked').default(false),
  commented: boolean('commented').default(false),
  shared: boolean('shared').default(false),
  subscribed: boolean('subscribed').default(false),
  
  // Advanced analytics
  watchPattern: jsonb('watch_pattern').default([]), // Array of watch segments
  interactionEvents: jsonb('interaction_events').default([]),
  dropOffTime: integer('drop_off_time'),
  resumedTimes: integer('resumed_times').default(0),
  
  // A/B testing
  experimentGroup: varchar('experiment_group', { length: 50 }),
  variantShown: varchar('variant_shown', { length: 50 }),
  
  viewedAt: timestamp('viewed_at').defaultNow(),
  lastInteractionAt: timestamp('last_interaction_at')
}, (table) => ({
  videoIdIdx: index('video_views_video_id_idx').on(table.videoId),
  userIdIdx: index('video_views_user_id_idx').on(table.userId),
  viewedAtIdx: index('video_views_viewed_at_idx').on(table.viewedAt),
  countryIdx: index('video_views_country_idx').on(table.country),
  deviceTypeIdx: index('video_views_device_type_idx').on(table.deviceType)
}));

export const videoRecommendations = pgTable('video_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  
  // Recommendation context
  recommendationType: varchar('recommendation_type', { length: 30 }).notNull(), // home_feed, watch_next, trending, search, related
  position: integer('position').notNull(),
  page: integer('page').default(1),
  section: varchar('section', { length: 50 }),
  
  // Scoring details
  score: numeric('score', { precision: 8, scale: 6 }).notNull(),
  algorithmVersion: varchar('algorithm_version', { length: 20 }).notNull(),
  modelScores: jsonb('model_scores').default({}), // Individual model contributions
  features: jsonb('features').default({}), // Feature values used
  
  // Performance tracking
  wasClicked: boolean('was_clicked').default(false),
  clickedAt: timestamp('clicked_at'),
  impressionDuration: integer('impression_duration'), // milliseconds
  viewportPercentage: numeric('viewport_percentage', { precision: 5, scale: 2 }),
  
  // A/B testing
  experimentId: varchar('experiment_id', { length: 50 }),
  treatmentGroup: varchar('treatment_group', { length: 50 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at')
}, (table) => ({
  userRecommendationIdx: index('video_recommendations_user_idx').on(table.userId, table.recommendationType),
  videoIdIdx: index('video_recommendations_video_id_idx').on(table.videoId),
  scoreIdx: index('video_recommendations_score_idx').on(table.score),
  createdAtIdx: index('video_recommendations_created_at_idx').on(table.createdAt),
  experimentIdx: index('video_recommendations_experiment_idx').on(table.experimentId, table.treatmentGroup)
}));

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Content preferences
  preferredCategories: jsonb('preferred_categories').default([]),
  preferredSubjects: jsonb('preferred_subjects').default([]),
  preferredLanguages: jsonb('preferred_languages').default(['en']),
  preferredDifficulty: varchar('preferred_difficulty', { length: 20 }),
  preferredDuration: varchar('preferred_duration', { length: 20 }), // short, medium, long
  
  // Discovery preferences
  discoverySensitivity: numeric('discovery_sensitivity', { precision: 3, scale: 2 }).default(0.5), // 0-1
  diversityPreference: numeric('diversity_preference', { precision: 3, scale: 2 }).default(0.3),
  noveltyPreference: numeric('novelty_preference', { precision: 3, scale: 2 }).default(0.2),
  trendingWeight: numeric('trending_weight', { precision: 3, scale: 2 }).default(0.3),
  
  // Behavioral patterns
  typicalWatchTime: integer('typical_watch_time'), // average session length
  preferredWatchTimes: jsonb('preferred_watch_times').default([]), // hours of day
  devicePreferences: jsonb('device_preferences').default({}),
  qualityPreference: varchar('quality_preference', { length: 10 }).default('auto'),
  
  // Engagement patterns
  engagementStyle: varchar('engagement_style', { length: 20 }).default('passive'), // passive, active, social
  commentFrequency: varchar('comment_frequency', { length: 20 }).default('rarely'),
  shareFrequency: varchar('share_frequency', { length: 20 }).default('rarely'),
  subscriptionTendency: varchar('subscription_tendency', { length: 20 }).default('selective'),
  
  // Learning preferences (educational focus)
  learningStyle: varchar('learning_style', { length: 20 }),
  learningGoals: jsonb('learning_goals').default([]),
  skillLevel: jsonb('skill_level').default({}), // subject -> level mapping
  
  // Privacy and control
  personalizationEnabled: boolean('personalization_enabled').default(true),
  dataCollectionConsent: boolean('data_collection_consent').default(true),
  adPersonalization: boolean('ad_personalization').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('user_preferences_user_id_idx').on(table.userId)
}));

export const videoLikes = pgTable('video_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  likeType: varchar('like_type', { length: 10 }).notNull(), // like, dislike
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  videoUserIdx: uniqueIndex('video_likes_video_user_idx').on(table.videoId, table.userId),
  videoIdIdx: index('video_likes_video_id_idx').on(table.videoId),
  userIdIdx: index('video_likes_user_id_idx').on(table.userId),
  likeTypeIdx: index('video_likes_type_idx').on(table.likeType)
}));

export const videoComments = pgTable('video_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  parentCommentId: uuid('parent_comment_id').references(() => videoComments.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  timestamp: integer('timestamp'), // Video timestamp for the comment
  likeCount: integer('like_count').default(0),
  dislikeCount: integer('dislike_count').default(0),
  replyCount: integer('reply_count').default(0),
  isEdited: boolean('is_edited').default(false),
  isPinned: boolean('is_pinned').default(false),
  isHearted: boolean('is_hearted').default(false), // Hearted by channel owner
  moderationStatus: varchar('moderation_status', { length: 20 }).default('approved'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  videoIdIdx: index('video_comments_video_id_idx').on(table.videoId),
  userIdIdx: index('video_comments_user_id_idx').on(table.userId),
  parentCommentIdx: index('video_comments_parent_idx').on(table.parentCommentId),
  createdAtIdx: index('video_comments_created_at_idx').on(table.createdAt),
  likeCountIdx: index('video_comments_like_count_idx').on(table.likeCount)
}));

export const playlists = pgTable('playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  visibility: varchar('visibility', { length: 20 }).default('public'), // public, unlisted, private
  videoCount: integer('video_count').default(0),
  totalDuration: integer('total_duration').default(0), // in seconds
  viewCount: integer('view_count').default(0),
  isOfficial: boolean('is_official').default(false), // Created by channel owner
  category: varchar('category', { length: 50 }),
  tags: jsonb('tags').default([]),
  collaborators: jsonb('collaborators').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('playlists_user_id_idx').on(table.userId),
  visibilityIdx: index('playlists_visibility_idx').on(table.visibility),
  categoryIdx: index('playlists_category_idx').on(table.category),
  viewCountIdx: index('playlists_view_count_idx').on(table.viewCount)
}));

export const playlistVideos = pgTable('playlist_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  playlistId: uuid('playlist_id').references(() => playlists.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull(),
  addedBy: uuid('added_by').references(() => users.id, { onDelete: 'set null' }),
  addedAt: timestamp('added_at').defaultNow()
}, (table) => ({
  playlistVideoIdx: uniqueIndex('playlist_videos_playlist_video_idx').on(table.playlistId, table.videoId),
  playlistIdIdx: index('playlist_videos_playlist_id_idx').on(table.playlistId),
  videoIdIdx: index('playlist_videos_video_id_idx').on(table.videoId),
  positionIdx: index('playlist_videos_position_idx').on(table.playlistId, table.position)
}));

export const videoAnalytics = pgTable('video_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  
  // Basic metrics
  views: integer('views').default(0),
  uniqueViews: integer('unique_views').default(0),
  watchTime: integer('watch_time').default(0), // total seconds watched
  averageWatchTime: integer('average_watch_time').default(0),
  averageViewDuration: integer('average_view_duration').default(0),
  
  // Engagement metrics
  likes: integer('likes').default(0),
  dislikes: integer('dislikes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  subscribersGained: integer('subscribers_gained').default(0),
  
  // Discovery metrics
  impressions: integer('impressions').default(0),
  clickThroughRate: numeric('click_through_rate', { precision: 5, scale: 4 }).default(0),
  trafficSources: jsonb('traffic_sources').default({}),
  
  // Demographic data
  demographics: jsonb('demographics').default({}),
  geography: jsonb('geography').default({}),
  devices: jsonb('devices').default({}),
  
  // Revenue metrics
  adRevenue: numeric('ad_revenue', { precision: 10, scale: 2 }).default(0),
  sponsorRevenue: numeric('sponsor_revenue', { precision: 10, scale: 2 }).default(0),
  membershipRevenue: numeric('membership_revenue', { precision: 10, scale: 2 }).default(0),
  
  // Retention analysis
  retentionCurve: jsonb('retention_curve').default([]), // Array of retention percentages
  dropOffPoints: jsonb('drop_off_points').default([]),
  replaySegments: jsonb('replay_segments').default([]),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  videoDateIdx: uniqueIndex('video_analytics_video_date_idx').on(table.videoId, table.date),
  videoIdIdx: index('video_analytics_video_id_idx').on(table.videoId),
  dateIdx: index('video_analytics_date_idx').on(table.date)
}));

export const algorithmModels = pgTable('algorithm_models', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // collaborative_filtering, content_based, deep_learning, hybrid
  description: text('description'),
  
  // Model configuration
  hyperparameters: jsonb('hyperparameters').default({}),
  featureSet: jsonb('feature_set').default([]),
  trainingData: jsonb('training_data').default({}),
  
  // Performance metrics
  accuracy: numeric('accuracy', { precision: 5, scale: 4 }),
  precision: numeric('precision', { precision: 5, scale: 4 }),
  recall: numeric('recall', { precision: 5, scale: 4 }),
  f1Score: numeric('f1_score', { precision: 5, scale: 4 }),
  auc: numeric('auc', { precision: 5, scale: 4 }),
  
  // Business metrics
  clickThroughRate: numeric('click_through_rate', { precision: 5, scale: 4 }),
  watchTimeImprovement: numeric('watch_time_improvement', { precision: 5, scale: 4 }),
  userSatisfaction: numeric('user_satisfaction', { precision: 5, scale: 4 }),
  
  // Model status
  status: varchar('status', { length: 20 }).default('training'), // training, testing, active, retired
  isActive: boolean('is_active').default(false),
  weight: numeric('weight', { precision: 3, scale: 2 }).default(1.0), // For ensemble models
  
  // Deployment info
  modelPath: text('model_path'),
  servingEndpoint: text('serving_endpoint'),
  lastTrainedAt: timestamp('last_trained_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameVersionIdx: uniqueIndex('algorithm_models_name_version_idx').on(table.name, table.version),
  typeIdx: index('algorithm_models_type_idx').on(table.type),
  statusIdx: index('algorithm_models_status_idx').on(table.status),
  isActiveIdx: index('algorithm_models_is_active_idx').on(table.isActive)
}));

// Relations
export const channelRelations = relations(channels, ({ one, many }) => ({
  user: one(users, {
    fields: [channels.userId],
    references: [users.id],
  }),
  videos: many(videos),
  subscriptions: many(subscriptions),
}));

export const videoRelations = relations(videos, ({ one, many }) => ({
  channel: one(channels, {
    fields: [videos.channelId],
    references: [channels.id],
  }),
  views: many(videoViews),
  likes: many(videoLikes),
  comments: many(videoComments),
  recommendations: many(videoRecommendations),
  analytics: many(videoAnalytics),
  playlistVideos: many(playlistVideos),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [subscriptions.channelId],
    references: [channels.id],
  }),
}));

export const videoViewRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoViews.userId],
    references: [users.id],
  }),
}));

export const videoRecommendationRelations = relations(videoRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [videoRecommendations.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoRecommendations.videoId],
    references: [videos.id],
  }),
}));

export const userPreferenceRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const videoLikeRelations = relations(videoLikes, ({ one }) => ({
  video: one(videos, {
    fields: [videoLikes.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoLikes.userId],
    references: [users.id],
  }),
}));

export const videoCommentRelations = relations(videoComments, ({ one, many }) => ({
  video: one(videos, {
    fields: [videoComments.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoComments.userId],
    references: [users.id],
  }),
  parentComment: one(videoComments, {
    fields: [videoComments.parentCommentId],
    references: [videoComments.id],
  }),
  replies: many(videoComments),
}));

export const playlistRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistVideos: many(playlistVideos),
}));

export const playlistVideoRelations = relations(playlistVideos, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistVideos.playlistId],
    references: [playlists.id],
  }),
  video: one(videos, {
    fields: [playlistVideos.videoId],
    references: [videos.id],
  }),
  addedByUser: one(users, {
    fields: [playlistVideos.addedBy],
    references: [users.id],
  }),
}));

export const videoAnalyticsRelations = relations(videoAnalytics, ({ one }) => ({
  video: one(videos, {
    fields: [videoAnalytics.videoId],
    references: [videos.id],
  }),
}));