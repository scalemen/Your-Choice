import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { db, leaderboards, leaderboardEntries, users, achievements, userAchievementProgress, friendships, studyGroups, studyGroupMemberships } from '../db/index.js';
import { eq, and, desc, asc, sql, inArray, gte, lte, ne, or } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get all available leaderboards
router.get('/', [
  query('category').optional().isString().withMessage('Category must be a string'),
  query('scope').optional().isIn(['global', 'school', 'friends', 'class']).withMessage('Invalid scope'),
  query('timeframe').optional().isIn(['daily', 'weekly', 'monthly', 'yearly', 'all_time']).withMessage('Invalid timeframe'),
  query('active').optional().isBoolean().withMessage('Active must be a boolean')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { category, scope, timeframe, active = true } = req.query;
  
  let query = db.select()
    .from(leaderboards)
    .where(eq(leaderboards.isVisible, true));

  // Apply filters
  if (active !== undefined) {
    query = query.where(eq(leaderboards.isActive, active));
  }
  if (category) {
    query = query.where(eq(leaderboards.category, category));
  }
  if (scope) {
    query = query.where(eq(leaderboards.scope, scope));
  }
  if (timeframe) {
    query = query.where(eq(leaderboards.timeframe, timeframe));
  }

  const availableLeaderboards = await query
    .orderBy(asc(leaderboards.category), asc(leaderboards.name));

  // Group by category for better organization
  const groupedLeaderboards = availableLeaderboards.reduce((acc, board) => {
    if (!acc[board.category]) {
      acc[board.category] = [];
    }
    acc[board.category].push(board);
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      leaderboards: availableLeaderboards,
      grouped: groupedLeaderboards,
      categories: Object.keys(groupedLeaderboards)
    }
  });
}));

// Get specific leaderboard with rankings
router.get('/:id', [
  param('id').isInt().withMessage('Leaderboard ID must be an integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('showTrends').optional().isBoolean().withMessage('Show trends must be a boolean'),
  query('includeMe').optional().isBoolean().withMessage('Include me must be a boolean')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const leaderboardId = parseInt(req.params.id);
  const { limit = 50, offset = 0, showTrends = true, includeMe = true } = req.query;
  const userId = req.user?.id;

  // Get leaderboard details
  const leaderboard = await db.select()
    .from(leaderboards)
    .where(and(
      eq(leaderboards.id, leaderboardId),
      eq(leaderboards.isVisible, true)
    ))
    .limit(1);

  if (!leaderboard.length) {
    throw new AppError('Leaderboard not found', 404, 'LEADERBOARD_NOT_FOUND');
  }

  const board = leaderboard[0];

  // Get entries with user details
  let entriesQuery = db.select({
    rank: leaderboardEntries.rank,
    score: leaderboardEntries.score,
    previousRank: leaderboardEntries.previousRank,
    previousScore: leaderboardEntries.previousScore,
    personalBest: leaderboardEntries.personalBest,
    streakCount: leaderboardEntries.streakCount,
    trendData: leaderboardEntries.trendData,
    lastActivity: leaderboardEntries.lastActivity,
    userId: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    username: users.username,
    avatar: users.avatar,
    isPremium: users.isPremium
  })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .where(eq(leaderboardEntries.leaderboardId, leaderboardId))
    .orderBy(asc(leaderboardEntries.rank))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  // Apply scope filters
  if (board.scope === 'friends' && userId) {
    const friendIds = await getFriendIds(userId);
    friendIds.push(userId); // Include self
    entriesQuery = entriesQuery.where(inArray(leaderboardEntries.userId, friendIds));
  }

  const entries = await entriesQuery;

  // Get user's position if not in current page
  let userPosition = null;
  if (includeMe && userId) {
    const userEntry = await db.select({
      rank: leaderboardEntries.rank,
      score: leaderboardEntries.score,
      previousRank: leaderboardEntries.previousRank,
      previousScore: leaderboardEntries.previousScore,
      personalBest: leaderboardEntries.personalBest,
      streakCount: leaderboardEntries.streakCount,
      trendData: leaderboardEntries.trendData,
      lastActivity: leaderboardEntries.lastActivity,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      avatar: users.avatar,
      isPremium: users.isPremium
    })
      .from(leaderboardEntries)
      .innerJoin(users, eq(leaderboardEntries.userId, users.id))
      .where(and(
        eq(leaderboardEntries.leaderboardId, leaderboardId),
        eq(leaderboardEntries.userId, userId)
      ))
      .limit(1);

    userPosition = userEntry[0] || null;
  }

  // Calculate statistics
  const totalParticipants = await db.select({ count: sql`count(*)` })
    .from(leaderboardEntries)
    .where(eq(leaderboardEntries.leaderboardId, leaderboardId));

  const stats = {
    totalParticipants: totalParticipants[0].count,
    averageScore: 0,
    topScore: entries[0]?.score || 0,
    competitionLevel: calculateCompetitionLevel(entries)
  };

  // Add trend calculations if requested
  if (showTrends) {
    for (const entry of entries) {
      entry.trend = calculateTrend(entry);
    }
  }

  res.json({
    success: true,
    data: {
      leaderboard: board,
      entries,
      userPosition,
      statistics: stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: stats.totalParticipants
      }
    }
  });
}));

