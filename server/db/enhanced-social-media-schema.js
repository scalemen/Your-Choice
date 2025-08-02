import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, serial, numeric, index, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Enhanced Social Media Posts with comprehensive features
export const enhancedSocialPosts = pgTable('enhanced_social_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Content fields
  caption: text('caption'),
  altText: text('alt_text'), // Accessibility
  originalLanguage: varchar('original_language', { length: 10 }).default('en'),
  translations: jsonb('translations').default({}), // Multi-language support
  
  // Media information
  mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image', 'video', 'carousel', 'document', 'audio'
  mediaUrls: jsonb('media_urls').default([]).notNull(),
  processedMediaUrls: jsonb('processed_media_urls').default([]), // Different resolutions
  thumbnailUrl: text('thumbnail_url'),
  aspectRatio: varchar('aspect_ratio', { length: 10 }).default('1:1'),
  dimensions: jsonb('dimensions').default({}), // {width: 1080, height: 1080}
  fileSize: integer('file_size'), // in bytes
  duration: integer('duration'), // For videos/audio, in seconds
  
  // Location and context
  location: varchar('location', { length: 255 }),
  coordinates: jsonb('coordinates'), // {lat: 0, lng: 0}
  timezone: varchar('timezone', { length: 50 }),
  
  // Social features
  tags: jsonb('tags').default([]),
  mentions: jsonb('mentions').default([]),
  collaborators: jsonb('collaborators').default([]), // Co-authors
  
  // Study-specific features
  studyRelated: boolean('study_related').default(false),
  subject: varchar('subject', { length: 100 }),
  topics: jsonb('topics').default([]), // Specific topics within subject
  difficulty: varchar('difficulty', { length: 20 }),
  studyLevel: varchar('study_level', { length: 50 }), // 'elementary', 'high_school', 'university', 'graduate'
  learningObjectives: jsonb('learning_objectives').default([]),
  resources: jsonb('resources').default([]), // Links to external resources
  estimatedStudyTime: integer('estimated_study_time'), // minutes
  
  // Engagement metrics
  likesCount: integer('likes_count').default(0),
  commentsCount: integer('comments_count').default(0),
  sharesCount: integer('shares_count').default(0),
  savesCount: integer('saves_count').default(0),
  viewsCount: integer('views_count').default(0),
  clicksCount: integer('clicks_count').default(0),
  engagementRate: numeric('engagement_rate', { precision: 5, scale: 4 }).default(0),
  
  // Privacy and moderation
  isPublic: boolean('is_public').default(true),
  visibility: varchar('visibility', { length: 20 }).default('public'), // 'public', 'followers', 'close_friends', 'private'
  allowComments: boolean('allow_comments').default(true),
  allowSharing: boolean('allow_sharing').default(true),
  allowDownload: boolean('allow_download').default(false),
  restrictedCountries: jsonb('restricted_countries').default([]),
  contentWarnings: jsonb('content_warnings').default([]),
  isAgeRestricted: boolean('is_age_restricted').default(false),
  minimumAge: integer('minimum_age').default(13),
  
  // Content management
  isArchived: boolean('is_archived').default(false),
  isDeleted: boolean('is_deleted').default(false),
  isDraft: boolean('is_draft').default(false),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  moderationStatus: varchar('moderation_status', { length: 20 }).default('approved'), // 'pending', 'approved', 'rejected', 'flagged'
  moderationNotes: text('moderation_notes'),
  
  // SEO and discovery
  seoTitle: varchar('seo_title', { length: 100 }),
  seoDescription: text('seo_description'),
  keywords: jsonb('keywords').default([]),
  category: varchar('category', { length: 50 }),
  subcategory: varchar('subcategory', { length: 50 }),
  
  // Analytics and performance
  impressions: integer('impressions').default(0),
  reach: integer('reach').default(0),
  uniqueViews: integer('unique_views').default(0),
  averageWatchTime: integer('average_watch_time'), // seconds
  bounceRate: numeric('bounce_rate', { precision: 5, scale: 4 }).default(0),
  conversionRate: numeric('conversion_rate', { precision: 5, scale: 4 }).default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastViewedAt: timestamp('last_viewed_at'),
  lastEngagementAt: timestamp('last_engagement_at')
}, (table) => ({
  userIdIdx: index('enhanced_social_posts_user_id_idx').on(table.userId),
  createdAtIdx: index('enhanced_social_posts_created_at_idx').on(table.createdAt),
  studyRelatedIdx: index('enhanced_social_posts_study_related_idx').on(table.studyRelated),
  subjectIdx: index('enhanced_social_posts_subject_idx').on(table.subject),
  visibilityIdx: index('enhanced_social_posts_visibility_idx').on(table.visibility),
  moderationStatusIdx: index('enhanced_social_posts_moderation_status_idx').on(table.moderationStatus),
  engagementIdx: index('enhanced_social_posts_engagement_idx').on(table.engagementRate),
  tagsIdx: index('enhanced_social_posts_tags_idx').on(table.tags)
}));

