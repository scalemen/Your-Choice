import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { eq, and, desc, asc, sql, or, inArray, ne, gte, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { 
  socialPosts, 
  socialStories, 
  postLikes, 
  postComments, 
  commentLikes,
  postShares, 
  postSaves,
  socialFollows,
  directMessages,
  conversations,
  socialNotifications,
  trendingHashtags,
  socialAnalytics,
  socialProfiles,
  storyViews
} from '../db/social-media-schema.js';
import { users } from '../db/schema.js';
import { authenticateUser } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/social-media');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Apply authentication to all routes
router.use(authenticateUser);

// =============================================================================
// SOCIAL MEDIA POSTS
// =============================================================================

// Get feed posts
router.get('/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereCondition = eq(socialPosts.isPublic, true);
    
    if (type === 'following') {
      // Get posts from users the current user follows
      const following = await db
        .select({ followingId: socialFollows.followingId })
        .from(socialFollows)
        .where(eq(socialFollows.followerId, req.user.id));
      
      const followingIds = following.map(f => f.followingId);
      if (followingIds.length > 0) {
        whereCondition = and(
          eq(socialPosts.isPublic, true),
          or(
            inArray(socialPosts.userId, followingIds),
            eq(socialPosts.userId, req.user.id)
          )
        );
      } else {
        whereCondition = eq(socialPosts.userId, req.user.id);
      }
    } else if (type === 'study') {
      whereCondition = and(
        eq(socialPosts.isPublic, true),
        eq(socialPosts.studyRelated, true)
      );
    }
    
    const posts = await db
      .select({
        id: socialPosts.id,
        caption: socialPosts.caption,
        mediaType: socialPosts.mediaType,
        mediaUrls: socialPosts.mediaUrls,
        thumbnailUrl: socialPosts.thumbnailUrl,
        aspectRatio: socialPosts.aspectRatio,
        duration: socialPosts.duration,
        location: socialPosts.location,
        tags: socialPosts.tags,
        mentions: socialPosts.mentions,
        studyRelated: socialPosts.studyRelated,
        subject: socialPosts.subject,
        difficulty: socialPosts.difficulty,
        likesCount: socialPosts.likesCount,
        commentsCount: socialPosts.commentsCount,
        sharesCount: socialPosts.sharesCount,
        viewsCount: socialPosts.viewsCount,
        createdAt: socialPosts.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        }
      })
      .from(socialPosts)
      .leftJoin(users, eq(socialPosts.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(socialPosts.createdAt))
      .limit(parseInt(limit))
      .offset(offset);
    
    // Check if user liked each post
    const postIds = posts.map(p => p.id);
    const userLikes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(and(
        inArray(postLikes.postId, postIds),
        eq(postLikes.userId, req.user.id)
      ));
    
    const likedPostIds = new Set(userLikes.map(l => l.postId));
    
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id)
    }));
    
    res.json({
      success: true,
      data: postsWithLikes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
});

