import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
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

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: { error: 'Too many uploads. Please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: { error: 'Rate limit exceeded. Please try again later.' }
});

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Middleware
router.use(generalLimiter);

// Initialize recommendation engine
recommendationEngine.initialize().catch(console.error);

// ==================== CHANNEL MANAGEMENT ====================

// Get channel by handle
router.get('/channels/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    
    const channel = await db
      .select({
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
        country: channels.country,
        createdAt: channels.createdAt
      })
      .from(channels)
      .where(eq(channels.handle, handle))
      .limit(1);

    if (!channel.length) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Get recent videos
    const recentVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        viewCount: videos.viewCount,
        publishedAt: videos.publishedAt
      })
      .from(videos)
      .where(and(
        eq(videos.channelId, channel[0].id),
        eq(videos.visibility, 'public'),
        eq(videos.isDeleted, false)
      ))
      .orderBy(desc(videos.publishedAt))
      .limit(12);

    res.json({
      channel: channel[0],
      recentVideos
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

// Create or update channel
router.post('/channels', [
  body('handle').isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('name').isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { handle, name, description, category } = req.body;
    const userId = req.user.id;

    // Check if handle is taken
    const existingChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.handle, handle))
      .limit(1);

    if (existingChannel.length) {
      return res.status(400).json({ error: 'Handle already taken' });
    }

    // Create channel
    const newChannel = await db
      .insert(channels)
      .values({
        userId,
        handle,
        name,
        description,
        category
      })
      .returning();

    res.status(201).json({ channel: newChannel[0] });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// ==================== VIDEO MANAGEMENT ====================

// Get video by ID with full details
router.get('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const video = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        category: videos.category,
        tags: videos.tags,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        dislikeCount: videos.dislikeCount,
        commentCount: videos.commentCount,
        publishedAt: videos.publishedAt,
        isEducational: videos.isEducational,
        subject: videos.subject,
        difficulty: videos.difficulty,
        learningObjectives: videos.learningObjectives,
        channel: {
          id: channels.id,
          handle: channels.handle,
          name: channels.name,
          avatarUrl: channels.avatarUrl,
          subscriberCount: channels.subscriberCount,
          isVerified: channels.isVerified
        }
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(
        eq(videos.id, id),
        eq(videos.visibility, 'public'),
        eq(videos.isDeleted, false)
      ))
      .limit(1);

    if (!video.length) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoData = video[0];

    // Track view if user is authenticated
    if (userId) {
      await trackVideoView(id, userId, req);
    }

    // Get user interaction data
    let userInteraction = null;
    if (userId) {
      const [liked, subscribed] = await Promise.all([
        db.select().from(videoLikes).where(and(
          eq(videoLikes.videoId, id),
          eq(videoLikes.userId, userId)
        )).limit(1),
        db.select().from(subscriptions).where(and(
          eq(subscriptions.channelId, videoData.channel.id),
          eq(subscriptions.subscriberId, userId)
        )).limit(1)
      ]);

      userInteraction = {
        liked: liked.length > 0 ? liked[0].likeType : null,
        subscribed: subscribed.length > 0
      };
    }

    // Get recommendations
    const recommendations = userId ? 
      await getRecommendations(userId, 'watch_next', { currentVideoId: id }) : 
      await getTrendingVideos(8);

    res.json({
      video: videoData,
      userInteraction,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Upload video
router.post('/videos/upload', uploadLimiter, upload.single('video'), [
  body('title').isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 5000 }),
  body('category').isIn(['education', 'entertainment', 'music', 'gaming', 'technology', 'science', 'sports', 'news']),
  body('tags').optional().isArray({ max: 10 }),
  body('visibility').optional().isIn(['public', 'unlisted', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const userId = req.user.id;
    const { title, description, category, tags, visibility = 'public', isEducational, subject, difficulty } = req.body;

    // Get user's channel
    const userChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.userId, userId))
      .limit(1);

    if (!userChannel.length) {
      return res.status(400).json({ error: 'User must have a channel to upload videos' });
    }

    const channelId = userChannel[0].id;

    // Process video to get metadata
    const videoMetadata = await getVideoMetadata(req.file.path);

    // Create video record
    const newVideo = await db
      .insert(videos)
      .values({
        channelId,
        title,
        description,
        videoUrl: `/uploads/videos/${req.file.filename}`,
        duration: Math.round(videoMetadata.duration),
        fileSize: req.file.size,
        resolution: videoMetadata.resolution,
        category,
        tags: tags || [],
        visibility,
        isEducational: isEducational === 'true',
        subject,
        difficulty,
        processingStatus: 'uploaded'
      })
      .returning();

    // Start background processing
    processVideoAsync(newVideo[0].id, req.file.path);

    // Update channel video count
    await db
      .update(channels)
      .set({
        videoCount: sql`${channels.videoCount} + 1`
      })
      .where(eq(channels.id, channelId));

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: newVideo[0]
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Get video recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type = 'home_feed', limit = 20, offset = 0 } = req.query;

    if (!userId) {
      // Return trending videos for non-authenticated users
      const trending = await getTrendingVideos(limit);
      return res.json({ recommendations: trending });
    }

    const recommendations = await recommendationEngine.generateRecommendations(userId, {
      recommendationType: type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Search videos
router.get('/search', [
  query('q').isLength({ min: 1, max: 100 }),
  query('category').optional().isIn(['education', 'entertainment', 'music', 'gaming', 'technology', 'science', 'sports', 'news']),
  query('duration').optional().isIn(['short', 'medium', 'long']),
  query('sortBy').optional().isIn(['relevance', 'upload_date', 'view_count', 'rating'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, category, duration, sortBy = 'relevance', limit = 20, offset = 0 } = req.query;

    let searchQuery = db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        viewCount: videos.viewCount,
        publishedAt: videos.publishedAt,
        channel: {
          handle: channels.handle,
          name: channels.name,
          avatarUrl: channels.avatarUrl
        }
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(
        or(
          like(videos.title, `%${q}%`),
          like(videos.description, `%${q}%`),
          sql`${videos.tags}::text ILIKE ${'%' + q + '%'}`
        ),
        eq(videos.visibility, 'public'),
        eq(videos.isDeleted, false)
      ));

    // Apply filters
    if (category) {
      searchQuery = searchQuery.where(eq(videos.category, category));
    }

    if (duration) {
      const durationRanges = {
        short: [0, 240], // 0-4 minutes
        medium: [240, 1200], // 4-20 minutes
        long: [1200, Infinity] // 20+ minutes
      };
      const [min, max] = durationRanges[duration];
      searchQuery = searchQuery.where(and(
        gte(videos.duration, min),
        max !== Infinity ? lte(videos.duration, max) : undefined
      ).filter(Boolean));
    }

    // Apply sorting
    switch (sortBy) {
      case 'upload_date':
        searchQuery = searchQuery.orderBy(desc(videos.publishedAt));
        break;
      case 'view_count':
        searchQuery = searchQuery.orderBy(desc(videos.viewCount));
        break;
      case 'rating':
        searchQuery = searchQuery.orderBy(desc(videos.engagementRate));
        break;
      default: // relevance
        searchQuery = searchQuery.orderBy(desc(videos.viewCount));
    }

    const results = await searchQuery
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({ results });
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

// ==================== INTERACTIONS ====================

// Like/Dislike video
router.post('/videos/:id/like', [
  param('id').isUUID(),
  body('type').isIn(['like', 'dislike'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    // Check if user already liked/disliked
    const existingLike = await db
      .select()
      .from(videoLikes)
      .where(and(
        eq(videoLikes.videoId, id),
        eq(videoLikes.userId, userId)
      ))
      .limit(1);

    if (existingLike.length) {
      if (existingLike[0].likeType === type) {
        // Remove like/dislike
        await db
          .delete(videoLikes)
          .where(and(
            eq(videoLikes.videoId, id),
            eq(videoLikes.userId, userId)
          ));

        // Update video counters
        await db
          .update(videos)
          .set(type === 'like' ? 
            { likeCount: sql`${videos.likeCount} - 1` } :
            { dislikeCount: sql`${videos.dislikeCount} - 1` }
          )
          .where(eq(videos.id, id));

        res.json({ action: 'removed', type });
      } else {
        // Update like type
        await db
          .update(videoLikes)
          .set({ likeType: type })
          .where(and(
            eq(videoLikes.videoId, id),
            eq(videoLikes.userId, userId)
          ));

        // Update video counters
        await db
          .update(videos)
          .set(type === 'like' ? 
            { likeCount: sql`${videos.likeCount} + 1`, dislikeCount: sql`${videos.dislikeCount} - 1` } :
            { dislikeCount: sql`${videos.dislikeCount} + 1`, likeCount: sql`${videos.likeCount} - 1` }
          )
          .where(eq(videos.id, id));

        res.json({ action: 'updated', type });
      }
    } else {
      // Create new like/dislike
      await db
        .insert(videoLikes)
        .values({
          videoId: id,
          userId,
          likeType: type
        });

      // Update video counters
      await db
        .update(videos)
        .set(type === 'like' ? 
          { likeCount: sql`${videos.likeCount} + 1` } :
          { dislikeCount: sql`${videos.dislikeCount} + 1` }
        )
        .where(eq(videos.id, id));

      res.json({ action: 'added', type });
    }
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({ error: 'Failed to like video' });
  }
});

// Add comment
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

    const { id } = req.params;
    const { content, parentCommentId, timestamp } = req.body;
    const userId = req.user.id;

    const newComment = await db
      .insert(videoComments)
      .values({
        videoId: id,
        userId,
        parentCommentId,
        content,
        timestamp
      })
      .returning();

    // Update video comment count
    await db
      .update(videos)
      .set({
        commentCount: sql`${videos.commentCount} + 1`
      })
      .where(eq(videos.id, id));

    // Get comment with user info
    const commentWithUser = await db
      .select({
        id: videoComments.id,
        content: videoComments.content,
        timestamp: videoComments.timestamp,
        likeCount: videoComments.likeCount,
        replyCount: videoComments.replyCount,
        createdAt: videoComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl
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

// Get comments
router.get('/videos/:id/comments', [
  param('id').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const comments = await db
      .select({
        id: videoComments.id,
        content: videoComments.content,
        timestamp: videoComments.timestamp,
        likeCount: videoComments.likeCount,
        replyCount: videoComments.replyCount,
        isPinned: videoComments.isPinned,
        isHearted: videoComments.isHearted,
        createdAt: videoComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl
        }
      })
      .from(videoComments)
      .innerJoin(users, eq(videoComments.userId, users.id))
      .where(and(
        eq(videoComments.videoId, id),
        isNull(videoComments.parentCommentId)
      ))
      .orderBy(desc(videoComments.likeCount), desc(videoComments.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Subscribe to channel
router.post('/channels/:id/subscribe', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already subscribed
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.channelId, id),
        eq(subscriptions.subscriberId, userId)
      ))
      .limit(1);

    if (existingSubscription.length) {
      // Unsubscribe
      await db
        .delete(subscriptions)
        .where(and(
          eq(subscriptions.channelId, id),
          eq(subscriptions.subscriberId, userId)
        ));

      // Update channel subscriber count
      await db
        .update(channels)
        .set({
          subscriberCount: sql`${channels.subscriberCount} - 1`
        })
        .where(eq(channels.id, id));

      res.json({ action: 'unsubscribed' });
    } else {
      // Subscribe
      await db
        .insert(subscriptions)
        .values({
          channelId: id,
          subscriberId: userId
        });

      // Update channel subscriber count
      await db
        .update(channels)
        .set({
          subscriberCount: sql`${channels.subscriberCount} + 1`
        })
        .where(eq(channels.id, id));

      res.json({ action: 'subscribed' });
    }
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    res.status(500).json({ error: 'Failed to subscribe to channel' });
  }
});

// ==================== ANALYTICS ====================

// Get video analytics
router.get('/videos/:id/analytics', [
  param('id').isUUID(),
  query('period').optional().isIn(['7d', '30d', '90d', '1y'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;
    const userId = req.user.id;

    // Verify video ownership
    const video = await db
      .select({ channelId: videos.channelId })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(
        eq(videos.id, id),
        eq(channels.userId, userId)
      ))
      .limit(1);

    if (!video.length) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays[period]);

    const analytics = await db
      .select()
      .from(videoAnalytics)
      .where(and(
        eq(videoAnalytics.videoId, id),
        gte(videoAnalytics.date, startDate)
      ))
      .orderBy(asc(videoAnalytics.date));

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ==================== UTILITY FUNCTIONS ====================

async function trackVideoView(videoId, userId, req) {
  try {
    const sessionId = req.sessionID || crypto.randomUUID();
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    await db.insert(videoViews).values({
      videoId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      deviceType: getDeviceType(userAgent),
      platform: getPlatform(userAgent)
    });

    // Update video view count
    await db
      .update(videos)
      .set({
        viewCount: sql`${videos.viewCount} + 1`
      })
      .where(eq(videos.id, videoId));

  } catch (error) {
    console.error('Error tracking video view:', error);
  }
}

async function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        resolve({
          duration: metadata.format.duration,
          resolution: `${videoStream.width}x${videoStream.height}`,
          fileSize: metadata.format.size
        });
      }
    });
  });
}

async function processVideoAsync(videoId, filePath) {
  try {
    // Update processing status
    await db
      .update(videos)
      .set({ processingStatus: 'processing' })
      .where(eq(videos.id, videoId));

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(filePath, videoId);

    // Generate different quality versions (simplified)
    const qualityVersions = await generateQualityVersions(filePath, videoId);

    // Update video with processed data
    await db
      .update(videos)
      .set({
        thumbnailUrl: thumbnailPath,
        qualityVersions,
        processingStatus: 'processed'
      })
      .where(eq(videos.id, videoId));

    console.log(`✅ Video ${videoId} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing video ${videoId}:`, error);
    
    await db
      .update(videos)
      .set({ processingStatus: 'failed' })
      .where(eq(videos.id, videoId));
  }
}

async function generateThumbnail(videoPath, videoId) {
  const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', `${videoId}.jpg`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        folder: path.dirname(thumbnailPath),
        filename: path.basename(thumbnailPath),
        timemarks: ['30%']
      })
      .on('end', () => resolve(`/uploads/thumbnails/${videoId}.jpg`))
      .on('error', reject);
  });
}

async function generateQualityVersions(videoPath, videoId) {
  // Simplified quality generation - in production, you'd generate multiple resolutions
  return {
    '720p': `/uploads/videos/processed/${videoId}_720p.mp4`,
    '480p': `/uploads/videos/processed/${videoId}_480p.mp4`,
    '360p': `/uploads/videos/processed/${videoId}_360p.mp4`
  };
}

async function getRecommendations(userId, type, context = {}) {
  try {
    const result = await recommendationEngine.generateRecommendations(userId, {
      recommendationType: type,
      limit: 8,
      context
    });
    return result.recommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

async function getTrendingVideos(limit = 20) {
  try {
    return await db
      .select({
        id: videos.id,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        viewCount: videos.viewCount,
        publishedAt: videos.publishedAt,
        channel: {
          handle: channels.handle,
          name: channels.name,
          avatarUrl: channels.avatarUrl
        }
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(and(
        eq(videos.visibility, 'public'),
        eq(videos.isDeleted, false),
        gte(videos.publishedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      ))
      .orderBy(desc(videos.trendingScore))
      .limit(limit);
  } catch (error) {
    console.error('Error getting trending videos:', error);
    return [];
  }
}

function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getPlatform(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}

export default router;