// Get personalized leaderboard dashboard
router.get('/dashboard/personal', catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user's entries across different leaderboards
  const userEntries = await db.select({
    leaderboardId: leaderboards.id,
    leaderboardName: leaderboards.name,
    category: leaderboards.category,
    timeframe: leaderboards.timeframe,
    rank: leaderboardEntries.rank,
    score: leaderboardEntries.score,
    previousRank: leaderboardEntries.previousRank,
    totalParticipants: sql`(SELECT COUNT(*) FROM ${leaderboardEntries} le WHERE le.leaderboard_id = ${leaderboards.id})`,
    percentile: sql`(100.0 * (${leaderboardEntries.rank} - 1) / (SELECT COUNT(*) FROM ${leaderboardEntries} le WHERE le.leaderboard_id = ${leaderboards.id}))`,
    personalBest: leaderboardEntries.personalBest,
    streakCount: leaderboardEntries.streakCount
  })
    .from(leaderboardEntries)
    .innerJoin(leaderboards, eq(leaderboardEntries.leaderboardId, leaderboards.id))
    .where(and(
      eq(leaderboardEntries.userId, userId),
      eq(leaderboards.isActive, true),
      eq(leaderboards.isVisible, true)
    ))
    .orderBy(asc(leaderboardEntries.rank));

  // Get recent achievements
  const recentAchievements = await db.select({
    achievementName: achievements.name,
    achievementIcon: achievements.icon,
    achievementRarity: achievements.rarity,
    pointsReward: achievements.pointsReward,
    unlockedAt: userAchievementProgress.unlockedAt
  })
    .from(userAchievementProgress)
    .innerJoin(achievements, eq(userAchievementProgress.achievementId, achievements.id))
    .where(and(
      eq(userAchievementProgress.userId, userId),
      eq(userAchievementProgress.isUnlocked, true)
    ))
    .orderBy(desc(userAchievementProgress.unlockedAt))
    .limit(5);

  // Calculate performance insights
  const insights = calculatePersonalInsights(userEntries);

  res.json({
    success: true,
    data: {
      userEntries,
      recentAchievements,
      insights,
      summary: {
        totalLeaderboards: userEntries.length,
        topTenCount: userEntries.filter(e => e.rank <= 10).length,
        personalBests: userEntries.filter(e => e.personalBest).length,
        averagePercentile: userEntries.reduce((sum, e) => sum + parseFloat(e.percentile), 0) / userEntries.length || 0
      }
    }
  });
}));

