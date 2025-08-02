import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Social Media Posts (like Instagram posts)
export const socialPosts = pgTable('social_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  caption: text('caption'),
  mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image', 'video', 'carousel'
  mediaUrls: jsonb('media_urls').default([]).notNull(), // Array of media URLs
  thumbnailUrl: text('thumbnail_url'), // For videos
  aspectRatio: varchar('aspect_ratio', { length: 10 }).default('1:1'), // '1:1', '4:5', '16:9'
  duration: integer('duration'), // For videos, in seconds
  location: varchar('location', { length: 255 }),
  tags: jsonb('tags').default([]), // Array of hashtags
  mentions: jsonb('mentions').default([]), // Array of user IDs
  studyRelated: boolean('study_related').default(false),
  subject: varchar('subject', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }), // 'beginner', 'intermediate', 'advanced'
  likesCount: integer('likes_count').default(0),
  commentsCount: integer('comments_count').default(0),
  sharesCount: integer('shares_count').default(0),
  viewsCount: integer('views_count').default(0),
  isPublic: boolean('is_public').default(true),
  allowComments: boolean('allow_comments').default(true),
  allowSharing: boolean('allow_sharing').default(true),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Social Media Stories (like Instagram/Snapchat stories)
export const socialStories = pgTable('social_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image', 'video'
  mediaUrl: text('media_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration').default(5), // Display duration in seconds
  backgroundColor: varchar('background_color', { length: 7 }).default('#000000'),
  textOverlay: text('text_overlay'),
  textColor: varchar('text_color', { length: 7 }).default('#FFFFFF'),
  textPosition: jsonb('text_position').default({}), // {x: 0, y: 0}
  stickers: jsonb('stickers').default([]), // Array of sticker objects
  filters: jsonb('filters').default({}), // Applied filters/effects
  music: varchar('music', { length: 255 }), // Background music
  studyTip: text('study_tip'), // Educational content overlay
  viewsCount: integer('views_count').default(0),
  isPublic: boolean('is_public').default(true),
  expiresAt: timestamp('expires_at').notNull(), // Stories expire after 24 hours
  createdAt: timestamp('created_at').defaultNow()
});

// Story Views (who viewed which story)
export const storyViews = pgTable('story_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').references(() => socialStories.id).notNull(),
  viewerId: uuid('viewer_id').references(() => users.id).notNull(),
  viewedAt: timestamp('viewed_at').defaultNow()
});

// Post Likes
export const postLikes = pgTable('post_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => socialPosts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  likeType: varchar('like_type', { length: 20 }).default('like'), // 'like', 'love', 'helpful', 'genius'
  createdAt: timestamp('created_at').defaultNow()
});

// Post Comments
export const postComments = pgTable('post_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => socialPosts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  parentCommentId: uuid('parent_comment_id').references(() => postComments.id), // For replies
  content: text('content').notNull(),
  mentions: jsonb('mentions').default([]), // Array of mentioned user IDs
  likesCount: integer('likes_count').default(0),
  repliesCount: integer('replies_count').default(0),
  isEdited: boolean('is_edited').default(false),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Comment Likes
export const commentLikes = pgTable('comment_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  commentId: uuid('comment_id').references(() => postComments.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Post Shares
export const postShares = pgTable('post_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => socialPosts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  shareType: varchar('share_type', { length: 20 }).notNull(), // 'repost', 'story', 'dm', 'external'
  shareToUserId: uuid('share_to_user_id').references(() => users.id), // For DMs
  shareMessage: text('share_message'),
  createdAt: timestamp('created_at').defaultNow()
});

// Post Saves/Bookmarks
export const postSaves = pgTable('post_saves', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => socialPosts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  collectionName: varchar('collection_name', { length: 100 }).default('Saved Posts'),
  createdAt: timestamp('created_at').defaultNow()
});

// User Followers/Following
export const socialFollows = pgTable('social_follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').references(() => users.id).notNull(),
  followingId: uuid('following_id').references(() => users.id).notNull(),
  isClose: boolean('is_close').default(false), // Close friends feature
  notificationsEnabled: boolean('notifications_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Direct Messages
export const directMessages = pgTable('direct_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  messageType: varchar('message_type', { length: 20 }).notNull(), // 'text', 'image', 'video', 'audio', 'post_share', 'story_reply'
  content: text('content'),
  mediaUrl: text('media_url'),
  replyToMessageId: uuid('reply_to_message_id').references(() => directMessages.id),
  sharedPostId: uuid('shared_post_id').references(() => socialPosts.id),
  sharedStoryId: uuid('shared_story_id').references(() => socialStories.id),
  isRead: boolean('is_read').default(false),
  isDelivered: boolean('is_delivered').default(false),
  disappearsAt: timestamp('disappears_at'), // For disappearing messages
  reactions: jsonb('reactions').default([]), // Array of reaction objects
  createdAt: timestamp('created_at').defaultNow()
});

