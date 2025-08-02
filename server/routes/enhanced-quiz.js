import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { enhancedQuizzes, enhancedQuizQuestions, enhancedQuizAttempts } from '../db/enhanced-quiz-schema.js';

const router = express.Router();

// Get enhanced quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await db
      .select()
      .from(enhancedQuizzes)
      .where(eq(enhancedQuizzes.userId, req.user.id))
      .orderBy(desc(enhancedQuizzes.createdAt));

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('Error fetching enhanced quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced quizzes'
    });
  }
});

// Create enhanced quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, subject, difficulty = 'medium' } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title is required'
      });
    }

    const newQuiz = await db
      .insert(enhancedQuizzes)
      .values({
        title,
        description,
        subject,
        difficulty,
        userId: req.user.id
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newQuiz[0],
      message: 'Enhanced quiz created successfully'
    });
  } catch (error) {
    console.error('Error creating enhanced quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create enhanced quiz'
    });
  }
});

export default router;