// Get friends' leaderboard comparison
router.get('/friends/comparison', [
  query('category').optional().isString().withMessage('Category must be a string'),
  query('timeframe').optional().isIn(['daily', 'weekly', 'monthly', 'yearly', 'all_time']).withMessage('Invalid timeframe')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const { category, timeframe } = req.query;

  // Get friends
  const friendIds = await getFriendIds(userId);
  friendIds.push(userId); // Include self

  if (friendIds.length === 1) {
    return res.json({
      success: true,
      data: {
        comparison: [],
        message: 'Add friends to see comparisons!'
      }
    });
  }

  // Get leaderboards to compare
  let boardsQuery = db.select()
    .from(leaderboards)
    .where(and(
      eq(leaderboards.isActive, true),
      eq(leaderboards.isVisible, true),
      or(
        eq(leaderboards.scope, 'global'),
        eq(leaderboards.scope, 'friends')
      )
    ));

  if (category) {
    boardsQuery = boardsQuery.where(eq(leaderboards.category, category));
  }
  if (timeframe) {
    boardsQuery = boardsQuery.where(eq(leaderboards.timeframe, timeframe));
  }

  const boards = await boardsQuery.limit(10);

  const comparisons = [];

  for (const board of boards) {
    const friendEntries = await db.select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      avatar: users.avatar,
      rank: leaderboardEntries.rank,
      score: leaderboardEntries.score,
      previousRank: leaderboardEntries.previousRank
    })
      .from(leaderboardEntries)
      .innerJoin(users, eq(leaderboardEntries.userId, users.id))
      .where(and(
        eq(leaderboardEntries.leaderboardId, board.id),
        inArray(leaderboardEntries.userId, friendIds)
      ))
      .orderBy(asc(leaderboardEntries.rank));

    if (friendEntries.length > 0) {
      comparisons.push({
        leaderboard: board,
        entries: friendEntries,
        userRank: friendEntries.find(e => e.userId === userId)?.rank || null
      });
    }
  }

  res.json({
    success: true,
    data: {
      comparison: comparisons,
      friendCount: friendIds.length - 1
    }
  });
}));

// Create custom leaderboard (for study groups, classes, etc.)
router.post('/custom', [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('category').notEmpty().withMessage('Category is required'),
  body('subcategory').optional().isString().withMessage('Subcategory must be a string'),
  body('scope').isIn(['global', 'school', 'friends', 'class']).withMessage('Invalid scope'),
  body('timeframe').isIn(['daily', 'weekly', 'monthly', 'yearly', 'all_time']).withMessage('Invalid timeframe'),
  body('metricType').isIn(['sum', 'average', 'max', 'count', 'ratio']).withMessage('Invalid metric type'),
  body('calculationFormula').optional().isString().withMessage('Calculation formula must be a string'),
  body('maxDisplayRank').optional().isInt({ min: 1, max: 1000 }).withMessage('Max display rank must be between 1 and 1000')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const leaderboardData = req.body;

  // Create the leaderboard
  const newLeaderboard = await db.insert(leaderboards)
    .values({
      ...leaderboardData,
      isActive: true,
      isVisible: true,
      createdBy: userId // Assuming we add this field to the schema
    })
    .returning();

  res.json({
    success: true,
    message: 'Custom leaderboard created successfully',
    data: newLeaderboard[0]
  });
}));

// Update leaderboard entry (for real-time updates)
router.put('/entries', [
  body('leaderboardId').isInt().withMessage('Leaderboard ID must be an integer'),
  body('score').isNumeric().withMessage('Score must be numeric'),
  body('rawMetrics').optional().isObject().withMessage('Raw metrics must be an object')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { leaderboardId, score, rawMetrics = {} } = req.body;
  const userId = req.user.id;

  // Verify leaderboard exists and is active
  const leaderboard = await db.select()
    .from(leaderboards)
    .where(and(
      eq(leaderboards.id, leaderboardId),
      eq(leaderboards.isActive, true)
    ))
    .limit(1);

  if (!leaderboard.length) {
    throw new AppError('Leaderboard not found or inactive', 404, 'LEADERBOARD_NOT_FOUND');
  }

  // Get current entry
  const currentEntry = await db.select()
    .from(leaderboardEntries)
    .where(and(
      eq(leaderboardEntries.leaderboardId, leaderboardId),
      eq(leaderboardEntries.userId, userId)
    ))
    .limit(1);

  const updateData = {
    score: parseFloat(score),
    rawMetrics,
    lastActivity: new Date(),
    updatedAt: new Date()
  };

  // Check for personal best
  if (!currentEntry.length || parseFloat(score) > parseFloat(currentEntry[0].score)) {
    updateData.personalBest = true;
    updateData.previousScore = currentEntry[0]?.score || 0;
  }

  let updatedEntry;
  if (currentEntry.length) {
    // Update existing entry
    updateData.previousRank = currentEntry[0].rank;
    
    updatedEntry = await db.update(leaderboardEntries)
      .set(updateData)
      .where(and(
        eq(leaderboardEntries.leaderboardId, leaderboardId),
        eq(leaderboardEntries.userId, userId)
      ))
      .returning();
  } else {
    // Create new entry
    updatedEntry = await db.insert(leaderboardEntries)
      .values({
        leaderboardId,
        userId,
        rank: 999999, // Temporary rank, will be recalculated
        ...updateData
      })
      .returning();
  }

  // Recalculate ranks for this leaderboard
  await recalculateLeaderboardRanks(leaderboardId);

  // Get updated entry with new rank
  const finalEntry = await db.select()
    .from(leaderboardEntries)
    .where(and(
      eq(leaderboardEntries.leaderboardId, leaderboardId),
      eq(leaderboardEntries.userId, userId)
    ))
    .limit(1);

  // Check for achievements
  const achievements = await checkLeaderboardAchievements(userId, leaderboardId, finalEntry[0]);

  res.json({
    success: true,
    message: 'Leaderboard entry updated successfully',
    data: {
      entry: finalEntry[0],
      achievements,
      rankImprovement: currentEntry.length ? currentEntry[0].rank - finalEntry[0].rank : null
    }
  });
}));

