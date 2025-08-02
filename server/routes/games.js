import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { db, games, gameScores, users, achievements, userAchievementProgress, leaderboardEntries, leaderboards } from '../db/index.js';
import { eq, and, desc, sql, gte, lte, inArray, or } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI for dynamic content generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Game definitions with comprehensive details
const GAME_DEFINITIONS = {
  // 1. Speed Math Challenge
  speed_math: {
    name: 'Speed Math Challenge',
    description: 'Solve math problems as quickly as possible',
    category: 'mathematics',
    difficulty_levels: ['easy', 'medium', 'hard', 'expert'],
    multiplayer: true,
    max_players: 8,
    duration: 120, // seconds
    scoring: {
      correct_answer: 10,
      speed_bonus: 5,
      streak_multiplier: 1.5
    }
  },
  
  // 2. Vocabulary Vault
  vocabulary_vault: {
    name: 'Vocabulary Vault',
    description: 'Build your vocabulary through word matching and definitions',
    category: 'language',
    difficulty_levels: ['beginner', 'intermediate', 'advanced', 'expert'],
    multiplayer: true,
    max_players: 6,
    duration: 180,
    scoring: {
      correct_match: 15,
      definition_bonus: 10,
      rare_word_bonus: 25
    }
  },
  
  // 3. Science Lab Simulator
  science_lab: {
    name: 'Science Lab Simulator',
    description: 'Conduct virtual experiments and learn scientific principles',
    category: 'science',
    difficulty_levels: ['basic', 'intermediate', 'advanced'],
    multiplayer: false,
    max_players: 1,
    duration: 300,
    scoring: {
      experiment_complete: 50,
      hypothesis_correct: 30,
      safety_bonus: 20
    }
  },
  
  // 4. History Timeline Race
  history_timeline: {
    name: 'History Timeline Race',
    description: 'Arrange historical events in chronological order',
    category: 'history',
    difficulty_levels: ['ancient', 'medieval', 'modern', 'contemporary'],
    multiplayer: true,
    max_players: 4,
    duration: 240,
    scoring: {
      correct_placement: 20,
      era_bonus: 15,
      perfect_timeline: 100
    }
  },
  
  // 5. Geography Quest
  geography_quest: {
    name: 'Geography Quest',
    description: 'Explore the world through interactive maps and challenges',
    category: 'geography',
    difficulty_levels: ['continents', 'countries', 'capitals', 'landmarks'],
    multiplayer: true,
    max_players: 6,
    duration: 200,
    scoring: {
      location_correct: 25,
      distance_accuracy: 10,
      cultural_bonus: 15
    }
  },
  
  // 6. Code Breaker
  code_breaker: {
    name: 'Code Breaker',
    description: 'Solve programming puzzles and algorithm challenges',
    category: 'computer_science',
    difficulty_levels: ['syntax', 'logic', 'algorithms', 'optimization'],
    multiplayer: true,
    max_players: 4,
    duration: 600,
    scoring: {
      solution_correct: 100,
      efficiency_bonus: 50,
      style_points: 25
    }
  },
  
  // 7. Literary Detective
  literary_detective: {
    name: 'Literary Detective',
    description: 'Analyze literature and solve literary mysteries',
    category: 'literature',
    difficulty_levels: ['classic', 'modern', 'poetry', 'analysis'],
    multiplayer: false,
    max_players: 1,
    duration: 400,
    scoring: {
      analysis_point: 30,
      quote_identification: 40,
      theme_recognition: 50
    }
  },
  
  // 8. Chemistry Mixer
  chemistry_mixer: {
    name: 'Chemistry Mixer',
    description: 'Mix compounds and learn chemical reactions',
    category: 'chemistry',
    difficulty_levels: ['elements', 'compounds', 'reactions', 'organic'],
    multiplayer: true,
    max_players: 3,
    duration: 250,
    scoring: {
      reaction_success: 40,
      prediction_bonus: 30,
      safety_compliance: 20
    }
  },
  
  // 9. Economics Empire
  economics_empire: {
    name: 'Economics Empire',
    description: 'Build and manage virtual economies',
    category: 'economics',
    difficulty_levels: ['basic', 'market', 'global', 'advanced'],
    multiplayer: true,
    max_players: 8,
    duration: 800,
    scoring: {
      profit_margin: 10,
      market_stability: 25,
      innovation_bonus: 35
    }
  },
  
  // 10. Physics Playground
  physics_playground: {
    name: 'Physics Playground',
    description: 'Solve physics puzzles using real-world principles',
    category: 'physics',
    difficulty_levels: ['mechanics', 'thermodynamics', 'electromagnetism', 'quantum'],
    multiplayer: false,
    max_players: 1,
    duration: 350,
    scoring: {
      law_application: 45,
      calculation_accuracy: 35,
      creative_solution: 60
    }
  }
};

