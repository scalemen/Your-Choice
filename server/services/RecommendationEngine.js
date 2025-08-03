import { db } from '../db/index.js';
import { videos, videoViews, videoRecommendations, userPreferences, subscriptions, videoLikes, algorithmModels } from '../db/video-platform-schema.js';
import { eq, and, desc, sql, inArray, gt, lt, gte, lte, isNull, ne, or } from 'drizzle-orm';
import NodeCache from 'node-cache';
import RecommendationEngineHelpers from './RecommendationEngineHelpers.js';

// Advanced Recommendation Engine
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

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.loadActiveModels();
      await this.warmupCache();
      this.isInitialized = true;
      console.log('🤖 Recommendation Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Recommendation Engine:', error);
    }
  }

  async loadActiveModels() {
    const activeModels = await db
      .select()
      .from(algorithmModels)
      .where(eq(algorithmModels.isActive, true));

    for (const model of activeModels) {
      this.models.set(`${model.type}_${model.version}`, model);
    }
  }

  // Main recommendation generation
  async generateRecommendations(userId, options = {}) {
    const {
      recommendationType = 'home_feed',
      limit = 20,
      offset = 0,
      context = {},
      experimentId = null
    } = options;

    try {
      // Get user preferences and history
      const userContext = await this.getUserContext(userId);
      
      // Assign A/B testing group
      const treatmentGroup = this.assignTreatmentGroup(userId, experimentId);
      
      // Generate candidate videos from multiple algorithms
      const candidates = await this.generateCandidates(userId, userContext, recommendationType, context);
      
      // Apply ensemble scoring
      const scoredCandidates = await this.applyEnsembleScoring(candidates, userContext, treatmentGroup);
      
      // Diversify and rank
      const rankedRecommendations = await this.diversifyAndRank(scoredCandidates, userContext, treatmentGroup);
      
      // Apply business rules and filters
      const filteredRecommendations = await this.applyBusinessRules(rankedRecommendations, userContext);
      
      // Paginate results
      const paginatedResults = filteredRecommendations.slice(offset, offset + limit);
      
      // Store recommendations for tracking
      await this.storeRecommendations(userId, paginatedResults, recommendationType, treatmentGroup, experimentId);
      
      return {
        recommendations: paginatedResults,
        metadata: {
          algorithmVersion: 'v2.1.0',
          treatmentGroup,
          experimentId,
          totalCandidates: candidates.length,
          scoringTime: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      throw error;
    }
  }

  async getUserContext(userId) {
    const cacheKey = `user_context_${userId}`;
    let context = this.cache.get(cacheKey);
    
    if (!context) {
      const [preferences, viewHistory, subscriptions, likes] = await Promise.all([
        this.getUserPreferences(userId),
        this.getViewHistory(userId),
        this.getUserSubscriptions(userId),
        this.getUserLikes(userId)
      ]);

      context = {
        preferences,
        viewHistory,
        subscriptions,
        likes,
        behaviorProfile: await this.generateBehaviorProfile(userId, viewHistory),
        lastActivity: Date.now()
      };

      this.cache.set(cacheKey, context, 300); // 5 minute cache
    }

    return context;
  }

  async getUserPreferences(userId) {
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return prefs[0] || this.getDefaultPreferences();
  }

  async getViewHistory(userId, limit = 100) {
    return await db
      .select({
        videoId: videoViews.videoId,
        watchTime: videoViews.watchTime,
        watchPercentage: videoViews.watchPercentage,
        viewedAt: videoViews.viewedAt,
        liked: videoViews.liked,
        shared: videoViews.shared,
        video: {
          id: videos.id,
          title: videos.title,
          category: videos.category,
          subject: videos.subject,
          difficulty: videos.difficulty,
          duration: videos.duration,
          tags: videos.tags
        }
      })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .where(eq(videoViews.userId, userId))
      .orderBy(desc(videoViews.viewedAt))
      .limit(limit);
  }

  async getUserSubscriptions(userId) {
    return await db
      .select({
        channelId: subscriptions.channelId,
        subscriptionType: subscriptions.subscriptionType,
        createdAt: subscriptions.createdAt
      })
      .from(subscriptions)
      .where(eq(subscriptions.subscriberId, userId));
  }

  async getUserLikes(userId, limit = 50) {
    return await db
      .select({
        videoId: videoLikes.videoId,
        likeType: videoLikes.likeType,
        createdAt: videoLikes.createdAt
      })
      .from(videoLikes)
      .where(eq(videoLikes.userId, userId))
      .orderBy(desc(videoLikes.createdAt))
      .limit(limit);
  }

  async generateBehaviorProfile(userId, viewHistory) {
    if (!viewHistory.length) return this.getDefaultBehaviorProfile();

    const totalWatchTime = viewHistory.reduce((sum, view) => sum + view.watchTime, 0);
    const avgWatchPercentage = viewHistory.reduce((sum, view) => sum + view.watchPercentage, 0) / viewHistory.length;
    
    const categoryPreferences = {};
    const subjectPreferences = {};
    const difficultyPreferences = {};
    
    viewHistory.forEach(view => {
      if (view.video.category) {
        categoryPreferences[view.video.category] = (categoryPreferences[view.video.category] || 0) + view.watchPercentage;
      }
      if (view.video.subject) {
        subjectPreferences[view.video.subject] = (subjectPreferences[view.video.subject] || 0) + view.watchPercentage;
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

    const candidateSets = await Promise.all(
      candidateGenerators.map(generator => generator().catch(err => {
        console.warn('Candidate generator failed:', err);
        return [];
      }))
    );

    // Merge and deduplicate candidates
    const allCandidates = candidateSets.flat();
    const uniqueCandidates = new Map();
    
    allCandidates.forEach(candidate => {
      const existing = uniqueCandidates.get(candidate.videoId);
      if (!existing || candidate.score > existing.score) {
        uniqueCandidates.set(candidate.videoId, candidate);
      }
    });

    return Array.from(uniqueCandidates.values());
  }

  // Collaborative Filtering Algorithm
  async collaborativeFiltering(userId, userContext) {
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
            reason: `Users similar to you enjoyed this`,
            metadata: { similarUserId: similarUser.userId, similarity: similarUser.similarity }
          });
        }
      }
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 50);
  }

  // Content-Based Filtering Algorithm
  async contentBasedFiltering(userId, userContext) {
    const userProfile = RecommendationEngineHelpers.buildContentProfile(userContext);
    const candidates = [];

    // Get videos matching user's content preferences
    const matchingVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        category: videos.category,
        subject: videos.subject,
        difficulty: videos.difficulty,
        tags: videos.tags,
        duration: videos.duration,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate,
        publishedAt: videos.publishedAt
      })
      .from(videos)
      .where(
        and(
          eq(videos.visibility, 'public'),
          eq(videos.isDeleted, false),
          inArray(videos.category, userProfile.preferredCategories.slice(0, 5))
        )
      )
      .orderBy(desc(videos.engagementRate))
      .limit(200);

    for (const video of matchingVideos) {
      if (!RecommendationEngineHelpers.hasUserWatched(video.id, userContext.viewHistory)) {
        const score = this.calculateContentScore(video, userProfile);
        candidates.push({
          videoId: video.id,
          score,
          algorithm: 'content_based',
          reason: RecommendationEngineHelpers.generateContentReason(video, userProfile),
          metadata: { contentMatch: RecommendationEngineHelpers.getContentMatchDetails(video, userProfile) }
        });
      }
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 50);
  }

  // Trending Videos Algorithm
  async trendingVideos(userId, userContext) {
    const trendingPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const trending = await db
      .select({
        id: videos.id,
        title: videos.title,
        category: videos.category,
        viewCount: videos.viewCount,
        trendingScore: videos.trendingScore,
        engagementRate: videos.engagementRate,
        publishedAt: videos.publishedAt
      })
      .from(videos)
      .where(
        and(
          eq(videos.visibility, 'public'),
          eq(videos.isDeleted, false),
          gte(videos.publishedAt, trendingPeriod)
        )
      )
      .orderBy(desc(videos.trendingScore))
      .limit(100);

    return trending
      .filter(video => !RecommendationEngineHelpers.hasUserWatched(video.id, userContext.viewHistory))
      .map(video => ({
        videoId: video.id,
        score: this.calculateTrendingScore(video, userContext),
        algorithm: 'trending',
        reason: 'Trending now',
        metadata: { trendingScore: video.trendingScore, trendingRank: trending.indexOf(video) + 1 }
      }));
  }

  // Subscription-Based Recommendations
  async subscriptionBasedRecommendations(userId, userContext) {
    const subscribedChannels = userContext.subscriptions.map(sub => sub.channelId);
    
    if (!subscribedChannels.length) return [];

    const newVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        channelId: videos.channelId,
        publishedAt: videos.publishedAt,
        viewCount: videos.viewCount,
        engagementRate: videos.engagementRate
      })
      .from(videos)
      .where(
        and(
          inArray(videos.channelId, subscribedChannels),
          eq(videos.visibility, 'public'),
          eq(videos.isDeleted, false),
          gte(videos.publishedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last week
        )
      )
      .orderBy(desc(videos.publishedAt))
      .limit(50);

    return newVideos
      .filter(video => !RecommendationEngineHelpers.hasUserWatched(video.id, userContext.viewHistory))
      .map(video => ({
        videoId: video.id,
        score: RecommendationEngineHelpers.calculateSubscriptionScore(video, userContext),
        algorithm: 'subscription_based',
        reason: 'New from subscribed channels',
        metadata: { channelId: video.channelId, recency: RecommendationEngineHelpers.calculateRecency(video.publishedAt) }
      }));
  }

  // Educational Path Recommendations (StudyGenius specific)
  async educationalPathRecommendations(userId, userContext) {
    const learningGoals = userContext.preferences?.learningGoals || [];
    const currentSkillLevels = userContext.preferences?.skillLevel || {};
    
    if (!learningGoals.length) return [];

    const candidates = [];

    for (const goal of learningGoals) {
      const currentLevel = currentSkillLevels[goal] || 'beginner';
      const nextLevel = RecommendationEngineHelpers.getNextDifficultyLevel(currentLevel);
      
      const pathVideos = await db
        .select({
          id: videos.id,
          title: videos.title,
          subject: videos.subject,
          difficulty: videos.difficulty,
          learningObjectives: videos.learningObjectives,
          prerequisites: videos.prerequisites,
          engagementRate: videos.engagementRate
        })
        .from(videos)
        .where(
          and(
            eq(videos.isEducational, true),
            eq(videos.subject, goal),
            eq(videos.difficulty, nextLevel),
            eq(videos.visibility, 'public'),
            eq(videos.isDeleted, false)
          )
        )
        .orderBy(desc(videos.engagementRate))
        .limit(20);

      pathVideos.forEach(video => {
        candidates.push({
          videoId: video.id,
          score: this.calculateEducationalScore(video, goal, currentLevel),
          algorithm: 'educational_path',
          reason: `Continue learning ${goal}`,
          metadata: { 
            learningGoal: goal, 
            currentLevel, 
            nextLevel,
            prerequisites: video.prerequisites 
          }
        });
      });
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 30);
  }

  // Apply ensemble scoring with multiple models
  async applyEnsembleScoring(candidates, userContext, treatmentGroup) {
    const scoredCandidates = [];

    for (const candidate of candidates) {
      let ensembleScore = 0;
      const modelScores = {};

      // Apply different model weights based on treatment group
      const weights = this.getModelWeights(treatmentGroup);

      // Get base score from algorithm
      const baseScore = candidate.score;
      
      // Apply collaborative filtering score
      if (this.models.has('collaborative_filtering_v1')) {
        const cfScore = await RecommendationEngineHelpers.calculateCFScore(candidate, userContext);
        modelScores.collaborative_filtering = cfScore;
        ensembleScore += cfScore * weights.collaborative_filtering;
      }

      // Apply content-based score
      if (this.models.has('content_based_v1')) {
        const cbScore = await RecommendationEngineHelpers.calculateCBScore(candidate, userContext);
        modelScores.content_based = cbScore;
        ensembleScore += cbScore * weights.content_based;
      }

      // Apply deep learning score (simulated)
      if (this.models.has('deep_learning_v1')) {
        const dlScore = await RecommendationEngineHelpers.calculateDLScore(candidate, userContext);
        modelScores.deep_learning = dlScore;
        ensembleScore += dlScore * weights.deep_learning;
      }

      // Apply trending boost
      const trendingBoost = RecommendationEngineHelpers.calculateTrendingBoost(candidate);
      modelScores.trending = trendingBoost;
      ensembleScore += trendingBoost * weights.trending;

      // Apply freshness decay
      ensembleScore *= RecommendationEngineHelpers.calculateFreshnessDecay(candidate);

      // Apply personalization multiplier
      ensembleScore *= RecommendationEngineHelpers.calculatePersonalizationMultiplier(candidate, userContext);

      scoredCandidates.push({
        ...candidate,
        ensembleScore,
        modelScores,
        weights
      });
    }

    return scoredCandidates.sort((a, b) => b.ensembleScore - a.ensembleScore);
  }

  // Diversify and rank final recommendations
  async diversifyAndRank(scoredCandidates, userContext, treatmentGroup) {
    const diversityConfig = RecommendationEngineHelpers.getDiversityConfig(treatmentGroup);
    const rankedCandidates = [];
    const usedCategories = new Set();
    const usedChannels = new Set();

    // First pass: High-scoring videos with diversity constraints
    for (const candidate of scoredCandidates) {
      if (rankedCandidates.length >= diversityConfig.maxRecommendations) break;

      const videoDetails = await RecommendationEngineHelpers.getVideoDetails(candidate.videoId);
      if (!videoDetails) continue;

      // Check diversity constraints
      const categoryDiversity = RecommendationEngineHelpers.checkCategoryDiversity(videoDetails.category, usedCategories, diversityConfig);
      const channelDiversity = RecommendationEngineHelpers.checkChannelDiversity(videoDetails.channelId, usedChannels, diversityConfig);

      if (categoryDiversity && channelDiversity) {
        rankedCandidates.push({
          ...candidate,
          finalScore: candidate.ensembleScore,
          diversityBoost: 0,
          videoDetails
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

      const diversityBoost = RecommendationEngineHelpers.calculateDiversityBoost(videoDetails, usedCategories, usedChannels);
      const finalScore = candidate.ensembleScore + diversityBoost;

      rankedCandidates.push({
        ...candidate,
        finalScore,
        diversityBoost,
        videoDetails
      });
    }

    return rankedCandidates
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, diversityConfig.maxRecommendations);
  }

  // Helper methods for scoring
  calculateCollaborativeScore(video, similarUser, userContext) {
    const baseScore = video.watchPercentage / 100;
    const similarityWeight = similarUser.similarity;
    const recencyWeight = RecommendationEngineHelpers.calculateRecency(video.viewedAt);
    
    return baseScore * similarityWeight * recencyWeight;
  }

  calculateContentScore(video, userProfile) {
    let score = 0;

    // Category match
    if (userProfile.preferredCategories.includes(video.category)) {
      score += 0.3;
    }

    // Subject match
    if (userProfile.preferredSubjects.includes(video.subject)) {
      score += 0.3;
    }

    // Difficulty match
    if (userProfile.preferredDifficulty === video.difficulty) {
      score += 0.2;
    }

    // Duration preference
    const durationScore = RecommendationEngineHelpers.calculateDurationScore(video.duration, userProfile.preferredDuration);
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
    let score = 0.7; // Base educational score

    // Learning objective alignment
    if (video.learningObjectives && video.learningObjectives.includes(learningGoal)) {
      score += 0.2;
    }

    // Prerequisites check
    if (video.prerequisites && video.prerequisites.length > 0) {
      // Check if user meets prerequisites (simplified)
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // Business rules and filters
  async applyBusinessRules(recommendations, userContext) {
    return recommendations.filter(rec => {
      // Age restriction check
      if (rec.videoDetails.isAgeRestricted && userContext.preferences?.age < rec.videoDetails.minimumAge) {
        return false;
      }

      // Content rating check
      const allowedRatings = RecommendationEngineHelpers.getAllowedContentRatings(userContext);
      if (!allowedRatings.includes(rec.videoDetails.contentRating)) {
        return false;
      }

      // Quality threshold
      if (rec.finalScore < 0.1) {
        return false;
      }

      return true;
    });
  }

  // Store recommendations for tracking and analysis
  async storeRecommendations(userId, recommendations, recommendationType, treatmentGroup, experimentId) {
    const recommendationRecords = recommendations.map((rec, index) => ({
      userId,
      videoId: rec.videoId,
      recommendationType,
      position: index + 1,
      score: rec.finalScore,
      algorithmVersion: 'v2.1.0',
      modelScores: rec.modelScores,
      features: rec.metadata,
      experimentId,
      treatmentGroup,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }));

    try {
      await db.insert(videoRecommendations).values(recommendationRecords);
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  // A/B testing methods
  assignTreatmentGroup(userId, experimentId) {
    if (!experimentId) return 'control';
    
    const hash = this.hashUserId(userId);
    const groupIndex = hash % this.abTestingGroups.length;
    return this.abTestingGroups[groupIndex];
  }

  getModelWeights(treatmentGroup) {
    const baseWeights = { ...this.modelWeights };
    
    switch (treatmentGroup) {
      case 'variant_a':
        baseWeights.deep_learning += 0.1;
        baseWeights.collaborative_filtering -= 0.1;
        break;
      case 'variant_b':
        baseWeights.content_based += 0.15;
        baseWeights.trending -= 0.05;
        baseWeights.collaborative_filtering -= 0.1;
        break;
      case 'variant_c':
        baseWeights.trending += 0.2;
        baseWeights.deep_learning -= 0.2;
        break;
    }
    
    return baseWeights;
  }

  // Utility methods
  hasUserWatched(videoId, viewHistory) {
    return RecommendationEngineHelpers.hasUserWatched(videoId, viewHistory);
  }

  calculateRecency(timestamp) {
    return RecommendationEngineHelpers.calculateRecency(timestamp);
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
      preferredCategories: ['education', 'technology', 'science'],
      preferredSubjects: [],
      preferredLanguages: ['en'],
      preferredDifficulty: 'intermediate',
      preferredDuration: 'medium',
      personalizationEnabled: true
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
      preferredDuration: 'medium',
      diversityScore: 0.5
    };
  }

  async warmupCache() {
    // Pre-load popular videos and trending content
    console.log('🔥 Warming up recommendation cache...');
  }

  // Performance tracking and analytics
  async trackRecommendationPerformance(recommendationId, action, metadata = {}) {
    try {
      await db
        .update(videoRecommendations)
        .set({
          wasClicked: action === 'click',
          clickedAt: action === 'click' ? new Date() : undefined,
          impressionDuration: metadata.impressionDuration,
          viewportPercentage: metadata.viewportPercentage
        })
        .where(eq(videoRecommendations.id, recommendationId));
    } catch (error) {
      console.error('Error tracking recommendation performance:', error);
    }
  }

  // Real-time model updates
  async updateModelWeights(performanceData) {
    // Analyze performance and adjust model weights
    const improvements = RecommendationEngineHelpers.analyzePerformance(performanceData);
    
    for (const [modelType, improvement] of Object.entries(improvements)) {
      if (improvement > 0.05) { // 5% improvement threshold
        this.modelWeights[modelType] = Math.min(this.modelWeights[modelType] * 1.1, 0.5);
      } else if (improvement < -0.05) {
        this.modelWeights[modelType] = Math.max(this.modelWeights[modelType] * 0.9, 0.1);
      }
    }

    console.log('📊 Model weights updated:', this.modelWeights);
  }
}

// Global instance
export const recommendationEngine = new RecommendationEngine();