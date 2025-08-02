import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { quizzes, quizQuestions, quizAttempts } from '../db/schema.js';

const router = express.Router();

// Get user's quizzes
router.get('/', async (req, res) => {
  try {
    const userQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, req.user.id))
      .orderBy(desc(quizzes.createdAt));

    res.json({
      success: true,
      data: userQuizzes
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes'
    });
  }
});

// Create new quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, subject, difficulty = 'medium', timeLimit = 30 } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title is required'
      });
    }

    const newQuiz = await db
      .insert(quizzes)
      .values({
        title,
        description,
        subject,
        difficulty,
        timeLimit,
        userId: req.user.id
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newQuiz[0],
      message: 'Quiz created successfully'
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz'
    });
  }
});

// Get quiz attempts
router.get('/:id/attempts', async (req, res) => {
  try {
    const { id } = req.params;

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.quizId, id),
        eq(quizAttempts.userId, req.user.id)
      ))
      .orderBy(desc(quizAttempts.createdAt));

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts'
    });
  }
});

export default router;