// Get all available games
router.get('/', [
  query('category').optional().isString().withMessage('Category must be a string'),
  query('multiplayer').optional().isBoolean().withMessage('Multiplayer must be a boolean'),
  query('difficulty').optional().isString().withMessage('Difficulty must be a string')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { category, multiplayer, difficulty } = req.query;
  const userId = req.user.id;

  // Filter games based on query parameters
  let filteredGames = Object.entries(GAME_DEFINITIONS);

  if (category) {
    filteredGames = filteredGames.filter(([key, game]) => game.category === category);
  }

  if (multiplayer !== undefined) {
    filteredGames = filteredGames.filter(([key, game]) => game.multiplayer === multiplayer);
  }

  if (difficulty) {
    filteredGames = filteredGames.filter(([key, game]) => 
      game.difficulty_levels.includes(difficulty)
    );
  }

  // Get user's best scores for each game
  const userScores = await db.select({
    gameId: gameScores.gameId,
    bestScore: sql`MAX(${gameScores.score})`,
    gamesPlayed: sql`COUNT(*)`,
    averageScore: sql`AVG(${gameScores.score})`
  })
    .from(gameScores)
    .where(eq(gameScores.userId, userId))
    .groupBy(gameScores.gameId);

  const scoresMap = userScores.reduce((acc, score) => {
    acc[score.gameId] = score;
    return acc;
  }, {});

  // Get leaderboard positions for each game
  const gamesWithStats = await Promise.all(
    filteredGames.map(async ([gameId, gameInfo]) => {
      const globalLeaderboard = await db.select({
        rank: sql`ROW_NUMBER() OVER (ORDER BY score DESC)`,
        userId: gameScores.userId,
        score: gameScores.score
      })
        .from(gameScores)
        .where(eq(gameScores.gameId, gameId))
        .orderBy(desc(gameScores.score))
        .limit(100);

      const userRank = globalLeaderboard.findIndex(entry => entry.userId === userId) + 1;
      
      return {
        id: gameId,
        ...gameInfo,
        userStats: scoresMap[gameId] || null,
        globalRank: userRank || null,
        totalPlayers: globalLeaderboard.length
      };
    })
  );

  res.json({
    success: true,
    data: {
      games: gamesWithStats,
      categories: [...new Set(Object.values(GAME_DEFINITIONS).map(g => g.category))],
      totalGames: gamesWithStats.length
    }
  });
}));

