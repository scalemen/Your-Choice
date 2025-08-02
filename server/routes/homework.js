import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { homeworkAssignments } from '../db/schema.js';

const router = express.Router();

// Get user's homework assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.userId, req.user.id))
      .orderBy(desc(homeworkAssignments.createdAt));

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch homework assignments'
    });
  }
});

// Create new homework assignment
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      subject, 
      dueDate, 
      priority = 'medium',
      difficulty = 'medium'
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Homework title is required'
      });
    }

    const newAssignment = await db
      .insert(homeworkAssignments)
      .values({
        title,
        description,
        subject,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        difficulty,
        userId: req.user.id,
        status: 'pending'
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newAssignment[0],
      message: 'Homework assignment created successfully'
    });
  } catch (error) {
    console.error('Error creating homework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create homework assignment'
    });
  }
});

// Update homework assignment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updatedAssignment = await db
      .update(homeworkAssignments)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(homeworkAssignments.id, id),
        eq(homeworkAssignments.userId, req.user.id)
      ))
      .returning();

    if (!updatedAssignment.length) {
      return res.status(404).json({
        success: false,
        message: 'Homework assignment not found'
      });
    }

    res.json({
      success: true,
      data: updatedAssignment[0],
      message: 'Homework assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating homework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update homework assignment'
    });
  }
});

// Delete homework assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAssignment = await db
      .delete(homeworkAssignments)
      .where(and(
        eq(homeworkAssignments.id, id),
        eq(homeworkAssignments.userId, req.user.id)
      ))
      .returning();

    if (!deletedAssignment.length) {
      return res.status(404).json({
        success: false,
        message: 'Homework assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Homework assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete homework assignment'
    });
  }
});

// Mark homework as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedAssignment = await db
      .update(homeworkAssignments)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(homeworkAssignments.id, id),
        eq(homeworkAssignments.userId, req.user.id)
      ))
      .returning();

    if (!updatedAssignment.length) {
      return res.status(404).json({
        success: false,
        message: 'Homework assignment not found'
      });
    }

    res.json({
      success: true,
      data: updatedAssignment[0],
      message: 'Homework marked as completed'
    });
  } catch (error) {
    console.error('Error completing homework:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark homework as completed'
    });
  }
});

export default router;