// Create new post
router.post('/posts', upload.array('media', 10), async (req, res) => {
  try {
    const { 
      caption, 
      location, 
      tags, 
      mentions, 
      studyRelated, 
      subject, 
      difficulty, 
      aspectRatio = '1:1',
      isPublic = true,
      allowComments = true,
      allowSharing = true
    } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one media file is required' });
    }
    
    const mediaUrls = [];
    let thumbnailUrl = null;
    let duration = null;
    
    // Process uploaded files
    for (const file of req.files) {
      const relativePath = path.relative(process.cwd(), file.path);
      
      if (file.mimetype.startsWith('image/')) {
        // Process image
        const optimizedPath = file.path.replace(path.extname(file.path), '_optimized.jpg');
        await sharp(file.path)
          .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(optimizedPath);
        
        mediaUrls.push(path.relative(process.cwd(), optimizedPath));
      } else {
        // For videos, keep original and create thumbnail
        mediaUrls.push(relativePath);
        
        if (!thumbnailUrl) {
          // Create video thumbnail (simplified - in production use ffmpeg)
          thumbnailUrl = relativePath; // Placeholder
        }
      }
    }
    
    const mediaType = req.files.length > 1 ? 'carousel' : 
                     req.files[0].mimetype.startsWith('image/') ? 'image' : 'video';
    
    const [newPost] = await db.insert(socialPosts).values({
      userId: req.user.id,
      caption,
      mediaType,
      mediaUrls: JSON.stringify(mediaUrls),
      thumbnailUrl,
      aspectRatio,
      duration,
      location,
      tags: tags ? JSON.parse(tags) : [],
      mentions: mentions ? JSON.parse(mentions) : [],
      studyRelated: studyRelated === 'true',
      subject,
      difficulty,
      isPublic: isPublic === 'true',
      allowComments: allowComments === 'true',
      allowSharing: allowSharing === 'true'
    }).returning();
    
    // Update hashtag trends
    if (tags) {
      const hashtags = JSON.parse(tags);
      for (const tag of hashtags) {
        await db.insert(trendingHashtags)
          .values({
            hashtag: tag,
            postsCount: 1,
            trendScore: 1
          })
          .onConflictDoUpdate({
            target: trendingHashtags.hashtag,
            set: {
              postsCount: sql`${trendingHashtags.postsCount} + 1`,
              trendScore: sql`${trendingHashtags.trendScore} + 1`,
              updatedAt: new Date()
            }
          });
      }
    }
    
    res.status(201).json({
      success: true,
      data: newPost,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// Like/Unlike post
router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { likeType = 'like' } = req.body;
    
    // Check if already liked
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, req.user.id)
      ))
      .limit(1);
    
    if (existingLike.length > 0) {
      // Unlike
      await db.delete(postLikes)
        .where(and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, req.user.id)
        ));
      
      // Decrement likes count
      await db.update(socialPosts)
        .set({ 
          likesCount: sql`${socialPosts.likesCount} - 1`
        })
        .where(eq(socialPosts.id, postId));
      
      res.json({ success: true, action: 'unliked' });
    } else {
      // Like
      await db.insert(postLikes).values({
        postId,
        userId: req.user.id,
        likeType
      });
      
      // Increment likes count
      await db.update(socialPosts)
        .set({ 
          likesCount: sql`${socialPosts.likesCount} + 1`
        })
        .where(eq(socialPosts.id, postId));
      
      // Create notification
      const [post] = await db
        .select({ userId: socialPosts.userId })
        .from(socialPosts)
        .where(eq(socialPosts.id, postId))
        .limit(1);
      
      if (post && post.userId !== req.user.id) {
        await db.insert(socialNotifications).values({
          userId: post.userId,
          actorId: req.user.id,
          type: 'like',
          entityType: 'post',
          entityId: postId,
          message: `liked your post`
        });
      }
      
      res.json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

// Add comment to post
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId, mentions } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    
    const [newComment] = await db.insert(postComments).values({
      postId,
      userId: req.user.id,
      parentCommentId: parentCommentId || null,
      content: content.trim(),
      mentions: mentions || []
    }).returning();
    
    // Increment comments count
    await db.update(socialPosts)
      .set({ 
        commentsCount: sql`${socialPosts.commentsCount} + 1`
      })
      .where(eq(socialPosts.id, postId));
    
    // Increment replies count if it's a reply
    if (parentCommentId) {
      await db.update(postComments)
        .set({ 
          repliesCount: sql`${postComments.repliesCount} + 1`
        })
        .where(eq(postComments.id, parentCommentId));
    }
    
    // Create notification
    const [post] = await db
      .select({ userId: socialPosts.userId })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);
    
    if (post && post.userId !== req.user.id) {
      await db.insert(socialNotifications).values({
        userId: post.userId,
        actorId: req.user.id,
        type: 'comment',
        entityType: 'post',
        entityId: postId,
        message: parentCommentId ? 'replied to your comment' : 'commented on your post'
      });
    }
    
    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// Get post comments
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const comments = await db
      .select({
        id: postComments.id,
        content: postComments.content,
        likesCount: postComments.likesCount,
        repliesCount: postComments.repliesCount,
        isEdited: postComments.isEdited,
        createdAt: postComments.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        }
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(and(
        eq(postComments.postId, postId),
        eq(postComments.parentCommentId, null),
        eq(postComments.isHidden, false)
      ))
      .orderBy(desc(postComments.createdAt))
      .limit(parseInt(limit))
      .offset(offset);
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: comments.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

// Share post
router.post('/posts/:postId/share', async (req, res) => {
  try {
    const { postId } = req.params;
    const { shareType, shareToUserId, shareMessage } = req.body;
    
    const [newShare] = await db.insert(postShares).values({
      postId,
      userId: req.user.id,
      shareType,
      shareToUserId,
      shareMessage
    }).returning();
    
    // Increment shares count
    await db.update(socialPosts)
      .set({ 
        sharesCount: sql`${socialPosts.sharesCount} + 1`
      })
      .where(eq(socialPosts.id, postId));
    
    res.json({
      success: true,
      data: newShare,
      message: 'Post shared successfully'
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ success: false, message: 'Failed to share post' });
  }
});

// Save/Unsave post
router.post('/posts/:postId/save', async (req, res) => {
  try {
    const { postId } = req.params;
    const { collectionName = 'Saved Posts' } = req.body;
    
    // Check if already saved
    const existingSave = await db
      .select()
      .from(postSaves)
      .where(and(
        eq(postSaves.postId, postId),
        eq(postSaves.userId, req.user.id)
      ))
      .limit(1);
    
    if (existingSave.length > 0) {
      // Unsave
      await db.delete(postSaves)
        .where(and(
          eq(postSaves.postId, postId),
          eq(postSaves.userId, req.user.id)
        ));
      
      res.json({ success: true, action: 'unsaved' });
    } else {
      // Save
      await db.insert(postSaves).values({
        postId,
        userId: req.user.id,
        collectionName
      });
      
      res.json({ success: true, action: 'saved' });
    }
  } catch (error) {
    console.error('Error toggling save:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle save' });
  }
});