// Get specific game details and leaderboard
router.get('/:gameId', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  query('difficulty').optional().isString().withMessage('Difficulty must be a string'),
  query('timeframe').optional().isIn(['daily', 'weekly', 'monthly', 'all_time']).withMessage('Invalid timeframe')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { difficulty, timeframe = 'all_time' } = req.query;
  const userId = req.user.id;

  if (!GAME_DEFINITIONS[gameId]) {
    throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
  }

  const gameInfo = GAME_DEFINITIONS[gameId];

  // Get timeframe filter
  let timeFilter = null;
  const now = new Date();
  switch (timeframe) {
    case 'daily':
      timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  // Build leaderboard query
  let leaderboardQuery = db.select({
    rank: sql`ROW_NUMBER() OVER (ORDER BY score DESC)`,
    userId: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    username: users.username,
    avatar: users.avatar,
    score: gameScores.score,
    difficulty: gameScores.difficulty,
    achievedAt: gameScores.achievedAt,
    metadata: gameScores.metadata
  })
    .from(gameScores)
    .innerJoin(users, eq(gameScores.userId, users.id))
    .where(eq(gameScores.gameId, gameId));

  if (difficulty) {
    leaderboardQuery = leaderboardQuery.where(eq(gameScores.difficulty, difficulty));
  }

  if (timeFilter) {
    leaderboardQuery = leaderboardQuery.where(gte(gameScores.achievedAt, timeFilter));
  }

  const leaderboard = await leaderboardQuery
    .orderBy(desc(gameScores.score))
    .limit(50);

  // Get user's personal best and recent games
  const userStats = await db.select({
    bestScore: sql`MAX(${gameScores.score})`,
    gamesPlayed: sql`COUNT(*)`,
    averageScore: sql`AVG(${gameScores.score})`,
    lastPlayed: sql`MAX(${gameScores.achievedAt})`
  })
    .from(gameScores)
    .where(and(
      eq(gameScores.gameId, gameId),
      eq(gameScores.userId, userId)
    ));

  const recentGames = await db.select()
    .from(gameScores)
    .where(and(
      eq(gameScores.gameId, gameId),
      eq(gameScores.userId, userId)
    ))
    .orderBy(desc(gameScores.achievedAt))
    .limit(10);

  res.json({
    success: true,
    data: {
      game: gameInfo,
      leaderboard,
      userStats: userStats[0] || null,
      recentGames,
      userRank: leaderboard.findIndex(entry => entry.userId === userId) + 1 || null
    }
  });
}));

// Start a new game session
router.post('/:gameId/start', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  body('difficulty').isString().withMessage('Difficulty is required'),
  body('multiplayer').optional().isBoolean().withMessage('Multiplayer must be a boolean'),
  body('customSettings').optional().isObject().withMessage('Custom settings must be an object')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { difficulty, multiplayer = false, customSettings = {} } = req.body;
  const userId = req.user.id;

  if (!GAME_DEFINITIONS[gameId]) {
    throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
  }

  const gameInfo = GAME_DEFINITIONS[gameId];

  if (!gameInfo.difficulty_levels.includes(difficulty)) {
    throw new AppError('Invalid difficulty level', 400, 'INVALID_DIFFICULTY');
  }

  // Generate game content based on game type and difficulty
  const gameContent = await generateGameContent(gameId, difficulty, customSettings);

  // Create game session
  const gameSession = await db.insert(games)
    .values({
      gameId,
      userId,
      difficulty,
      isMultiplayer: multiplayer,
      gameData: gameContent,
      metadata: {
        startTime: new Date(),
        settings: customSettings,
        expectedDuration: gameInfo.duration
      },
      status: 'active'
    })
    .returning();

  res.json({
    success: true,
    message: 'Game session started successfully',
    data: {
      sessionId: gameSession[0].id,
      gameContent,
      timeLimit: gameInfo.duration,
      scoring: gameInfo.scoring
    }
  });
}));

