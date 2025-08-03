import { db } from '../db/index.js';
import { videos, videoViews, userPreferences, subscriptions, videoLikes, channels } from '../db/video-platform-schema.js';
import { eq, and, desc, sql, inArray, gt, lt, gte, lte, isNull, ne, count, or } from 'drizzle-orm';

/**
 * Helper methods for the Recommendation Engine
 * Contains utility functions for various calculations and operations
 */
export class RecommendationEngineHelpers {
  
  /**
   * Calculate session frequency from viewing history
   */
  static calculateSessionFrequency(viewHistory) {
    if (!viewHistory.length) return 0;

    const dates = viewHistory.map(view => view.viewedAt.toDateString());
    const uniqueDates = new Set(dates);
    const totalDays = Math.max(1, (Date.now() - new Date(viewHistory[viewHistory.length - 1].viewedAt)) / (1000 * 60 * 60 * 24));
    
    return uniqueDates.size / totalDays;
  }

  /**
   * Calculate engagement level from viewing behavior
   */
  static calculateEngagementLevel(viewHistory) {
    if (!viewHistory.length) return 'low';

    const avgWatchPercentage = viewHistory.reduce((sum, view) => sum + view.watchPercentage, 0) / viewHistory.length;
    const completionRate = viewHistory.filter(view => view.completed).length / viewHistory.length;

    if (avgWatchPercentage > 75 && completionRate > 0.6) return 'high';
    if (avgWatchPercentage > 50 && completionRate > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Normalize preference scores to percentages
   */
  static normalizePreferences(preferences) {
    const total = Object.values(preferences).reduce((sum, val) => sum + val, 0);
    if (total === 0) return {};

    const normalized = {};
    for (const [key, value] of Object.entries(preferences)) {
      normalized[key] = value / total;
    }
    return normalized;
  }

  /**
   * Calculate preferred video duration from viewing history
   */
  static calculatePreferredDuration(viewHistory) {
    if (!viewHistory.length) return 600; // Default 10 minutes

    const durations = viewHistory
      .filter(view => view.video.duration && view.watchPercentage > 50)
      .map(view => view.video.duration);

    if (!durations.length) return 600;

    // Calculate median duration
    durations.sort((a, b) => a - b);
    const mid = Math.floor(durations.length / 2);
    return durations.length % 2 === 0 
      ? (durations[mid - 1] + durations[mid]) / 2 
      : durations[mid];
  }

  /**
   * Calculate content diversity score
   */
  static calculateDiversityScore(viewHistory) {
    if (!viewHistory.length) return 0.5;

    const categories = new Set(viewHistory.map(view => view.video.category).filter(Boolean));
    const subjects = new Set(viewHistory.map(view => view.video.subject).filter(Boolean));
    
    const categoryDiversity = Math.min(categories.size / 10, 1); // Normalize to max 10 categories
    const subjectDiversity = Math.min(subjects.size / 15, 1); // Normalize to max 15 subjects
    
    return (categoryDiversity + subjectDiversity) / 2;
  }

  /**
   * Find users with similar viewing patterns
   */
  static async findSimilarUsers(userId, userContext, limit = 50) {
    try {
      const userCategories = Object.keys(userContext.behaviorProfile.categoryPreferences);
      const userSubjects = Object.keys(userContext.behaviorProfile.subjectPreferences);

      if (!userCategories.length && !userSubjects.length) {
        return [];
      }

      // Find users who watched videos in similar categories/subjects
      const similarUsers = await db.select({
        userId: videoViews.userId,
        watchTime: sql`SUM(${videoViews.watchTime})`.as('totalWatchTime'),
        avgWatchPercentage: sql`AVG(${videoViews.watchPercentage})`.as('avgWatchPercentage'),
        viewCount: sql`COUNT(*)`.as('viewCount')
      })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .where(and(
        ne(videoViews.userId, userId),
        or(
          inArray(videos.category, userCategories),
          inArray(videos.subject, userSubjects)
        )
      ))
      .groupBy(videoViews.userId)
      .having(sql`COUNT(*) >= 5`) // At least 5 videos watched
      .orderBy(desc(sql`AVG(${videoViews.watchPercentage})`))
      .limit(limit);

      // Calculate similarity scores
      return similarUsers.map(user => ({
        userId: user.userId,
        similarity: this.calculateUserSimilarity(userContext.behaviorProfile, {
          avgWatchPercentage: parseFloat(user.avgWatchPercentage),
          totalWatchTime: parseInt(user.totalWatchTime),
          viewCount: parseInt(user.viewCount)
        }),
        totalWatchTime: parseInt(user.totalWatchTime),
        avgWatchPercentage: parseFloat(user.avgWatchPercentage)
      }));

    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two user behavior profiles
   */
  static calculateUserSimilarity(profile1, profile2) {
    // Simple similarity calculation based on watch behavior
    const watchPercentageSimilarity = 1 - Math.abs(profile1.avgWatchPercentage - profile2.avgWatchPercentage) / 100;
    const engagementSimilarity = profile1.engagementLevel === this.getEngagementLevel(profile2.avgWatchPercentage) ? 1 : 0.5;
    
    return (watchPercentageSimilarity * 0.6 + engagementSimilarity * 0.4);
  }

  /**
   * Get engagement level from average watch percentage
   */
  static getEngagementLevel(avgWatchPercentage) {
    if (avgWatchPercentage > 75) return 'high';
    if (avgWatchPercentage > 50) return 'medium';
    return 'low';
  }

  /**
   * Build content profile from user context
   */
  static buildContentProfile(userContext) {
    const { behaviorProfile, preferences, viewHistory } = userContext;

    // Extract preferred content from behavior and explicit preferences
    const preferredSubjects = [
      ...Object.keys(behaviorProfile.subjectPreferences || {}),
      ...(preferences.preferredSubjects || [])
    ];

    const preferredCategories = [
      ...Object.keys(behaviorProfile.categoryPreferences || {}),
      ...(preferences.preferredCategories || [])
    ];

    const preferredDifficulty = preferences.preferredDifficulty || 
      Object.keys(behaviorProfile.difficultyPreferences || {})[0] || 'intermediate';

    return {
      preferredSubjects: [...new Set(preferredSubjects)],
      preferredCategories: [...new Set(preferredCategories)],
      preferredDifficulty,
      preferredDuration: behaviorProfile.preferredDuration || preferences.preferredDuration || 600,
      engagementLevel: behaviorProfile.engagementLevel || 'medium'
    };
  }

  /**
   * Generate human-readable reason for content recommendation
   */
  static generateContentReason(video, userProfile) {
    const reasons = [];

    if (userProfile.preferredSubjects.includes(video.subject)) {
      reasons.push(`matches your interest in ${video.subject}`);
    }
    
    if (userProfile.preferredCategories.includes(video.category)) {
      reasons.push(`you enjoy ${video.category} content`);
    }
    
    if (userProfile.preferredDifficulty === video.difficulty) {
      reasons.push(`${video.difficulty} level content suits you`);
    }

    if (this.isDurationMatch(video.duration, userProfile.preferredDuration)) {
      reasons.push('perfect length for you');
    }

    return reasons.length > 0 
      ? `Recommended because ${reasons.join(', ')}`
      : 'Based on your viewing preferences';
  }

  /**
   * Get detailed content match information
   */
  static getContentMatchDetails(video, userProfile) {
    return {
      subjectMatch: userProfile.preferredSubjects.includes(video.subject),
      categoryMatch: userProfile.preferredCategories.includes(video.category),
      difficultyMatch: userProfile.preferredDifficulty === video.difficulty,
      durationMatch: this.isDurationMatch(video.duration, userProfile.preferredDuration),
      durationScore: this.calculateDurationScore(video.duration, userProfile.preferredDuration)
    };
  }

  /**
   * Check if video duration matches user preference
   */
  static isDurationMatch(videoDuration, preferredDuration) {
    if (!videoDuration || !preferredDuration) return false;
    
    const tolerance = 0.3; // 30% tolerance
    const minDuration = preferredDuration * (1 - tolerance);
    const maxDuration = preferredDuration * (1 + tolerance);
    
    return videoDuration >= minDuration && videoDuration <= maxDuration;
  }

  /**
   * Calculate duration preference score
   */
  static calculateDurationScore(videoDuration, preferredDuration) {
    if (!videoDuration || !preferredDuration) return 0.5;

    const ratio = Math.min(videoDuration, preferredDuration) / Math.max(videoDuration, preferredDuration);
    return ratio;
  }

  /**
   * Calculate personal trending weight based on user preferences
   */
  static calculatePersonalTrendingWeight(video, userContext) {
    let weight = 1.0;

    // Boost if matches user's preferred subjects/categories
    if (userContext.behaviorProfile.subjectPreferences[video.subject]) {
      weight += userContext.behaviorProfile.subjectPreferences[video.subject];
    }

    if (userContext.behaviorProfile.categoryPreferences[video.category]) {
      weight += userContext.behaviorProfile.categoryPreferences[video.category];
    }

    return Math.min(weight, 2.0); // Cap at 2x
  }

  /**
   * Get next difficulty level for learning progression
   */
  static getNextDifficultyLevel(currentLevel) {
    const progression = {
      'beginner': 'intermediate',
      'intermediate': 'advanced',
      'advanced': 'expert',
      'expert': 'expert' // Stay at expert
    };
    
    return progression[currentLevel] || 'intermediate';
  }

  /**
   * Calculate collaborative filtering score for a candidate
   */
  static async calculateCFScore(candidate, userContext) {
    try {
      // Simplified CF score based on similar users' behavior
      const baseScore = candidate.score || 0.5;
      const userEngagement = userContext.behaviorProfile.avgWatchPercentage / 100;
      
      return baseScore * (0.5 + userEngagement * 0.5);
    } catch (error) {
      return candidate.score || 0.5;
    }
  }

  /**
   * Calculate content-based score for a candidate
   */
  static async calculateCBScore(candidate, userContext) {
    try {
      const videoDetails = await this.getVideoDetails(candidate.videoId);
      if (!videoDetails) return candidate.score || 0.5;

      const userProfile = this.buildContentProfile(userContext);
      let score = 0;

      // Subject match
      if (userProfile.preferredSubjects.includes(videoDetails.subject)) {
        score += 0.4;
      }

      // Category match
      if (userProfile.preferredCategories.includes(videoDetails.category)) {
        score += 0.3;
      }

      // Difficulty match
      if (userProfile.preferredDifficulty === videoDetails.difficulty) {
        score += 0.3;
      }

      return Math.max(score, candidate.score || 0.5);
    } catch (error) {
      return candidate.score || 0.5;
    }
  }

  /**
   * Calculate deep learning score (simulated)
   */
  static async calculateDLScore(candidate, userContext) {
    try {
      // Simulated deep learning score
      const baseScore = candidate.score || 0.5;
      const engagementBoost = userContext.behaviorProfile.engagementLevel === 'high' ? 0.2 : 0;
      const diversityBoost = userContext.behaviorProfile.diversityScore * 0.1;
      
      return Math.min(baseScore + engagementBoost + diversityBoost, 1.0);
    } catch (error) {
      return candidate.score || 0.5;
    }
  }

  /**
   * Calculate trending boost for a candidate
   */
  static calculateTrendingBoost(candidate) {
    if (candidate.algorithm === 'trending') {
      return 0.1; // 10% boost for trending content
    }
    return 0;
  }

  /**
   * Calculate freshness decay based on content age
   */
  static calculateFreshnessDecay(candidate) {
    if (!candidate.metadata?.publishedAt) return 1.0;

    const ageInDays = (Date.now() - new Date(candidate.metadata.publishedAt)) / (1000 * 60 * 60 * 24);
    
    // Exponential decay over 30 days
    return Math.exp(-ageInDays / 30);
  }

  /**
   * Calculate personalization multiplier
   */
  static calculatePersonalizationMultiplier(candidate, userContext) {
    let multiplier = 1.0;

    // Boost for high engagement users
    if (userContext.behaviorProfile.engagementLevel === 'high') {
      multiplier += 0.1;
    }

    // Boost for algorithm alignment
    if (candidate.algorithm === 'educational_path' && userContext.preferences.learningGoals?.length > 0) {
      multiplier += 0.15;
    }

    return multiplier;
  }

  /**
   * Get diversity configuration for different treatment groups
   */
  static getDiversityConfig(treatmentGroup) {
    const configs = {
      control: {
        maxRecommendations: 20,
        maxPerCategory: 5,
        maxPerChannel: 3
      },
      variant_a: {
        maxRecommendations: 20,
        maxPerCategory: 4,
        maxPerChannel: 2
      },
      variant_b: {
        maxRecommendations: 25,
        maxPerCategory: 6,
        maxPerChannel: 4
      },
      variant_c: {
        maxRecommendations: 20,
        maxPerCategory: 3,
        maxPerChannel: 2
      }
    };

    return configs[treatmentGroup] || configs.control;
  }

  /**
   * Check category diversity constraints
   */
  static checkCategoryDiversity(category, usedCategories, diversityConfig) {
    if (!category) return true;
    
    const categoryCount = Array.from(usedCategories).filter(cat => cat === category).length;
    return categoryCount < diversityConfig.maxPerCategory;
  }

  /**
   * Check channel diversity constraints
   */
  static checkChannelDiversity(channelId, usedChannels, diversityConfig) {
    if (!channelId) return true;
    
    const channelCount = Array.from(usedChannels).filter(ch => ch === channelId).length;
    return channelCount < diversityConfig.maxPerChannel;
  }

  /**
   * Calculate diversity boost for underrepresented content
   */
  static calculateDiversityBoost(videoDetails, usedCategories, usedChannels) {
    let boost = 0;

    // Boost for categories not yet represented
    if (!usedCategories.has(videoDetails.category)) {
      boost += 0.1;
    }

    // Boost for channels not yet represented
    if (!usedChannels.has(videoDetails.channelId)) {
      boost += 0.05;
    }

    return boost;
  }

  /**
   * Get video details for recommendations
   */
  static async getVideoDetails(videoId) {
    try {
      const result = await db.select({
        id: videos.id,
        title: videos.title,
        channelId: videos.channelId,
        category: videos.category,
        subject: videos.subject,
        difficulty: videos.difficulty,
        duration: videos.duration,
        isAgeRestricted: videos.isAgeRestricted,
        minimumAge: videos.minimumAge,
        contentRating: videos.contentRating,
        publishedAt: videos.publishedAt,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate
      })
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error getting video details:', error);
      return null;
    }
  }

  /**
   * Get allowed content ratings for user
   */
  static getAllowedContentRatings(userContext) {
    const age = userContext.preferences?.age || 18;
    const restrictedMode = userContext.preferences?.restrictedMode || false;

    if (restrictedMode) {
      return ['general'];
    }

    if (age < 13) {
      return ['general'];
    } else if (age < 18) {
      return ['general', 'teen'];
    } else {
      return ['general', 'teen', 'mature'];
    }
  }

  /**
   * Analyze performance data for model optimization
   */
  static analyzePerformance(performanceData) {
    const improvements = {};
    
    // Calculate improvement metrics for each algorithm
    for (const [algorithm, data] of Object.entries(performanceData)) {
      const clickRate = data.clicks / data.impressions;
      const engagementRate = data.engagements / data.clicks;
      
      // Calculate improvement based on performance metrics
      const improvement = (clickRate * 0.6 + engagementRate * 0.4) - 0.5; // Baseline 0.5
      improvements[algorithm] = improvement;
    }

    return improvements;
  }

  /**
   * Get recommendations for users similar to the target user
   */
  static async similarUserRecommendations(userId, userContext) {
    try {
      const similarUsers = await this.findSimilarUsers(userId, userContext, 10);
      const candidates = [];

      for (const similarUser of similarUsers) {
        // Get recent popular videos watched by similar users
        const popularVideos = await db.select({
          videoId: videoViews.videoId,
          watchTime: videoViews.watchTime,
          watchPercentage: videoViews.watchPercentage
        })
        .from(videoViews)
        .where(and(
          eq(videoViews.userId, similarUser.userId),
          gte(videoViews.watchPercentage, 70)
        ))
        .orderBy(desc(videoViews.viewedAt))
        .limit(10);

        popularVideos.forEach(video => {
          if (!this.hasUserWatched(video.videoId, userContext.viewHistory)) {
            candidates.push({
              videoId: video.videoId,
              score: (video.watchPercentage / 100) * similarUser.similarity,
              algorithm: 'similar_users',
              reason: 'Users like you watched this',
              metadata: {
                similarUserId: similarUser.userId,
                similarity: similarUser.similarity
              }
            });
          }
        });
      }

      return candidates.sort((a, b) => b.score - a.score).slice(0, 30);
    } catch (error) {
      console.error('Error in similar user recommendations:', error);
      return [];
    }
  }

  /**
   * Get diversity boost recommendations
   */
  static async diversityBoostRecommendations(userId, userContext) {
    try {
      const watchedCategories = new Set(
        userContext.viewHistory.map(view => view.video.category).filter(Boolean)
      );

      // Find videos in categories user hasn't explored much
      const diverseVideos = await db.select({
        id: videos.id,
        category: videos.category,
        subject: videos.subject,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate
      })
      .from(videos)
      .where(and(
        eq(videos.status, 'active'),
        eq(videos.visibility, 'public'),
        gte(videos.engagementRate, 0.05) // Minimum engagement threshold
      ))
      .orderBy(desc(videos.engagementRate))
      .limit(100);

      const candidates = [];
      
      diverseVideos.forEach(video => {
        if (!this.hasUserWatched(video.id, userContext.viewHistory)) {
          const diversityScore = watchedCategories.has(video.category) ? 0.3 : 0.7;
          
          candidates.push({
            videoId: video.id,
            score: diversityScore * (video.engagementRate || 0.1),
            algorithm: 'diversity_boost',
            reason: 'Explore new topics',
            metadata: {
              category: video.category,
              diversityScore
            }
          });
        }
      });

      return candidates.sort((a, b) => b.score - a.score).slice(0, 20);
    } catch (error) {
      console.error('Error in diversity boost recommendations:', error);
      return [];
    }
  }

  /**
   * Check if user has watched a video
   */
  static hasUserWatched(videoId, viewHistory) {
    return viewHistory.some(view => view.videoId === videoId);
  }

  /**
   * Calculate subscription-based score
   */
  static calculateSubscriptionScore(video, userContext) {
    const baseScore = 0.7; // High base score for subscribed content
    const recencyBoost = this.calculateRecency(video.publishedAt);
    const engagementBoost = (video.engagementRate || 0.1) * 0.3;
    
    return Math.min(baseScore + recencyBoost + engagementBoost, 1.0);
  }

  /**
   * Calculate recency weight
   */
  static calculateRecency(timestamp) {
    if (!timestamp) return 0.5;
    
    const ageInHours = (Date.now() - new Date(timestamp)) / (1000 * 60 * 60);
    
    // Fresh content gets higher weight, decaying over 168 hours (1 week)
    return Math.max(0.1, Math.exp(-ageInHours / 168));
  }
}

export default RecommendationEngineHelpers;