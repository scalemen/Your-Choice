import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { folders } from '../db/schema.js';

const router = express.Router();

// Get user's folders
router.get('/', async (req, res) => {
  try {
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, req.user.id))
      .orderBy(desc(folders.createdAt));

    res.json({
      success: true,
      data: userFolders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders'
    });
  }
});

// Create new folder
router.post('/', async (req, res) => {
  try {
    const { name, color = '#3B82F6', parentFolderId = null } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    const newFolder = await db
      .insert(folders)
      .values({
        name,
        color,
        parentFolderId,
        userId: req.user.id
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newFolder[0],
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder'
    });
  }
});

// Update folder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const updatedFolder = await db
      .update(folders)
      .set({
        name,
        color,
        updatedAt: new Date()
      })
      .where(and(
        eq(folders.id, id),
        eq(folders.userId, req.user.id)
      ))
      .returning();

    if (!updatedFolder.length) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.json({
      success: true,
      data: updatedFolder[0],
      message: 'Folder updated successfully'
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update folder'
    });
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFolder = await db
      .delete(folders)
      .where(and(
        eq(folders.id, id),
        eq(folders.userId, req.user.id)
      ))
      .returning();

    if (!deletedFolder.length) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder'
    });
  }
});

export default router;