// Submit game results
router.post('/:gameId/submit', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  body('sessionId').isInt().withMessage('Session ID must be an integer'),
  body('answers').isArray().withMessage('Answers must be an array'),
  body('timeSpent').isInt({ min: 1 }).withMessage('Time spent must be a positive integer'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { sessionId, answers, timeSpent, metadata = {} } = req.body;
  const userId = req.user.id;

  // Verify game session
  const gameSession = await db.select()
    .from(games)
    .where(and(
      eq(games.id, sessionId),
      eq(games.userId, userId),
      eq(games.gameId, gameId),
      eq(games.status, 'active')
    ))
    .limit(1);

  if (!gameSession.length) {
    throw new AppError('Game session not found or already completed', 404, 'SESSION_NOT_FOUND');
  }

  const session = gameSession[0];
  const gameInfo = GAME_DEFINITIONS[gameId];

  // Calculate score based on answers and game-specific logic
  const scoreResult = await calculateGameScore(gameId, session.gameData, answers, timeSpent, session.difficulty);

  // Update game session
  await db.update(games)
    .set({
      status: 'completed',
      completedAt: new Date(),
      score: scoreResult.totalScore,
      metadata: {
        ...session.metadata,
        endTime: new Date(),
        finalAnswers: answers,
        scoreBreakdown: scoreResult.breakdown,
        ...metadata
      }
    })
    .where(eq(games.id, sessionId));

  // Save high score
  await db.insert(gameScores)
    .values({
      gameId,
      userId,
      score: scoreResult.totalScore,
      difficulty: session.difficulty,
      timeSpent,
      metadata: {
        answers,
        scoreBreakdown: scoreResult.breakdown,
        sessionId,
        ...metadata
      }
    });

  // Update leaderboards
  await updateGameLeaderboards(gameId, userId, scoreResult.totalScore, session.difficulty);

  // Check for achievements
  const newAchievements = await checkGameAchievements(userId, gameId, scoreResult, session.difficulty);

  // Get updated rank
  const updatedRank = await getUserGameRank(gameId, userId, session.difficulty);

  res.json({
    success: true,
    message: 'Game completed successfully!',
    data: {
      score: scoreResult.totalScore,
      breakdown: scoreResult.breakdown,
      rank: updatedRank,
      achievements: newAchievements,
      personalBest: await checkPersonalBest(userId, gameId, scoreResult.totalScore),
      nextDifficulty: getNextDifficulty(gameInfo, session.difficulty, scoreResult.totalScore)
    }
  });
}));

// Get game content/questions for practice
router.get('/:gameId/practice', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  query('difficulty').isString().withMessage('Difficulty is required'),
  query('count').optional().isInt({ min: 1, max: 50 }).withMessage('Count must be between 1 and 50')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { difficulty, count = 10 } = req.query;

  if (!GAME_DEFINITIONS[gameId]) {
    throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
  }

  const gameInfo = GAME_DEFINITIONS[gameId];

  if (!gameInfo.difficulty_levels.includes(difficulty)) {
    throw new AppError('Invalid difficulty level', 400, 'INVALID_DIFFICULTY');
  }

  // Generate practice content
  const practiceContent = await generateGameContent(gameId, difficulty, { count: parseInt(count), practice: true });

  res.json({
    success: true,
    data: practiceContent
  });
}));

// Get multiplayer lobby
router.get('/:gameId/lobby', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  query('difficulty').optional().isString().withMessage('Difficulty must be a string')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { difficulty } = req.query;

  if (!GAME_DEFINITIONS[gameId]) {
    throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
  }

  const gameInfo = GAME_DEFINITIONS[gameId];

  if (!gameInfo.multiplayer) {
    throw new AppError('Game does not support multiplayer', 400, 'NO_MULTIPLAYER_SUPPORT');
  }

  // Get active multiplayer sessions waiting for players
  let lobbyQuery = db.select({
    sessionId: games.id,
    hostUser: users.username,
    hostAvatar: users.avatar,
    difficulty: games.difficulty,
    currentPlayers: sql`1`, // Will be updated with actual count
    maxPlayers: sql`${gameInfo.max_players}`,
    createdAt: games.createdAt,
    metadata: games.metadata
  })
    .from(games)
    .innerJoin(users, eq(games.userId, users.id))
    .where(and(
      eq(games.gameId, gameId),
      eq(games.status, 'waiting'),
      eq(games.isMultiplayer, true)
    ));

  if (difficulty) {
    lobbyQuery = lobbyQuery.where(eq(games.difficulty, difficulty));
  }

  const lobbies = await lobbyQuery
    .orderBy(desc(games.createdAt))
    .limit(20);

  res.json({
    success: true,
    data: {
      lobbies,
      gameInfo: {
        name: gameInfo.name,
        maxPlayers: gameInfo.max_players,
        duration: gameInfo.duration
      }
    }
  });
}));