// Enhanced Stories with advanced features
export const enhancedSocialStories = pgTable('enhanced_social_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Content
  mediaType: varchar('media_type', { length: 20 }).notNull(),
  mediaUrl: text('media_url').notNull(),
  processedMediaUrl: text('processed_media_url'), // Optimized version
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration').default(5),
  
  // Visual customization
  backgroundColor: varchar('background_color', { length: 7 }).default('#000000'),
  backgroundGradient: jsonb('background_gradient'),
  textOverlay: text('text_overlay'),
  textColor: varchar('text_color', { length: 7 }).default('#FFFFFF'),
  textFont: varchar('text_font', { length: 50 }).default('Arial'),
  textSize: integer('text_size').default(16),
  textPosition: jsonb('text_position').default({}),
  textAlignment: varchar('text_alignment', { length: 10 }).default('center'),
  textAnimation: varchar('text_animation', { length: 50 }),
  
  // Interactive elements
  stickers: jsonb('stickers').default([]),
  polls: jsonb('polls').default([]),
  questions: jsonb('questions').default([]),
  quizzes: jsonb('quizzes').default([]),
  links: jsonb('links').default([]),
  mentions: jsonb('mentions').default([]),
  
  // Effects and filters
  filters: jsonb('filters').default({}),
  effects: jsonb('effects').default([]),
  music: varchar('music', { length: 255 }),
  musicStartTime: integer('music_start_time').default(0),
  soundEffects: jsonb('sound_effects').default([]),
  
  // Study features
  studyTip: text('study_tip'),
  flashcardId: uuid('flashcard_id'),
  quizId: uuid('quiz_id'),
  noteId: uuid('note_id'),
  studyGoal: text('study_goal'),
  learningCheckpoint: text('learning_checkpoint'),
  
  // Engagement
  viewsCount: integer('views_count').default(0),
  reactionsCount: integer('reactions_count').default(0),
  repliesCount: integer('replies_count').default(0),
  sharesCount: integer('shares_count').default(0),
  
  // Privacy and visibility
  isPublic: boolean('is_public').default(true),
  visibility: varchar('visibility', { length: 20 }).default('public'),
  allowReplies: boolean('allow_replies').default(true),
  allowReactions: boolean('allow_reactions').default(true),
  hiddenFromUsers: jsonb('hidden_from_users').default([]),
  closefriendsOnly: boolean('closefriends_only').default(false),
  
  // Analytics
  uniqueViews: integer('unique_views').default(0),
  completionRate: numeric('completion_rate', { precision: 5, scale: 4 }).default(0),
  replayCount: integer('replay_count').default(0),
  exitPoints: jsonb('exit_points').default([]), // When users exit the story
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  lastViewedAt: timestamp('last_viewed_at')
}, (table) => ({
  userIdIdx: index('enhanced_social_stories_user_id_idx').on(table.userId),
  createdAtIdx: index('enhanced_social_stories_created_at_idx').on(table.createdAt),
  expiresAtIdx: index('enhanced_social_stories_expires_at_idx').on(table.expiresAt),
  visibilityIdx: index('enhanced_social_stories_visibility_idx').on(table.visibility)
}));

// Enhanced Post Interactions
export const enhancedPostLikes = pgTable('enhanced_post_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => enhancedSocialPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  likeType: varchar('like_type', { length: 20 }).default('like'), // 'like', 'love', 'helpful', 'genius', 'mind_blown', 'fire'
  intensity: integer('intensity').default(1), // 1-5 scale for reaction strength
  deviceType: varchar('device_type', { length: 20 }), // 'mobile', 'desktop', 'tablet'
  location: jsonb('location'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  postUserUniqueIdx: uniqueIndex('enhanced_post_likes_post_user_unique').on(table.postId, table.userId),
  postIdIdx: index('enhanced_post_likes_post_id_idx').on(table.postId),
  userIdIdx: index('enhanced_post_likes_user_id_idx').on(table.userId),
  likeTypeIdx: index('enhanced_post_likes_type_idx').on(table.likeType)
}));