// =============================================================================
// STORIES
// =============================================================================

// Get stories feed
router.get('/stories', async (req, res) => {
  try {
    const currentTime = new Date();
    
    // Get stories from followed users and own stories
    const following = await db
      .select({ followingId: socialFollows.followingId })
      .from(socialFollows)
      .where(eq(socialFollows.followerId, req.user.id));
    
    const followingIds = following.map(f => f.followingId);
    const userIds = [...followingIds, req.user.id];
    
    const stories = await db
      .select({
        id: socialStories.id,
        userId: socialStories.userId,
        mediaType: socialStories.mediaType,
        mediaUrl: socialStories.mediaUrl,
        thumbnailUrl: socialStories.thumbnailUrl,
        duration: socialStories.duration,
        backgroundColor: socialStories.backgroundColor,
        textOverlay: socialStories.textOverlay,
        viewsCount: socialStories.viewsCount,
        createdAt: socialStories.createdAt,
        expiresAt: socialStories.expiresAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        }
      })
      .from(socialStories)
      .leftJoin(users, eq(socialStories.userId, users.id))
      .where(and(
        inArray(socialStories.userId, userIds),
        eq(socialStories.isPublic, true),
        gte(socialStories.expiresAt, currentTime)
      ))
      .orderBy(desc(socialStories.createdAt));
    
    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[story.userId].stories.push(story);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: Object.values(groupedStories)
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stories' });
  }
});

