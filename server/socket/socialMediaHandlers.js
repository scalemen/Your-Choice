import { db } from '../db/index.js';
import { 
  socialPosts, 
  socialStories,
  postLikes, 
  postComments, 
  socialNotifications,
  socialFollows,
  storyViews
} from '../db/social-media-schema.js';
import { users } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export const setupSocialMediaHandlers = (io, socket) => {
  // Join user to their own room for notifications
  socket.on('join-social-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined social room`);
  });

  // Real-time post likes
  socket.on('like-post', async (data) => {
    try {
      const { postId, userId, likeType = 'like' } = data;
      
      // Check if already liked
      const existingLike = await db
        .select()
        .from(postLikes)
        .where(and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        ))
        .limit(1);

      let action;
      let newLikesCount;

      if (existingLike.length > 0) {
        // Unlike
        await db.delete(postLikes)
          .where(and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId)
          ));

        // Decrement likes count
        const [updatedPost] = await db.update(socialPosts)
          .set({ 
            likesCount: sql`${socialPosts.likesCount} - 1`
          })
          .where(eq(socialPosts.id, postId))
          .returning({ likesCount: socialPosts.likesCount, userId: socialPosts.userId });

        action = 'unliked';
        newLikesCount = updatedPost.likesCount;
      } else {
        // Like
        await db.insert(postLikes).values({
          postId,
          userId,
          likeType
        });

        // Increment likes count
        const [updatedPost] = await db.update(socialPosts)
          .set({ 
            likesCount: sql`${socialPosts.likesCount} + 1`
          })
          .where(eq(socialPosts.id, postId))
          .returning({ likesCount: socialPosts.likesCount, userId: socialPosts.userId });

        action = 'liked';
        newLikesCount = updatedPost.likesCount;

        // Create notification for post owner (if not self-like)
        if (updatedPost.userId !== userId) {
          const [notification] = await db.insert(socialNotifications).values({
            userId: updatedPost.userId,
            actorId: userId,
            type: 'like',
            entityType: 'post',
            entityId: postId,
            message: `liked your post`
          }).returning();

          // Send real-time notification
          io.to(`user:${updatedPost.userId}`).emit('new-notification', {
            ...notification,
            type: 'social'
          });
        }
      }

      // Broadcast like update to all viewers of this post
      io.emit('post-like-update', {
        postId,
        likesCount: newLikesCount,
        action,
        userId
      });

      // Confirm to sender
      socket.emit('like-post-response', {
        success: true,
        action,
        likesCount: newLikesCount
      });

    } catch (error) {
      console.error('Error handling like-post:', error);
      socket.emit('like-post-response', {
        success: false,
        error: 'Failed to like post'
      });
    }
  });

  // Real-time comments
  socket.on('add-comment', async (data) => {
    try {
      const { postId, userId, content, parentCommentId } = data;

      if (!content || content.trim().length === 0) {
        socket.emit('add-comment-response', {
          success: false,
          error: 'Comment content is required'
        });
        return;
      }

      // Add comment to database
      const [newComment] = await db.insert(postComments).values({
        postId,
        userId,
        parentCommentId: parentCommentId || null,
        content: content.trim()
      }).returning();

      // Increment comments count
      const [updatedPost] = await db.update(socialPosts)
        .set({ 
          commentsCount: sql`${socialPosts.commentsCount} + 1`
        })
        .where(eq(socialPosts.id, postId))
        .returning({ commentsCount: socialPosts.commentsCount, userId: socialPosts.userId });

      // If it's a reply, increment replies count
      if (parentCommentId) {
        await db.update(postComments)
          .set({ 
            repliesCount: sql`${postComments.repliesCount} + 1`
          })
          .where(eq(postComments.id, parentCommentId));
      }

      // Get user info for the comment
      const [userInfo] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture,
          isVerified: users.isVerified
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const commentWithUser = {
        ...newComment,
        user: userInfo
      };

      // Create notification for post owner (if not own comment)
      if (updatedPost.userId !== userId) {
        const [notification] = await db.insert(socialNotifications).values({
          userId: updatedPost.userId,
          actorId: userId,
          type: 'comment',
          entityType: 'post',
          entityId: postId,
          message: parentCommentId ? 'replied to your comment' : 'commented on your post'
        }).returning();

        // Send real-time notification
        io.to(`user:${updatedPost.userId}`).emit('new-notification', {
          ...notification,
          type: 'social'
        });
      }

      // Broadcast new comment to all viewers of this post
      io.emit('new-comment', {
        postId,
        comment: commentWithUser,
        commentsCount: updatedPost.commentsCount
      });

      // Confirm to sender
      socket.emit('add-comment-response', {
        success: true,
        comment: commentWithUser,
        commentsCount: updatedPost.commentsCount
      });

    } catch (error) {
      console.error('Error handling add-comment:', error);
      socket.emit('add-comment-response', {
        success: false,
        error: 'Failed to add comment'
      });
    }
  });

  // Real-time story views
  socket.on('view-story', async (data) => {
    try {
      const { storyId, viewerId } = data;

      // Check if already viewed
      const existingView = await db
        .select()
        .from(storyViews)
        .where(and(
          eq(storyViews.storyId, storyId),
          eq(storyViews.viewerId, viewerId)
        ))
        .limit(1);

      if (existingView.length === 0) {
        // Record view
        await db.insert(storyViews).values({
          storyId,
          viewerId
        });

        // Increment views count
        const [updatedStory] = await db.update(socialStories)
          .set({ 
            viewsCount: sql`${socialStories.viewsCount} + 1`
          })
          .where(eq(socialStories.id, storyId))
          .returning({ viewsCount: socialStories.viewsCount, userId: socialStories.userId });

        // Notify story owner of new view (except self-views)
        if (updatedStory.userId !== viewerId) {
          io.to(`user:${updatedStory.userId}`).emit('story-view', {
            storyId,
            viewerId,
            viewsCount: updatedStory.viewsCount
          });
        }

        // Broadcast updated view count
        io.emit('story-view-update', {
          storyId,
          viewsCount: updatedStory.viewsCount
        });
      }

      socket.emit('view-story-response', { success: true });

    } catch (error) {
      console.error('Error handling view-story:', error);
      socket.emit('view-story-response', {
        success: false,
        error: 'Failed to record story view'
      });
    }
  });

  // Real-time follow/unfollow
  socket.on('toggle-follow', async (data) => {
    try {
      const { followerId, followingId } = data;

      if (followerId === followingId) {
        socket.emit('toggle-follow-response', {
          success: false,
          error: 'Cannot follow yourself'
        });
        return;
      }

      // Check if already following
      const existingFollow = await db
        .select()
        .from(socialFollows)
        .where(and(
          eq(socialFollows.followerId, followerId),
          eq(socialFollows.followingId, followingId)
        ))
        .limit(1);

      let action;

      if (existingFollow.length > 0) {
        // Unfollow
        await db.delete(socialFollows)
          .where(and(
            eq(socialFollows.followerId, followerId),
            eq(socialFollows.followingId, followingId)
          ));

        action = 'unfollowed';
      } else {
        // Follow
        await db.insert(socialFollows).values({
          followerId,
          followingId
        });

        // Create notification
        const [notification] = await db.insert(socialNotifications).values({
          userId: followingId,
          actorId: followerId,
          type: 'follow',
          message: 'started following you'
        }).returning();

        // Send real-time notification
        io.to(`user:${followingId}`).emit('new-notification', {
          ...notification,
          type: 'social'
        });

        action = 'followed';
      }

      // Notify the user being followed/unfollowed
      io.to(`user:${followingId}`).emit('follow-update', {
        followerId,
        action
      });

      // Confirm to sender
      socket.emit('toggle-follow-response', {
        success: true,
        action
      });

    } catch (error) {
      console.error('Error handling toggle-follow:', error);
      socket.emit('toggle-follow-response', {
        success: false,
        error: 'Failed to toggle follow'
      });
    }
  });

  // Real-time typing indicator for comments
  socket.on('comment-typing', (data) => {
    const { postId, userId, isTyping } = data;
    
    // Broadcast typing status to other users viewing this post
    socket.broadcast.emit('user-typing-comment', {
      postId,
      userId,
      isTyping
    });
  });

  // Real-time presence for story viewing
  socket.on('story-presence', (data) => {
    const { storyId, userId, action } = data; // action: 'enter' or 'leave'
    
    if (action === 'enter') {
      socket.join(`story:${storyId}`);
    } else {
      socket.leave(`story:${storyId}`);
    }

    // Notify story owner of viewer presence
    socket.to(`story:${storyId}`).emit('story-viewer-presence', {
      userId,
      action
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected from social media');
  });
};

// Utility function to get followers for broadcasting
export const getFollowers = async (userId) => {
  try {
    const followers = await db
      .select({ followerId: socialFollows.followerId })
      .from(socialFollows)
      .where(eq(socialFollows.followingId, userId));
    
    return followers.map(f => f.followerId);
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
};

// Utility function to broadcast to user's followers
export const broadcastToFollowers = async (io, userId, event, data) => {
  try {
    const followers = await getFollowers(userId);
    
    followers.forEach(followerId => {
      io.to(`user:${followerId}`).emit(event, data);
    });
  } catch (error) {
    console.error('Error broadcasting to followers:', error);
  }
};