// Enhanced Comments with threading and reactions
export const enhancedPostComments = pgTable('enhanced_post_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => enhancedSocialPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  parentCommentId: uuid('parent_comment_id').references(() => enhancedPostComments.id, { onDelete: 'cascade' }),
  
  // Content
  content: text('content').notNull(),
  originalLanguage: varchar('original_language', { length: 10 }).default('en'),
  translations: jsonb('translations').default({}),
  contentType: varchar('content_type', { length: 20 }).default('text'), // 'text', 'media', 'sticker', 'gif'
  mediaUrl: text('media_url'),
  
  // Mentions and tags
  mentions: jsonb('mentions').default([]),
  hashtags: jsonb('hashtags').default([]),
  
  // Engagement
  likesCount: integer('likes_count').default(0),
  repliesCount: integer('replies_count').default(0),
  reportsCount: integer('reports_count').default(0),
  
  // Threading
  threadDepth: integer('thread_depth').default(0),
  threadPath: text('thread_path'), // Materialized path for efficient querying
  
  // Status
  isEdited: boolean('is_edited').default(false),
  isHidden: boolean('is_hidden').default(false),
  isDeleted: boolean('is_deleted').default(false),
  isPinned: boolean('is_pinned').default(false),
  moderationStatus: varchar('moderation_status', { length: 20 }).default('approved'),
  
  // Analytics
  readTime: integer('read_time'), // Estimated read time in seconds
  engagementScore: numeric('engagement_score', { precision: 5, scale: 2 }).default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  editedAt: timestamp('edited_at')
}, (table) => ({
  postIdIdx: index('enhanced_post_comments_post_id_idx').on(table.postId),
  userIdIdx: index('enhanced_post_comments_user_id_idx').on(table.userId),
  parentIdIdx: index('enhanced_post_comments_parent_id_idx').on(table.parentCommentId),
  threadPathIdx: index('enhanced_post_comments_thread_path_idx').on(table.threadPath),
  createdAtIdx: index('enhanced_post_comments_created_at_idx').on(table.createdAt)
}));

// User Relationships with advanced features
export const enhancedSocialFollows = pgTable('enhanced_social_follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Relationship type
  relationshipType: varchar('relationship_type', { length: 20 }).default('follow'), // 'follow', 'close_friend', 'blocked', 'muted'
  followBackStatus: boolean('follow_back_status').default(false),
  mutualFriends: jsonb('mutual_friends').default([]),
  
  // Interaction settings
  notificationsEnabled: boolean('notifications_enabled').default(true),
  showInFeed: boolean('show_in_feed').default(true),
  allowStoryViews: boolean('allow_story_views').default(true),
  allowDirectMessages: boolean('allow_direct_messages').default(true),
  
  // Analytics
  interactionFrequency: numeric('interaction_frequency', { precision: 5, scale: 2 }).default(0),
  lastInteractionAt: timestamp('last_interaction_at'),
  totalInteractions: integer('total_interactions').default(0),
  
  // Study connection
  sharedSubjects: jsonb('shared_subjects').default([]),
  studyCompatibility: numeric('study_compatibility', { precision: 3, scale: 2 }).default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  followerFollowingUniqueIdx: uniqueIndex('enhanced_social_follows_unique').on(table.followerId, table.followingId),
  followerIdIdx: index('enhanced_social_follows_follower_idx').on(table.followerId),
  followingIdIdx: index('enhanced_social_follows_following_idx').on(table.followingId),
  relationshipTypeIdx: index('enhanced_social_follows_type_idx').on(table.relationshipType)
}));