// Create new story
router.post('/stories', upload.single('media'), async (req, res) => {
  try {
    const {
      duration = 5,
      backgroundColor = '#000000',
      textOverlay,
      textColor = '#FFFFFF',
      textPosition,
      stickers,
      filters,
      music,
      studyTip,
      isPublic = true
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Media file is required' });
    }
    
    const mediaUrl = path.relative(process.cwd(), req.file.path);
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    let thumbnailUrl = null;
    if (mediaType === 'video') {
      // Create video thumbnail (simplified)
      thumbnailUrl = mediaUrl;
    }
    
    // Stories expire after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const [newStory] = await db.insert(socialStories).values({
      userId: req.user.id,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      duration: parseInt(duration),
      backgroundColor,
      textOverlay,
      textColor,
      textPosition: textPosition ? JSON.parse(textPosition) : {},
      stickers: stickers ? JSON.parse(stickers) : [],
      filters: filters ? JSON.parse(filters) : {},
      music,
      studyTip,
      isPublic: isPublic === 'true',
      expiresAt
    }).returning();
    
    res.status(201).json({
      success: true,
      data: newStory,
      message: 'Story created successfully'
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ success: false, message: 'Failed to create story' });
  }
});

// View story
router.post('/stories/:storyId/view', async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Check if already viewed
    const existingView = await db
      .select()
      .from(storyViews)
      .where(and(
        eq(storyViews.storyId, storyId),
        eq(storyViews.viewerId, req.user.id)
      ))
      .limit(1);
    
    if (existingView.length === 0) {
      // Record view
      await db.insert(storyViews).values({
        storyId,
        viewerId: req.user.id
      });
      
      // Increment views count
      await db.update(socialStories)
        .set({ 
          viewsCount: sql`${socialStories.viewsCount} + 1`
        })
        .where(eq(socialStories.id, storyId));
    }
    
    res.json({ success: true, message: 'Story view recorded' });
  } catch (error) {
    console.error('Error recording story view:', error);
    res.status(500).json({ success: false, message: 'Failed to record story view' });
  }
});

// =============================================================================
// SOCIAL INTERACTIONS
// =============================================================================

// Follow/Unfollow user
router.post('/users/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }
    
    // Check if already following
    const existingFollow = await db
      .select()
      .from(socialFollows)
      .where(and(
        eq(socialFollows.followerId, req.user.id),
        eq(socialFollows.followingId, userId)
      ))
      .limit(1);
    
    if (existingFollow.length > 0) {
      // Unfollow
      await db.delete(socialFollows)
        .where(and(
          eq(socialFollows.followerId, req.user.id),
          eq(socialFollows.followingId, userId)
        ));
      
      res.json({ success: true, action: 'unfollowed' });
    } else {
      // Follow
      await db.insert(socialFollows).values({
        followerId: req.user.id,
        followingId: userId
      });
      
      // Create notification
      await db.insert(socialNotifications).values({
        userId: userId,
        actorId: req.user.id,
        type: 'follow',
        message: 'started following you'
      });
      
      res.json({ success: true, action: 'followed' });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle follow' });
  }
});

