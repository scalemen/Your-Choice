import express from 'express';
import { eq, desc, asc, count, and, or, gte, lte, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  flashcardDecks,
  flashcards,
  flashcardStudySessions,
  cardReviews,
  aiFlashcardGeneration,
  spacedRepetitionAnalytics,
  flashcardCollaborations
} from '../db/enhanced-flashcard-schema.js';
import { authenticateUser } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Apply authentication to all routes
router.use(authenticateUser);

// FLASHCARD DECKS MANAGEMENT

// Get user's flashcard decks
router.get('/decks', async (req, res) => {
  try {
    const { subject, difficulty, sortBy = 'updated', order = 'desc', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: flashcardDecks.id,
      deckId: flashcardDecks.deckId,
      title: flashcardDecks.title,
      description: flashcardDecks.description,
      subject: flashcardDecks.subject,
      topic: flashcardDecks.topic,
      difficulty: flashcardDecks.difficulty,
      totalCards: flashcardDecks.totalCards,
      matureCards: flashcardDecks.matureCards,
      averageRetention: flashcardDecks.averageRetention,
      lastStudied: flashcardDecks.lastStudied,
      createdAt: flashcardDecks.createdAt,
      updatedAt: flashcardDecks.updatedAt,
      isPublic: flashcardDecks.isPublic,
      rating: flashcardDecks.rating,
      usageCount: flashcardDecks.usageCount
    }).from(flashcardDecks);

    // Add filters
    let conditions = [];
    
    if (req.user.role !== 'admin') {
      conditions.push(
        or(
          eq(flashcardDecks.createdBy, req.user.id),
          eq(flashcardDecks.isPublic, true)
        )
      );
    }

    if (subject) {
      conditions.push(eq(flashcardDecks.subject, subject));
    }

    if (difficulty) {
      conditions.push(eq(flashcardDecks.difficulty, difficulty));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    const orderDirection = order === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'title':
        query = query.orderBy(orderDirection(flashcardDecks.title));
        break;
      case 'created':
        query = query.orderBy(orderDirection(flashcardDecks.createdAt));
        break;
      case 'rating':
        query = query.orderBy(orderDirection(flashcardDecks.rating));
        break;
      case 'cards':
        query = query.orderBy(orderDirection(flashcardDecks.totalCards));
        break;
      default:
        query = query.orderBy(orderDirection(flashcardDecks.updatedAt));
    }

    const decks = await query.limit(parseInt(limit)).offset(offset);

    // Get total count
    const totalQuery = db.select({ count: count() }).from(flashcardDecks);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await totalQuery;

    res.json({
      decks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard decks' });
  }
});

// Create new flashcard deck
router.post('/decks', async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      topic,
      gradeLevel,
      difficulty = 'medium',
      deckType = 'standard',
      spacedRepetitionAlgorithm = 'anki',
      isPublic = false,
      tags = []
    } = req.body;

    const [newDeck] = await db.insert(flashcardDecks).values({
      title,
      description,
      subject,
      topic,
      gradeLevel,
      difficulty,
      deckType,
      spacedRepetitionAlgorithm,
      isPublic,
      tags,
      createdBy: req.user.id
    }).returning();

    res.status(201).json({ 
      message: 'Flashcard deck created successfully',
      deck: newDeck 
    });
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    res.status(500).json({ error: 'Failed to create flashcard deck' });
  }
});

