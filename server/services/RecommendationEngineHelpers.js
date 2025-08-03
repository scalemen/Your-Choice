import { db } from '../db/index.js';
import { videos, videoViews, userPreferences, subscriptions, videoLikes, channels } from '../db/video-platform-schema.js';
import { eq, and, desc, sql, inArray, gt, lt, gte, lte, isNull, ne, count, or } from 'drizzle-orm';

// Helper methods for the Recommendation Engine
export class RecommendationEngineHelpers {
  
  // Calculate session frequency from view history
  static calculateSessionFrequency(viewHistory) {
    if (!viewHistory.length) return 0;
    
    const sessions = [];
    let currentSession = null;
    const sessionThreshold = 30 * 60 * 1000; // 30 minutes
    
    viewHistory.forEach(view => {
      const viewTime = new Date(view.viewedAt).getTime();
      
      if (!currentSession || viewTime - currentSession.end > sessionThreshold) {
        currentSession = { start: viewTime, end: viewTime, views: 1 };
        sessions.push(currentSession);
      } else {
        currentSession.end = viewTime;
        currentSession.views++;
      }
    });
    
    const totalDays = (Date.now() - new Date(viewHistory[viewHistory.length - 1].viewedAt).getTime()) / (24 * 60 * 60 * 1000);
    return sessions.length / Math.max(totalDays, 1);
  }
  
  // Calculate engagement level based on user interactions
  static calculateEngagementLevel(viewHistory) {
    if (!viewHistory.length) return 'low';
    
    const totalViews = viewHistory.length;
    const likedVideos = viewHistory.filter(view => view.liked).length;
    const sharedVideos = viewHistory.filter(view => view.shared).length;
    const avgWatchPercentage = viewHistory.reduce((sum, view) => sum + view.watchPercentage, 0) / totalViews;
    
    const engagementScore = (
      (likedVideos / totalViews) * 0.3 +
      (sharedVideos / totalViews) * 0.4 +
      (avgWatchPercentage / 100) * 0.3
    );
    
    if (engagementScore > 0.7) return 'high';
    if (engagementScore > 0.4) return 'medium';
    return 'low';
  }
  
  // Normalize preference scores
  static normalizePreferences(preferences) {
    const total = Object.values(preferences).reduce((sum, value) => sum + value, 0);
    if (total === 0) return preferences;
    
    const normalized = {};
    for (const [key, value] of Object.entries(preferences)) {
      normalized[key] = value / total;
    }
    return normalized;
  }
  
  // Calculate preferred duration based on viewing patterns
  static calculatePreferredDuration(viewHistory) {
    if (!viewHistory.length) return 'medium';
    
    const durations = viewHistory.map(view => view.video.duration);
    const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    
    if (avgDuration < 300) return 'short'; // < 5 minutes
    if (avgDuration < 1200) return 'medium'; // 5-20 minutes
    return 'long'; // > 20 minutes
  }
  
  // Calculate diversity score of viewing history
  static calculateDiversityScore(viewHistory) {
    if (!viewHistory.length) return 0.5;
    
    const categories = new Set();
    const subjects = new Set();
    
    viewHistory.forEach(view => {
      if (view.video.category) categories.add(view.video.category);
      if (view.video.subject) subjects.add(view.video.subject);
    });
    
    const categoryDiversity = Math.min(categories.size / 8, 1); // Assume 8 total categories
    const subjectDiversity = Math.min(subjects.size / 20, 1); // Assume 20 total subjects
    
    return (categoryDiversity + subjectDiversity) / 2;
  }
  
