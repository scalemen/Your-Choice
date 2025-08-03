import { db } from '../db/index.js';
import { 
  videos, videoViews, videoRecommendations, userPreferences, subscriptions, 
  videoLikes, algorithmModels, channels, videoComments, playlists, videoAnalytics
} from '../db/video-platform-schema.js';
import { eq, and, desc, sql, inArray, gt, lt, gte, lte, isNull, ne, or, count } from 'drizzle-orm';
import NodeCache from 'node-cache';
import RecommendationEngineHelpers from './RecommendationEngineHelpers.js';

/**
 * Advanced AI-Powered Recommendation Engine for StudyTube
 * 
 * Features:
 * - Multi-algorithm approach (Collaborative Filtering, Content-Based, Deep Learning)
 * - Real-time personalization and A/B testing
 * - Educational content optimization
 * - Engagement optimization with YouTube-rivaling capabilities
 * - Advanced analytics and performance tracking
 */
export class RecommendationEngine {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 }); // 10 minute cache
    this.modelWeights = {
      collaborative_filtering: 0.35,
      content_based: 0.25,
      deep_learning: 0.30,
      trending: 0.10
    };
    this.abTestingGroups = ['control', 'variant_a', 'variant_b', 'variant_c'];
    this.isInitialized = false;
    this.models = new Map();
  }

  /**
   * Initialize the recommendation engine
   */
  async initialize() {
    try {
      console.log('🚀 Initializing StudyTube Recommendation Engine...');
      
      await this.loadActiveModels();
      await this.warmupCache();
      
      this.isInitialized = true;
      console.log('✅ Recommendation Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Recommendation Engine:', error);
      throw error;
    }
  }

  /**
   * Load active ML models from database
   */
  async loadActiveModels() {
    try {
      const activeModels = await db.select()
        .from(algorithmModels)
        .where(eq(algorithmModels.isActive, true));

      for (const model of activeModels) {
        this.models.set(`${model.type}_${model.version}`, {
          ...model,
          loadedAt: new Date()
        });
      }

      console.log(`📊 Loaded ${activeModels.length} active ML models`);
    } catch (error) {
      console.error('❌ Error loading ML models:', error);
      // Continue with default models
      this.loadDefaultModels();
    }
  }

  /**
   * Load default models if database models fail
   */
  loadDefaultModels() {
    const defaultModels = [
      {
        type: 'collaborative_filtering',
        version: 'v1',
        config: { minSimilarUsers: 5, maxRecommendations: 50 },
        weights: { userSimilarity: 0.7, itemSimilarity: 0.3 }
      },
      {
        type: 'content_based',
        version: 'v1',
        config: { minContentScore: 0.3, categoryWeight: 0.4 },
        weights: { subject: 0.3, difficulty: 0.2, category: 0.3, tags: 0.2 }
      },
      {
        type: 'deep_learning',
        version: 'v1',
        config: { embeddingDim: 128, hiddenLayers: [256, 128, 64] },
        weights: { neural: 1.0 }
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(`${model.type}_${model.version}`, model);
    });
  }

  /**
   * Generate personalized video recommendations for a user
   */
  async generateRecommendations(userId, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      recommendationType = 'personalized',
      limit = 20,
      excludeWatched = true,
      context = {},
      experimentId = null
    } = options;

    try {
      console.log(`🎯 Generating ${recommendationType} recommendations for user ${userId}`);

      // Get user context and preferences
      const userContext = await this.getUserContext(userId);
      
      // Assign A/B testing group
      const treatmentGroup = this.assignTreatmentGroup(userId, experimentId);
      
      // Generate candidate recommendations from multiple algorithms
      const candidates = await this.generateCandidates(userId, userContext, recommendationType, context);
      
      // Apply ensemble scoring with ML models
      const scoredCandidates = await this.applyEnsembleScoring(candidates, userContext, treatmentGroup);
      
      // Apply diversity and ranking algorithms
      const finalRecommendations = await this.diversifyAndRank(scoredCandidates, userContext, treatmentGroup);
      
      // Apply business rules and filters
      const filteredRecommendations = await this.applyBusinessRules(finalRecommendations, userContext);
      
      // Limit results
      const limitedRecommendations = filteredRecommendations.slice(0, limit);
      
      // Store recommendations for analytics
      await this.storeRecommendations(userId, limitedRecommendations, recommendationType, treatmentGroup, experimentId);
      
      console.log(`✅ Generated ${limitedRecommendations.length} recommendations for user ${userId}`);
      
      return {
        recommendations: limitedRecommendations,
        metadata: {
          userId,
          recommendationType,
          treatmentGroup,
          experimentId,
          totalCandidates: candidates.length,
          finalCount: limitedRecommendations.length,
          generatedAt: new Date(),
          algorithms: Array.from(this.models.keys())
        }
      };
      
    } catch (error) {
      console.error(`❌ Error generating recommendations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive user context for recommendations
   */
  async getUserContext(userId) {
    const cacheKey = `user_context_${userId}`;
    let userContext = this.cache.get(cacheKey);
    
    if (!userContext) {
      console.log(`📊 Building user context for ${userId}...`);
      
      const [preferences, viewHistory, subscriptions, likes] = await Promise.all([
        this.getUserPreferences(userId),
        this.getViewHistory(userId, 100),
        this.getUserSubscriptions(userId),
        this.getUserLikes(userId, 50)
      ]);

      const behaviorProfile = await this.generateBehaviorProfile(userId, viewHistory);
      
      userContext = {
        userId,
        preferences,
        viewHistory,
        subscriptions,
        likes,
        behaviorProfile,
        createdAt: new Date()
      };
      
      this.cache.set(cacheKey, userContext, 300); // 5 minute cache
    }
    
    return userContext;
  }

  /**
   * Get user preferences with defaults
   */
  async getUserPreferences(userId) {
    try {
      const preferences = await db.select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      return preferences[0] || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get user's video viewing history
   */
  async getViewHistory(userId, limit = 100) {
    try {
      return await db.select({
        videoId: videoViews.videoId,
        watchTime: videoViews.watchTime,
        watchPercentage: videoViews.watchPercentage,
        completed: videoViews.completed,
        viewedAt: videoViews.viewedAt,
        video: {
          id: videos.id,
          title: videos.title,
          subject: videos.subject,
          difficulty: videos.difficulty,
          category: videos.category,
          tags: videos.tags,
          duration: videos.duration
        }
      })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .where(eq(videoViews.userId, userId))
      .orderBy(desc(videoViews.viewedAt))
      .limit(limit);
    } catch (error) {
      console.error('Error fetching view history:', error);
      return [];
    }
  }

  /**
   * Get user's channel subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      return await db.select({
        channelId: subscriptions.channelId,
        subscribedAt: subscriptions.subscribedAt,
        channel: {
          id: channels.id,
          name: channels.name,
          category: channels.category,
          isVerified: channels.isVerified
        }
      })
      .from(subscriptions)
      .innerJoin(channels, eq(subscriptions.channelId, channels.id))
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isActive, true)
      ));
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }
  }

  /**
   * Get user's liked videos
   */
  async getUserLikes(userId, limit = 50) {
    try {
      return await db.select({
        videoId: videoLikes.videoId,
        type: videoLikes.type,
        createdAt: videoLikes.createdAt,
        video: {
          id: videos.id,
          title: videos.title,
          subject: videos.subject,
          category: videos.category,
          difficulty: videos.difficulty
        }
      })
      .from(videoLikes)
      .innerJoin(videos, eq(videoLikes.videoId, videos.id))
      .where(eq(videoLikes.userId, userId))
      .orderBy(desc(videoLikes.createdAt))
      .limit(limit);
    } catch (error) {
      console.error('Error fetching user likes:', error);
      return [];
    }
  }

  /**
   * Generate user behavior profile from viewing history
   */
  async generateBehaviorProfile(userId, viewHistory) {
    if (!viewHistory.length) {
      return this.getDefaultBehaviorProfile();
    }

    const totalWatchTime = viewHistory.reduce((sum, view) => sum + view.watchTime, 0);
    const avgWatchPercentage = viewHistory.reduce((sum, view) => sum + view.watchPercentage, 0) / viewHistory.length;
    
    // Calculate subject preferences
    const subjectPreferences = {};
    const categoryPreferences = {};
    const difficultyPreferences = {};
    
    viewHistory.forEach(view => {
      if (view.video.subject) {
        subjectPreferences[view.video.subject] = (subjectPreferences[view.video.subject] || 0) + view.watchPercentage;
      }
      if (view.video.category) {
        categoryPreferences[view.video.category] = (categoryPreferences[view.video.category] || 0) + view.watchPercentage;
      }
      if (view.video.difficulty) {
        difficultyPreferences[view.video.difficulty] = (difficultyPreferences[view.video.difficulty] || 0) + view.watchPercentage;
      }
    });

    return {
      totalWatchTime,
      avgWatchPercentage,
      sessionFrequency: RecommendationEngineHelpers.calculateSessionFrequency(viewHistory),
      engagementLevel: RecommendationEngineHelpers.calculateEngagementLevel(viewHistory),
      categoryPreferences: RecommendationEngineHelpers.normalizePreferences(categoryPreferences),
      subjectPreferences: RecommendationEngineHelpers.normalizePreferences(subjectPreferences),
      difficultyPreferences: RecommendationEngineHelpers.normalizePreferences(difficultyPreferences),
      preferredDuration: RecommendationEngineHelpers.calculatePreferredDuration(viewHistory),
      diversityScore: RecommendationEngineHelpers.calculateDiversityScore(viewHistory)
    };
  }

  /**
   * Generate candidate recommendations from multiple algorithms
   */
  async generateCandidates(userId, userContext, recommendationType, context) {
    const candidateGenerators = [
      () => this.collaborativeFiltering(userId, userContext),
      () => this.contentBasedFiltering(userId, userContext),
      () => this.trendingVideos(userId, userContext),
      () => this.subscriptionBasedRecommendations(userId, userContext),
      () => RecommendationEngineHelpers.similarUserRecommendations(userId, userContext),
      () => this.educationalPathRecommendations(userId, userContext),
      () => RecommendationEngineHelpers.diversityBoostRecommendations(userId, userContext)
    ];

    const candidateResults = await Promise.allSettled(
      candidateGenerators.map(generator => generator())
    );

    let allCandidates = [];
    candidateResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allCandidates = allCandidates.concat(result.value);
      } else {
        console.error(`Candidate generator ${index} failed:`, result.reason);
      }
    });

    // Remove duplicates while preserving highest scores
    const uniqueCandidates = new Map();
    allCandidates.forEach(candidate => {
      const existing = uniqueCandidates.get(candidate.videoId);
      if (!existing || candidate.score > existing.score) {
        uniqueCandidates.set(candidate.videoId, candidate);
      }
    });

    return Array.from(uniqueCandidates.values());
  }

  /**
   * Collaborative Filtering Algorithm
   */
  async collaborativeFiltering(userId, userContext) {
    try {
      const userSimilarities = await RecommendationEngineHelpers.findSimilarUsers(userId, userContext);
      const candidates = [];

      for (const similarUser of userSimilarities.slice(0, 20)) {
        const similarUserVideos = await this.getViewHistory(similarUser.userId, 50);
        
        for (const video of similarUserVideos) {
          if (!RecommendationEngineHelpers.hasUserWatched(video.videoId, userContext.viewHistory)) {
            const score = this.calculateCollaborativeScore(video, similarUser, userContext);
            candidates.push({
              videoId: video.videoId,
              score,
              algorithm: 'collaborative_filtering',
              reason: `Users similar to you enjoyed this video`,
              metadata: {
                similarUserId: similarUser.userId,
                similarity: similarUser.similarity,
                watchPercentage: video.watchPercentage
              }
            });
          }
        }
      }

      return candidates.sort((a, b) => b.score - a.score).slice(0, 50);
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }

  /**
   * Content-Based Filtering Algorithm
   */
  async contentBasedFiltering(userId, userContext) {
    try {
      const userProfile = RecommendationEngineHelpers.buildContentProfile(userContext);
      const candidates = [];

      // Get videos matching user's content preferences
      const matchingVideos = await db.select({
        id: videos.id,
        title: videos.title,
        subject: videos.subject,
        category: videos.category,
        difficulty: videos.difficulty,
        duration: videos.duration,
        tags: videos.tags,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate
      })
      .from(videos)
      .where(and(
        eq(videos.status, 'active'),
        eq(videos.visibility, 'public'),
        or(
          inArray(videos.subject, userProfile.preferredSubjects),
          inArray(videos.category, userProfile.preferredCategories),
          eq(videos.difficulty, userProfile.preferredDifficulty)
        )
      ))
      .limit(200);

      for (const video of matchingVideos) {
        if (!RecommendationEngineHelpers.hasUserWatched(video.id, userContext.viewHistory)) {
          const score = this.calculateContentScore(video, userProfile);
          candidates.push({
            videoId: video.id,
            score,
            algorithm: 'content_based',
            reason: RecommendationEngineHelpers.generateContentReason(video, userProfile),
            metadata: {
              contentMatch: RecommendationEngineHelpers.getContentMatchDetails(video, userProfile)
            }
          });
        }
      }

      return candidates.sort((a, b) => b.score - a.score).slice(0, 50);
    } catch (error) {
      console.error('Error in content-based filtering:', error);
      return [];
    }
  }

  /**
   * Trending Videos Algorithm
   */
  async trendingVideos(userId, userContext) {
    try {
      const trendingPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const trending = await db.select({
        id: videos.id,
        title: videos.title,
        trendingScore: videos.trendingScore,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate,
        category: videos.category,
        subject: videos.subject
      })
      .from(videos)
      .where(and(
        eq(videos.status, 'active'),
        eq(videos.visibility, 'public'),
        gte(videos.publishedAt, trendingPeriod)
      ))
      .orderBy(desc(videos.trendingScore))
      .limit(100);

      return trending
        .filter(video => !RecommendationEngineHelpers.hasUserWatched(video.id, userContext.viewHistory))
        .map(video => ({
          videoId: video.id,
          score: this.calculateTrendingScore(video, userContext),
          algorithm: 'trending',
          reason: 'Trending now',
          metadata: {
            trendingScore: video.trendingScore,
            trendingRank: trending.indexOf(video) + 1
          }
        }));
    } catch (error) {
      console.error('Error in trending videos:', error);
      return [];
    }
  }

  /**
   * Subscription-Based Recommendations
   */
  async subscriptionBasedRecommendations(userId, userContext) {
    try {
      const subscribedChannels = userContext.subscriptions.map(sub => sub.channelId);
      
      if (!subscribedChannels.length) {
        return [];
      }

      const newVideos = await db.select({
        id: videos.id,
        title: videos.title,
        channelId: videos.channelId,
        publishedAt: videos.publishedAt,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate
      })
      .from(videos)
      .where(and(
        inArray(videos.channelId, subscribedChannels),
        eq(videos.status, 'active'),
        eq(videos.visibility, 'public')
      ))
      .orderBy(desc(videos.publishedAt))
      .limit(50);

      return newVideos
        .filter(video => !RecommendationEngineHelpers.hasUserWatched(video.id, userContext.viewHistory))
        .map(video => ({
          videoId: video.id,
          score: RecommendationEngineHelpers.calculateSubscriptionScore(video, userContext),
          algorithm: 'subscription_based',
          reason: 'New from subscribed channels',
          metadata: {
            channelId: video.channelId,
            recency: RecommendationEngineHelpers.calculateRecency(video.publishedAt)
          }
        }));
    } catch (error) {
      console.error('Error in subscription-based recommendations:', error);
      return [];
    }
  }

  /**
   * Educational Path Recommendations
   */
  async educationalPathRecommendations(userId, userContext) {
    try {
      const learningGoals = userContext.preferences?.learningGoals || [];
      const currentSkillLevels = userContext.preferences?.skillLevel || {};
      
      if (!learningGoals.length) {
        return [];
      }

      const candidates = [];
      
      for (const goal of learningGoals) {
        const currentLevel = currentSkillLevels[goal] || 'beginner';
        const nextLevel = RecommendationEngineHelpers.getNextDifficultyLevel(currentLevel);
        
        const pathVideos = await db.select({
          id: videos.id,
          title: videos.title,
          subject: videos.subject,
          difficulty: videos.difficulty,
          learningObjectives: videos.learningObjectives,
          engagementRate: videos.engagementRate
        })
        .from(videos)
        .where(and(
          eq(videos.subject, goal),
          eq(videos.difficulty, nextLevel),
          eq(videos.status, 'active')
        ))
        .orderBy(desc(videos.engagementRate))
        .limit(20);

        pathVideos.forEach(video => {
          candidates.push({
            videoId: video.id,
            score: this.calculateEducationalScore(video, goal, currentLevel),
            algorithm: 'educational_path',
            reason: `Next step in your ${goal} learning journey`,
            metadata: {
              learningGoal: goal,
              currentLevel,
              targetLevel: nextLevel
            }
          });
        });
      }

      return candidates.sort((a, b) => b.score - a.score).slice(0, 30);
    } catch (error) {
      console.error('Error in educational path recommendations:', error);
      return [];
    }
  }

  /**
   * Apply ensemble scoring using multiple ML models
   */
  async applyEnsembleScoring(candidates, userContext, treatmentGroup) {
    const scoredCandidates = [];

    for (const candidate of candidates) {
      let ensembleScore = 0;
      const modelScores = {};
      const weights = this.getModelWeights(treatmentGroup);

      // Base algorithm score
      const baseScore = candidate.score;

      // Collaborative Filtering Model
      if (this.models.has('collaborative_filtering_v1')) {
        const cfScore = await RecommendationEngineHelpers.calculateCFScore(candidate, userContext);
        modelScores.collaborative_filtering = cfScore;
        ensembleScore += cfScore * weights.collaborative_filtering;
      }

      // Content-Based Model
      if (this.models.has('content_based_v1')) {
        const cbScore = await RecommendationEngineHelpers.calculateCBScore(candidate, userContext);
        modelScores.content_based = cbScore;
        ensembleScore += cbScore * weights.content_based;
      }

      // Deep Learning Model (simulated)
      if (this.models.has('deep_learning_v1')) {
        const dlScore = await RecommendationEngineHelpers.calculateDLScore(candidate, userContext);
        modelScores.deep_learning = dlScore;
        ensembleScore += dlScore * weights.deep_learning;
      }

      // Trending boost
      const trendingBoost = RecommendationEngineHelpers.calculateTrendingBoost(candidate);
      modelScores.trending = trendingBoost;
      ensembleScore += trendingBoost * weights.trending;

      // Apply time decay and personalization multipliers
      ensembleScore *= RecommendationEngineHelpers.calculateFreshnessDecay(candidate);
      ensembleScore *= RecommendationEngineHelpers.calculatePersonalizationMultiplier(candidate, userContext);

      scoredCandidates.push({
        ...candidate,
        ensembleScore,
        modelScores,
        baseScore,
        treatmentGroup
      });
    }

    return scoredCandidates.sort((a, b) => b.ensembleScore - a.ensembleScore);
  }

  /**
   * Apply diversity algorithms and final ranking
   */
  async diversifyAndRank(scoredCandidates, userContext, treatmentGroup) {
    const diversityConfig = RecommendationEngineHelpers.getDiversityConfig(treatmentGroup);
    const rankedCandidates = [];
    const usedCategories = new Set();
    const usedChannels = new Set();

    // First pass: Select high-scoring candidates with diversity constraints
    for (const candidate of scoredCandidates) {
      if (rankedCandidates.length >= diversityConfig.maxRecommendations) break;

      const videoDetails = await RecommendationEngineHelpers.getVideoDetails(candidate.videoId);
      if (!videoDetails) continue;

      const categoryDiversity = RecommendationEngineHelpers.checkCategoryDiversity(
        videoDetails.category, usedCategories, diversityConfig
      );
      const channelDiversity = RecommendationEngineHelpers.checkChannelDiversity(
        videoDetails.channelId, usedChannels, diversityConfig
      );

      if (categoryDiversity && channelDiversity) {
        rankedCandidates.push({
          ...candidate,
          videoDetails,
          finalScore: candidate.ensembleScore,
          diversityBoost: 0
        });

        usedCategories.add(videoDetails.category);
        usedChannels.add(videoDetails.channelId);
      }
    }

    // Second pass: Fill remaining slots with diversity boost
    for (const candidate of scoredCandidates) {
      if (rankedCandidates.length >= diversityConfig.maxRecommendations) break;
      if (rankedCandidates.find(r => r.videoId === candidate.videoId)) continue;

      const videoDetails = await RecommendationEngineHelpers.getVideoDetails(candidate.videoId);
      if (!videoDetails) continue;

      const diversityBoost = RecommendationEngineHelpers.calculateDiversityBoost(
        videoDetails, usedCategories, usedChannels
      );
      const finalScore = candidate.ensembleScore + diversityBoost;

      rankedCandidates.push({
        ...candidate,
        videoDetails,
        finalScore,
        diversityBoost
      });
    }

    return rankedCandidates
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, diversityConfig.maxRecommendations);
  }

  /**
   * Apply business rules and content filters
   */
  async applyBusinessRules(recommendations, userContext) {
    return recommendations.filter(rec => {
      // Age restriction check
      if (rec.videoDetails.isAgeRestricted && 
          userContext.preferences?.age < rec.videoDetails.minimumAge) {
        return false;
      }

      // Content rating check
      const allowedRatings = RecommendationEngineHelpers.getAllowedContentRatings(userContext);
      if (!allowedRatings.includes(rec.videoDetails.contentRating)) {
        return false;
      }

      // Minimum score threshold
      if (rec.finalScore < 0.1) {
        return false;
      }

      return true;
    });
  }

  /**
   * Store recommendations for analytics and tracking
   */
  async storeRecommendations(userId, recommendations, recommendationType, treatmentGroup, experimentId) {
    try {
      const recommendationRecords = recommendations.map((rec, index) => ({
        userId,
        videoId: rec.videoId,
        recommendationType,
        score: rec.finalScore,
        algorithm: rec.algorithm,
        reason: rec.reason,
        metadata: rec.metadata,
        position: index + 1,
        experimentId,
        treatmentGroup
      }));

      await db.insert(videoRecommendations).values(recommendationRecords);
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  // Scoring Calculation Methods
  calculateCollaborativeScore(video, similarUser, userContext) {
    const baseScore = video.watchPercentage / 100;
    const similarityWeight = similarUser.similarity;
    const recencyWeight = RecommendationEngineHelpers.calculateRecency(video.viewedAt);
    
    return baseScore * similarityWeight * recencyWeight;
  }

  calculateContentScore(video, userProfile) {
    let score = 0;

    // Subject matching
    if (userProfile.preferredSubjects.includes(video.subject)) {
      score += 0.3;
    }

    // Category matching
    if (userProfile.preferredCategories.includes(video.category)) {
      score += 0.3;
    }

    // Difficulty matching
    if (userProfile.preferredDifficulty === video.difficulty) {
      score += 0.2;
    }

    // Duration preference
    const durationScore = RecommendationEngineHelpers.calculateDurationScore(
      video.duration, userProfile.preferredDuration
    );
    score += durationScore * 0.2;

    return Math.min(score, 1.0);
  }

  calculateTrendingScore(video, userContext) {
    const baseScore = video.trendingScore || 0;
    const engagementWeight = video.engagementRate;
    const personalWeight = RecommendationEngineHelpers.calculatePersonalTrendingWeight(video, userContext);
    
    return baseScore * engagementWeight * personalWeight;
  }

  calculateEducationalScore(video, learningGoal, currentLevel) {
    let score = 0.5; // Base score

    // Learning objective alignment
    if (video.learningObjectives && video.learningObjectives.length > 0) {
      score += 0.2;
    }

    // Difficulty progression
    const nextLevel = RecommendationEngineHelpers.getNextDifficultyLevel(currentLevel);
    if (video.difficulty === nextLevel) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  // Utility Methods
  assignTreatmentGroup(userId, experimentId) {
    if (!experimentId) {
      return 'control';
    }

    const hash = this.hashUserId(userId + experimentId);
    const groupIndex = hash % this.abTestingGroups.length;
    return this.abTestingGroups[groupIndex];
  }

  getModelWeights(treatmentGroup) {
    const weightVariations = {
      control: this.modelWeights,
      variant_a: { ...this.modelWeights, deep_learning: 0.4, collaborative_filtering: 0.3 },
      variant_b: { ...this.modelWeights, content_based: 0.35, trending: 0.15 },
      variant_c: { ...this.modelWeights, collaborative_filtering: 0.4, content_based: 0.3 }
    };

    return weightVariations[treatmentGroup] || this.modelWeights;
  }

  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getDefaultPreferences() {
    return {
      preferredSubjects: [],
      preferredDifficulty: 'intermediate',
      preferredDuration: 600, // 10 minutes
      preferredCategories: [],
      preferredLanguages: ['en'],
      learningGoals: [],
      skillLevel: {},
      autoplay: true,
      captionsEnabled: false,
      age: 18
    };
  }

  getDefaultBehaviorProfile() {
    return {
      totalWatchTime: 0,
      avgWatchPercentage: 0,
      sessionFrequency: 0,
      engagementLevel: 'low',
      categoryPreferences: {},
      subjectPreferences: {},
      difficultyPreferences: {},
      preferredDuration: 600,
      diversityScore: 0.5
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache() {
    console.log('🔥 Warming up recommendation cache...');
    
    try {
      // Cache trending videos
      const trending = await this.trendingVideos('system', { viewHistory: [], subscriptions: [], preferences: {} });
      this.cache.set('trending_videos', trending, 1800); // 30 minute cache

      console.log('✅ Cache warmed up successfully');
    } catch (error) {
      console.error('❌ Error warming up cache:', error);
    }
  }

  /**
   * Track recommendation performance for ML model optimization
   */
  async trackRecommendationPerformance(recommendationId, action, metadata = {}) {
    try {
      const performance = {
        recommendationId,
        action, // click, view, like, share, skip
        metadata,
        timestamp: new Date()
      };

      // Update recommendation record
      await db.update(videoRecommendations)
        .set({
          clicked: action === 'click' ? true : undefined,
          clickedAt: action === 'click' ? new Date() : undefined,
          watchTime: metadata.watchTime || undefined,
          completed: metadata.completed || undefined,
          liked: action === 'like' ? true : undefined,
          shared: action === 'share' ? true : undefined
        })
        .where(eq(videoRecommendations.id, recommendationId));

    } catch (error) {
      console.error('Error tracking recommendation performance:', error);
    }
  }

  /**
   * Update model weights based on performance data
   */
  async updateModelWeights(performanceData) {
    const improvements = RecommendationEngineHelpers.analyzePerformance(performanceData);
    
    for (const [modelType, improvement] of Object.entries(improvements)) {
      if (this.modelWeights[modelType]) {
        this.modelWeights[modelType] *= (1 + improvement);
      }
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(this.modelWeights).reduce((sum, weight) => sum + weight, 0);
    for (const [modelType, weight] of Object.entries(this.modelWeights)) {
      this.modelWeights[modelType] = weight / totalWeight;
    }

    console.log('📊 Model weights updated:', this.modelWeights);
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();