// Get specific deck with cards
router.get('/decks/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const { includeCards = true, sortCards = 'order' } = req.query;

    // Get deck info
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId));

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check access permissions
    if (!deck.isPublic && deck.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let cards = [];
    if (includeCards === 'true') {
      let cardQuery = db.select().from(flashcards)
        .where(eq(flashcards.deckId, deck.id));

      // Sort cards
      switch (sortCards) {
        case 'due':
          cardQuery = cardQuery.orderBy(asc(flashcards.dueDate));
          break;
        case 'difficulty':
          cardQuery = cardQuery.orderBy(desc(flashcards.difficultyLevel));
          break;
        case 'recent':
          cardQuery = cardQuery.orderBy(desc(flashcards.lastReviewed));
          break;
        default:
          cardQuery = cardQuery.orderBy(asc(flashcards.order));
      }

      cards = await cardQuery;
    }

    res.json({
      deck,
      cards,
      cardCount: cards.length
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// FLASHCARD MANAGEMENT

// Create new flashcard
router.post('/decks/:deckId/cards', async (req, res) => {
  try {
    const { deckId } = req.params;
    const {
      front,
      back,
      hint,
      explanation,
      cardType = 'basic',
      difficultyLevel,
      tags = [],
      frontMedia = [],
      backMedia = []
    } = req.body;

    // Verify deck ownership
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId));

    if (!deck || deck.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get next order number
    const [{ maxOrder }] = await db.select({
      maxOrder: sql`COALESCE(MAX(${flashcards.order}), 0)`
    }).from(flashcards).where(eq(flashcards.deckId, deck.id));

    const [newCard] = await db.insert(flashcards).values({
      deckId: deck.id,
      front,
      back,
      hint,
      explanation,
      cardType,
      difficultyLevel,
      tags,
      frontMedia,
      backMedia,
      order: maxOrder + 1,
      dueDate: new Date() // New cards are due immediately
    }).returning();

    // Update deck card count
    await db.update(flashcardDecks)
      .set({ 
        totalCards: sql`${flashcardDecks.totalCards} + 1`,
        updatedAt: new Date()
      })
      .where(eq(flashcardDecks.id, deck.id));

    res.status(201).json({
      message: 'Flashcard created successfully',
      card: newCard
    });
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

// Update flashcard
router.put('/cards/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const updateData = req.body;

    // Verify card ownership through deck
    const [card] = await db.select({
      cardId: flashcards.cardId,
      deckId: flashcards.deckId,
      createdBy: flashcardDecks.createdBy
    })
    .from(flashcards)
    .innerJoin(flashcardDecks, eq(flashcards.deckId, flashcardDecks.id))
    .where(eq(flashcards.cardId, cardId));

    if (!card || card.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [updatedCard] = await db.update(flashcards)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(flashcards.cardId, cardId))
      .returning();

    res.json({
      message: 'Flashcard updated successfully',
      card: updatedCard
    });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    res.status(500).json({ error: 'Failed to update flashcard' });
  }
});

// SPACED REPETITION STUDY SESSION

// Get due cards for study
router.get('/decks/:deckId/due-cards', async (req, res) => {
  try {
    const { deckId } = req.params;
    const { limit = 20, newCards = 10 } = req.query;

    // Verify deck access
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId));

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (!deck.isPublic && deck.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();

    // Get due cards (reviews)
    const dueCards = await db.select()
      .from(flashcards)
      .where(
        and(
          eq(flashcards.deckId, deck.id),
          or(
            lte(flashcards.dueDate, now),
            eq(flashcards.dueDate, null)
          ),
          eq(flashcards.status, 'active')
        )
      )
      .orderBy(asc(flashcards.dueDate))
      .limit(parseInt(limit));

    // Get new cards if needed
    let newCardsToStudy = [];
    if (dueCards.length < limit && newCards > 0) {
      const remainingSlots = Math.min(limit - dueCards.length, parseInt(newCards));
      
      newCardsToStudy = await db.select()
        .from(flashcards)
        .where(
          and(
            eq(flashcards.deckId, deck.id),
            eq(flashcards.totalReviews, 0),
            eq(flashcards.status, 'active')
          )
        )
        .orderBy(asc(flashcards.order))
        .limit(remainingSlots);
    }

    const allCards = [...dueCards, ...newCardsToStudy];

    res.json({
      cards: allCards,
      dueCount: dueCards.length,
      newCount: newCardsToStudy.length,
      totalCount: allCards.length
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

// Start study session
router.post('/decks/:deckId/study-sessions', async (req, res) => {
  try {
    const { deckId } = req.params;
    const {
      sessionType = 'review',
      studyMode = 'spaced_repetition',
      maxNewCards = 20,
      maxReviews = 100,
      timeLimit
    } = req.body;

    // Verify deck access
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId));

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const [newSession] = await db.insert(flashcardStudySessions).values({
      userId: req.user.id,
      deckId: deck.id,
      sessionType,
      studyMode,
      maxNewCards,
      maxReviews,
      timeLimit
    }).returning();

    res.status(201).json({
      message: 'Study session started',
      session: newSession
    });
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ error: 'Failed to start study session' });
  }
});

// Submit card review
router.post('/sessions/:sessionId/reviews', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      cardId,
      userResponse, // 'again', 'hard', 'good', 'easy'
      responseTime,
      confidence
    } = req.body;

    // Verify session ownership
    const [session] = await db.select()
      .from(flashcardStudySessions)
      .where(eq(flashcardStudySessions.sessionId, sessionId));

    if (!session || session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current card data
    const [card] = await db.select()
      .from(flashcards)
      .where(eq(flashcards.cardId, cardId));

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Calculate spaced repetition algorithm (simplified Anki algorithm)
    const calculateNextReview = (ease, interval, response) => {
      let newEase = ease;
      let newInterval = interval;

      switch (response) {
        case 'again':
          newEase = Math.max(1.3, ease - 0.2);
          newInterval = 1;
          break;
        case 'hard':
          newEase = Math.max(1.3, ease - 0.15);
          newInterval = Math.max(1, Math.round(interval * 1.2));
          break;
        case 'good':
          newInterval = Math.round(interval * ease);
          break;
        case 'easy':
          newEase = Math.min(ease + 0.15, 2.5);
          newInterval = Math.round(interval * ease * 1.3);
          break;
      }

      return { newEase, newInterval };
    };

    const currentEase = parseFloat(card.easeFactor) || 2.5;
    const currentInterval = card.interval || 0;
    const { newEase, newInterval } = calculateNextReview(currentEase, currentInterval, userResponse);

    // Calculate due date
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);

    // Record the review
    const [review] = await db.insert(cardReviews).values({
      sessionId: session.id,
      cardId: card.id,
      userId: req.user.id,
      userResponse,
      responseTime: parseFloat(responseTime),
      isCorrect: ['good', 'easy'].includes(userResponse),
      confidence,
      previousInterval: currentInterval,
      previousEase: currentEase,
      newInterval,
      newEase,
      newDueDate,
      learningPhase: card.totalReviews === 0 ? 'new' : 'review'
    }).returning();

    // Update card statistics
    const isCorrect = ['good', 'easy'].includes(userResponse);
    await db.update(flashcards).set({
      easeFactor: newEase,
      interval: newInterval,
      dueDate: newDueDate,
      lastReviewed: new Date(),
      totalReviews: sql`${flashcards.totalReviews} + 1`,
      correctReviews: isCorrect ? sql`${flashcards.correctReviews} + 1` : flashcards.correctReviews,
      streakCount: isCorrect ? sql`${flashcards.streakCount} + 1` : 0,
      lapseCount: !isCorrect ? sql`${flashcards.lapseCount} + 1` : flashcards.lapseCount,
      totalStudyTime: sql`${flashcards.totalStudyTime} + ${Math.round(responseTime)}`,
      averageResponseTime: sql`(${flashcards.averageResponseTime} * ${flashcards.totalReviews} + ${responseTime}) / (${flashcards.totalReviews} + 1)`
    }).where(eq(flashcards.id, card.id));

    // Update session statistics
    await db.update(flashcardStudySessions).set({
      cardsStudied: sql`${flashcardStudySessions.cardsStudied} + 1`,
      cardsCorrect: isCorrect ? sql`${flashcardStudySessions.cardsCorrect} + 1` : flashcardStudySessions.cardsCorrect,
      cardsWrong: !isCorrect ? sql`${flashcardStudySessions.cardsWrong} + 1` : flashcardStudySessions.cardsWrong,
      averageResponseTime: sql`COALESCE((${flashcardStudySessions.averageResponseTime} * ${flashcardStudySessions.cardsStudied} + ${responseTime}) / (${flashcardStudySessions.cardsStudied} + 1), ${responseTime})`,
      updatedAt: new Date()
    }).where(eq(flashcardStudySessions.id, session.id));

    res.json({
      message: 'Review recorded successfully',
      review,
      nextReview: {
        interval: newInterval,
        dueDate: newDueDate,
        ease: newEase
      }
    });
  } catch (error) {
    console.error('Error recording review:', error);
    res.status(500).json({ error: 'Failed to record review' });
  }
});