// Create multiplayer lobby
router.post('/:gameId/lobby/create', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  body('difficulty').isString().withMessage('Difficulty is required'),
  body('maxPlayers').optional().isInt({ min: 2, max: 8 }).withMessage('Max players must be between 2 and 8'),
  body('isPrivate').optional().isBoolean().withMessage('Is private must be a boolean')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { difficulty, maxPlayers, isPrivate = false } = req.body;
  const userId = req.user.id;

  if (!GAME_DEFINITIONS[gameId]) {
    throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
  }

  const gameInfo = GAME_DEFINITIONS[gameId];

  if (!gameInfo.multiplayer) {
    throw new AppError('Game does not support multiplayer', 400, 'NO_MULTIPLAYER_SUPPORT');
  }

  if (!gameInfo.difficulty_levels.includes(difficulty)) {
    throw new AppError('Invalid difficulty level', 400, 'INVALID_DIFFICULTY');
  }

  const finalMaxPlayers = maxPlayers || gameInfo.max_players;

  // Create lobby session
  const lobbySession = await db.insert(games)
    .values({
      gameId,
      userId,
      difficulty,
      isMultiplayer: true,
      status: 'waiting',
      metadata: {
        isPrivate,
        maxPlayers: finalMaxPlayers,
        currentPlayers: 1,
        lobbyCode: generateLobbyCode(),
        createdAt: new Date()
      }
    })
    .returning();

  res.json({
    success: true,
    message: 'Multiplayer lobby created successfully',
    data: {
      sessionId: lobbySession[0].id,
      lobbyCode: lobbySession[0].metadata.lobbyCode,
      maxPlayers: finalMaxPlayers,
      isPrivate
    }
  });
}));

// Get comprehensive game statistics
router.get('/:gameId/statistics', [
  param('gameId').isString().withMessage('Game ID must be a string'),
  query('timeframe').optional().isIn(['week', 'month', 'quarter', 'year', 'all_time']).withMessage('Invalid timeframe')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { gameId } = req.params;
  const { timeframe = 'all_time' } = req.query;
  const userId = req.user.id;

  if (!GAME_DEFINITIONS[gameId]) {
    throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
  }

  // Get comprehensive statistics
  const stats = await getGameStatistics(gameId, userId, timeframe);

  res.json({
    success: true,
    data: stats
  });
}));

// Helper Functions

async function generateGameContent(gameId, difficulty, settings = {}) {
  const gameInfo = GAME_DEFINITIONS[gameId];
  const count = settings.count || 20;

  switch (gameId) {
    case 'speed_math':
      return generateMathProblems(difficulty, count);
    
    case 'vocabulary_vault':
      return await generateVocabularyQuestions(difficulty, count);
    
    case 'science_lab':
      return await generateScienceExperiments(difficulty, count);
    
    case 'history_timeline':
      return await generateHistoryEvents(difficulty, count);
    
    case 'geography_quest':
      return await generateGeographyQuestions(difficulty, count);
    
    case 'code_breaker':
      return await generateCodingChallenges(difficulty, count);
    
    case 'literary_detective':
      return await generateLiteratureQuestions(difficulty, count);
    
    case 'chemistry_mixer':
      return await generateChemistryProblems(difficulty, count);
    
    case 'economics_empire':
      return await generateEconomicsScenarios(difficulty, count);
    
    case 'physics_playground':
      return await generatePhysicsProblems(difficulty, count);
    
    default:
      throw new AppError('Game content generation not implemented', 500, 'CONTENT_NOT_IMPLEMENTED');
  }
}