// Advanced Notifications System
export const enhancedSocialNotifications = pgTable('enhanced_social_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Notification details
  type: varchar('type', { length: 30 }).notNull(),
  subtype: varchar('subtype', { length: 30 }),
  entityType: varchar('entity_type', { length: 20 }),
  entityId: uuid('entity_id'),
  
  // Content
  title: varchar('title', { length: 100 }),
  message: text('message'),
  richContent: jsonb('rich_content').default({}), // For rich notifications
  actionUrl: text('action_url'),
  imageUrl: text('image_url'),
  
  // Personalization
  priority: varchar('priority', { length: 10 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  category: varchar('category', { length: 30 }), // 'social', 'study', 'achievement', 'reminder'
  tags: jsonb('tags').default([]),
  
  // Status
  isRead: boolean('is_read').default(false),
  isClicked: boolean('is_clicked').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  isArchived: boolean('is_archived').default(false),
  
  // Delivery
  deliveryMethod: jsonb('delivery_method').default(['in_app']), // 'in_app', 'push', 'email', 'sms'
  deliveryStatus: varchar('delivery_status', { length: 20 }).default('pending'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  clickedAt: timestamp('clicked_at'),
  
  // Grouping
  groupId: uuid('group_id'), // For grouping similar notifications
  batchId: uuid('batch_id'), // For batch notifications
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('enhanced_social_notifications_user_id_idx').on(table.userId),
  typeIdx: index('enhanced_social_notifications_type_idx').on(table.type),
  categoryIdx: index('enhanced_social_notifications_category_idx').on(table.category),
  priorityIdx: index('enhanced_social_notifications_priority_idx').on(table.priority),
  isReadIdx: index('enhanced_social_notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('enhanced_social_notifications_created_at_idx').on(table.createdAt)
}));

// Advanced Analytics and Insights
export const enhancedSocialAnalytics = pgTable('enhanced_social_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Time period
  date: timestamp('date').notNull(),
  period: varchar('period', { length: 10 }).notNull(), // 'hour', 'day', 'week', 'month'
  
  // Content metrics
  postsCreated: integer('posts_created').default(0),
  storiesCreated: integer('stories_created').default(0),
  commentsPosted: integer('comments_posted').default(0),
  
  // Engagement given
  likesGiven: integer('likes_given').default(0),
  commentsGiven: integer('comments_given').default(0),
  sharesGiven: integer('shares_given').default(0),
  storiesViewed: integer('stories_viewed').default(0),
  
  // Engagement received
  likesReceived: integer('likes_received').default(0),
  commentsReceived: integer('comments_received').default(0),
  sharesReceived: integer('shares_received').default(0),
  storyViews: integer('story_views').default(0),
  profileViews: integer('profile_views').default(0),
  
  // Growth metrics
  newFollowers: integer('new_followers').default(0),
  newFollowing: integer('new_following').default(0),
  unfollowers: integer('unfollowers').default(0),
  
  // Engagement metrics
  engagementRate: numeric('engagement_rate', { precision: 5, scale: 4 }).default(0),
  averageLikesPerPost: numeric('average_likes_per_post', { precision: 8, scale: 2 }).default(0),
  averageCommentsPerPost: numeric('average_comments_per_post', { precision: 8, scale: 2 }).default(0),
  storyCompletionRate: numeric('story_completion_rate', { precision: 5, scale: 4 }).default(0),
  
  // Time metrics
  timeSpentMinutes: integer('time_spent_minutes').default(0),
  sessionsCount: integer('sessions_count').default(0),
  averageSessionLength: integer('average_session_length').default(0),
  
  // Study-specific metrics
  studyPostsShared: integer('study_posts_shared').default(0),
  studyTipsShared: integer('study_tips_shared').default(0),
  studyGroupsJoined: integer('study_groups_joined').default(0),
  learningStreakDays: integer('learning_streak_days').default(0),
  
  // Content performance
  topPerformingPostId: uuid('top_performing_post_id'),
  topPerformingStoryId: uuid('top_performing_story_id'),
  mostUsedHashtags: jsonb('most_used_hashtags').default([]),
  mostActiveHours: jsonb('most_active_hours').default([]),
  
  // Audience insights
  topFollowerLocations: jsonb('top_follower_locations').default([]),
  followerAgeGroups: jsonb('follower_age_groups').default({}),
  followerInterests: jsonb('follower_interests').default([]),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userDateIdx: uniqueIndex('enhanced_social_analytics_user_date_period').on(table.userId, table.date, table.period),
  userIdIdx: index('enhanced_social_analytics_user_id_idx').on(table.userId),
  dateIdx: index('enhanced_social_analytics_date_idx').on(table.date),
  periodIdx: index('enhanced_social_analytics_period_idx').on(table.period)
}));