// Get user profile
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [userProfile] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        profilePicture: users.profilePicture,
        bio: users.bio,
        isVerified: users.isVerified,
        profile: {
          username: socialProfiles.username,
          displayName: socialProfiles.displayName,
          bio: socialProfiles.bio,
          website: socialProfiles.website,
          location: socialProfiles.location,
          pronouns: socialProfiles.pronouns,
          studyInterests: socialProfiles.studyInterests,
          achievements: socialProfiles.achievements,
          profileViews: socialProfiles.profileViews,
          isPrivate: socialProfiles.isPrivate,
          isVerified: socialProfiles.isVerified
        }
      })
      .from(users)
      .leftJoin(socialProfiles, eq(users.id, socialProfiles.userId))
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get follower/following counts
    const [followerCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(socialFollows)
      .where(eq(socialFollows.followingId, userId));
    
    const [followingCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(socialFollows)
      .where(eq(socialFollows.followerId, userId));
    
    // Get posts count
    const [postsCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(socialPosts)
      .where(and(
        eq(socialPosts.userId, userId),
        eq(socialPosts.isArchived, false)
      ));
    
    // Check if current user follows this user
    let isFollowing = false;
    if (req.user.id !== userId) {
      const [follow] = await db
        .select()
        .from(socialFollows)
        .where(and(
          eq(socialFollows.followerId, req.user.id),
          eq(socialFollows.followingId, userId)
        ))
        .limit(1);
      
      isFollowing = follow ? true : false;
    }
    
    res.json({
      success: true,
      data: {
        ...userProfile,
        stats: {
          followers: parseInt(followerCount.count),
          following: parseInt(followingCount.count),
          posts: parseInt(postsCount.count)
        },
        isFollowing
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
});

// Get user's posts
router.get('/users/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereCondition = and(
      eq(socialPosts.userId, userId),
      eq(socialPosts.isArchived, false)
    );
    
    // If viewing someone else's profile and their account is private
    if (req.user.id !== userId) {
      const [profile] = await db
        .select({ isPrivate: socialProfiles.isPrivate })
        .from(socialProfiles)
        .where(eq(socialProfiles.userId, userId))
        .limit(1);
      
      if (profile?.isPrivate) {
        // Check if following
        const [follow] = await db
          .select()
          .from(socialFollows)
          .where(and(
            eq(socialFollows.followerId, req.user.id),
            eq(socialFollows.followingId, userId)
          ))
          .limit(1);
        
        if (!follow) {
          return res.status(403).json({ success: false, message: 'This account is private' });
        }
      }
      
      whereCondition = and(whereCondition, eq(socialPosts.isPublic, true));
    }
    
    const posts = await db
      .select({
        id: socialPosts.id,
        mediaType: socialPosts.mediaType,
        mediaUrls: socialPosts.mediaUrls,
        thumbnailUrl: socialPosts.thumbnailUrl,
        likesCount: socialPosts.likesCount,
        commentsCount: socialPosts.commentsCount,
        createdAt: socialPosts.createdAt
      })
      .from(socialPosts)
      .where(whereCondition)
      .orderBy(desc(socialPosts.createdAt))
      .limit(parseInt(limit))
      .offset(offset);
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user posts' });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const notifications = await db
      .select({
        id: socialNotifications.id,
        type: socialNotifications.type,
        entityType: socialNotifications.entityType,
        entityId: socialNotifications.entityId,
        message: socialNotifications.message,
        isRead: socialNotifications.isRead,
        createdAt: socialNotifications.createdAt,
        actor: {
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        }
      })
      .from(socialNotifications)
      .leftJoin(users, eq(socialNotifications.actorId, users.id))
      .where(eq(socialNotifications.userId, req.user.id))
      .orderBy(desc(socialNotifications.createdAt))
      .limit(parseInt(limit))
      .offset(offset);
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark notifications as read
router.patch('/notifications/read', async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (notificationIds && notificationIds.length > 0) {
      await db.update(socialNotifications)
        .set({ isRead: true })
        .where(and(
          eq(socialNotifications.userId, req.user.id),
          inArray(socialNotifications.id, notificationIds)
        ));
    } else {
      // Mark all as read
      await db.update(socialNotifications)
        .set({ isRead: true })
        .where(eq(socialNotifications.userId, req.user.id));
    }
    
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

// Search users
router.get('/search/users', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    
    const users = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
        username: socialProfiles.username,
        bio: socialProfiles.bio
      })
      .from(users)
      .leftJoin(socialProfiles, eq(users.id, socialProfiles.userId))
      .where(or(
        sql`LOWER(${users.fullName}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${socialProfiles.username}) LIKE LOWER(${searchTerm})`
      ))
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

// Get trending hashtags
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trending = await db
      .select()
      .from(trendingHashtags)
      .orderBy(desc(trendingHashtags.trendScore))
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending hashtags' });
  }
});

export default router;