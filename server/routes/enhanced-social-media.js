import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';
import { eq, and, desc, asc, sql, or, inArray, ne, gte, lt, like, count, avg, sum, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { 
  enhancedSocialPosts,
  enhancedSocialStories,
  enhancedPostLikes,
  enhancedPostComments,
  enhancedSocialFollows,
  enhancedSocialNotifications,
  enhancedSocialAnalytics,
  enhancedContentModeration,
  enhancedSearchQueries
} from '../db/enhanced-social-media-schema.js';
import { users } from '../db/schema.js';
import { authenticateUser } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import NodeCache from 'node-cache';

const router = express.Router();

// Initialize cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300 });

// Rate limiting configurations
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Rate limit exceeded' }
});

const lenientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Rate limit exceeded' }
});

// Enhanced multer configuration with better security
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/social-media', new Date().toISOString().split('T')[0]);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10,
    fields: 20
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|mp3|wav|ogg|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed'));
    }
  }
});

// Validation middleware
const validatePost = [
  body('caption').optional().isLength({ max: 2200 }).withMessage('Caption too long'),
  body('studyRelated').optional().isBoolean().withMessage('Study related must be boolean'),
  body('subject').optional().isLength({ max: 100 }).withMessage('Subject too long'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('tags').optional().isArray({ max: 30 }).withMessage('Too many tags'),
  body('mentions').optional().isArray({ max: 20 }).withMessage('Too many mentions'),
  body('visibility').optional().isIn(['public', 'followers', 'close_friends', 'private']).withMessage('Invalid visibility'),
  body('allowComments').optional().isBoolean().withMessage('Allow comments must be boolean'),
  body('allowSharing').optional().isBoolean().withMessage('Allow sharing must be boolean')
];

const validateComment = [
  body('content').notEmpty().isLength({ min: 1, max: 2000 }).withMessage('Comment content required and must be under 2000 characters'),
  body('parentCommentId').optional().isUUID().withMessage('Invalid parent comment ID')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

// Error handling middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Utility functions
const generateCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .trim();
  }
  return input;
};

const processMediaUrls = async (files, options = {}) => {
  const processedUrls = [];
  const { createThumbnails = true, generateMultipleResolutions = true } = options;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file.path);
    const processed = { original: relativePath };

    if (file.mimetype.startsWith('image/')) {
      try {
        // Create optimized versions
        const optimizedPath = file.path.replace(path.extname(file.path), '_optimized.jpg');
        await sharp(file.path)
          .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(optimizedPath);
        
        processed.optimized = path.relative(process.cwd(), optimizedPath);

        if (generateMultipleResolutions) {
          // Create thumbnail
          const thumbnailPath = file.path.replace(path.extname(file.path), '_thumb.jpg');
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          
          processed.thumbnail = path.relative(process.cwd(), thumbnailPath);

          // Create medium resolution
          const mediumPath = file.path.replace(path.extname(file.path), '_medium.jpg');
          await sharp(file.path)
            .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(mediumPath);
          
          processed.medium = path.relative(process.cwd(), mediumPath);
        }

        // Get image metadata
        const metadata = await sharp(file.path).metadata();
        processed.dimensions = { width: metadata.width, height: metadata.height };
        processed.size = file.size;

      } catch (error) {
        console.error('Error processing image:', error);
        processed.error = 'Failed to process image';
      }
    } else if (file.mimetype.startsWith('video/')) {
      try {
        if (createThumbnails) {
          // Create video thumbnail using ffmpeg
          const thumbnailPath = file.path.replace(path.extname(file.path), '_thumb.jpg');
          
          await new Promise((resolve, reject) => {
            ffmpeg(file.path)
              .screenshots({
                timestamps: ['00:00:01'],
                filename: path.basename(thumbnailPath),
                folder: path.dirname(thumbnailPath),
                size: '300x300'
              })
              .on('end', resolve)
              .on('error', reject);
          });

          processed.thumbnail = path.relative(process.cwd(), thumbnailPath);
        }

        // Get video metadata
        await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(file.path, (err, metadata) => {
            if (err) reject(err);
            else {
              const videoStream = metadata.streams.find(s => s.codec_type === 'video');
              if (videoStream) {
                processed.dimensions = { 
                  width: videoStream.width, 
                  height: videoStream.height 
                };
                processed.duration = Math.floor(metadata.format.duration);
              }
              processed.size = file.size;
              resolve();
            }
          });
        });

      } catch (error) {
        console.error('Error processing video:', error);
        processed.error = 'Failed to process video';
      }
    }

    processedUrls.push(processed);
  }

  return processedUrls;
};