function generateMathProblems(difficulty, count) {
  const problems = [];
  
  for (let i = 0; i < count; i++) {
    let problem;
    
    switch (difficulty) {
      case 'easy':
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        problem = {
          question: `${a} ${op} ${b}`,
          answer: eval(`${a} ${op} ${b}`),
          type: 'arithmetic'
        };
        break;
      
      case 'medium':
        const x = Math.floor(Math.random() * 50) + 10;
        const y = Math.floor(Math.random() * 12) + 2;
        problem = {
          question: `${x} ÷ ${y} (rounded to nearest integer)`,
          answer: Math.round(x / y),
          type: 'division'
        };
        break;
      
      case 'hard':
        const base = Math.floor(Math.random() * 10) + 2;
        const exp = Math.floor(Math.random() * 4) + 2;
        problem = {
          question: `${base}^${exp}`,
          answer: Math.pow(base, exp),
          type: 'exponent'
        };
        break;
      
      case 'expert':
        const coeff = Math.floor(Math.random() * 5) + 1;
        const constant = Math.floor(Math.random() * 20) - 10;
        problem = {
          question: `Solve for x: ${coeff}x + ${constant} = 0`,
          answer: parseFloat((-constant / coeff).toFixed(2)),
          type: 'algebra'
        };
        break;
    }
    
    problems.push({ ...problem, id: i + 1 });
  }
  
  return { problems, totalQuestions: count };
}

async function generateVocabularyQuestions(difficulty, count) {
  try {
    const prompt = `Generate ${count} vocabulary questions for ${difficulty} level. Include:
    - Word definition matching
    - Synonym/antonym questions
    - Context usage questions
    
    Format as JSON array with: word, definition, options, correctAnswer, type`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const questions = JSON.parse(completion.choices[0].message.content);
    return { questions, totalQuestions: count };
  } catch (error) {
    console.error('Error generating vocabulary questions:', error);
    return { questions: [], totalQuestions: 0 };
  }
}

async function generateScienceExperiments(difficulty, count) {
  const experiments = [
    {
      id: 1,
      title: 'pH Testing Lab',
      description: 'Test the pH of various solutions',
      materials: ['pH strips', 'Various solutions', 'Safety goggles'],
      steps: ['Put on safety equipment', 'Dip pH strip in solution', 'Compare to color chart'],
      expectedResult: 'Acidic solutions turn red, basic turn blue',
      difficulty
    }
  ];
  
  return { experiments, totalExperiments: experiments.length };
}

async function generateHistoryEvents(difficulty, count) {
  const events = [
    { id: 1, event: 'World War II begins', year: 1939, era: 'modern' },
    { id: 2, event: 'Fall of Roman Empire', year: 476, era: 'ancient' },
    { id: 3, event: 'American Revolution', year: 1776, era: 'modern' }
  ];
  
  return { events: events.slice(0, count), totalEvents: Math.min(count, events.length) };
}

async function generateGeographyQuestions(difficulty, count) {
  const questions = [
    {
      id: 1,
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      type: 'capital',
      difficulty
    }
  ];
  
  return { questions: questions.slice(0, count), totalQuestions: Math.min(count, questions.length) };
}

async function generateCodingChallenges(difficulty, count) {
  const challenges = [
    {
      id: 1,
      title: 'Reverse a String',
      description: 'Write a function that reverses a string',
      template: 'function reverseString(str) {\n  // Your code here\n}',
      tests: ['reverseString("hello") should return "olleh"'],
      difficulty
    }
  ];
  
  return { challenges: challenges.slice(0, count), totalChallenges: Math.min(count, challenges.length) };
}

async function generateLiteratureQuestions(difficulty, count) {
  const questions = [
    {
      id: 1,
      passage: 'To be or not to be, that is the question...',
      question: 'Who wrote this famous soliloquy?',
      options: ['Shakespeare', 'Dickens', 'Austen', 'Hemingway'],
      correctAnswer: 'Shakespeare',
      work: 'Hamlet',
      difficulty
    }
  ];
  
  return { questions: questions.slice(0, count), totalQuestions: Math.min(count, questions.length) };
}

async function generateChemistryProblems(difficulty, count) {
  const problems = [
    {
      id: 1,
      question: 'What happens when you mix sodium and chlorine?',
      reaction: 'Na + Cl₂ → NaCl',
      product: 'Sodium Chloride (Table Salt)',
      type: 'synthesis',
      difficulty
    }
  ];
  
  return { problems: problems.slice(0, count), totalProblems: Math.min(count, problems.length) };
}