// Conversation Metadata
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  isGroup: boolean('is_group').default(false),
  groupName: varchar('group_name', { length: 100 }),
  groupAvatar: text('group_avatar'),
  participantIds: jsonb('participant_ids').notNull(), // Array of user IDs
  adminIds: jsonb('admin_ids').default([]), // For group chats
  lastMessageId: uuid('last_message_id').references(() => directMessages.id),
  lastActivity: timestamp('last_activity').defaultNow(),
  isArchived: boolean('is_archived').default(false),
  isMuted: boolean('is_muted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Social Media Notifications
export const socialNotifications = pgTable('social_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(), // Who receives the notification
  actorId: uuid('actor_id').references(() => users.id).notNull(), // Who performed the action
  type: varchar('type', { length: 30 }).notNull(), // 'like', 'comment', 'follow', 'mention', 'share', 'story_view'
  entityType: varchar('entity_type', { length: 20 }), // 'post', 'story', 'comment'
  entityId: uuid('entity_id'), // ID of the entity (post, story, comment)
  message: text('message'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Trending Hashtags
export const trendingHashtags = pgTable('trending_hashtags', {
  id: uuid('id').defaultRandom().primaryKey(),
  hashtag: varchar('hashtag', { length: 100 }).notNull(),
  postsCount: integer('posts_count').default(0),
  category: varchar('category', { length: 50 }), // 'math', 'science', 'language', 'general'
  trendScore: integer('trend_score').default(0),
  region: varchar('region', { length: 50 }).default('global'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// User Activity Analytics
export const socialAnalytics = pgTable('social_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: timestamp('date').notNull(),
  postsCreated: integer('posts_created').default(0),
  storiesCreated: integer('stories_created').default(0),
  likesGiven: integer('likes_given').default(0),
  likesReceived: integer('likes_received').default(0),
  commentsGiven: integer('comments_given').default(0),
  commentsReceived: integer('comments_received').default(0),
  sharesGiven: integer('shares_given').default(0),
  sharesReceived: integer('shares_received').default(0),
  profileViews: integer('profile_views').default(0),
  newFollowers: integer('new_followers').default(0),
  newFollowing: integer('new_following').default(0),
  timeSpentMinutes: integer('time_spent_minutes').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// User Social Profile Settings
export const socialProfiles = pgTable('social_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 100 }),
  pronouns: varchar('pronouns', { length: 20 }),
  studyInterests: jsonb('study_interests').default([]), // Array of subjects
  achievements: jsonb('achievements').default([]), // Array of achievement IDs
  profileViews: integer('profile_views').default(0),
  isPrivate: boolean('is_private').default(false),
  isVerified: boolean('is_verified').default(false),
  allowMessageRequests: boolean('allow_message_requests').default(true),
  showActivityStatus: boolean('show_activity_status').default(true),
  allowTagging: boolean('allow_tagging').default(true),
  hideStoryFrom: jsonb('hide_story_from').default([]), // Array of user IDs
  closeFriends: jsonb('close_friends').default([]), // Array of user IDs
  blockedUsers: jsonb('blocked_users').default([]), // Array of blocked user IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Relations
export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  user: one(users, { fields: [socialPosts.userId], references: [users.id] }),
  likes: many(postLikes),
  comments: many(postComments),
  shares: many(postShares),
  saves: many(postSaves)
}));

export const socialStoriesRelations = relations(socialStories, ({ one, many }) => ({
  user: one(users, { fields: [socialStories.userId], references: [users.id] }),
  views: many(storyViews)
}));

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(socialStories, { fields: [storyViews.storyId], references: [socialStories.id] }),
  viewer: one(users, { fields: [storyViews.viewerId], references: [users.id] })
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(socialPosts, { fields: [postLikes.postId], references: [socialPosts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] })
}));

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(socialPosts, { fields: [postComments.postId], references: [socialPosts.id] }),
  user: one(users, { fields: [postComments.userId], references: [users.id] }),
  parentComment: one(postComments, { fields: [postComments.parentCommentId], references: [postComments.id] }),
  replies: many(postComments),
  likes: many(commentLikes)
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(postComments, { fields: [commentLikes.commentId], references: [postComments.id] }),
  user: one(users, { fields: [commentLikes.userId], references: [users.id] })
}));

export const postSharesRelations = relations(postShares, ({ one }) => ({
  post: one(socialPosts, { fields: [postShares.postId], references: [socialPosts.id] }),
  user: one(users, { fields: [postShares.userId], references: [users.id] }),
  shareToUser: one(users, { fields: [postShares.shareToUserId], references: [users.id] })
}));

export const postSavesRelations = relations(postSaves, ({ one }) => ({
  post: one(socialPosts, { fields: [postSaves.postId], references: [socialPosts.id] }),
  user: one(users, { fields: [postSaves.userId], references: [users.id] })
}));

export const socialFollowsRelations = relations(socialFollows, ({ one }) => ({
  follower: one(users, { fields: [socialFollows.followerId], references: [users.id] }),
  following: one(users, { fields: [socialFollows.followingId], references: [users.id] })
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, { fields: [directMessages.senderId], references: [users.id] }),
  receiver: one(users, { fields: [directMessages.receiverId], references: [users.id] }),
  replyToMessage: one(directMessages, { fields: [directMessages.replyToMessageId], references: [directMessages.id] }),
  sharedPost: one(socialPosts, { fields: [directMessages.sharedPostId], references: [socialPosts.id] }),
  sharedStory: one(socialStories, { fields: [directMessages.sharedStoryId], references: [socialStories.id] }),
  conversation: one(conversations, { fields: [directMessages.conversationId], references: [conversations.id] })
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  lastMessage: one(directMessages, { fields: [conversations.lastMessageId], references: [directMessages.id] }),
  messages: many(directMessages)
}));

export const socialNotificationsRelations = relations(socialNotifications, ({ one }) => ({
  user: one(users, { fields: [socialNotifications.userId], references: [users.id] }),
  actor: one(users, { fields: [socialNotifications.actorId], references: [users.id] })
}));

export const socialAnalyticsRelations = relations(socialAnalytics, ({ one }) => ({
  user: one(users, { fields: [socialAnalytics.userId], references: [users.id] })
}));

export const socialProfilesRelations = relations(socialProfiles, ({ one }) => ({
  user: one(users, { fields: [socialProfiles.userId], references: [users.id] })
}));