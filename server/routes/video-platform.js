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
  videos, channels, videoViews, videoLikes, videoComments, subscriptions, 
  playlists, playlistVideos, videoAnalytics, videoRecommendations, userPreferences 
} from '../db/video-platform-schema.js';
import { users } from '../db/schema.js';
import { eq, and, desc, asc, sql, inArray, gt, lt, gte, lte, like, or, isNull, ne, count } from 'drizzle-orm';
import { recommendationEngine } from '../services/RecommendationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

// Rate limiting configurations
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: { error: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false
});

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/videos');
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
    cb(null, `video_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Apply rate limiting
router.use(generalLimiter);

// Initialize recommendation engine
recommendationEngine.initialize().catch(console.error);

// ==================== CHANNEL MANAGEMENT ====================

/**
 * Get channel by handle
 */
router.get('/channels/:handle', async (req, res) => {
  try {
    const { handle } = req.params;

    const channel = await db.select({
      id: channels.id,
      handle: channels.handle,
      name: channels.name,
      description: channels.description,
      avatarUrl: channels.avatarUrl,
      bannerUrl: channels.bannerUrl,
      subscriberCount: channels.subscriberCount,
      videoCount: channels.videoCount,
      totalViews: channels.totalViews,
      isVerified: channels.isVerified,
      category: channels.category,
      createdAt: channels.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(channels)
    .innerJoin(users, eq(channels.userId, users.id))
    .where(eq(channels.handle, handle))
    .limit(1);

    if (!channel.length) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel: channel[0] });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

/**
 * Create new channel
 */
router.post('/channels', [
  body('handle').isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
  body('name').isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 1000 }),
  body('category').optional().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { handle, name, description, category } = req.body;
    const userId = req.user.id;

    // Check if handle is already taken
    const existingChannel = await db.select().from(channels).where(eq(channels.handle, handle)).limit(1);
    if (existingChannel.length > 0) {
      return res.status(409).json({ error: 'Channel handle already exists' });
    }

    // Create channel
    const newChannel = await db.insert(channels).values({
      userId,
      handle,
      name,
      description,
      category
    }).returning();

    res.status(201).json({ channel: newChannel[0] });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// ==================== VIDEO MANAGEMENT ====================

/**
 * Get video by ID with full details
 */
router.get('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const video = await db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      videoUrl: videos.videoUrl,
      duration: videos.duration,
      subject: videos.subject,
      difficulty: videos.difficulty,
      category: videos.category,
      tags: videos.tags,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      dislikeCount: videos.dislikeCount,
      commentCount: videos.commentCount,
      publishedAt: videos.publishedAt,
      channel: {
        id: channels.id,
        handle: channels.handle,
        name: channels.name,
        avatarUrl: channels.avatarUrl,
        isVerified: channels.isVerified,
        subscriberCount: channels.subscriberCount
      },
      creator: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .innerJoin(users, eq(channels.userId, users.id))
    .where(and(
      eq(videos.id, id),
      eq(videos.status, 'active'),
      eq(videos.visibility, 'public')
    ))
    .limit(1);

    if (!video.length) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Track video view if user is authenticated
    if (userId) {
      await trackVideoView(id, userId, req);
    }

    // Get user interaction data if authenticated
    let userInteraction = null;
    if (userId) {
      const [like, subscription] = await Promise.all([
        db.select().from(videoLikes).where(and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, id))).limit(1),
        db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, video[0].channel.id))).limit(1)
      ]);

      userInteraction = {
        liked: like.length > 0 ? like[0].type : null,
        subscribed: subscription.length > 0 && subscription[0].isActive
      };
    }

    res.json({ 
      video: video[0],
      userInteraction
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

/**
 * Upload new video
 */
router.post('/videos/upload', uploadLimiter, upload.single('video'), [
  body('title').isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 2000 }),
  body('subject').optional().isLength({ max: 100 }),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('category').optional().isLength({ max: 50 }),
  body('tags').optional().isArray({ max: 20 }),
  body('visibility').optional().isIn(['public', 'unlisted', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const {
      title,
      description,
      subject,
      difficulty = 'intermediate',
      category,
      tags = [],
      visibility = 'public',
      channelId
    } = req.body;

    const userId = req.user.id;
    const videoPath = req.file.path;

    // Verify channel ownership
    const channel = await db.select().from(channels).where(and(
      eq(channels.id, channelId),
      eq(channels.userId, userId)
    )).limit(1);

    if (!channel.length) {
      return res.status(403).json({ error: 'Invalid channel or insufficient permissions' });
    }

    // Get video metadata
    const metadata = await getVideoMetadata(videoPath);
    
    // Generate thumbnail
    const thumbnailUrl = await generateThumbnail(videoPath, crypto.randomUUID());

    // Create video record
    const newVideo = await db.insert(videos).values({
      channelId,
      title,
      description,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      thumbnailUrl,
      duration: metadata.duration,
      fileSize: req.file.size,
      subject,
      difficulty,
      category,
      tags,
      visibility,
      publishedAt: new Date(),
      processingStatus: 'processing'
    }).returning();

    // Process video asynchronously (generate different quality versions, etc.)
    processVideoAsync(newVideo[0].id, videoPath).catch(console.error);

    res.status(201).json({ 
      video: newVideo[0],
      message: 'Video uploaded successfully and is being processed'
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

/**
 * Get personalized video recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      type = 'personalized', 
      limit = 20, 
      subject,
      category,
      difficulty 
    } = req.query;

    const context = {
      subject,
      category,
      difficulty
    };

    const recommendations = await getRecommendations(userId, type, context);

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * Search videos
 */
router.get('/search', [
  query('q').isLength({ min: 1, max: 100 }),
  query('category').optional().isLength({ max: 50 }),
  query('subject').optional().isLength({ max: 100 }),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  query('duration').optional().isIn(['short', 'medium', 'long']),
  query('sort').optional().isIn(['relevance', 'upload_date', 'view_count', 'rating']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q: query,
      category,
      subject,
      difficulty,
      duration,
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    // Build search conditions
    let conditions = [
      eq(videos.status, 'active'),
      eq(videos.visibility, 'public')
    ];

    if (category) {
      conditions.push(eq(videos.category, category));
    }

    if (subject) {
      conditions.push(eq(videos.subject, subject));
    }

    if (difficulty) {
      conditions.push(eq(videos.difficulty, difficulty));
    }

    if (duration) {
      const durationRanges = {
        short: [0, 300], // 0-5 minutes
        medium: [300, 1200], // 5-20 minutes
        long: [1200, Infinity] // 20+ minutes
      };
      const [min, max] = durationRanges[duration];
      conditions.push(gte(videos.duration, min));
      if (max !== Infinity) {
        conditions.push(lte(videos.duration, max));
      }
    }

    // Add text search condition
    conditions.push(
      or(
        like(videos.title, `%${query}%`),
        like(videos.description, `%${query}%`),
        sql`${videos.tags}::text ILIKE ${'%' + query + '%'}`
      )
    );

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'upload_date':
        orderBy = desc(videos.publishedAt);
        break;
      case 'view_count':
        orderBy = desc(videos.viewCount);
        break;
      case 'rating':
        orderBy = desc(videos.engagementRate);
        break;
      default: // relevance
        orderBy = desc(sql`
          (CASE 
            WHEN ${videos.title} ILIKE ${'%' + query + '%'} THEN 3
            WHEN ${videos.description} ILIKE ${'%' + query + '%'} THEN 2
            WHEN ${videos.tags}::text ILIKE ${'%' + query + '%'} THEN 1
            ELSE 0
          END) + (${videos.viewCount} / 10000.0) + (${videos.engagementRate} * 10)
        `);
    }

    const results = await db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      publishedAt: videos.publishedAt,
      subject: videos.subject,
      difficulty: videos.difficulty,
      category: videos.category,
      channel: {
        id: channels.id,
        handle: channels.handle,
        name: channels.name,
        avatarUrl: channels.avatarUrl,
        isVerified: channels.isVerified
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

    // Get total count for pagination
    const totalCount = await db.select({ count: count() })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(...conditions));

    res.json({
      results,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit)
      },
      filters: {
        query,
        category,
        subject,
        difficulty,
        duration,
        sort
      }
    });
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

/**
 * Get trending videos
 */
router.get('/trending', async (req, res) => {
  try {
    const { 
      category,
      timeframe = '24h',
      limit = 20 
    } = req.query;

    const trending = await getTrendingVideos(limit, category, timeframe);
    res.json({ trending });
  } catch (error) {
    console.error('Error getting trending videos:', error);
    res.status(500).json({ error: 'Failed to get trending videos' });
  }
});

// ==================== INTERACTIONS ====================

/**
 * Like or dislike a video
 */
router.post('/videos/:id/like', [
  param('id').isUUID(),
  body('type').isIn(['like', 'dislike'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: videoId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    // Check if video exists
    const video = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
    if (!video.length) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check existing like/dislike
    const existingLike = await db.select().from(videoLikes)
      .where(and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, videoId)))
      .limit(1);

    if (existingLike.length > 0) {
      if (existingLike[0].type === type) {
        // Remove like/dislike
        await db.delete(videoLikes).where(eq(videoLikes.id, existingLike[0].id));
      } else {
        // Update like/dislike type
        await db.update(videoLikes)
          .set({ type })
          .where(eq(videoLikes.id, existingLike[0].id));
      }
    } else {
      // Create new like/dislike
      await db.insert(videoLikes).values({
        userId,
        videoId,
        type
      });
    }

    // Update video counts
    const likeCounts = await db.select({
      likes: sql`COUNT(CASE WHEN ${videoLikes.type} = 'like' THEN 1 END)`.as('likes'),
      dislikes: sql`COUNT(CASE WHEN ${videoLikes.type} = 'dislike' THEN 1 END)`.as('dislikes')
    })
    .from(videoLikes)
    .where(eq(videoLikes.videoId, videoId));

    await db.update(videos)
      .set({
        likeCount: parseInt(likeCounts[0].likes),
        dislikeCount: parseInt(likeCounts[0].dislikes)
      })
      .where(eq(videos.id, videoId));

    res.json({ 
      success: true, 
      likeCount: parseInt(likeCounts[0].likes),
      dislikeCount: parseInt(likeCounts[0].dislikes)
    });
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({ error: 'Failed to like video' });
  }
});

/**
 * Add comment to video
 */
router.post('/videos/:id/comments', [
  param('id').isUUID(),
  body('content').isLength({ min: 1, max: 1000 }),
  body('parentCommentId').optional().isUUID(),
  body('timestamp').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: videoId } = req.params;
    const { content, parentCommentId, timestamp } = req.body;
    const userId = req.user.id;

    // Check if video exists and allows comments
    const video = await db.select().from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.allowComments, true)))
      .limit(1);

    if (!video.length) {
      return res.status(404).json({ error: 'Video not found or comments disabled' });
    }

    // Create comment
    const newComment = await db.insert(videoComments).values({
      videoId,
      userId,
      content,
      parentCommentId,
      timestamp
    }).returning();

    // Update video comment count
    await db.update(videos)
      .set({ commentCount: sql`${videos.commentCount} + 1` })
      .where(eq(videos.id, videoId));

    // If this is a reply, update parent comment reply count
    if (parentCommentId) {
      await db.update(videoComments)
        .set({ replyCount: sql`${videoComments.replyCount} + 1` })
        .where(eq(videoComments.id, parentCommentId));
    }

    // Get comment with user details
    const commentWithUser = await db.select({
      id: videoComments.id,
      content: videoComments.content,
      timestamp: videoComments.timestamp,
      likeCount: videoComments.likeCount,
      replyCount: videoComments.replyCount,
      createdAt: videoComments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(videoComments)
    .innerJoin(users, eq(videoComments.userId, users.id))
    .where(eq(videoComments.id, newComment[0].id))
    .limit(1);

    res.status(201).json({ comment: commentWithUser[0] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

/**
 * Get video comments
 */
router.get('/videos/:id/comments', [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('sort').optional().isIn(['newest', 'oldest', 'top'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: videoId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = asc(videoComments.createdAt);
        break;
      case 'top':
        orderBy = desc(videoComments.likeCount);
        break;
      default: // newest
        orderBy = desc(videoComments.createdAt);
    }

    const comments = await db.select({
      id: videoComments.id,
      content: videoComments.content,
      timestamp: videoComments.timestamp,
      likeCount: videoComments.likeCount,
      replyCount: videoComments.replyCount,
      isPinned: videoComments.isPinned,
      createdAt: videoComments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
    .from(videoComments)
    .innerJoin(users, eq(videoComments.userId, users.id))
    .where(and(
      eq(videoComments.videoId, videoId),
      isNull(videoComments.parentCommentId), // Only top-level comments
      eq(videoComments.isDeleted, false)
    ))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * Subscribe to channel
 */
router.post('/channels/:id/subscribe', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id: channelId } = req.params;
    const userId = req.user.id;

    // Check if channel exists
    const channel = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);
    if (!channel.length) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check existing subscription
    const existingSubscription = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId)))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Toggle subscription
      const newStatus = !existingSubscription[0].isActive;
      await db.update(subscriptions)
        .set({ 
          isActive: newStatus,
          unsubscribedAt: newStatus ? null : new Date()
        })
        .where(eq(subscriptions.id, existingSubscription[0].id));

      // Update channel subscriber count
      const increment = newStatus ? 1 : -1;
      await db.update(channels)
        .set({ subscriberCount: sql`${channels.subscriberCount} + ${increment}` })
        .where(eq(channels.id, channelId));

      res.json({ subscribed: newStatus });
    } else {
      // Create new subscription
      await db.insert(subscriptions).values({
        userId,
        channelId,
        isActive: true
      });

      // Update channel subscriber count
      await db.update(channels)
        .set({ subscriberCount: sql`${channels.subscriberCount} + 1` })
        .where(eq(channels.id, channelId));

      res.json({ subscribed: true });
    }
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    res.status(500).json({ error: 'Failed to subscribe to channel' });
  }
});

// ==================== ANALYTICS ====================

/**
 * Get video analytics (creator only)
 */
router.get('/videos/:id/analytics', [
  param('id').isUUID(),
  query('period').optional().isIn(['24h', '7d', '30d', '90d', '1y']),
  query('metric').optional().isIn(['views', 'engagement', 'demographics', 'traffic'])
], async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { period = '30d', metric = 'views' } = req.query;
    const userId = req.user.id;

    // Verify video ownership
    const video = await db.select({ channelId: videos.channelId })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(eq(videos.id, videoId), eq(channels.userId, userId)))
      .limit(1);

    if (!video.length) {
      return res.status(403).json({ error: 'Unauthorized to view analytics for this video' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const periodMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    startDate.setDate(endDate.getDate() - periodMap[period]);

    // Get analytics data based on metric
    let analyticsData;
    switch (metric) {
      case 'views':
        analyticsData = await db.select({
          date: videoAnalytics.date,
          views: videoAnalytics.views,
          uniqueViews: videoAnalytics.uniqueViews,
          watchTime: videoAnalytics.watchTime,
          averageWatchTime: videoAnalytics.averageWatchTime
        })
        .from(videoAnalytics)
        .where(and(
          eq(videoAnalytics.videoId, videoId),
          gte(videoAnalytics.date, startDate),
          lte(videoAnalytics.date, endDate)
        ))
        .orderBy(asc(videoAnalytics.date));
        break;

      case 'engagement':
        analyticsData = await db.select({
          date: videoAnalytics.date,
          likes: videoAnalytics.likes,
          dislikes: videoAnalytics.dislikes,
          comments: videoAnalytics.comments,
          shares: videoAnalytics.shares,
          engagementRate: videoAnalytics.engagementRate
        })
        .from(videoAnalytics)
        .where(and(
          eq(videoAnalytics.videoId, videoId),
          gte(videoAnalytics.date, startDate),
          lte(videoAnalytics.date, endDate)
        ))
        .orderBy(asc(videoAnalytics.date));
        break;

      default:
        analyticsData = [];
    }

    res.json({
      videoId,
      period,
      metric,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    res.status(500).json({ error: 'Failed to fetch video analytics' });
  }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Track video view for analytics
 */
async function trackVideoView(videoId, userId, req) {
  try {
    const sessionId = req.sessionID || req.ip;
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer') || '';

    await db.insert(videoViews).values({
      videoId,
      userId,
      sessionId,
      ipAddress: req.ip,
      userAgent,
      referrer,
      device: getDeviceType(userAgent),
      platform: getPlatform(userAgent)
    });

    // Update video view count
    await db.update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, videoId));

  } catch (error) {
    console.error('Error tracking video view:', error);
  }
}

/**
 * Get video metadata using FFmpeg (placeholder - would use actual FFmpeg in production)
 */
async function getVideoMetadata(filePath) {
  // Placeholder implementation - in production, use FFmpeg to extract metadata
  return {
    duration: 600, // 10 minutes placeholder
    resolution: '1920x1080',
    fps: 30,
    codec: 'h264'
  };
}

/**
 * Process video asynchronously (generate thumbnails, different qualities, etc.)
 */
async function processVideoAsync(videoId, filePath) {
  try {
    console.log(`Processing video ${videoId}...`);
    
    // Placeholder for video processing tasks:
    // 1. Generate multiple quality versions (720p, 480p, 360p)
    // 2. Extract additional thumbnails at different timestamps
    // 3. Generate preview clips
    // 4. Extract audio for accessibility
    // 5. Generate captions using speech-to-text
    
    // Update processing status
    await db.update(videos)
      .set({ processingStatus: 'completed' })
      .where(eq(videos.id, videoId));

    console.log(`Video ${videoId} processing completed`);
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    
    await db.update(videos)
      .set({ processingStatus: 'failed' })
      .where(eq(videos.id, videoId));
  }
}

/**
 * Generate video thumbnail
 */
async function generateThumbnail(videoPath, videoId) {
  try {
    // Placeholder - in production, use FFmpeg to extract thumbnail
    const thumbnailDir = path.join(__dirname, '../uploads/thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });
    
    const thumbnailPath = path.join(thumbnailDir, `${videoId}_thumb.jpg`);
    
    // Placeholder thumbnail generation
    // In production: ffmpeg -i videoPath -ss 00:00:10 -vframes 1 thumbnailPath
    
    return `/uploads/thumbnails/${videoId}_thumb.jpg`;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Get recommendations using the recommendation engine
 */
async function getRecommendations(userId, type, context = {}) {
  try {
    const cacheKey = `recommendations_${userId}_${type}_${JSON.stringify(context)}`;
    let cached = cache.get(cacheKey);
    
    if (!cached) {
      const recommendations = await recommendationEngine.generateRecommendations(userId, {
        recommendationType: type,
        limit: 20,
        context
      });
      
      // Get video details for recommendations
      if (recommendations.recommendations.length > 0) {
        const videoIds = recommendations.recommendations.map(rec => rec.videoId);
        const videoDetails = await db.select({
          id: videos.id,
          title: videos.title,
          description: videos.description,
          thumbnailUrl: videos.thumbnailUrl,
          duration: videos.duration,
          viewCount: videos.viewCount,
          publishedAt: videos.publishedAt,
          channel: {
            id: channels.id,
            handle: channels.handle,
            name: channels.name,
            avatarUrl: channels.avatarUrl,
            isVerified: channels.isVerified
          }
        })
        .from(videos)
        .innerJoin(channels, eq(videos.channelId, channels.id))
        .where(inArray(videos.id, videoIds));

        // Merge recommendation data with video details
        cached = {
          recommendations: recommendations.recommendations.map(rec => ({
            ...rec,
            video: videoDetails.find(v => v.id === rec.videoId)
          })).filter(rec => rec.video), // Filter out videos that weren't found
          metadata: recommendations.metadata
        };
      } else {
        cached = recommendations;
      }
      
      cache.set(cacheKey, cached, 300); // 5 minute cache
    }
    
    return cached;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return { recommendations: [], metadata: { error: 'Failed to get recommendations' } };
  }
}

/**
 * Get trending videos
 */
async function getTrendingVideos(limit = 20, category = null, timeframe = '24h') {
  try {
    const cacheKey = `trending_${category || 'all'}_${timeframe}_${limit}`;
    let cached = cache.get(cacheKey);
    
    if (!cached) {
      // Calculate trending period
      const endDate = new Date();
      const startDate = new Date();
      const timeframes = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      };
      startDate.setHours(endDate.getHours() - (timeframes[timeframe] || 24));

      let conditions = [
        eq(videos.status, 'active'),
        eq(videos.visibility, 'public'),
        gte(videos.publishedAt, startDate)
      ];

      if (category) {
        conditions.push(eq(videos.category, category));
      }

      cached = await db.select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        publishedAt: videos.publishedAt,
        trendingScore: videos.trendingScore,
        channel: {
          id: channels.id,
          handle: channels.handle,
          name: channels.name,
          avatarUrl: channels.avatarUrl,
          isVerified: channels.isVerified
        }
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(...conditions))
      .orderBy(desc(videos.trendingScore))
      .limit(limit);

      cache.set(cacheKey, cached, 600); // 10 minute cache
    }
    
    return cached;
  } catch (error) {
    console.error('Error getting trending videos:', error);
    return [];
  }
}

/**
 * Detect device type from user agent
 */
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

/**
 * Detect platform from user agent
 */
function getPlatform(userAgent) {
  if (/windows/i.test(userAgent)) return 'windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macos';
  if (/linux/i.test(userAgent)) return 'linux';
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'unknown';
}

export default router;