async function generateEconomicsScenarios(difficulty, count) {
  const scenarios = [
    {
      id: 1,
      scenario: 'A new factory opens in town, creating 500 jobs',
      question: 'What economic effect will this likely have?',
      options: ['Decreased unemployment', 'Increased inflation', 'Market crash', 'Currency devaluation'],
      correctAnswer: 'Decreased unemployment',
      concept: 'employment',
      difficulty
    }
  ];
  
  return { scenarios: scenarios.slice(0, count), totalScenarios: Math.min(count, scenarios.length) };
}

async function generatePhysicsProblems(difficulty, count) {
  const problems = [
    {
      id: 1,
      question: 'A ball is dropped from 10m height. How long does it take to hit the ground?',
      formula: 't = √(2h/g)',
      variables: { h: '10m', g: '9.8 m/s²' },
      answer: '1.43 seconds',
      concept: 'free fall',
      difficulty
    }
  ];
  
  return { problems: problems.slice(0, count), totalProblems: Math.min(count, problems.length) };
}

async function calculateGameScore(gameId, gameData, answers, timeSpent, difficulty) {
  const gameInfo = GAME_DEFINITIONS[gameId];
  const scoring = gameInfo.scoring;
  
  let totalScore = 0;
  let correctAnswers = 0;
  const breakdown = {};

  switch (gameId) {
    case 'speed_math':
      answers.forEach((answer, index) => {
        if (answer.correct) {
          correctAnswers++;
          totalScore += scoring.correct_answer;
          
          // Speed bonus (faster = more points)
          const expectedTime = 30; // seconds per problem
          const actualTime = answer.timeSpent || expectedTime;
          if (actualTime < expectedTime) {
            const speedBonus = Math.floor((expectedTime - actualTime) / 5) * scoring.speed_bonus;
            totalScore += speedBonus;
          }
        }
      });
      
      // Streak multiplier
      let currentStreak = 0;
      let maxStreak = 0;
      answers.forEach(answer => {
        if (answer.correct) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      
      if (maxStreak >= 5) {
        totalScore = Math.floor(totalScore * scoring.streak_multiplier);
      }
      
      breakdown.correctAnswers = correctAnswers;
      breakdown.speedBonus = totalScore - (correctAnswers * scoring.correct_answer);
      breakdown.streakBonus = maxStreak >= 5 ? Math.floor(correctAnswers * scoring.correct_answer * (scoring.streak_multiplier - 1)) : 0;
      break;
      
    default:
      // Generic scoring for other games
      correctAnswers = answers.filter(a => a.correct).length;
      totalScore = correctAnswers * (scoring.correct_answer || 10);
      breakdown.correctAnswers = correctAnswers;
      break;
  }

  // Difficulty multiplier
  const difficultyMultipliers = { easy: 1, medium: 1.2, hard: 1.5, expert: 2 };
  const multiplier = difficultyMultipliers[difficulty] || 1;
  totalScore = Math.floor(totalScore * multiplier);

  return { totalScore, correctAnswers, breakdown };
}

async function updateGameLeaderboards(gameId, userId, score, difficulty) {
  // Find or create leaderboard for this game and difficulty
  const leaderboardName = `${GAME_DEFINITIONS[gameId].name} - ${difficulty}`;
  
  let leaderboard = await db.select()
    .from(leaderboards)
    .where(and(
      eq(leaderboards.name, leaderboardName),
      eq(leaderboards.category, `game_${gameId}`)
    ))
    .limit(1);

  if (!leaderboard.length) {
    // Create new leaderboard
    leaderboard = await db.insert(leaderboards)
      .values({
        name: leaderboardName,
        description: `High scores for ${GAME_DEFINITIONS[gameId].name} (${difficulty})`,
        category: `game_${gameId}`,
        subcategory: difficulty,
        scope: 'global',
        timeframe: 'all_time',
        metricType: 'max',
        isActive: true,
        isVisible: true
      })
      .returning();
  }

  const leaderboardId = leaderboard[0].id;

  // Update or insert leaderboard entry
  const existingEntry = await db.select()
    .from(leaderboardEntries)
    .where(and(
      eq(leaderboardEntries.leaderboardId, leaderboardId),
      eq(leaderboardEntries.userId, userId)
    ))
    .limit(1);

  if (existingEntry.length && score > parseFloat(existingEntry[0].score)) {
    // Update with new high score
    await db.update(leaderboardEntries)
      .set({
        score: score.toString(),
        previousScore: existingEntry[0].score,
        personalBest: true,
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(leaderboardEntries.id, existingEntry[0].id));
  } else if (!existingEntry.length) {
    // Create new entry
    await db.insert(leaderboardEntries)
      .values({
        leaderboardId,
        userId,
        rank: 999999, // Will be recalculated
        score: score.toString(),
        personalBest: true,
        lastActivity: new Date()
      });
  }

  // Recalculate ranks
  await recalculateGameLeaderboardRanks(leaderboardId);
}

async function recalculateGameLeaderboardRanks(leaderboardId) {
  const entries = await db.select()
    .from(leaderboardEntries)
    .where(eq(leaderboardEntries.leaderboardId, leaderboardId))
    .orderBy(desc(sql`CAST(${leaderboardEntries.score} AS DECIMAL)`));

  for (let i = 0; i < entries.length; i++) {
    await db.update(leaderboardEntries)
      .set({ 
        rank: i + 1,
        previousRank: entries[i].rank,
        updatedAt: new Date() 
      })
      .where(eq(leaderboardEntries.id, entries[i].id));
  }
}

async function checkGameAchievements(userId, gameId, scoreResult, difficulty) {
  const achievements = [];
  
  // Score-based achievements
  if (scoreResult.totalScore >= 1000) achievements.push('high_scorer');
  if (scoreResult.totalScore >= 5000) achievements.push('master_scorer');
  if (scoreResult.correctAnswers === scoreResult.breakdown.totalQuestions) achievements.push('perfect_game');
  
  // Difficulty achievements
  if (difficulty === 'expert' && scoreResult.totalScore >= 500) achievements.push('expert_level');
  
  // Game-specific achievements
  switch (gameId) {
    case 'speed_math':
      if (scoreResult.breakdown.speedBonus > 100) achievements.push('speed_demon');
      break;
    case 'vocabulary_vault':
      if (scoreResult.correctAnswers >= 15) achievements.push('word_master');
      break;
  }

  return achievements;
}

async function getUserGameRank(gameId, userId, difficulty) {
  const leaderboardName = `${GAME_DEFINITIONS[gameId].name} - ${difficulty}`;
  
  const entry = await db.select({ rank: leaderboardEntries.rank })
    .from(leaderboardEntries)
    .innerJoin(leaderboards, eq(leaderboardEntries.leaderboardId, leaderboards.id))
    .where(and(
      eq(leaderboards.name, leaderboardName),
      eq(leaderboardEntries.userId, userId)
    ))
    .limit(1);

  return entry[0]?.rank || null;
}

async function checkPersonalBest(userId, gameId, score) {
  const currentBest = await db.select({ bestScore: sql`MAX(${gameScores.score})` })
    .from(gameScores)
    .where(and(
      eq(gameScores.userId, userId),
      eq(gameScores.gameId, gameId)
    ));

  return !currentBest[0]?.bestScore || score > parseFloat(currentBest[0].bestScore);
}

function getNextDifficulty(gameInfo, currentDifficulty, score) {
  const levels = gameInfo.difficulty_levels;
  const currentIndex = levels.indexOf(currentDifficulty);
  
  if (currentIndex < levels.length - 1 && score >= 800) {
    return levels[currentIndex + 1];
  }
  
  return null;
}

function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getGameStatistics(gameId, userId, timeframe) {
  // Implementation for comprehensive game statistics
  return {
    totalGamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    improvementRate: 0,
    timeSpentPlaying: 0,
    achievementsUnlocked: 0,
    currentRank: null,
    difficultyProgression: [],
    recentPerformance: []
  };
}

export default router;