import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { body, query, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { db } from '../db/index.js';
import { 
  socialPosts, socialStories, socialLikes, socialComments, socialShares, socialSaves,
  socialFollows, socialMessages, socialNotifications, socialStoryViews, socialHashtags,
  socialAnalytics, socialProfiles
} from '../db/social-media-schema.js';
import { users } from '../db/schema.js';
import { eq, and, desc, asc, sql, inArray, gt, lt, gte, lte, like, or, isNull, ne, count } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Rate limiting configurations
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: { error: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: { error: 'Too many messages, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/social');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Apply rate limiting
router.use(generalLimiter);

// ==================== FEED & DISCOVERY ====================

/**
 * Get personalized feed
 */
router.get('/feed', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type = 'following' } = req.query;
    const offset = (page - 1) * limit;

    const cacheKey = `feed_${userId}_${type}_${page}_${limit}`;
    let cached = cache.get(cacheKey);

    if (!cached) {
      let posts;

      if (type === 'following') {
        // Get posts from followed users
        const following = await db.select({ followingId: socialFollows.followingId })
          .from(socialFollows)
          .where(and(
            eq(socialFollows.followerId, userId),
            eq(socialFollows.isAccepted, true),
            isNull(socialFollows.unfollowedAt)
          ));

        const followingIds = following.map(f => f.followingId);
        followingIds.push(userId); // Include own posts

        posts = await db.select({
          id: socialPosts.id,
          caption: socialPosts.caption,
          imageUrls: socialPosts.imageUrls,
          videoUrl: socialPosts.videoUrl,
          aspectRatio: socialPosts.aspectRatio,
          location: socialPosts.location,
          tags: socialPosts.tags,
          studyRelated: socialPosts.studyRelated,
          subject: socialPosts.subject,
          difficulty: socialPosts.difficulty,
          studyTips: socialPosts.studyTips,
          likesCount: socialPosts.likesCount,
          commentsCount: socialPosts.commentsCount,
          sharesCount: socialPosts.sharesCount,
          savesCount: socialPosts.savesCount,
          createdAt: socialPosts.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            email: users.email
          }
        })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.userId, users.id))
        .where(and(
          inArray(socialPosts.userId, followingIds),
          eq(socialPosts.isPublic, true),
          eq(socialPosts.isArchived, false)
        ))
        .orderBy(desc(socialPosts.createdAt))
        .limit(parseInt(limit))
        .offset(offset);
      } else if (type === 'explore') {
        // Get trending and popular posts
        posts = await db.select({
          id: socialPosts.id,
          caption: socialPosts.caption,
          imageUrls: socialPosts.imageUrls,
          videoUrl: socialPosts.videoUrl,
          aspectRatio: socialPosts.aspectRatio,
          location: socialPosts.location,
          tags: socialPosts.tags,
          studyRelated: socialPosts.studyRelated,
          subject: socialPosts.subject,
          difficulty: socialPosts.difficulty,
          studyTips: socialPosts.studyTips,
          likesCount: socialPosts.likesCount,
          commentsCount: socialPosts.commentsCount,
          sharesCount: socialPosts.sharesCount,
          savesCount: socialPosts.savesCount,
          createdAt: socialPosts.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            email: users.email
          }
        })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.userId, users.id))
        .where(and(
          eq(socialPosts.isPublic, true),
          eq(socialPosts.isArchived, false),
          gte(socialPosts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        ))
        .orderBy(desc(sql`${socialPosts.likesCount} + ${socialPosts.commentsCount} * 2 + ${socialPosts.sharesCount} * 3`))
        .limit(parseInt(limit))
        .offset(offset);
      } else if (type === 'study') {
        // Get study-related posts
        posts = await db.select({
          id: socialPosts.id,
          caption: socialPosts.caption,
          imageUrls: socialPosts.imageUrls,
          videoUrl: socialPosts.videoUrl,
          aspectRatio: socialPosts.aspectRatio,
          location: socialPosts.location,
          tags: socialPosts.tags,
          studyRelated: socialPosts.studyRelated,
          subject: socialPosts.subject,
          difficulty: socialPosts.difficulty,
          studyTips: socialPosts.studyTips,
          likesCount: socialPosts.likesCount,
          commentsCount: socialPosts.commentsCount,
          sharesCount: socialPosts.sharesCount,
          savesCount: socialPosts.savesCount,
          createdAt: socialPosts.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            email: users.email
          }
        })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.userId, users.id))
        .where(and(
          eq(socialPosts.studyRelated, true),
          eq(socialPosts.isPublic, true),
          eq(socialPosts.isArchived, false)
        ))
        .orderBy(desc(socialPosts.createdAt))
        .limit(parseInt(limit))
        .offset(offset);
      }

      // Get user interactions for each post
      for (let post of posts) {
        const [userLike, userSave] = await Promise.all([
          db.select().from(socialLikes)
            .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, post.id)))
            .limit(1),
          db.select().from(socialSaves)
            .where(and(eq(socialSaves.userId, userId), eq(socialSaves.postId, post.id)))
            .limit(1)
        ]);

        post.userLiked = userLike.length > 0 ? userLike[0].reactionType : null;
        post.userSaved = userSave.length > 0;
      }

      cached = posts;
      cache.set(cacheKey, cached, 180); // 3 minute cache
    }

    res.json({
      posts: cached,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: cached.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

/**
 * Get trending hashtags
 */
router.get('/hashtags/trending', async (req, res) => {
  try {
    const { limit = 20, category } = req.query;

    const cacheKey = `trending_hashtags_${category || 'all'}_${limit}`;
    let cached = cache.get(cacheKey);

    if (!cached) {
      let conditions = [gt(socialHashtags.usageCount, 0)];
      
      if (category) {
        conditions.push(eq(socialHashtags.category, category));
      }

      cached = await db.select({
        id: socialHashtags.id,
        tag: socialHashtags.tag,
        usageCount: socialHashtags.usageCount,
        category: socialHashtags.category,
        isEducational: socialHashtags.isEducational,
        subjectArea: socialHashtags.subjectArea,
        trendingScore: socialHashtags.trendingScore
      })
      .from(socialHashtags)
      .where(and(...conditions))
      .orderBy(desc(socialHashtags.trendingScore))
      .limit(parseInt(limit));

      cache.set(cacheKey, cached, 600); // 10 minute cache
    }

    res.json({ hashtags: cached });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    res.status(500).json({ error: 'Failed to fetch trending hashtags' });
  }
});

// ==================== POSTS ====================

/**
 * Create new post
 */
router.post('/posts', uploadLimiter, upload.array('media', 10), [
  body('caption').optional().isLength({ max: 2200 }),
  body('location').optional().isLength({ max: 255 }),
  body('tags').optional().isArray({ max: 30 }),
  body('studyRelated').optional().isBoolean(),
  body('subject').optional().isLength({ max: 100 }),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('studyTips').optional().isLength({ max: 1000 }),
  body('aspectRatio').optional().isIn(['1:1', '4:5', '16:9'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      caption,
      location,
      tags = [],
      studyRelated = false,
      subject,
      difficulty,
      studyTips,
      aspectRatio = '1:1'
    } = req.body;

    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one media file is required' });
    }

    // Process uploaded files
    const imageUrls = [];
    let videoUrl = null;

    for (const file of req.files) {
      if (file.mimetype.startsWith('image/')) {
        // Process image
        const processedImageUrl = await processImage(file, aspectRatio);
        imageUrls.push(processedImageUrl);
      } else if (file.mimetype.startsWith('video/')) {
        // Only one video allowed per post
        if (!videoUrl) {
          videoUrl = `/uploads/social/${file.filename}`;
        }
      }
    }

    // Extract hashtags from caption
    const hashtags = extractHashtags(caption);
    
    // Create post
    const newPost = await db.insert(socialPosts).values({
      userId,
      caption,
      imageUrls,
      videoUrl,
      aspectRatio,
      location,
      tags: [...tags, ...hashtags],
      studyRelated,
      subject,
      difficulty,
      studyTips
    }).returning();

    // Update hashtag usage
    await updateHashtagUsage(hashtags, subject);

    // Update user's post count
    await updateUserPostCount(userId);

    // Clear feed cache
    cache.del(`feed_${userId}_following_1_20`);
    
    res.status(201).json({ post: newPost[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

/**
 * Get post by ID
 */
router.get('/posts/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await db.select({
      id: socialPosts.id,
      caption: socialPosts.caption,
      imageUrls: socialPosts.imageUrls,
      videoUrl: socialPosts.videoUrl,
      aspectRatio: socialPosts.aspectRatio,
      location: socialPosts.location,
      tags: socialPosts.tags,
      studyRelated: socialPosts.studyRelated,
      subject: socialPosts.subject,
      difficulty: socialPosts.difficulty,
      studyTips: socialPosts.studyTips,
      likesCount: socialPosts.likesCount,
      commentsCount: socialPosts.commentsCount,
      sharesCount: socialPosts.sharesCount,
      savesCount: socialPosts.savesCount,
      isPublic: socialPosts.isPublic,
      allowComments: socialPosts.allowComments,
      createdAt: socialPosts.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        email: users.email
      }
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.userId, users.id))
    .where(and(
      eq(socialPosts.id, id),
      eq(socialPosts.isArchived, false)
    ))
    .limit(1);

    if (!post.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check user interactions
    const [userLike, userSave] = await Promise.all([
      db.select().from(socialLikes)
        .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, id)))
        .limit(1),
      db.select().from(socialSaves)
        .where(and(eq(socialSaves.userId, userId), eq(socialSaves.postId, id)))
        .limit(1)
    ]);

    const postData = post[0];
    postData.userLiked = userLike.length > 0 ? userLike[0].reactionType : null;
    postData.userSaved = userSave.length > 0;

    res.json({ post: postData });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * Like/unlike a post
 */
router.post('/posts/:id/like', [
  param('id').isUUID(),
  body('reactionType').optional().isIn(['like', 'love', 'fire', 'clap', 'brilliant'])
], async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { reactionType = 'like' } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
    if (!post.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check existing like
    const existingLike = await db.select().from(socialLikes)
      .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId)))
      .limit(1);

    if (existingLike.length > 0) {
      if (existingLike[0].reactionType === reactionType) {
        // Remove like
        await db.delete(socialLikes).where(eq(socialLikes.id, existingLike[0].id));
      } else {
        // Update reaction type
        await db.update(socialLikes)
          .set({ reactionType })
          .where(eq(socialLikes.id, existingLike[0].id));
      }
    } else {
      // Create new like
      await db.insert(socialLikes).values({
        userId,
        postId,
        reactionType
      });

      // Create notification if not own post
      if (post[0].userId !== userId) {
        await createNotification({
          userId: post[0].userId,
          actorId: userId,
          type: 'like',
          postId,
          title: 'New like on your post',
          content: `${req.user.username} liked your post`
        });
      }
    }

    // Update post like count
    const likeCount = await db.select({ count: count() })
      .from(socialLikes)
      .where(eq(socialLikes.postId, postId));

    await db.update(socialPosts)
      .set({ likesCount: likeCount[0].count })
      .where(eq(socialPosts.id, postId));

    res.json({ 
      success: true, 
      likesCount: likeCount[0].count,
      userLiked: existingLike.length > 0 && existingLike[0].reactionType === reactionType ? null : reactionType
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

/**
 * Save/unsave a post
 */
router.post('/posts/:id/save', [
  param('id').isUUID(),
  body('collectionName').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { collectionName } = req.body;
    const userId = req.user.id;

    // Check existing save
    const existingSave = await db.select().from(socialSaves)
      .where(and(eq(socialSaves.userId, userId), eq(socialSaves.postId, postId)))
      .limit(1);

    if (existingSave.length > 0) {
      // Remove save
      await db.delete(socialSaves).where(eq(socialSaves.id, existingSave[0].id));
    } else {
      // Create new save
      await db.insert(socialSaves).values({
        userId,
        postId,
        collectionName: collectionName || null
      });
    }

    // Update post save count
    const saveCount = await db.select({ count: count() })
      .from(socialSaves)
      .where(eq(socialSaves.postId, postId));

    await db.update(socialPosts)
      .set({ savesCount: saveCount[0].count })
      .where(eq(socialPosts.id, postId));

    res.json({ 
      success: true,
      savesCount: saveCount[0].count,
      userSaved: existingSave.length === 0
    });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// ==================== COMMENTS ====================

/**
 * Get post comments
 */
router.get('/posts/:id/comments', [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('sort').optional().isIn(['newest', 'oldest', 'top'])
], async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = asc(socialComments.createdAt);
        break;
      case 'top':
        orderBy = desc(socialComments.likesCount);
        break;
      default: // newest
        orderBy = desc(socialComments.createdAt);
    }

    const comments = await db.select({
      id: socialComments.id,
      content: socialComments.content,
      mediaUrl: socialComments.mediaUrl,
      mentions: socialComments.mentions,
      likesCount: socialComments.likesCount,
      repliesCount: socialComments.repliesCount,
      isPinned: socialComments.isPinned,
      isEdited: socialComments.isEdited,
      editedAt: socialComments.editedAt,
      createdAt: socialComments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(socialComments)
    .innerJoin(users, eq(socialComments.userId, users.id))
    .where(and(
      eq(socialComments.postId, postId),
      isNull(socialComments.parentCommentId) // Only top-level comments
    ))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

    res.json({ 
      comments,
      pagination: {
        page,
        limit,
        hasMore: comments.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * Add comment to post
 */
router.post('/posts/:id/comments', [
  param('id').isUUID(),
  body('content').isLength({ min: 1, max: 500 }),
  body('parentCommentId').optional().isUUID()
], async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    // Check if post exists and allows comments
    const post = await db.select().from(socialPosts)
      .where(and(eq(socialPosts.id, postId), eq(socialPosts.allowComments, true)))
      .limit(1);

    if (!post.length) {
      return res.status(404).json({ error: 'Post not found or comments disabled' });
    }

    // Extract mentions from content
    const mentions = extractMentions(content);

    // Create comment
    const newComment = await db.insert(socialComments).values({
      userId,
      postId,
      parentCommentId,
      content,
      mentions
    }).returning();

    // Update post comment count
    await db.update(socialPosts)
      .set({ commentsCount: sql`${socialPosts.commentsCount} + 1` })
      .where(eq(socialPosts.id, postId));

    // If this is a reply, update parent comment reply count
    if (parentCommentId) {
      await db.update(socialComments)
        .set({ repliesCount: sql`${socialComments.repliesCount} + 1` })
        .where(eq(socialComments.id, parentCommentId));
    }

    // Create notifications
    if (post[0].userId !== userId) {
      await createNotification({
        userId: post[0].userId,
        actorId: userId,
        type: 'comment',
        postId,
        commentId: newComment[0].id,
        title: 'New comment on your post',
        content: `${req.user.username} commented on your post`
      });
    }

    // Create mention notifications
    for (const mention of mentions) {
      if (mention !== userId && mention !== post[0].userId) {
        await createNotification({
          userId: mention,
          actorId: userId,
          type: 'mention',
          postId,
          commentId: newComment[0].id,
          title: 'You were mentioned',
          content: `${req.user.username} mentioned you in a comment`
        });
      }
    }

    // Get comment with user details
    const commentWithUser = await db.select({
      id: socialComments.id,
      content: socialComments.content,
      mediaUrl: socialComments.mediaUrl,
      mentions: socialComments.mentions,
      likesCount: socialComments.likesCount,
      repliesCount: socialComments.repliesCount,
      isPinned: socialComments.isPinned,
      createdAt: socialComments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(socialComments)
    .innerJoin(users, eq(socialComments.userId, users.id))
    .where(eq(socialComments.id, newComment[0].id))
    .limit(1);

    res.status(201).json({ comment: commentWithUser[0] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ==================== STORIES ====================

/**
 * Get stories feed
 */
router.get('/stories', async (req, res) => {
  try {
    const userId = req.user.id;

    const cacheKey = `stories_${userId}`;
    let cached = cache.get(cacheKey);

    if (!cached) {
      // Get stories from followed users
      const following = await db.select({ followingId: socialFollows.followingId })
        .from(socialFollows)
        .where(and(
          eq(socialFollows.followerId, userId),
          eq(socialFollows.isAccepted, true),
          isNull(socialFollows.unfollowedAt)
        ));

      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Include own stories

      const stories = await db.select({
        id: socialStories.id,
        mediaType: socialStories.mediaType,
        mediaUrl: socialStories.mediaUrl,
        duration: socialStories.duration,
        text: socialStories.text,
        textStyle: socialStories.textStyle,
        background: socialStories.background,
        stickers: socialStories.stickers,
        studyTip: socialStories.studyTip,
        subject: socialStories.subject,
        viewsCount: socialStories.viewsCount,
        isHighlight: socialStories.isHighlight,
        highlightTitle: socialStories.highlightTitle,
        expiresAt: socialStories.expiresAt,
        createdAt: socialStories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          avatar: users.avatar
        }
      })
      .from(socialStories)
      .innerJoin(users, eq(socialStories.userId, users.id))
      .where(and(
        inArray(socialStories.userId, followingIds),
        gt(socialStories.expiresAt, new Date())
      ))
      .orderBy(desc(socialStories.createdAt));

      // Group stories by user
      const groupedStories = stories.reduce((acc, story) => {
        const userId = story.user.id;
        if (!acc[userId]) {
          acc[userId] = {
            user: story.user,
            stories: [],
            hasUnseen: false
          };
        }
        acc[userId].stories.push(story);
        return acc;
      }, {});

      // Check for unseen stories
      for (const [userId, userStories] of Object.entries(groupedStories)) {
        const userViewedStories = await db.select({ storyId: socialStoryViews.storyId })
          .from(socialStoryViews)
          .where(and(
            eq(socialStoryViews.viewerId, req.user.id),
            inArray(socialStoryViews.storyId, userStories.stories.map(s => s.id))
          ));

        const viewedStoryIds = new Set(userViewedStories.map(v => v.storyId));
        userStories.hasUnseen = userStories.stories.some(s => !viewedStoryIds.has(s.id));
      }

      cached = Object.values(groupedStories);
      cache.set(cacheKey, cached, 300); // 5 minute cache
    }

    res.json({ stories: cached });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

/**
 * Create new story
 */
router.post('/stories', uploadLimiter, upload.single('media'), [
  body('text').optional().isLength({ max: 500 }),
  body('textStyle').optional().isJSON(),
  body('background').optional().isLength({ max: 50 }),
  body('stickers').optional().isArray({ max: 10 }),
  body('studyTip').optional().isLength({ max: 300 }),
  body('subject').optional().isLength({ max: 100 }),
  body('duration').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      text,
      textStyle,
      background,
      stickers = [],
      studyTip,
      subject,
      duration = 5
    } = req.body;

    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const mediaUrl = `/uploads/social/${req.file.filename}`;

    // Set expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create story
    const newStory = await db.insert(socialStories).values({
      userId,
      mediaType,
      mediaUrl,
      duration: parseInt(duration),
      text,
      textStyle: textStyle ? JSON.parse(textStyle) : {},
      background,
      stickers,
      studyTip,
      subject,
      expiresAt
    }).returning();

    // Clear stories cache
    cache.del(`stories_${userId}`);

    res.status(201).json({ story: newStory[0] });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

/**
 * View story
 */
router.post('/stories/:id/view', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id: storyId } = req.params;
    const userId = req.user.id;

    // Check if already viewed
    const existingView = await db.select().from(socialStoryViews)
      .where(and(eq(socialStoryViews.storyId, storyId), eq(socialStoryViews.viewerId, userId)))
      .limit(1);

    if (existingView.length === 0) {
      // Record view
      await db.insert(socialStoryViews).values({
        storyId,
        viewerId: userId
      });

      // Update story view count
      await db.update(socialStories)
        .set({ viewsCount: sql`${socialStories.viewsCount} + 1` })
        .where(eq(socialStories.id, storyId));

      // Create notification if not own story
      const story = await db.select({ userId: socialStories.userId })
        .from(socialStories)
        .where(eq(socialStories.id, storyId))
        .limit(1);

      if (story.length > 0 && story[0].userId !== userId) {
        await createNotification({
          userId: story[0].userId,
          actorId: userId,
          type: 'story_view',
          storyId,
          title: 'Story view',
          content: `${req.user.username} viewed your story`
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({ error: 'Failed to view story' });
  }
});

// ==================== FOLLOWS ====================

/**
 * Follow/unfollow user
 */
router.post('/users/:id/follow', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id: followingId } = req.params;
    const followerId = req.user.id;

    if (followingId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check existing follow
    const existingFollow = await db.select().from(socialFollows)
      .where(and(
        eq(socialFollows.followerId, followerId),
        eq(socialFollows.followingId, followingId)
      ))
      .limit(1);

    if (existingFollow.length > 0) {
      if (existingFollow[0].unfollowedAt) {
        // Re-follow
        await db.update(socialFollows)
          .set({ 
            unfollowedAt: null,
            followedAt: new Date()
          })
          .where(eq(socialFollows.id, existingFollow[0].id));
      } else {
        // Unfollow
        await db.update(socialFollows)
          .set({ unfollowedAt: new Date() })
          .where(eq(socialFollows.id, existingFollow[0].id));
      }
    } else {
      // New follow
      await db.insert(socialFollows).values({
        followerId,
        followingId,
        isAccepted: true // For now, auto-accept all follows
      });

      // Create notification
      await createNotification({
        userId: followingId,
        actorId: followerId,
        type: 'follow',
        title: 'New follower',
        content: `${req.user.username} started following you`
      });
    }

    // Update follower/following counts
    await updateFollowCounts(followerId, followingId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// ==================== SEARCH ====================

/**
 * Search posts and users
 */
router.get('/search', [
  query('q').isLength({ min: 1, max: 100 }),
  query('type').optional().isIn(['posts', 'users', 'hashtags', 'all']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  try {
    const { q: query, type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const results = {};

    if (type === 'posts' || type === 'all') {
      // Search posts
      results.posts = await db.select({
        id: socialPosts.id,
        caption: socialPosts.caption,
        imageUrls: socialPosts.imageUrls,
        videoUrl: socialPosts.videoUrl,
        tags: socialPosts.tags,
        studyRelated: socialPosts.studyRelated,
        subject: socialPosts.subject,
        likesCount: socialPosts.likesCount,
        commentsCount: socialPosts.commentsCount,
        createdAt: socialPosts.createdAt,
        user: {
          id: users.id,
          username: users.username,
          avatar: users.avatar
        }
      })
      .from(socialPosts)
      .innerJoin(users, eq(socialPosts.userId, users.id))
      .where(and(
        or(
          like(socialPosts.caption, `%${query}%`),
          sql`${socialPosts.tags}::text ILIKE ${'%' + query + '%'}`,
          like(socialPosts.subject, `%${query}%`)
        ),
        eq(socialPosts.isPublic, true),
        eq(socialPosts.isArchived, false)
      ))
      .orderBy(desc(socialPosts.createdAt))
      .limit(type === 'posts' ? limit : 10)
      .offset(type === 'posts' ? offset : 0);
    }

    if (type === 'users' || type === 'all') {
      // Search users
      results.users = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        profile: {
          bio: socialProfiles.bio,
          isVerified: socialProfiles.isVerified,
          isEducator: socialProfiles.isEducator,
          followersCount: socialProfiles.followersCount,
          postsCount: socialProfiles.postsCount
        }
      })
      .from(users)
      .leftJoin(socialProfiles, eq(users.id, socialProfiles.userId))
      .where(or(
        like(users.username, `%${query}%`),
        like(users.email, `%${query}%`),
        like(socialProfiles.bio, `%${query}%`)
      ))
      .limit(type === 'users' ? limit : 10)
      .offset(type === 'users' ? offset : 0);
    }

    if (type === 'hashtags' || type === 'all') {
      // Search hashtags
      results.hashtags = await db.select({
        id: socialHashtags.id,
        tag: socialHashtags.tag,
        usageCount: socialHashtags.usageCount,
        category: socialHashtags.category,
        isEducational: socialHashtags.isEducational,
        subjectArea: socialHashtags.subjectArea
      })
      .from(socialHashtags)
      .where(like(socialHashtags.tag, `%${query}%`))
      .orderBy(desc(socialHashtags.usageCount))
      .limit(type === 'hashtags' ? limit : 10)
      .offset(type === 'hashtags' ? offset : 0);
    }

    res.json({
      results,
      query,
      type,
      pagination: {
        page,
        limit,
        hasMore: Object.values(results).some(arr => arr?.length === limit)
      }
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// ==================== DIRECT MESSAGES ====================

/**
 * Get conversations
 */
router.get('/messages/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await db.select({
      conversationId: socialMessages.conversationId,
      lastMessage: {
        id: socialMessages.id,
        content: socialMessages.content,
        messageType: socialMessages.messageType,
        mediaUrl: socialMessages.mediaUrl,
        isRead: socialMessages.isRead,
        createdAt: socialMessages.createdAt
      },
      otherUser: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(socialMessages)
    .innerJoin(users, eq(socialMessages.senderId === userId ? socialMessages.receiverId : socialMessages.senderId, users.id))
    .where(or(
      eq(socialMessages.senderId, userId),
      eq(socialMessages.receiverId, userId)
    ))
    .orderBy(desc(socialMessages.createdAt))
    .limit(50);

    // Group by conversation and get latest message
    const groupedConversations = conversations.reduce((acc, msg) => {
      if (!acc[msg.conversationId] || new Date(msg.lastMessage.createdAt) > new Date(acc[msg.conversationId].lastMessage.createdAt)) {
        acc[msg.conversationId] = msg;
      }
      return acc;
    }, {});

    res.json({ conversations: Object.values(groupedConversations) });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * Send message
 */
router.post('/messages', messageLimiter, [
  body('receiverId').isUUID(),
  body('content').optional().isLength({ min: 1, max: 1000 }),
  body('messageType').optional().isIn(['text', 'image', 'video', 'post_share']),
  body('sharedPostId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, content, messageType = 'text', sharedPostId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Generate conversation ID (consistent between users)
    const conversationId = [senderId, receiverId].sort().join('_');

    const newMessage = await db.insert(socialMessages).values({
      conversationId,
      senderId,
      receiverId,
      content,
      messageType,
      sharedPostId
    }).returning();

    // Create notification
    await createNotification({
      userId: receiverId,
      actorId: senderId,
      type: 'message',
      messageId: newMessage[0].id,
      title: 'New message',
      content: `${req.user.username} sent you a message`
    });

    res.status(201).json({ message: newMessage[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==================== NOTIFICATIONS ====================

/**
 * Get user notifications
 */
router.get('/notifications', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('unreadOnly').optional().isBoolean()
], async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let conditions = [eq(socialNotifications.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(socialNotifications.isRead, false));
    }

    const notifications = await db.select({
      id: socialNotifications.id,
      type: socialNotifications.type,
      title: socialNotifications.title,
      content: socialNotifications.content,
      imageUrl: socialNotifications.imageUrl,
      isRead: socialNotifications.isRead,
      createdAt: socialNotifications.createdAt,
      actor: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      },
      post: socialNotifications.postId ? {
        id: socialPosts.id,
        imageUrls: socialPosts.imageUrls
      } : null
    })
    .from(socialNotifications)
    .innerJoin(users, eq(socialNotifications.actorId, users.id))
    .leftJoin(socialPosts, eq(socialNotifications.postId, socialPosts.id))
    .where(and(...conditions))
    .orderBy(desc(socialNotifications.createdAt))
    .limit(limit)
    .offset(offset);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Mark notifications as read
 */
router.put('/notifications/read', [
  body('notificationIds').isArray({ min: 1 })
], async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.id;

    await db.update(socialNotifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(socialNotifications.userId, userId),
        inArray(socialNotifications.id, notificationIds)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Process uploaded image
 */
async function processImage(file, aspectRatio) {
  try {
    const outputPath = file.path.replace(path.extname(file.path), '_processed.jpg');
    
    let width, height;
    switch (aspectRatio) {
      case '1:1':
        width = height = 1080;
        break;
      case '4:5':
        width = 1080;
        height = 1350;
        break;
      case '16:9':
        width = 1920;
        height = 1080;
        break;
      default:
        width = height = 1080;
    }

    await sharp(file.path)
      .resize(width, height, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    // Delete original file
    await fs.unlink(file.path);

    return `/uploads/social/${path.basename(outputPath)}`;
  } catch (error) {
    console.error('Error processing image:', error);
    return `/uploads/social/${file.filename}`;
  }
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

/**
 * Extract user mentions from text
 */
function extractMentions(text) {
  if (!text) return [];
  const mentionRegex = /@[\w]+/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.slice(1)) : [];
}

/**
 * Update hashtag usage counts
 */
async function updateHashtagUsage(hashtags, subject) {
  for (const tag of hashtags) {
    const existingHashtag = await db.select().from(socialHashtags)
      .where(eq(socialHashtags.tag, tag))
      .limit(1);

    if (existingHashtag.length > 0) {
      await db.update(socialHashtags)
        .set({
          usageCount: sql`${socialHashtags.usageCount} + 1`,
          lastUsedAt: new Date()
        })
        .where(eq(socialHashtags.id, existingHashtag[0].id));
    } else {
      await db.insert(socialHashtags).values({
        tag,
        usageCount: 1,
        category: subject ? 'study' : 'general',
        isEducational: !!subject,
        subjectArea: subject
      });
    }
  }
}

/**
 * Update user post count
 */
async function updateUserPostCount(userId) {
  const postCount = await db.select({ count: count() })
    .from(socialPosts)
    .where(and(
      eq(socialPosts.userId, userId),
      eq(socialPosts.isArchived, false)
    ));

  await db.update(socialProfiles)
    .set({ postsCount: postCount[0].count })
    .where(eq(socialProfiles.userId, userId));
}

/**
 * Update follower/following counts
 */
async function updateFollowCounts(followerId, followingId) {
  // Update follower count for following user
  const followerCount = await db.select({ count: count() })
    .from(socialFollows)
    .where(and(
      eq(socialFollows.followingId, followingId),
      eq(socialFollows.isAccepted, true),
      isNull(socialFollows.unfollowedAt)
    ));

  // Update following count for follower user
  const followingCount = await db.select({ count: count() })
    .from(socialFollows)
    .where(and(
      eq(socialFollows.followerId, followerId),
      eq(socialFollows.isAccepted, true),
      isNull(socialFollows.unfollowedAt)
    ));

  await Promise.all([
    db.update(socialProfiles)
      .set({ followersCount: followerCount[0].count })
      .where(eq(socialProfiles.userId, followingId)),
    db.update(socialProfiles)
      .set({ followingCount: followingCount[0].count })
      .where(eq(socialProfiles.userId, followerId))
  ]);
}

/**
 * Create notification
 */
async function createNotification(data) {
  try {
    await db.insert(socialNotifications).values(data);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export default router;