  // Find similar users based on viewing patterns
  static async findSimilarUsers(userId, userContext, limit = 50) {
    try {
      // Get user's preferred categories and subjects
      const userCategories = Object.keys(userContext.behaviorProfile.categoryPreferences || {});
      const userSubjects = Object.keys(userContext.behaviorProfile.subjectPreferences || {});
      
      if (!userCategories.length && !userSubjects.length) return [];
      
      // Find users with similar viewing patterns
      const similarUsers = await db
        .select({
          userId: videoViews.userId,
          category: videos.category,
          subject: videos.subject,
          watchPercentage: videoViews.watchPercentage
        })
        .from(videoViews)
        .innerJoin(videos, eq(videoViews.videoId, videos.id))
        .where(
          and(
            ne(videoViews.userId, userId),
            or(
              userCategories.length ? inArray(videos.category, userCategories) : sql`false`,
              userSubjects.length ? inArray(videos.subject, userSubjects) : sql`false`
            )
          )
        )
        .limit(1000);
      
      // Calculate similarity scores
      const userSimilarities = new Map();
      
      similarUsers.forEach(view => {
        if (!userSimilarities.has(view.userId)) {
          userSimilarities.set(view.userId, { userId: view.userId, score: 0, commonViews: 0 });
        }
        
        const similarity = userSimilarities.get(view.userId);
        
        // Calculate similarity based on category/subject overlap and watch percentage
        let categoryMatch = userContext.behaviorProfile.categoryPreferences[view.category] || 0;
        let subjectMatch = userContext.behaviorProfile.subjectPreferences[view.subject] || 0;
        let watchMatch = Math.min(view.watchPercentage / 100, 1);
        
        similarity.score += (categoryMatch + subjectMatch + watchMatch) / 3;
        similarity.commonViews++;
      });
      
      // Filter and sort by similarity
      return Array.from(userSimilarities.values())
        .filter(sim => sim.commonViews >= 3) // At least 3 common interactions
        .map(sim => ({ ...sim, similarity: sim.score / sim.commonViews }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }
  
  // Build content profile from user context
  static buildContentProfile(userContext) {
    const profile = {
      preferredCategories: [],
      preferredSubjects: [],
      preferredDifficulty: userContext.preferences?.preferredDifficulty || 'intermediate',
      preferredDuration: userContext.behaviorProfile?.preferredDuration || 'medium'
    };
    
    // Extract top categories and subjects from behavior profile
    const categoryPrefs = userContext.behaviorProfile?.categoryPreferences || {};
    const subjectPrefs = userContext.behaviorProfile?.subjectPreferences || {};
    
    profile.preferredCategories = Object.entries(categoryPrefs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
    
    profile.preferredSubjects = Object.entries(subjectPrefs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subject]) => subject);
    
    // Fallback to user preferences if behavior profile is empty
    if (!profile.preferredCategories.length) {
      profile.preferredCategories = userContext.preferences?.preferredCategories || ['education'];
    }
    
    if (!profile.preferredSubjects.length) {
      profile.preferredSubjects = userContext.preferences?.preferredSubjects || [];
    }
    
    return profile;
  }
  
  // Generate content-based reason for recommendation
  static generateContentReason(video, userProfile) {
    const reasons = [];
    
    if (userProfile.preferredCategories.includes(video.category)) {
      reasons.push(`Popular in ${video.category}`);
    }
    
    if (userProfile.preferredSubjects.includes(video.subject)) {
      reasons.push(`Related to ${video.subject}`);
    }
    
    if (video.difficulty === userProfile.preferredDifficulty) {
      reasons.push(`Perfect for your ${video.difficulty} level`);
    }
    
    return reasons.length ? reasons[0] : 'Recommended for you';
  }
  
  // Get content match details
  static getContentMatchDetails(video, userProfile) {
    return {
      categoryMatch: userProfile.preferredCategories.includes(video.category),
      subjectMatch: userProfile.preferredSubjects.includes(video.subject),
      difficultyMatch: video.difficulty === userProfile.preferredDifficulty,
      durationMatch: this.isDurationMatch(video.duration, userProfile.preferredDuration)
    };
  }
  
  // Check if video duration matches user preference
  static isDurationMatch(videoDuration, preferredDuration) {
    const ranges = {
      short: [0, 300],
      medium: [300, 1200],
      long: [1200, Infinity]
    };
    
    const [min, max] = ranges[preferredDuration] || ranges.medium;
    return videoDuration >= min && videoDuration <= max;
  }
  
  // Calculate duration score
  static calculateDurationScore(videoDuration, preferredDuration) {
    if (this.isDurationMatch(videoDuration, preferredDuration)) {
      return 1.0;
    }
    
    // Partial score for close matches
    const ranges = {
      short: [0, 300],
      medium: [300, 1200],
      long: [1200, Infinity]
    };
    
    const [prefMin, prefMax] = ranges[preferredDuration] || ranges.medium;
    const prefCenter = (prefMin + Math.min(prefMax, 1800)) / 2; // Cap long videos at 30min for calculation
    const distance = Math.abs(videoDuration - prefCenter);
    const maxDistance = Math.max(prefCenter, 1800 - prefCenter);
    
    return Math.max(0, 1 - (distance / maxDistance));
  }
  
  // Calculate personal trending weight
  static calculatePersonalTrendingWeight(video, userContext) {
    let weight = 1.0;
    
    // Boost if category matches user preferences
    const categoryPrefs = userContext.behaviorProfile?.categoryPreferences || {};
    if (categoryPrefs[video.category]) {
      weight += categoryPrefs[video.category] * 0.5;
    }
    
    // Boost if from subscribed channels
    const subscribedChannels = userContext.subscriptions?.map(sub => sub.channelId) || [];
    if (subscribedChannels.includes(video.channelId)) {
      weight += 0.3;
    }
    
    return Math.min(weight, 2.0); // Cap at 2x
  }
  
  // Get next difficulty level for educational progression
  static getNextDifficultyLevel(currentLevel) {
    const progression = {
      'beginner': 'intermediate',
      'intermediate': 'advanced',
      'advanced': 'expert',
      'expert': 'expert' // Stay at expert level
    };
    
    return progression[currentLevel] || 'intermediate';
  }
  
  // Calculate CF (Collaborative Filtering) score
  static async calculateCFScore(candidate, userContext) {
    // Simplified CF score based on similar users' interactions
    const baseScore = candidate.score || 0.5;
    const similarityBoost = candidate.metadata?.similarity || 0;
    
    return Math.min(baseScore + (similarityBoost * 0.3), 1.0);
  }
  
  // Calculate CB (Content-Based) score
  static async calculateCBScore(candidate, userContext) {
    const userProfile = this.buildContentProfile(userContext);
    const videoDetails = await this.getVideoDetails(candidate.videoId);
    
    if (!videoDetails) return 0.5;
    
    let score = 0;
    
    // Category match
    if (userProfile.preferredCategories.includes(videoDetails.category)) {
      score += 0.3;
    }
    
    // Subject match
    if (userProfile.preferredSubjects.includes(videoDetails.subject)) {
      score += 0.3;
    }
    
    // Difficulty match
    if (videoDetails.difficulty === userProfile.preferredDifficulty) {
      score += 0.2;
    }
    
    // Duration match
    score += this.calculateDurationScore(videoDetails.duration, userProfile.preferredDuration) * 0.2;
    
    return Math.min(score, 1.0);
  }
  
  // Calculate DL (Deep Learning) score - simulated
  static async calculateDLScore(candidate, userContext) {
    // Simulated deep learning score - in production, this would call an ML model
    const baseScore = candidate.score || 0.5;
    const engagementWeight = userContext.behaviorProfile?.engagementLevel === 'high' ? 1.2 : 1.0;
    const diversityWeight = userContext.behaviorProfile?.diversityScore || 0.5;
    
    // Simulate complex feature interactions
    const complexityScore = (
      baseScore * 0.4 +
      engagementWeight * 0.3 +
      diversityWeight * 0.3
    );
    
    return Math.min(complexityScore, 1.0);
  }
  
  // Calculate trending boost
  static calculateTrendingBoost(candidate) {
    // Simple trending boost based on metadata
    const trendingScore = candidate.metadata?.trendingScore || 0;
    const trendingRank = candidate.metadata?.trendingRank || 100;
    
    // Higher boost for higher trending scores and better ranks
    return Math.min(trendingScore * 0.1 + (1 / Math.log(trendingRank + 1)) * 0.1, 0.2);
  }
  
  // Calculate freshness decay
  static calculateFreshnessDecay(candidate) {
    const videoDetails = candidate.videoDetails;
    if (!videoDetails?.publishedAt) return 1.0;
    
    const daysSincePublished = (Date.now() - new Date(videoDetails.publishedAt).getTime()) / (24 * 60 * 60 * 1000);
    
    // Exponential decay - newer videos get higher scores
    return Math.exp(-daysSincePublished / 30); // 30-day half-life
  }
  
  // Calculate personalization multiplier
  static calculatePersonalizationMultiplier(candidate, userContext) {
    if (!userContext.preferences?.personalizationEnabled) {
      return 1.0; // No personalization
    }
    
    let multiplier = 1.0;
    
    // Boost based on user engagement patterns
    const engagementLevel = userContext.behaviorProfile?.engagementLevel;
    if (engagementLevel === 'high') {
      multiplier += 0.2;
    } else if (engagementLevel === 'low') {
      multiplier -= 0.1;
    }
    
    // Adjust based on algorithm performance for this user
    if (candidate.algorithm === 'collaborative_filtering' && userContext.behaviorProfile?.avgWatchPercentage > 70) {
      multiplier += 0.1;
    }
    
    return Math.max(multiplier, 0.5); // Minimum 0.5x multiplier
  }
  
  // Get diversity configuration based on treatment group
  static getDiversityConfig(treatmentGroup) {
    const baseConfig = {
      maxRecommendations: 20,
      maxPerCategory: 4,
      maxPerChannel: 2,
      diversityWeight: 0.3
    };
    
    switch (treatmentGroup) {
      case 'variant_a':
        return { ...baseConfig, diversityWeight: 0.5, maxPerCategory: 3 };
      case 'variant_b':
        return { ...baseConfig, diversityWeight: 0.2, maxPerChannel: 3 };
      case 'variant_c':
        return { ...baseConfig, diversityWeight: 0.4, maxRecommendations: 25 };
      default:
        return baseConfig;
    }
  }
  
  // Check category diversity
  static checkCategoryDiversity(category, usedCategories, diversityConfig) {
    const categoryCount = Array.from(usedCategories).filter(c => c === category).length;
    return categoryCount < diversityConfig.maxPerCategory;
  }
  
  // Check channel diversity
  static checkChannelDiversity(channelId, usedChannels, diversityConfig) {
    const channelCount = Array.from(usedChannels).filter(c => c === channelId).length;
    return channelCount < diversityConfig.maxPerChannel;
  }
  
  // Calculate diversity boost
  static calculateDiversityBoost(videoDetails, usedCategories, usedChannels) {
    let boost = 0;
    
    // Boost for new categories
    if (!usedCategories.has(videoDetails.category)) {
      boost += 0.2;
    }
    
    // Boost for new channels
    if (!usedChannels.has(videoDetails.channelId)) {
      boost += 0.1;
    }
    
    return boost;
  }
  
  // Get video details for scoring
  static async getVideoDetails(videoId) {
    try {
      const video = await db
        .select({
          id: videos.id,
          title: videos.title,
          category: videos.category,
          subject: videos.subject,
          difficulty: videos.difficulty,
          duration: videos.duration,
          channelId: videos.channelId,
          publishedAt: videos.publishedAt,
          isAgeRestricted: videos.isAgeRestricted,
          minimumAge: videos.minimumAge,
          contentRating: videos.contentRating
        })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);
      
      return video[0] || null;
    } catch (error) {
      console.error('Error getting video details:', error);
      return null;
    }
  }
  
  // Get allowed content ratings for user
  static getAllowedContentRatings(userContext) {
    const userAge = userContext.preferences?.age || 18;
    
    const ratings = ['G']; // General audience
    
    if (userAge >= 10) ratings.push('PG');
    if (userAge >= 13) ratings.push('PG-13');
    if (userAge >= 17) ratings.push('R');
    if (userAge >= 18) ratings.push('NC-17');
    
    return ratings;
  }
  
  // Analyze performance for model weight updates
  static analyzePerformance(performanceData) {
    const improvements = {};
    
    // Calculate improvement metrics for each model type
    for (const [modelType, data] of Object.entries(performanceData)) {
      const { clickThroughRate, watchTime, userSatisfaction } = data;
      
      // Weighted score based on multiple metrics
      const performanceScore = (
        clickThroughRate * 0.4 +
        watchTime * 0.4 +
        userSatisfaction * 0.2
      );
      
      // Compare to baseline (simplified)
      const baseline = 0.1; // 10% baseline performance
      improvements[modelType] = (performanceScore - baseline) / baseline;
    }
    
    return improvements;
  }
  
  // Similar user recommendations
  static async similarUserRecommendations(userId, userContext) {
    const similarUsers = await this.findSimilarUsers(userId, userContext, 10);
    const candidates = [];
    
    for (const similarUser of similarUsers) {
      const recentViews = await db
        .select({
          videoId: videoViews.videoId,
          watchPercentage: videoViews.watchPercentage,
          viewedAt: videoViews.viewedAt
        })
        .from(videoViews)
        .where(eq(videoViews.userId, similarUser.userId))
        .orderBy(desc(videoViews.viewedAt))
        .limit(20);
      
      for (const view of recentViews) {
        if (!this.hasUserWatched(view.videoId, userContext.viewHistory)) {
          candidates.push({
            videoId: view.videoId,
            score: (view.watchPercentage / 100) * similarUser.similarity,
            algorithm: 'similar_users',
            reason: 'Users like you watched this',
            metadata: { 
              similarUserId: similarUser.userId, 
              similarity: similarUser.similarity,
              watchPercentage: view.watchPercentage 
            }
          });
        }
      }
    }
    
    return candidates.sort((a, b) => b.score - a.score).slice(0, 30);
  }
  
  // Diversity boost recommendations
  static async diversityBoostRecommendations(userId, userContext) {
    const viewedCategories = new Set(
      userContext.viewHistory.map(view => view.video.category).filter(Boolean)
    );
    
    // Find videos from categories user hasn't explored much
    const allCategories = ['education', 'technology', 'science', 'entertainment', 'music', 'gaming', 'sports', 'news'];
    const unexploredCategories = allCategories.filter(cat => !viewedCategories.has(cat));
    
    if (!unexploredCategories.length) return [];
    
    const diversityVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        category: videos.category,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate
      })
      .from(videos)
      .where(
        and(
          inArray(videos.category, unexploredCategories),
          eq(videos.visibility, 'public'),
          eq(videos.isDeleted, false)
        )
      )
      .orderBy(desc(videos.engagementRate))
      .limit(50);
    
    return diversityVideos.map(video => ({
      videoId: video.id,
      score: 0.6 + (video.engagementRate * 0.4), // Base diversity score + engagement
      algorithm: 'diversity_boost',
      reason: `Explore ${video.category}`,
      metadata: { 
        category: video.category, 
        diversityType: 'category_exploration',
        engagementRate: video.engagementRate 
      }
    }));
  }
  
  // Check if user has watched a video
  static hasUserWatched(videoId, viewHistory) {
    return viewHistory.some(view => view.videoId === videoId);
  }
  
  // Calculate subscription score
  static calculateSubscriptionScore(video, userContext) {
    const baseScore = 0.8; // High base score for subscribed content
    const recencyBoost = this.calculateRecency(video.publishedAt);
    const engagementBoost = video.engagementRate || 0;
    
    return Math.min(baseScore + recencyBoost * 0.2 + engagementBoost * 0.2, 1.0);
  }
  
  // Calculate recency score
  static calculateRecency(timestamp) {
    const hoursSince = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
    return Math.exp(-hoursSince / 24); // Exponential decay over 24 hours
  }
}

export default RecommendationEngineHelpers;