// Get leaderboard categories and available metrics
router.get('/metrics/available', catchAsync(async (req, res) => {
  const availableMetrics = {
    study_metrics: [
      { key: 'total_study_time', name: 'Total Study Time', unit: 'minutes' },
      { key: 'study_sessions_count', name: 'Study Sessions', unit: 'count' },
      { key: 'average_session_length', name: 'Average Session Length', unit: 'minutes' },
      { key: 'study_streak', name: 'Study Streak', unit: 'days' },
      { key: 'weekly_study_time', name: 'Weekly Study Time', unit: 'minutes' }
    ],
    academic_performance: [
      { key: 'quiz_accuracy', name: 'Quiz Accuracy', unit: 'percentage' },
      { key: 'total_quiz_score', name: 'Total Quiz Points', unit: 'points' },
      { key: 'homework_completion', name: 'Homework Completion', unit: 'percentage' },
      { key: 'average_grade', name: 'Average Grade', unit: 'gpa' },
      { key: 'improvement_rate', name: 'Improvement Rate', unit: 'percentage' }
    ],
    content_creation: [
      { key: 'notes_created', name: 'Notes Created', unit: 'count' },
      { key: 'notes_shared', name: 'Notes Shared', unit: 'count' },
      { key: 'flashcards_created', name: 'Flashcards Created', unit: 'count' },
      { key: 'content_quality_score', name: 'Content Quality', unit: 'score' }
    ],
    collaboration: [
      { key: 'help_given', name: 'Help Given', unit: 'count' },
      { key: 'group_participation', name: 'Group Participation', unit: 'score' },
      { key: 'peer_rating', name: 'Peer Rating', unit: 'stars' },
      { key: 'collaboration_hours', name: 'Collaboration Time', unit: 'hours' }
    ],
    engagement: [
      { key: 'daily_login_streak', name: 'Login Streak', unit: 'days' },
      { key: 'features_used', name: 'Features Used', unit: 'count' },
      { key: 'community_contributions', name: 'Community Contributions', unit: 'points' },
      { key: 'feedback_given', name: 'Feedback Given', unit: 'count' }
    ]
  };

  const categories = Object.keys(availableMetrics);

  res.json({
    success: true,
    data: {
      metrics: availableMetrics,
      categories,
      totalMetrics: categories.reduce((sum, cat) => sum + availableMetrics[cat].length, 0)
    }
  });
}));

// Get competitive challenges
router.get('/challenges/active', [
  query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'legendary']).withMessage('Invalid difficulty'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { difficulty, category, limit = 10 } = req.query;
  const userId = req.user.id;

  // Get active competitive challenges (these would be special leaderboards)
  let challengesQuery = db.select({
    id: leaderboards.id,
    name: leaderboards.name,
    description: leaderboards.description,
    category: leaderboards.category,
    timeframe: leaderboards.timeframe,
    participantCount: sql`(SELECT COUNT(*) FROM ${leaderboardEntries} WHERE leaderboard_id = ${leaderboards.id})`,
    userRank: sql`(SELECT rank FROM ${leaderboardEntries} WHERE leaderboard_id = ${leaderboards.id} AND user_id = ${userId})`,
    topScore: sql`(SELECT score FROM ${leaderboardEntries} WHERE leaderboard_id = ${leaderboards.id} ORDER BY rank ASC LIMIT 1)`,
    rewardsEnabled: leaderboards.rewardsEnabled,
    badgeSystem: leaderboards.badgeSystem
  })
    .from(leaderboards)
    .where(and(
      eq(leaderboards.isActive, true),
      eq(leaderboards.isVisible, true),
      eq(leaderboards.scope, 'global')
    ));

  if (category) {
    challengesQuery = challengesQuery.where(eq(leaderboards.category, category));
  }

  const challenges = await challengesQuery
    .orderBy(desc(sql`participant_count`))
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: challenges
  });
}));