// Content Moderation and Safety
export const enhancedContentModeration = pgTable('enhanced_content_moderation', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentType: varchar('content_type', { length: 20 }).notNull(), // 'post', 'story', 'comment'
  contentId: uuid('content_id').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  moderatorId: uuid('moderator_id').references(() => users.id),
  
  // Moderation details
  action: varchar('action', { length: 20 }).notNull(), // 'approve', 'reject', 'flag', 'remove', 'restrict'
  reason: varchar('reason', { length: 50 }),
  reasonDetails: text('reason_details'),
  severity: varchar('severity', { length: 10 }).default('low'), // 'low', 'medium', 'high', 'critical'
  
  // Auto-moderation
  aiConfidenceScore: numeric('ai_confidence_score', { precision: 5, scale: 4 }),
  aiFlags: jsonb('ai_flags').default([]),
  aiSuggestions: jsonb('ai_suggestions').default([]),
  
  // Community reports
  reportCount: integer('report_count').default(0),
  reportReasons: jsonb('report_reasons').default([]),
  reporterIds: jsonb('reporter_ids').default([]),
  
  // Resolution
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'resolved', 'escalated', 'appealed'
  resolution: text('resolution'),
  appealReason: text('appeal_reason'),
  appealedAt: timestamp('appealed_at'),
  resolvedAt: timestamp('resolved_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  contentIdx: index('enhanced_content_moderation_content_idx').on(table.contentType, table.contentId),
  userIdIdx: index('enhanced_content_moderation_user_id_idx').on(table.userId),
  statusIdx: index('enhanced_content_moderation_status_idx').on(table.status),
  severityIdx: index('enhanced_content_moderation_severity_idx').on(table.severity)
}));

// Advanced Search and Discovery
export const enhancedSearchQueries = pgTable('enhanced_search_queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  
  // Query details
  query: text('query').notNull(),
  queryType: varchar('query_type', { length: 20 }).notNull(), // 'text', 'hashtag', 'user', 'location'
  filters: jsonb('filters').default({}),
  
  // Results
  resultsCount: integer('results_count').default(0),
  clickedResults: jsonb('clicked_results').default([]),
  selectedResult: uuid('selected_result'),
  
  // Context
  searchContext: varchar('search_context', { length: 30 }), // 'feed', 'explore', 'profile', 'study'
  deviceType: varchar('device_type', { length: 20 }),
  location: jsonb('location'),
  
  // Performance
  responseTime: integer('response_time'), // milliseconds
  satisfaction: integer('satisfaction'), // 1-5 rating
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('enhanced_search_queries_user_id_idx').on(table.userId),
  queryIdx: index('enhanced_search_queries_query_idx').on(table.query),
  queryTypeIdx: index('enhanced_search_queries_type_idx').on(table.queryType),
  createdAtIdx: index('enhanced_search_queries_created_at_idx').on(table.createdAt)
}));

// Relations
export const enhancedSocialPostsRelations = relations(enhancedSocialPosts, ({ one, many }) => ({
  user: one(users, { fields: [enhancedSocialPosts.userId], references: [users.id] }),
  likes: many(enhancedPostLikes),
  comments: many(enhancedPostComments)
}));

export const enhancedPostLikesRelations = relations(enhancedPostLikes, ({ one }) => ({
  post: one(enhancedSocialPosts, { fields: [enhancedPostLikes.postId], references: [enhancedSocialPosts.id] }),
  user: one(users, { fields: [enhancedPostLikes.userId], references: [users.id] })
}));

export const enhancedPostCommentsRelations = relations(enhancedPostComments, ({ one, many }) => ({
  post: one(enhancedSocialPosts, { fields: [enhancedPostComments.postId], references: [enhancedSocialPosts.id] }),
  user: one(users, { fields: [enhancedPostComments.userId], references: [users.id] }),
  parentComment: one(enhancedPostComments, { fields: [enhancedPostComments.parentCommentId], references: [enhancedPostComments.id] }),
  replies: many(enhancedPostComments)
}));

export const enhancedSocialFollowsRelations = relations(enhancedSocialFollows, ({ one }) => ({
  follower: one(users, { fields: [enhancedSocialFollows.followerId], references: [users.id] }),
  following: one(users, { fields: [enhancedSocialFollows.followingId], references: [users.id] })
}));

export const enhancedSocialNotificationsRelations = relations(enhancedSocialNotifications, ({ one }) => ({
  user: one(users, { fields: [enhancedSocialNotifications.userId], references: [users.id] }),
  actor: one(users, { fields: [enhancedSocialNotifications.actorId], references: [users.id] })
}));