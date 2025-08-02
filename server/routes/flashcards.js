import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { flashcardDecks, flashcards } from '../db/schema.js';

const router = express.Router();

// Get user's flashcard decks
router.get('/', async (req, res) => {
  try {
    const decks = await db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.userId, req.user.id))
      .orderBy(desc(flashcardDecks.createdAt));

    res.json({
      success: true,
      data: decks
    });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flashcard decks'
    });
  }
});

// Create new flashcard deck
router.post('/', async (req, res) => {
  try {
    const { title, description, subject, tags = [] } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Deck title is required'
      });
    }

    const newDeck = await db
      .insert(flashcardDecks)
      .values({
        title,
        description,
        subject,
        tags: JSON.stringify(tags),
        userId: req.user.id
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newDeck[0],
      message: 'Flashcard deck created successfully'
    });
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flashcard deck'
    });
  }
});

// Get flashcards in a deck
router.get('/:deckId/cards', async (req, res) => {
  try {
    const { deckId } = req.params;

    const cards = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.deckId, deckId))
      .orderBy(desc(flashcards.createdAt));

    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flashcards'
    });
  }
});

export default router;