// Helper Functions

async function getFriendIds(userId) {
  const friends = await db.select({
    friendId: sql`CASE 
      WHEN ${friendships.requesterId} = ${userId} THEN ${friendships.addresseeId}
      ELSE ${friendships.requesterId}
    END`
  })
    .from(friendships)
    .where(and(
      or(
        eq(friendships.requesterId, userId),
        eq(friendships.addresseeId, userId)
      ),
      eq(friendships.status, 'accepted')
    ));

  return friends.map(f => f.friendId);
}

function calculateCompetitionLevel(entries) {
  if (entries.length < 3) return 'low';
  
  const scores = entries.map(e => parseFloat(e.score));
  const variance = calculateVariance(scores);
  
  if (variance > 1000) return 'high';
  if (variance > 100) return 'medium';
  return 'low';
}

function calculateVariance(scores) {
  if (scores.length === 0) return 0;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
}

function calculateTrend(entry) {
  const currentRank = entry.rank;
  const previousRank = entry.previousRank;
  
  if (!previousRank) return 'new';
  if (currentRank < previousRank) return 'up';
  if (currentRank > previousRank) return 'down';
  return 'same';
}

function calculatePersonalInsights(userEntries) {
  const insights = {
    strengths: [],
    improvementAreas: [],
    trends: [],
    recommendations: []
  };

  // Analyze top categories
  const topCategories = userEntries
    .filter(e => e.rank <= 10)
    .map(e => e.category);

  if (topCategories.length > 0) {
    insights.strengths.push(`Excelling in ${topCategories.join(', ')}`);
  }

  // Find areas for improvement
  const weakCategories = userEntries
    .filter(e => e.percentile > 75)
    .map(e => e.category);

  if (weakCategories.length > 0) {
    insights.improvementAreas.push(`Room for growth in ${weakCategories.join(', ')}`);
  }

  // Trend analysis
  const improving = userEntries.filter(e => e.rank < (e.previousRank || 999)).length;
  const declining = userEntries.filter(e => e.rank > (e.previousRank || 0)).length;

  if (improving > declining) {
    insights.trends.push('Overall upward trend');
  } else if (declining > improving) {
    insights.trends.push('Some areas declining');
  } else {
    insights.trends.push('Stable performance');
  }

  return insights;
}

async function recalculateLeaderboardRanks(leaderboardId) {
  // Get all entries for this leaderboard ordered by score
  const entries = await db.select()
    .from(leaderboardEntries)
    .where(eq(leaderboardEntries.leaderboardId, leaderboardId))
    .orderBy(desc(leaderboardEntries.score));

  // Update ranks
  for (let i = 0; i < entries.length; i++) {
    await db.update(leaderboardEntries)
      .set({ rank: i + 1, updatedAt: new Date() })
      .where(eq(leaderboardEntries.id, entries[i].id));
  }
}

async function checkLeaderboardAchievements(userId, leaderboardId, entry) {
  const achievements = [];
  
  // Check for rank-based achievements
  if (entry.rank === 1) {
    achievements.push('leaderboard_champion');
  } else if (entry.rank <= 3) {
    achievements.push('top_three');
  } else if (entry.rank <= 10) {
    achievements.push('top_ten');
  }

  // Check for personal best
  if (entry.personalBest) {
    achievements.push('personal_best');
  }

  // Check for streak achievements
  if (entry.streakCount >= 7) {
    achievements.push('week_streak');
  }
  if (entry.streakCount >= 30) {
    achievements.push('month_streak');
  }

  // Process achievements (this would update the achievements system)
  // Implementation would depend on your achievements processing logic

  return achievements;
}

export default router;