// Apply authentication to all routes
router.use(authenticateUser);

// =============================================================================
// ENHANCED POSTS API
// =============================================================================

// Get enhanced feed with advanced filtering and recommendations
router.get('/enhanced/feed', lenientRateLimit, validatePagination, handleValidation, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = 'all',
      subject,
      difficulty,
      studyLevel,
      sortBy = 'recent', // 'recent', 'popular', 'trending', 'engagement'
      timeRange = 'all' // 'hour', 'day', 'week', 'month', 'all'
    } = req.query;

    const offset = (page - 1) * limit;
    const cacheKey = generateCacheKey('feed', req.user.id, page, limit, type, subject, difficulty, studyLevel, sortBy, timeRange);
    
    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        cached: true,
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      });
    }

    let whereConditions = [
      eq(enhancedSocialPosts.isDeleted, false),
      eq(enhancedSocialPosts.isDraft, false),
      ne(enhancedSocialPosts.moderationStatus, 'rejected')
    ];

    // Apply visibility filters
    if (type === 'following') {
      const following = await db
        .select({ followingId: enhancedSocialFollows.followingId })
        .from(enhancedSocialFollows)
        .where(eq(enhancedSocialFollows.followerId, req.user.id));
      
      const followingIds = following.map(f => f.followingId);
      if (followingIds.length > 0) {
        whereConditions.push(or(
          inArray(enhancedSocialPosts.userId, followingIds),
          eq(enhancedSocialPosts.userId, req.user.id)
        ));
      } else {
        whereConditions.push(eq(enhancedSocialPosts.userId, req.user.id));
      }
    } else if (type === 'study') {
      whereConditions.push(eq(enhancedSocialPosts.studyRelated, true));
    }

    // Apply filters
    if (subject) {
      whereConditions.push(eq(enhancedSocialPosts.subject, subject));
    }
    if (difficulty) {
      whereConditions.push(eq(enhancedSocialPosts.difficulty, difficulty));
    }
    if (studyLevel) {
      whereConditions.push(eq(enhancedSocialPosts.studyLevel, studyLevel));
    }

    // Apply time range filter
    if (timeRange !== 'all') {
      const timeMap = {
        'hour': new Date(Date.now() - 60 * 60 * 1000),
        'day': new Date(Date.now() - 24 * 60 * 60 * 1000),
        'week': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        'month': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };
      whereConditions.push(gte(enhancedSocialPosts.createdAt, timeMap[timeRange]));
    }

    // Apply sorting
    let orderBy;
    switch (sortBy) {
      case 'popular':
        orderBy = [desc(enhancedSocialPosts.likesCount), desc(enhancedSocialPosts.createdAt)];
        break;
      case 'engagement':
        orderBy = [desc(enhancedSocialPosts.engagementRate), desc(enhancedSocialPosts.createdAt)];
        break;
      case 'trending':
        orderBy = [desc(sql`(${enhancedSocialPosts.likesCount} + ${enhancedSocialPosts.commentsCount} * 2 + ${enhancedSocialPosts.sharesCount} * 3) / EXTRACT(EPOCH FROM (NOW() - ${enhancedSocialPosts.createdAt})) * 3600`), desc(enhancedSocialPosts.createdAt)];
        break;
      default:
        orderBy = [desc(enhancedSocialPosts.createdAt)];
    }

    const posts = await db
      .select({
        id: enhancedSocialPosts.id,
        caption: enhancedSocialPosts.caption,
        mediaType: enhancedSocialPosts.mediaType,
        mediaUrls: enhancedSocialPosts.mediaUrls,
        processedMediaUrls: enhancedSocialPosts.processedMediaUrls,
        thumbnailUrl: enhancedSocialPosts.thumbnailUrl,
        aspectRatio: enhancedSocialPosts.aspectRatio,
        duration: enhancedSocialPosts.duration,
        location: enhancedSocialPosts.location,
        tags: enhancedSocialPosts.tags,
        mentions: enhancedSocialPosts.mentions,
        studyRelated: enhancedSocialPosts.studyRelated,
        subject: enhancedSocialPosts.subject,
        topics: enhancedSocialPosts.topics,
        difficulty: enhancedSocialPosts.difficulty,
        studyLevel: enhancedSocialPosts.studyLevel,
        learningObjectives: enhancedSocialPosts.learningObjectives,
        estimatedStudyTime: enhancedSocialPosts.estimatedStudyTime,
        likesCount: enhancedSocialPosts.likesCount,
        commentsCount: enhancedSocialPosts.commentsCount,
        sharesCount: enhancedSocialPosts.sharesCount,
        savesCount: enhancedSocialPosts.savesCount,
        viewsCount: enhancedSocialPosts.viewsCount,
        engagementRate: enhancedSocialPosts.engagementRate,
        visibility: enhancedSocialPosts.visibility,
        allowComments: enhancedSocialPosts.allowComments,
        allowSharing: enhancedSocialPosts.allowSharing,
        createdAt: enhancedSocialPosts.createdAt,
        publishedAt: enhancedSocialPosts.publishedAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        }
      })
      .from(enhancedSocialPosts)
      .leftJoin(users, eq(enhancedSocialPosts.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(parseInt(limit))
      .offset(offset);

    // Get user interactions for these posts
    const postIds = posts.map(p => p.id);
    const userLikes = postIds.length > 0 ? await db
      .select({ postId: enhancedPostLikes.postId, likeType: enhancedPostLikes.likeType })
      .from(enhancedPostLikes)
      .where(and(
        inArray(enhancedPostLikes.postId, postIds),
        eq(enhancedPostLikes.userId, req.user.id)
      )) : [];

    const userSaves = postIds.length > 0 ? await db
      .select({ postId: enhancedSocialPosts.id })
      .from(enhancedSocialPosts)
      .where(and(
        inArray(enhancedSocialPosts.id, postIds),
        eq(enhancedSocialPosts.userId, req.user.id)
      )) : [];

    const likedPostIds = new Set(userLikes.map(l => l.postId));
    const likeTypes = new Map(userLikes.map(l => [l.postId, l.likeType]));
    const savedPostIds = new Set(userSaves.map(s => s.postId));

    const enhancedPosts = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      likeType: likeTypes.get(post.id),
      isSaved: savedPostIds.has(post.id),
      engagement: {
        rate: parseFloat(post.engagementRate),
        totalInteractions: post.likesCount + post.commentsCount + post.sharesCount
      }
    }));

    // Cache the result
    cache.set(cacheKey, enhancedPosts);

    res.json({
      success: true,
      data: enhancedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      },
      meta: {
        totalResults: posts.length,
        filters: { type, subject, difficulty, studyLevel, sortBy, timeRange }
      }
    });

  } catch (error) {
    console.error('Error fetching enhanced feed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create enhanced post with comprehensive features
router.post('/enhanced/posts', strictRateLimit, upload.array('media', 10), validatePost, handleValidation, async (req, res) => {
  try {
    const {
      caption,
      altText,
      location,
      coordinates,
      tags,
      mentions,
      collaborators,
      studyRelated,
      subject,
      topics,
      difficulty,
      studyLevel,
      learningObjectives,
      resources,
      estimatedStudyTime,
      visibility = 'public',
      allowComments = true,
      allowSharing = true,
      allowDownload = false,
      contentWarnings,
      isAgeRestricted = false,
      minimumAge = 13,
      isDraft = false,
      scheduledAt,
      category,
      subcategory,
      seoTitle,
      seoDescription,
      keywords
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one media file is required' 
      });
    }

    // Sanitize inputs
    const sanitizedCaption = sanitizeInput(caption);
    const sanitizedAltText = sanitizeInput(altText);

    // Process media files
    const processedMedia = await processMediaUrls(req.files, {
      createThumbnails: true,
      generateMultipleResolutions: true
    });

    // Determine media type
    let mediaType = 'image';
    if (req.files.length > 1) {
      mediaType = 'carousel';
    } else if (req.files[0].mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (req.files[0].mimetype.startsWith('audio/')) {
      mediaType = 'audio';
    } else if (req.files[0].mimetype.includes('pdf') || req.files[0].mimetype.includes('document')) {
      mediaType = 'document';
    }

    // Calculate estimated file size
    const totalFileSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // Parse JSON fields
    const parsedTags = tags ? JSON.parse(tags) : [];
    const parsedMentions = mentions ? JSON.parse(mentions) : [];
    const parsedCollaborators = collaborators ? JSON.parse(collaborators) : [];
    const parsedTopics = topics ? JSON.parse(topics) : [];
    const parsedLearningObjectives = learningObjectives ? JSON.parse(learningObjectives) : [];
    const parsedResources = resources ? JSON.parse(resources) : [];
    const parsedContentWarnings = contentWarnings ? JSON.parse(contentWarnings) : [];
    const parsedKeywords = keywords ? JSON.parse(keywords) : [];
    const parsedCoordinates = coordinates ? JSON.parse(coordinates) : null;

    // Get media dimensions from first processed file
    const dimensions = processedMedia[0]?.dimensions || {};
    const duration = processedMedia[0]?.duration || null;
    const thumbnailUrl = processedMedia[0]?.thumbnail || null;

    const currentTime = new Date();
    const publishedAt = isDraft || scheduledAt ? null : currentTime;

    // Create the post
    const [newPost] = await db.insert(enhancedSocialPosts).values({
      userId: req.user.id,
      caption: sanitizedCaption,
      altText: sanitizedAltText,
      mediaType,
      mediaUrls: JSON.stringify(req.files.map(f => path.relative(process.cwd(), f.path))),
      processedMediaUrls: JSON.stringify(processedMedia),
      thumbnailUrl,
      dimensions: JSON.stringify(dimensions),
      fileSize: totalFileSize,
      duration,
      location,
      coordinates: parsedCoordinates,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tags: parsedTags,
      mentions: parsedMentions,
      collaborators: parsedCollaborators,
      studyRelated: studyRelated === 'true',
      subject,
      topics: parsedTopics,
      difficulty,
      studyLevel,
      learningObjectives: parsedLearningObjectives,
      resources: parsedResources,
      estimatedStudyTime: estimatedStudyTime ? parseInt(estimatedStudyTime) : null,
      visibility,
      allowComments: allowComments === 'true',
      allowSharing: allowSharing === 'true',
      allowDownload: allowDownload === 'true',
      contentWarnings: parsedContentWarnings,
      isAgeRestricted: isAgeRestricted === 'true',
      minimumAge: parseInt(minimumAge),
      isDraft: isDraft === 'true',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt,
      category,
      subcategory,
      seoTitle,
      seoDescription,
      keywords: parsedKeywords
    }).returning();

    // Clear relevant caches
    cache.flushAll();

    // Send notifications to mentioned users
    if (parsedMentions.length > 0 && !isDraft) {
      for (const mentionedUserId of parsedMentions) {
        await db.insert(enhancedSocialNotifications).values({
          userId: mentionedUserId,
          actorId: req.user.id,
          type: 'mention',
          entityType: 'post',
          entityId: newPost.id,
          title: 'You were mentioned in a post',
          message: `${req.user.fullName} mentioned you in a post`,
          category: studyRelated ? 'study' : 'social',
          priority: 'normal'
        });
      }
    }

    // Update user analytics
    await updateUserAnalytics(req.user.id, 'post_created');

    res.status(201).json({
      success: true,
      data: newPost,
      message: isDraft ? 'Post saved as draft' : 'Post created successfully',
      processedMedia: processedMedia.length
    });

  } catch (error) {
    console.error('Error creating enhanced post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced like/unlike with reaction types
router.post('/enhanced/posts/:postId/like', 
  moderateRateLimit,
  param('postId').isUUID().withMessage('Invalid post ID'),
  body('likeType').optional().isIn(['like', 'love', 'helpful', 'genius', 'mind_blown', 'fire']).withMessage('Invalid like type'),
  body('intensity').optional().isInt({ min: 1, max: 5 }).withMessage('Intensity must be between 1 and 5'),
  handleValidation,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { likeType = 'like', intensity = 1 } = req.body;

      // Verify post exists and is accessible
      const [post] = await db
        .select({ 
          id: enhancedSocialPosts.id, 
          userId: enhancedSocialPosts.userId,
          visibility: enhancedSocialPosts.visibility,
          likesCount: enhancedSocialPosts.likesCount
        })
        .from(enhancedSocialPosts)
        .where(and(
          eq(enhancedSocialPosts.id, postId),
          eq(enhancedSocialPosts.isDeleted, false)
        ))
        .limit(1);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check if user can view this post based on visibility
      if (post.visibility !== 'public' && post.userId !== req.user.id) {
        // Check if user follows the post owner for follower-only posts
        if (post.visibility === 'followers') {
          const [follow] = await db
            .select()
            .from(enhancedSocialFollows)
            .where(and(
              eq(enhancedSocialFollows.followerId, req.user.id),
              eq(enhancedSocialFollows.followingId, post.userId)
            ))
            .limit(1);

          if (!follow) {
            return res.status(403).json({ success: false, message: 'Not authorized to like this post' });
          }
        }
      }

      // Check if already liked
      const existingLike = await db
        .select()
        .from(enhancedPostLikes)
        .where(and(
          eq(enhancedPostLikes.postId, postId),
          eq(enhancedPostLikes.userId, req.user.id)
        ))
        .limit(1);

      let action;
      let newLikesCount;

      if (existingLike.length > 0) {
        // Update existing like or unlike
        if (existingLike[0].likeType === likeType) {
          // Unlike
          await db.delete(enhancedPostLikes)
            .where(and(
              eq(enhancedPostLikes.postId, postId),
              eq(enhancedPostLikes.userId, req.user.id)
            ));

          const [updatedPost] = await db.update(enhancedSocialPosts)
            .set({ 
              likesCount: sql`${enhancedSocialPosts.likesCount} - 1`,
              lastEngagementAt: new Date()
            })
            .where(eq(enhancedSocialPosts.id, postId))
            .returning({ likesCount: enhancedSocialPosts.likesCount });

          action = 'unliked';
          newLikesCount = updatedPost.likesCount;
        } else {
          // Update like type
          await db.update(enhancedPostLikes)
            .set({ 
              likeType,
              intensity,
              createdAt: new Date()
            })
            .where(and(
              eq(enhancedPostLikes.postId, postId),
              eq(enhancedPostLikes.userId, req.user.id)
            ));

          action = 'updated';
          newLikesCount = post.likesCount;
        }
      } else {
        // New like
        await db.insert(enhancedPostLikes).values({
          postId,
          userId: req.user.id,
          likeType,
          intensity,
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
        });

        const [updatedPost] = await db.update(enhancedSocialPosts)
          .set({ 
            likesCount: sql`${enhancedSocialPosts.likesCount} + 1`,
            lastEngagementAt: new Date()
          })
          .where(eq(enhancedSocialPosts.id, postId))
          .returning({ likesCount: enhancedSocialPosts.likesCount });

        action = 'liked';
        newLikesCount = updatedPost.likesCount;

        // Create notification for post owner (if not self-like)
        if (post.userId !== req.user.id) {
          await db.insert(enhancedSocialNotifications).values({
            userId: post.userId,
            actorId: req.user.id,
            type: 'like',
            subtype: likeType,
            entityType: 'post',
            entityId: postId,
            title: 'New reaction to your post',
            message: `${req.user.fullName} reacted to your post with ${likeType}`,
            category: 'social',
            priority: intensity > 3 ? 'high' : 'normal'
          });
        }
      }

      // Update user analytics
      await updateUserAnalytics(req.user.id, 'like_given');
      if (post.userId !== req.user.id) {
        await updateUserAnalytics(post.userId, 'like_received');
      }

      // Clear caches
      cache.del(generateCacheKey('feed', req.user.id));

      res.json({
        success: true,
        action,
        likeType,
        likesCount: newLikesCount,
        intensity
      });

    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to toggle like',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Enhanced comment system with threading
router.post('/enhanced/posts/:postId/comments',
  moderateRateLimit,
  param('postId').isUUID().withMessage('Invalid post ID'),
  validateComment,
  handleValidation,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { content, parentCommentId, mentions, hashtags, contentType = 'text', mediaUrl } = req.body;

      // Verify post exists and allows comments
      const [post] = await db
        .select({ 
          id: enhancedSocialPosts.id, 
          userId: enhancedSocialPosts.userId,
          allowComments: enhancedSocialPosts.allowComments,
          commentsCount: enhancedSocialPosts.commentsCount
        })
        .from(enhancedSocialPosts)
        .where(and(
          eq(enhancedSocialPosts.id, postId),
          eq(enhancedSocialPosts.isDeleted, false)
        ))
        .limit(1);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      if (!post.allowComments) {
        return res.status(403).json({ success: false, message: 'Comments are disabled for this post' });
      }

      const sanitizedContent = sanitizeInput(content);
      const parsedMentions = mentions ? JSON.parse(mentions) : [];
      const parsedHashtags = hashtags ? JSON.parse(hashtags) : [];

      // Handle threading
      let threadDepth = 0;
      let threadPath = '';
      let parentComment = null;

      if (parentCommentId) {
        [parentComment] = await db
          .select({ 
            threadDepth: enhancedPostComments.threadDepth,
            threadPath: enhancedPostComments.threadPath,
            repliesCount: enhancedPostComments.repliesCount
          })
          .from(enhancedPostComments)
          .where(eq(enhancedPostComments.id, parentCommentId))
          .limit(1);

        if (parentComment) {
          threadDepth = Math.min(parentComment.threadDepth + 1, 5); // Max depth of 5
          threadPath = parentComment.threadPath ? `${parentComment.threadPath}.${parentCommentId}` : parentCommentId;
        }
      }

      // Estimate read time (average 200 words per minute)
      const wordCount = sanitizedContent.split(' ').length;
      const readTime = Math.ceil(wordCount / (200 / 60)); // in seconds

      // Create comment
      const [newComment] = await db.insert(enhancedPostComments).values({
        postId,
        userId: req.user.id,
        parentCommentId: parentCommentId || null,
        content: sanitizedContent,
        contentType,
        mediaUrl,
        mentions: parsedMentions,
        hashtags: parsedHashtags,
        threadDepth,
        threadPath,
        readTime
      }).returning();

      // Update post comments count
      await db.update(enhancedSocialPosts)
        .set({ 
          commentsCount: sql`${enhancedSocialPosts.commentsCount} + 1`,
          lastEngagementAt: new Date()
        })
        .where(eq(enhancedSocialPosts.id, postId));

      // Update parent comment replies count
      if (parentCommentId && parentComment) {
        await db.update(enhancedPostComments)
          .set({ 
            repliesCount: sql`${enhancedPostComments.repliesCount} + 1`
          })
          .where(eq(enhancedPostComments.id, parentCommentId));
      }

      // Get user info for the response
      const [userInfo] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      const commentWithUser = {
        ...newComment,
        user: userInfo
      };

      // Create notifications
      if (post.userId !== req.user.id) {
        await db.insert(enhancedSocialNotifications).values({
          userId: post.userId,
          actorId: req.user.id,
          type: 'comment',
          entityType: 'post',
          entityId: postId,
          title: 'New comment on your post',
          message: `${req.user.fullName} commented on your post`,
          category: 'social',
          priority: 'normal'
        });
      }

      // Notify mentioned users
      for (const mentionedUserId of parsedMentions) {
        if (mentionedUserId !== req.user.id) {
          await db.insert(enhancedSocialNotifications).values({
            userId: mentionedUserId,
            actorId: req.user.id,
            type: 'mention',
            entityType: 'comment',
            entityId: newComment.id,
            title: 'You were mentioned in a comment',
            message: `${req.user.fullName} mentioned you in a comment`,
            category: 'social',
            priority: 'normal'
          });
        }
      }

      // Update analytics
      await updateUserAnalytics(req.user.id, 'comment_given');
      if (post.userId !== req.user.id) {
        await updateUserAnalytics(post.userId, 'comment_received');
      }

      res.status(201).json({
        success: true,
        data: commentWithUser,
        message: 'Comment added successfully'
      });

    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Analytics helper function
const updateUserAnalytics = async (userId, action) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analyticsData = {
      userId,
      date: today,
      period: 'day'
    };

    switch (action) {
      case 'post_created':
        analyticsData.postsCreated = 1;
        break;
      case 'story_created':
        analyticsData.storiesCreated = 1;
        break;
      case 'comment_given':
        analyticsData.commentsGiven = 1;
        break;
      case 'comment_received':
        analyticsData.commentsReceived = 1;
        break;
      case 'like_given':
        analyticsData.likesGiven = 1;
        break;
      case 'like_received':
        analyticsData.likesReceived = 1;
        break;
    }

    await db.insert(enhancedSocialAnalytics)
      .values(analyticsData)
      .onConflictDoUpdate({
        target: [enhancedSocialAnalytics.userId, enhancedSocialAnalytics.date, enhancedSocialAnalytics.period],
        set: Object.keys(analyticsData).reduce((acc, key) => {
          if (key !== 'userId' && key !== 'date' && key !== 'period') {
            acc[key] = sql`${enhancedSocialAnalytics[key]} + ${analyticsData[key]}`;
          }
          return acc;
        }, {})
      });
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
};

// Get advanced analytics
router.get('/enhanced/analytics', lenientRateLimit, async (req, res) => {
  try {
    const { period = 'week', startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = and(
        gte(enhancedSocialAnalytics.date, new Date(startDate)),
        lt(enhancedSocialAnalytics.date, new Date(endDate))
      );
    } else {
      const periods = {
        'day': 1,
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365
      };
      const daysBack = periods[period] || 7;
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      dateFilter = gte(enhancedSocialAnalytics.date, since);
    }

    const analytics = await db
      .select({
        date: enhancedSocialAnalytics.date,
        postsCreated: sum(enhancedSocialAnalytics.postsCreated),
        storiesCreated: sum(enhancedSocialAnalytics.storiesCreated),
        likesGiven: sum(enhancedSocialAnalytics.likesGiven),
        likesReceived: sum(enhancedSocialAnalytics.likesReceived),
        commentsGiven: sum(enhancedSocialAnalytics.commentsGiven),
        commentsReceived: sum(enhancedSocialAnalytics.commentsReceived),
        newFollowers: sum(enhancedSocialAnalytics.newFollowers),
        engagementRate: avg(enhancedSocialAnalytics.engagementRate),
        timeSpent: sum(enhancedSocialAnalytics.timeSpentMinutes)
      })
      .from(enhancedSocialAnalytics)
      .where(and(
        eq(enhancedSocialAnalytics.userId, req.user.id),
        dateFilter
      ))
      .groupBy(enhancedSocialAnalytics.date)
      .orderBy(enhancedSocialAnalytics.date);

    // Get totals
    const [totals] = await db
      .select({
        totalPosts: count(enhancedSocialPosts.id),
        totalLikes: sum(enhancedSocialPosts.likesCount),
        totalComments: sum(enhancedSocialPosts.commentsCount),
        totalShares: sum(enhancedSocialPosts.sharesCount),
        avgEngagement: avg(enhancedSocialPosts.engagementRate)
      })
      .from(enhancedSocialPosts)
      .where(and(
        eq(enhancedSocialPosts.userId, req.user.id),
        eq(enhancedSocialPosts.isDeleted, false)
      ));

    res.json({
      success: true,
      data: {
        analytics,
        totals,
        period,
        summary: {
          totalEngagement: parseInt(totals.totalLikes) + parseInt(totals.totalComments) + parseInt(totals.totalShares),
          averageEngagementRate: parseFloat(totals.avgEngagement) || 0,
          postsCount: parseInt(totals.totalPosts)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced search with AI-powered recommendations
router.get('/enhanced/search', lenientRateLimit, async (req, res) => {
  try {
    const { 
      q, 
      type = 'all', // 'posts', 'users', 'hashtags', 'all'
      filters = '{}',
      page = 1,
      limit = 20,
      sortBy = 'relevance' // 'relevance', 'recent', 'popular'
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters' 
      });
    }

    const sanitizedQuery = sanitizeInput(q.trim());
    const parsedFilters = JSON.parse(filters);
    const offset = (page - 1) * limit;

    // Record search query for analytics
    await db.insert(enhancedSearchQueries).values({
      userId: req.user.id,
      query: sanitizedQuery,
      queryType: type,
      filters: parsedFilters,
      searchContext: 'enhanced_search'
    });

    const results = {};

    if (type === 'posts' || type === 'all') {
      // Search posts
      let postConditions = [
        eq(enhancedSocialPosts.isDeleted, false),
        eq(enhancedSocialPosts.isDraft, false),
        ne(enhancedSocialPosts.moderationStatus, 'rejected')
      ];

      // Add text search conditions
      postConditions.push(or(
        like(enhancedSocialPosts.caption, `%${sanitizedQuery}%`),
        sql`${enhancedSocialPosts.tags}::text ILIKE ${'%' + sanitizedQuery + '%'}`,
        sql`${enhancedSocialPosts.keywords}::text ILIKE ${'%' + sanitizedQuery + '%'}`
      ));

      // Apply filters
      if (parsedFilters.subject) {
        postConditions.push(eq(enhancedSocialPosts.subject, parsedFilters.subject));
      }
      if (parsedFilters.difficulty) {
        postConditions.push(eq(enhancedSocialPosts.difficulty, parsedFilters.difficulty));
      }
      if (parsedFilters.studyLevel) {
        postConditions.push(eq(enhancedSocialPosts.studyLevel, parsedFilters.studyLevel));
      }

      // Apply sorting
      let orderBy;
      switch (sortBy) {
        case 'recent':
          orderBy = [desc(enhancedSocialPosts.createdAt)];
          break;
        case 'popular':
          orderBy = [desc(enhancedSocialPosts.engagementRate), desc(enhancedSocialPosts.createdAt)];
          break;
        default: // relevance
          orderBy = [desc(sql`ts_rank_cd(to_tsvector('english', ${enhancedSocialPosts.caption}), plainto_tsquery('english', ${sanitizedQuery}))`), desc(enhancedSocialPosts.createdAt)];
      }

      const posts = await db
        .select({
          id: enhancedSocialPosts.id,
          caption: enhancedSocialPosts.caption,
          mediaType: enhancedSocialPosts.mediaType,
          thumbnailUrl: enhancedSocialPosts.thumbnailUrl,
          tags: enhancedSocialPosts.tags,
          subject: enhancedSocialPosts.subject,
          difficulty: enhancedSocialPosts.difficulty,
          likesCount: enhancedSocialPosts.likesCount,
          commentsCount: enhancedSocialPosts.commentsCount,
          engagementRate: enhancedSocialPosts.engagementRate,
          createdAt: enhancedSocialPosts.createdAt,
          user: {
            id: users.id,
            fullName: users.fullName,
            profilePicture: users.profilePicture,
            isVerified: users.isVerified
          }
        })
        .from(enhancedSocialPosts)
        .leftJoin(users, eq(enhancedSocialPosts.userId, users.id))
        .where(and(...postConditions))
        .orderBy(...orderBy)
        .limit(parseInt(limit))
        .offset(offset);

      results.posts = posts;
    }

    if (type === 'users' || type === 'all') {
      // Search users
      const userResults = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          bio: users.bio,
          isVerified: users.isVerified,
          subjects: users.subjects
        })
        .from(users)
        .where(or(
          like(users.fullName, `%${sanitizedQuery}%`),
          like(users.bio, `%${sanitizedQuery}%`)
        ))
        .limit(parseInt(limit))
        .offset(offset);

      results.users = userResults;
    }

    res.json({
      success: true,
      data: results,
      query: sanitizedQuery,
      filters: parsedFilters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error in enhanced search:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;