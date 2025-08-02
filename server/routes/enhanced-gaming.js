import express from 'express';
import { eq, desc, asc, count, and, or, gte, lte, inArray, sql, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  educationalGames,
  gameSessions,
  gameTournaments,
  tournamentParticipants,
  gameLeaderboards,
  leaderboardEntries,
  gameAchievements,
  userGameAchievements,
  gameAnalytics
} from '../db/enhanced-gaming-schema.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// GAME CATALOG AND DISCOVERY

// Get available educational games
router.get('/games', async (req, res) => {
  try {
    const { 
      category, 
      subject, 
      gradeLevel, 
      gameType, 
      difficulty,
      featured,
      search,
      sortBy = 'rating',
      order = 'desc',
      page = 1,
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db.select({
      id: educationalGames.id,
      gameId: educationalGames.gameId,
      name: educationalGames.name,
      displayName: educationalGames.displayName,
      description: educationalGames.description,
      shortDescription: educationalGames.shortDescription,
      category: educationalGames.category,
      gameType: educationalGames.gameType,
      genre: educationalGames.genre,
      subject: educationalGames.subject,
      topics: educationalGames.topics,
      gradeLevel: educationalGames.gradeLevel,
      skillsTargeted: educationalGames.skillsTargeted,
      minPlayers: educationalGames.minPlayers,
      maxPlayers: educationalGames.maxPlayers,
      averagePlayTime: educationalGames.averagePlayTime,
      averageRating: educationalGames.averageRating,
      playCount: educationalGames.playCount,
      completionRate: educationalGames.completionRate,
      hasLeaderboards: educationalGames.hasLeaderboards,
      hasTournaments: educationalGames.hasTournaments,
      hasAchievements: educationalGames.hasAchievements,
      isFeatured: educationalGames.isFeatured,
      status: educationalGames.status,
      createdAt: educationalGames.createdAt
    }).from(educationalGames);

    // Add filters
    let conditions = [eq(educationalGames.status, 'active')];

    if (category) {
      conditions.push(eq(educationalGames.category, category));
    }

    if (subject) {
      conditions.push(eq(educationalGames.subject, subject));
    }

    if (gradeLevel) {
      conditions.push(eq(educationalGames.gradeLevel, gradeLevel));
    }

    if (gameType) {
      conditions.push(eq(educationalGames.gameType, gameType));
    }

    if (featured === 'true') {
      conditions.push(eq(educationalGames.isFeatured, true));
    }

    if (search) {
      conditions.push(
        or(
          like(educationalGames.name, `%${search}%`),
          like(educationalGames.displayName, `%${search}%`),
          like(educationalGames.description, `%${search}%`)
        )
      );
    }

    query = query.where(and(...conditions));

    // Add sorting
    const orderDirection = order === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'name':
        query = query.orderBy(orderDirection(educationalGames.displayName));
        break;
      case 'popularity':
        query = query.orderBy(orderDirection(educationalGames.playCount));
        break;
      case 'newest':
        query = query.orderBy(orderDirection(educationalGames.createdAt));
        break;
      case 'completion':
        query = query.orderBy(orderDirection(educationalGames.completionRate));
        break;
      default:
        query = query.orderBy(orderDirection(educationalGames.averageRating));
    }

    const games = await query.limit(parseInt(limit)).offset(offset);

    // Get total count
    const totalQuery = db.select({ count: count() }).from(educationalGames).where(and(...conditions));
    const [{ count: totalCount }] = await totalQuery;

    res.json({
      games,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get specific game details
router.get('/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    const [game] = await db.select()
      .from(educationalGames)
      .where(eq(educationalGames.gameId, gameId));

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get user's recent sessions with this game
    const recentSessions = await db.select({
      sessionId: gameSessions.sessionId,
      startedAt: gameSessions.startedAt,
      endedAt: gameSessions.endedAt,
      finalScore: gameSessions.finalScore,
      percentageScore: gameSessions.percentageScore,
      levelReached: gameSessions.levelReached,
      status: gameSessions.status
    })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.gameId, game.id),
        eq(gameSessions.userId, req.user.id)
      )
    )
    .orderBy(desc(gameSessions.startedAt))
    .limit(5);

    // Get user's achievements for this game
    const achievements = await db.select({
      achievementId: gameAchievements.achievementId,
      name: gameAchievements.name,
      description: gameAchievements.description,
      category: gameAchievements.category,
      difficulty: gameAchievements.difficulty,
      pointsReward: gameAchievements.pointsReward,
      badgeIcon: gameAchievements.badgeIcon,
      isUnlocked: userGameAchievements.isUnlocked,
      unlockedAt: userGameAchievements.unlockedAt,
      progress: userGameAchievements.progress
    })
    .from(gameAchievements)
    .leftJoin(
      userGameAchievements, 
      and(
        eq(gameAchievements.id, userGameAchievements.achievementId),
        eq(userGameAchievements.userId, req.user.id)
      )
    )
    .where(eq(gameAchievements.gameId, game.id))
    .orderBy(asc(gameAchievements.difficulty));

    res.json({
      game,
      recentSessions,
      achievements,
      userStats: {
        totalSessions: recentSessions.length,
        bestScore: Math.max(...recentSessions.map(s => s.finalScore || 0)),
        achievementsUnlocked: achievements.filter(a => a.isUnlocked).length,
        totalAchievements: achievements.length
      }
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// GAME SESSIONS AND PLAY TRACKING

// Start new game session
router.post('/games/:gameId/sessions', async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      sessionType = 'solo',
      gameMode,
      difficultyLevel,
      teamId
    } = req.body;

    // Verify game exists and is active
    const [game] = await db.select()
      .from(educationalGames)
      .where(
        and(
          eq(educationalGames.gameId, gameId),
          eq(educationalGames.status, 'active')
        )
      );

    if (!game) {
      return res.status(404).json({ error: 'Game not found or inactive' });
    }

    const [newSession] = await db.insert(gameSessions).values({
      gameId: game.id,
      userId: req.user.id,
      sessionType,
      gameMode,
      difficultyLevel,
      teamId,
      maxScore: game.maxScore
    }).returning();

    // Update game play count
    await db.update(educationalGames)
      .set({ 
        playCount: sql`${educationalGames.playCount} + 1`,
        lastUpdate: new Date()
      })
      .where(eq(educationalGames.id, game.id));

    res.status(201).json({
      message: 'Game session started successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Error starting game session:', error);
    res.status(500).json({ error: 'Failed to start game session' });
  }
});

// Update game session (for real-time progress tracking)
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    // Verify session ownership
    const [session] = await db.select()
      .from(gameSessions)
      .where(eq(gameSessions.sessionId, sessionId));

    if (!session || session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [updatedSession] = await db.update(gameSessions)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(gameSessions.sessionId, sessionId))
      .returning();

    res.json({
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Complete game session
router.post('/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      finalScore,
      levelReached,
      accuracy,
      gameMetrics = {},
      skillsImproved = [],
      enjoymentRating,
      difficultyRating
    } = req.body;

    // Verify session ownership
    const [session] = await db.select()
      .from(gameSessions)
      .where(eq(gameSessions.sessionId, sessionId));

    if (!session || session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const endTime = new Date();
    const totalPlayTime = Math.round((endTime - new Date(session.startedAt)) / 1000);
    const percentageScore = session.maxScore ? (finalScore / session.maxScore) * 100 : null;

    // Update session with completion data
    const [completedSession] = await db.update(gameSessions)
      .set({
        endedAt: endTime,
        totalPlayTime,
        finalScore,
        percentageScore,
        levelReached,
        accuracy,
        gameMetrics,
        skillsImproved,
        enjoymentRating,
        difficultyRating,
        status: 'completed',
        completionPercentage: 100,
        updatedAt: new Date()
      })
      .where(eq(gameSessions.sessionId, sessionId))
      .returning();

    // Check for achievement unlocks
    const unlockedAchievements = await checkAndUnlockAchievements(
      req.user.id, 
      session.gameId, 
      completedSession
    );

    res.json({
      message: 'Game session completed successfully',
      session: completedSession,
      achievementsUnlocked: unlockedAchievements
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// LEADERBOARDS AND RANKINGS

// Get game leaderboards
router.get('/games/:gameId/leaderboards', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { type = 'global', period = 'all_time', limit = 50 } = req.query;

    // Verify game exists
    const [game] = await db.select()
      .from(educationalGames)
      .where(eq(educationalGames.gameId, gameId));

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get appropriate leaderboard
    const [leaderboard] = await db.select()
      .from(gameLeaderboards)
      .where(
        and(
          eq(gameLeaderboards.gameId, game.id),
          eq(gameLeaderboards.leaderboardType, type),
          eq(gameLeaderboards.periodType, period),
          eq(gameLeaderboards.isActive, true)
        )
      );

    if (!leaderboard) {
      return res.status(404).json({ error: 'Leaderboard not found' });
    }

    // Get leaderboard entries with user information
    const entries = await db.select({
      rank: leaderboardEntries.rank,
      score: leaderboardEntries.score,
      gamesPlayed: leaderboardEntries.gamesPlayed,
      bestScore: leaderboardEntries.bestScore,
      averageScore: leaderboardEntries.averageScore,
      totalPlayTime: leaderboardEntries.totalPlayTime,
      rankChange: leaderboardEntries.rankChange,
      lastUpdate: leaderboardEntries.lastUpdate,
      userId: leaderboardEntries.userId,
      // User info would be joined here in a real implementation
    })
    .from(leaderboardEntries)
    .where(eq(leaderboardEntries.leaderboardId, leaderboard.id))
    .orderBy(asc(leaderboardEntries.rank))
    .limit(parseInt(limit));

    // Get user's position if they're not in top entries
    let userPosition = null;
    const userEntry = await db.select()
      .from(leaderboardEntries)
      .where(
        and(
          eq(leaderboardEntries.leaderboardId, leaderboard.id),
          eq(leaderboardEntries.userId, req.user.id)
        )
      );

    if (userEntry.length > 0) {
      userPosition = userEntry[0];
    }

    res.json({
      leaderboard: {
        name: leaderboard.name,
        type: leaderboard.leaderboardType,
        period: leaderboard.periodType,
        metric: leaderboard.metric,
        lastReset: leaderboard.lastReset
      },
      entries,
      userPosition,
      totalEntries: entries.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// TOURNAMENTS

// Get available tournaments
router.get('/tournaments', async (req, res) => {
  try {
    const { 
      gameId, 
      status = 'upcoming', 
      tournamentType,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db.select({
      id: gameTournaments.id,
      tournamentId: gameTournaments.tournamentId,
      name: gameTournaments.name,
      description: gameTournaments.description,
      gameId: gameTournaments.gameId,
      tournamentType: gameTournaments.tournamentType,
      format: gameTournaments.format,
      maxParticipants: gameTournaments.maxParticipants,
      currentParticipants: gameTournaments.currentParticipants,
      entryFee: gameTournaments.entryFee,
      skillLevel: gameTournaments.skillLevel,
      registrationStart: gameTournaments.registrationStart,
      registrationEnd: gameTournaments.registrationEnd,
      tournamentStart: gameTournaments.tournamentStart,
      tournamentEnd: gameTournaments.tournamentEnd,
      prizePool: gameTournaments.prizePool,
      status: gameTournaments.status,
      isPublic: gameTournaments.isPublic,
      createdAt: gameTournaments.createdAt
    }).from(gameTournaments);

    // Add filters
    let conditions = [eq(gameTournaments.isPublic, true)];

    if (gameId) {
      const [game] = await db.select().from(educationalGames).where(eq(educationalGames.gameId, gameId));
      if (game) {
        conditions.push(eq(gameTournaments.gameId, game.id));
      }
    }

    if (status) {
      conditions.push(eq(gameTournaments.status, status));
    }

    if (tournamentType) {
      conditions.push(eq(gameTournaments.tournamentType, tournamentType));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(desc(gameTournaments.tournamentStart));

    const tournaments = await query.limit(parseInt(limit)).offset(offset);

    res.json({
      tournaments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(tournaments.length / limit),
        hasNextPage: tournaments.length === parseInt(limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Join tournament
router.post('/tournaments/:tournamentId/join', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { teamName, teamRole = 'member' } = req.body;

    // Verify tournament exists and is open for registration
    const [tournament] = await db.select()
      .from(gameTournaments)
      .where(eq(gameTournaments.tournamentId, tournamentId));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const now = new Date();
    if (tournament.status !== 'registration' || 
        now < new Date(tournament.registrationStart) || 
        now > new Date(tournament.registrationEnd)) {
      return res.status(400).json({ error: 'Tournament registration is not open' });
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Check if user is already registered
    const existingParticipant = await db.select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournament.id),
          eq(tournamentParticipants.userId, req.user.id)
        )
      );

    if (existingParticipant.length > 0) {
      return res.status(400).json({ error: 'Already registered for this tournament' });
    }

    // Generate team ID if needed
    const teamId = teamName ? `team_${Date.now()}` : null;

    // Register participant
    const [participant] = await db.insert(tournamentParticipants).values({
      tournamentId: tournament.id,
      userId: req.user.id,
      teamId,
      teamName,
      teamRole,
      seedRank: tournament.currentParticipants + 1
    }).returning();

    // Update tournament participant count
    await db.update(gameTournaments)
      .set({ 
        currentParticipants: sql`${gameTournaments.currentParticipants} + 1`,
        updatedAt: new Date()
      })
      .where(eq(gameTournaments.id, tournament.id));

    res.status(201).json({
      message: 'Successfully joined tournament',
      participant
    });
  } catch (error) {
    console.error('Error joining tournament:', error);
    res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// ACHIEVEMENTS

// Get user's achievements
router.get('/achievements', async (req, res) => {
  try {
    const { gameId, category, unlocked, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = db.select({
      achievementId: gameAchievements.achievementId,
      name: gameAchievements.name,
      description: gameAchievements.description,
      category: gameAchievements.category,
      difficulty: gameAchievements.difficulty,
      rarity: gameAchievements.rarity,
      pointsReward: gameAchievements.pointsReward,
      badgeIcon: gameAchievements.badgeIcon,
      badgeColor: gameAchievements.badgeColor,
      titleReward: gameAchievements.titleReward,
      isSecret: gameAchievements.isSecret,
      gameId: gameAchievements.gameId,
      // User achievement data
      progress: userGameAchievements.progress,
      currentValue: userGameAchievements.currentValue,
      isUnlocked: userGameAchievements.isUnlocked,
      unlockedAt: userGameAchievements.unlockedAt,
      isDisplayed: userGameAchievements.isDisplayed,
      isPinned: userGameAchievements.isPinned
    })
    .from(gameAchievements)
    .leftJoin(
      userGameAchievements,
      and(
        eq(gameAchievements.id, userGameAchievements.achievementId),
        eq(userGameAchievements.userId, req.user.id)
      )
    );

    // Add filters
    let conditions = [eq(gameAchievements.isActive, true)];

    if (gameId) {
      const [game] = await db.select().from(educationalGames).where(eq(educationalGames.gameId, gameId));
      if (game) {
        conditions.push(eq(gameAchievements.gameId, game.id));
      }
    }

    if (category) {
      conditions.push(eq(gameAchievements.category, category));
    }

    if (unlocked === 'true') {
      conditions.push(eq(userGameAchievements.isUnlocked, true));
    } else if (unlocked === 'false') {
      conditions.push(
        or(
          eq(userGameAchievements.isUnlocked, false),
          eq(userGameAchievements.isUnlocked, null)
        )
      );
    }

    query = query.where(and(...conditions));
    query = query.orderBy(
      desc(userGameAchievements.isUnlocked),
      desc(userGameAchievements.unlockedAt),
      asc(gameAchievements.difficulty)
    );

    const achievements = await query.limit(parseInt(limit)).offset(offset);

    // Calculate summary statistics
    const totalAchievements = achievements.length;
    const unlockedAchievements = achievements.filter(a => a.isUnlocked).length;
    const totalPoints = achievements
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + (a.pointsReward || 0), 0);

    res.json({
      achievements,
      summary: {
        totalAchievements,
        unlockedAchievements,
        unlockedPercentage: totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0,
        totalPoints,
        completionRate: totalAchievements > 0 ? (unlockedAchievements / totalAchievements) : 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAchievements / limit),
        hasNextPage: achievements.length === parseInt(limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// ANALYTICS AND INSIGHTS

// Get user's gaming analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get overall gaming statistics
    const overallStats = await db.select({
      totalSessions: count(),
      totalPlayTime: sql`SUM(${gameSessions.totalPlayTime})`,
      averageScore: sql`AVG(${gameSessions.finalScore})`,
      completedSessions: sql`COUNT(*) FILTER (WHERE ${gameSessions.status} = 'completed')`,
      averageAccuracy: sql`AVG(${gameSessions.accuracy})`,
      totalPointsEarned: sql`SUM(${gameSessions.pointsEarned})`
    })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.userId, req.user.id),
        gte(gameSessions.startedAt, startDate),
        lte(gameSessions.startedAt, endDate)
      )
    );

    // Get performance by game category
    const categoryStats = await db.select({
      category: educationalGames.category,
      sessionCount: count(),
      averageScore: sql`AVG(${gameSessions.finalScore})`,
      totalPlayTime: sql`SUM(${gameSessions.totalPlayTime})`
    })
    .from(gameSessions)
    .innerJoin(educationalGames, eq(gameSessions.gameId, educationalGames.id))
    .where(
      and(
        eq(gameSessions.userId, req.user.id),
        gte(gameSessions.startedAt, startDate),
        lte(gameSessions.startedAt, endDate)
      )
    )
    .groupBy(educationalGames.category);

    // Get recent achievements
    const recentAchievements = await db.select({
      achievementId: gameAchievements.achievementId,
      name: gameAchievements.name,
      description: gameAchievements.description,
      pointsReward: gameAchievements.pointsReward,
      badgeIcon: gameAchievements.badgeIcon,
      unlockedAt: userGameAchievements.unlockedAt
    })
    .from(userGameAchievements)
    .innerJoin(gameAchievements, eq(userGameAchievements.achievementId, gameAchievements.id))
    .where(
      and(
        eq(userGameAchievements.userId, req.user.id),
        eq(userGameAchievements.isUnlocked, true),
        gte(userGameAchievements.unlockedAt, startDate)
      )
    )
    .orderBy(desc(userGameAchievements.unlockedAt))
    .limit(10);

    res.json({
      period,
      dateRange: { startDate, endDate },
      overallStats: overallStats[0],
      categoryStats,
      recentAchievements,
      insights: {
        mostPlayedCategory: categoryStats.length > 0 ? 
          categoryStats.reduce((prev, current) => prev.sessionCount > current.sessionCount ? prev : current).category : null,
        improvementAreas: categoryStats
          .filter(cat => parseFloat(cat.averageScore) < 70)
          .map(cat => cat.category),
        strengths: categoryStats
          .filter(cat => parseFloat(cat.averageScore) >= 85)
          .map(cat => cat.category)
      }
    });
  } catch (error) {
    console.error('Error fetching gaming analytics:', error);
    res.status(500).json({ error: 'Failed to fetch gaming analytics' });
  }
});

// HELPER FUNCTIONS

// Check and unlock achievements based on game session
async function checkAndUnlockAchievements(userId, gameId, session) {
  try {
    const unlockedAchievements = [];

    // Get all achievements for this game that the user hasn't unlocked
    const availableAchievements = await db.select()
      .from(gameAchievements)
      .leftJoin(
        userGameAchievements,
        and(
          eq(gameAchievements.id, userGameAchievements.achievementId),
          eq(userGameAchievements.userId, userId)
        )
      )
      .where(
        and(
          eq(gameAchievements.gameId, gameId),
          eq(gameAchievements.isActive, true),
          or(
            eq(userGameAchievements.isUnlocked, false),
            eq(userGameAchievements.isUnlocked, null)
          )
        )
      );

    for (const achievement of availableAchievements) {
      const criteria = achievement.criteria;
      let achieved = false;

      // Check different achievement criteria
      switch (achievement.metric) {
        case 'score':
          achieved = session.finalScore >= achievement.requiredValue;
          break;
        case 'accuracy':
          achieved = session.accuracy >= achievement.requiredValue;
          break;
        case 'completion':
          achieved = session.status === 'completed';
          break;
        case 'time':
          achieved = session.totalPlayTime <= achievement.requiredValue;
          break;
        // Add more criteria as needed
      }

      if (achieved) {
        // Create or update user achievement
        if (achievement.userGameAchievements) {
          // Update existing record
          await db.update(userGameAchievements)
            .set({
              isUnlocked: true,
              unlockedAt: new Date(),
              gameSessionId: session.id,
              progress: 100
            })
            .where(eq(userGameAchievements.id, achievement.userGameAchievements.id));
        } else {
          // Create new record
          await db.insert(userGameAchievements).values({
            userId,
            achievementId: achievement.id,
            isUnlocked: true,
            unlockedAt: new Date(),
            gameSessionId: session.id,
            progress: 100,
            currentValue: achievement.requiredValue
          });
        }

        // Update achievement statistics
        await db.update(gameAchievements)
          .set({
            totalUnlocked: sql`${gameAchievements.totalUnlocked} + 1`
          })
          .where(eq(gameAchievements.id, achievement.id));

        unlockedAchievements.push({
          achievementId: achievement.achievementId,
          name: achievement.name,
          pointsReward: achievement.pointsReward
        });
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

export default router;