// AI FLASHCARD GENERATION

// Generate flashcards from content
router.post('/ai-generate', async (req, res) => {
  try {
    const {
      deckId,
      sourceType,
      sourceContent,
      sourceUrl,
      cardCount = 10,
      cardTypes = ['basic'],
      difficultyLevel = 'medium',
      subject,
      topic,
      includeDefinitions = true,
      includeExamples = true
    } = req.body;

    // Create generation record
    const [generation] = await db.insert(aiFlashcardGeneration).values({
      requestedBy: req.user.id,
      deckId: deckId ? (await db.select().from(flashcardDecks).where(eq(flashcardDecks.deckId, deckId)))[0]?.id : null,
      sourceType,
      sourceContent,
      sourceUrl,
      cardCount,
      cardTypes,
      difficultyLevel,
      subject,
      topic,
      aiModel: 'gpt-4',
      includeDefinitions,
      includeExamples,
      status: 'processing'
    }).returning();

    // Generate flashcards using OpenAI
    try {
      const prompt = `Generate ${cardCount} educational flashcards for the subject "${subject}" and topic "${topic}".

Source content: ${sourceContent}

Requirements:
- Difficulty level: ${difficultyLevel}
- Card types: ${cardTypes.join(', ')}
- Include definitions: ${includeDefinitions}
- Include examples: ${includeExamples}

Format each flashcard as JSON with the following structure:
{
  "front": "Question or prompt",
  "back": "Answer or explanation",
  "hint": "Optional hint",
  "explanation": "Detailed explanation",
  "tags": ["tag1", "tag2"],
  "difficultyLevel": 1-5 (1=easiest, 5=hardest)
}

Return only a JSON array of flashcards.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator specializing in creating effective flashcards for learning. Create flashcards that follow spaced repetition best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const generatedCards = JSON.parse(completion.choices[0].message.content);

      // Update generation record with results
      await db.update(aiFlashcardGeneration).set({
        status: 'completed',
        generatedCards,
        tokensUsed: completion.usage.total_tokens,
        completedAt: new Date()
      }).where(eq(aiFlashcardGeneration.id, generation.id));

      res.json({
        message: 'Flashcards generated successfully',
        generation: {
          ...generation,
          generatedCards,
          status: 'completed'
        }
      });
    } catch (aiError) {
      // Update generation record with error
      await db.update(aiFlashcardGeneration).set({
        status: 'failed'
      }).where(eq(aiFlashcardGeneration.id, generation.id));

      console.error('AI generation error:', aiError);
      res.status(500).json({ error: 'Failed to generate flashcards with AI' });
    }
  } catch (error) {
    console.error('Error in AI flashcard generation:', error);
    res.status(500).json({ error: 'Failed to start AI generation' });
  }
});

// Accept AI-generated cards and add to deck
router.post('/ai-generations/:generationId/accept', async (req, res) => {
  try {
    const { generationId } = req.params;
    const { selectedCards, deckId } = req.body;

    // Verify generation ownership
    const [generation] = await db.select()
      .from(aiFlashcardGeneration)
      .where(eq(aiFlashcardGeneration.generationId, generationId));

    if (!generation || generation.requestedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify deck ownership
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId));

    if (!deck || deck.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to deck' });
    }

    // Get next order number
    const [{ maxOrder }] = await db.select({
      maxOrder: sql`COALESCE(MAX(${flashcards.order}), 0)`
    }).from(flashcards).where(eq(flashcards.deckId, deck.id));

    // Insert selected cards
    const cardsToInsert = selectedCards.map((card, index) => ({
      deckId: deck.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      explanation: card.explanation,
      tags: card.tags || [],
      difficultyLevel: card.difficultyLevel,
      order: maxOrder + index + 1,
      aiGenerated: true,
      aiModel: 'gpt-4',
      dueDate: new Date() // New cards are due immediately
    }));

    const insertedCards = await db.insert(flashcards).values(cardsToInsert).returning();

    // Update deck card count
    await db.update(flashcardDecks)
      .set({ 
        totalCards: sql`${flashcardDecks.totalCards} + ${selectedCards.length}`,
        updatedAt: new Date()
      })
      .where(eq(flashcardDecks.id, deck.id));

    // Update generation record
    await db.update(aiFlashcardGeneration).set({
      cardsAccepted: selectedCards.length
    }).where(eq(aiFlashcardGeneration.id, generation.id));

    res.json({
      message: `${selectedCards.length} flashcards added to deck successfully`,
      cards: insertedCards
    });
  } catch (error) {
    console.error('Error accepting AI-generated cards:', error);
    res.status(500).json({ error: 'Failed to accept AI-generated cards' });
  }
});

// ANALYTICS AND INSIGHTS

// Get user's spaced repetition analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get or create analytics record
    let [analytics] = await db.select()
      .from(spacedRepetitionAnalytics)
      .where(eq(spacedRepetitionAnalytics.userId, req.user.id));

    if (!analytics) {
      // Create initial analytics record
      [analytics] = await db.insert(spacedRepetitionAnalytics).values({
        userId: req.user.id
      }).returning();
    }

    // Calculate recent statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await db.select({
      sessionsCount: count(),
      totalCards: sql`SUM(${flashcardStudySessions.cardsStudied})`,
      totalCorrect: sql`SUM(${flashcardStudySessions.cardsCorrect})`,
      totalTime: sql`SUM(${flashcardStudySessions.actualDuration})`
    })
    .from(flashcardStudySessions)
    .where(
      and(
        eq(flashcardStudySessions.userId, req.user.id),
        gte(flashcardStudySessions.startedAt, thirtyDaysAgo)
      )
    );

    res.json({
      analytics,
      recentActivity: recentSessions[0]
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get deck performance analytics
router.get('/decks/:deckId/analytics', async (req, res) => {
  try {
    const { deckId } = req.params;

    // Verify deck access
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId));

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (!deck.isPublic && deck.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get deck statistics
    const deckStats = await db.select({
      totalCards: count(),
      avgEase: sql`AVG(${flashcards.easeFactor})`,
      avgInterval: sql`AVG(${flashcards.interval})`,
      matureCards: sql`COUNT(*) FILTER (WHERE ${flashcards.interval} >= 21)`,
      newCards: sql`COUNT(*) FILTER (WHERE ${flashcards.totalReviews} = 0)`,
      dueCards: sql`COUNT(*) FILTER (WHERE ${flashcards.dueDate} <= NOW())`,
    })
    .from(flashcards)
    .where(
      and(
        eq(flashcards.deckId, deck.id),
        eq(flashcards.status, 'active')
      )
    );

    // Get recent study sessions
    const recentSessions = await db.select()
      .from(flashcardStudySessions)
      .where(
        and(
          eq(flashcardStudySessions.deckId, deck.id),
          eq(flashcardStudySessions.userId, req.user.id)
        )
      )
      .orderBy(desc(flashcardStudySessions.startedAt))
      .limit(10);

    res.json({
      deckStats: deckStats[0],
      recentSessions
    });
  } catch (error) {
    console.error('Error fetching deck analytics:', error);
    res.status(500).json({ error: 'Failed to fetch deck analytics' });
  }
});

export default router;