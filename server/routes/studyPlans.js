import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { studyPlans, studySessions } from '../db/schema.js';

const router = express.Router();

// Get user's study plans
router.get('/', async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, req.user.id))
      .orderBy(desc(studyPlans.createdAt));

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching study plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study plans'
    });
  }
});

// Create new study plan
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      subject, 
      targetDate, 
      difficulty = 'medium',
      estimatedHours = 0
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Study plan title is required'
      });
    }

    const newPlan = await db
      .insert(studyPlans)
      .values({
        title,
        description,
        subject,
        targetDate: targetDate ? new Date(targetDate) : null,
        difficulty,
        estimatedHours,
        userId: req.user.id,
        status: 'active'
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newPlan[0],
      message: 'Study plan created successfully'
    });
  } catch (error) {
    console.error('Error creating study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study plan'
    });
  }
});

// Update study plan
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.targetDate) {
      updateData.targetDate = new Date(updateData.targetDate);
    }

    const updatedPlan = await db
      .update(studyPlans)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(studyPlans.id, id),
        eq(studyPlans.userId, req.user.id)
      ))
      .returning();

    if (!updatedPlan.length) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    res.json({
      success: true,
      data: updatedPlan[0],
      message: 'Study plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study plan'
    });
  }
});

// Delete study plan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPlan = await db
      .delete(studyPlans)
      .where(and(
        eq(studyPlans.id, id),
        eq(studyPlans.userId, req.user.id)
      ))
      .returning();

    if (!deletedPlan.length) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Study plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study plan'
    });
  }
});

// Get study sessions for a plan
router.get('/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;

    const sessions = await db
      .select()
      .from(studySessions)
      .where(and(
        eq(studySessions.studyPlanId, id),
        eq(studySessions.userId, req.user.id)
      ))
      .orderBy(desc(studySessions.createdAt));

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study sessions'
    });
  }
});

export default router;