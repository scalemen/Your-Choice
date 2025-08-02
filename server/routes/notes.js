import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { db, notes, folders, noteVersions, users } from '../db/index.js';
import { eq, and, or, desc, asc, like, sql } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const createNoteValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('folderId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Folder ID must be a positive integer'),
  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be a valid object'),
  body('handwritingData')
    .optional()
    .isArray()
    .withMessage('Handwriting data must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const updateNoteValidation = [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be a valid object'),
  body('handwritingData')
    .optional()
    .isArray()
    .withMessage('Handwriting data must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Helper function to calculate word count and read time
function calculateNoteMetrics(content, handwritingData) {
  let wordCount = 0;
  let readTime = 1; // minimum 1 minute

  // Count words in rich text content
  if (content && content.blocks) {
    for (const block of content.blocks) {
      if (block.text) {
        wordCount += block.text.split(/\s+/).filter(word => word.length > 0).length;
      }
    }
  }

  // Estimate words from handwriting strokes (rough approximation)
  if (handwritingData && handwritingData.length > 0) {
    // Assume each stroke represents roughly 0.5 words on average
    wordCount += Math.floor(handwritingData.length * 0.5);
  }

  // Calculate read time (average 200 words per minute)
  readTime = Math.max(1, Math.ceil(wordCount / 200));

  return { wordCount, readTime };
}

// Helper function to check note ownership or sharing
async function checkNoteAccess(noteId, userId, requireWrite = false) {
  const note = await db.select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
  }

  const noteData = note[0];

  // Check if user owns the note
  if (noteData.userId === userId) {
    return { note: noteData, canWrite: true, canRead: true };
  }

  // Check if note is public
  if (noteData.isPublic && !requireWrite) {
    return { note: noteData, canWrite: false, canRead: true };
  }

  // Check if note is shared via shareCode
  // In a full implementation, you'd have a separate sharing table
  // For now, we'll just check if the note has a shareCode and is shared
  if (noteData.shareCode && !requireWrite) {
    return { note: noteData, canWrite: false, canRead: true };
  }

  throw new AppError('Access denied', 403, 'ACCESS_DENIED');
}

// Get all notes for user
router.get('/', [
  query('folderId').optional().isInt({ min: 1 }).withMessage('Folder ID must be a positive integer'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('sortBy').optional().isIn(['title', 'createdAt', 'updatedAt', 'lastEdited']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    folderId,
    search,
    tags,
    sortBy = 'lastEdited',
    sortOrder = 'desc',
    limit = 20,
    offset = 0
  } = req.query;

  let query = db.select({
    id: notes.id,
    title: notes.title,
    folderId: notes.folderId,
    tags: notes.tags,
    isPublic: notes.isPublic,
    thumbnail: notes.thumbnail,
    wordCount: notes.wordCount,
    readTime: notes.readTime,
    lastEdited: notes.lastEdited,
    createdAt: notes.createdAt,
    updatedAt: notes.updatedAt
  }).from(notes);

  // Build where conditions
  let whereConditions = [eq(notes.userId, req.user.id)];

  if (folderId) {
    whereConditions.push(eq(notes.folderId, parseInt(folderId)));
  }

  if (search) {
    whereConditions.push(
      or(
        like(notes.title, `%${search}%`),
        sql`${notes.content}::text ILIKE ${`%${search}%`}`
      )
    );
  }

  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    whereConditions.push(sql`${notes.tags} ?| ${tagArray}`);
  }

  query = query.where(and(...whereConditions));

  // Add sorting
  const sortColumn = notes[sortBy];
  query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

  // Add pagination
  query = query.limit(parseInt(limit)).offset(parseInt(offset));

  const result = await query;

  // Get total count for pagination
  const totalCount = await db.select({ count: sql`count(*)` })
    .from(notes)
    .where(and(...whereConditions));

  res.json({
    success: true,
    data: result,
    pagination: {
      total: parseInt(totalCount[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < parseInt(totalCount[0].count)
    }
  });
}));

// Get specific note
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { note, canRead } = await checkNoteAccess(noteId, req.user.id);

  if (!canRead) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Get full note data
  const fullNote = await db.select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  res.json({
    success: true,
    data: fullNote[0]
  });
}));

// Create new note
router.post('/', createNoteValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    title,
    content = {},
    handwritingData = [],
    folderId,
    tags = [],
    isPublic = false
  } = req.body;

  // Validate folder ownership if provided
  if (folderId) {
    const folder = await db.select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, req.user.id)))
      .limit(1);

    if (!folder.length) {
      throw new AppError('Folder not found or access denied', 404, 'FOLDER_NOT_FOUND');
    }
  }

  // Calculate metrics
  const { wordCount, readTime } = calculateNoteMetrics(content, handwritingData);

  // Generate share code if public
  const shareCode = isPublic ? uuidv4().substring(0, 8) : null;

  // Create note
  const newNote = await db.insert(notes)
    .values({
      userId: req.user.id,
      folderId: folderId || null,
      title,
      content,
      handwritingData,
      tags,
      isPublic,
      shareCode,
      wordCount,
      readTime,
      lastEdited: new Date()
    })
    .returning();

  // Create initial version
  await db.insert(noteVersions)
    .values({
      noteId: newNote[0].id,
      userId: req.user.id,
      version: 1,
      title,
      content,
      handwritingData,
      changeDescription: 'Initial version'
    });

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: newNote[0]
  });
}));

// Update note
router.put('/:id', updateNoteValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { note, canWrite } = await checkNoteAccess(noteId, req.user.id, true);

  if (!canWrite) {
    throw new AppError('Write access denied', 403, 'WRITE_ACCESS_DENIED');
  }

  const {
    title,
    content,
    handwritingData,
    tags,
    isPublic,
    folderId
  } = req.body;

  // Prepare update data
  const updateData = {
    lastEdited: new Date(),
    updatedAt: new Date()
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (handwritingData !== undefined) updateData.handwritingData = handwritingData;
  if (tags !== undefined) updateData.tags = tags;
  if (isPublic !== undefined) {
    updateData.isPublic = isPublic;
    // Generate or remove share code based on public status
    if (isPublic && !note.shareCode) {
      updateData.shareCode = uuidv4().substring(0, 8);
    } else if (!isPublic) {
      updateData.shareCode = null;
    }
  }
  if (folderId !== undefined) updateData.folderId = folderId;

  // Recalculate metrics if content changed
  if (content !== undefined || handwritingData !== undefined) {
    const finalContent = content !== undefined ? content : note.content;
    const finalHandwriting = handwritingData !== undefined ? handwritingData : note.handwritingData;
    const { wordCount, readTime } = calculateNoteMetrics(finalContent, finalHandwriting);
    updateData.wordCount = wordCount;
    updateData.readTime = readTime;
  }

  // Update note
  const updatedNote = await db.update(notes)
    .set(updateData)
    .where(eq(notes.id, noteId))
    .returning();

  // Create new version if content changed
  if (content !== undefined || handwritingData !== undefined || title !== undefined) {
    const latestVersion = await db.select({ version: noteVersions.version })
      .from(noteVersions)
      .where(eq(noteVersions.noteId, noteId))
      .orderBy(desc(noteVersions.version))
      .limit(1);

    const newVersion = latestVersion.length ? latestVersion[0].version + 1 : 1;

    await db.insert(noteVersions)
      .values({
        noteId,
        userId: req.user.id,
        version: newVersion,
        title: updateData.title || note.title,
        content: updateData.content || note.content,
        handwritingData: updateData.handwritingData || note.handwritingData,
        changeDescription: 'Updated content'
      });
  }

  res.json({
    success: true,
    message: 'Note updated successfully',
    data: updatedNote[0]
  });
}));

// Delete note
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { canWrite } = await checkNoteAccess(noteId, req.user.id, true);

  if (!canWrite) {
    throw new AppError('Delete access denied', 403, 'DELETE_ACCESS_DENIED');
  }

  // Delete note versions first
  await db.delete(noteVersions).where(eq(noteVersions.noteId, noteId));

  // Delete note
  await db.delete(notes).where(eq(notes.id, noteId));

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

// Get note versions
router.get('/:id/versions', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { canRead } = await checkNoteAccess(noteId, req.user.id);

  if (!canRead) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  const versions = await db.select({
    id: noteVersions.id,
    version: noteVersions.version,
    title: noteVersions.title,
    changeDescription: noteVersions.changeDescription,
    createdAt: noteVersions.createdAt,
    userId: noteVersions.userId,
    userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`
  })
    .from(noteVersions)
    .leftJoin(users, eq(noteVersions.userId, users.id))
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.version));

  res.json({
    success: true,
    data: versions
  });
}));

// Get specific version
router.get('/:id/versions/:version', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer'),
  param('version').isInt({ min: 1 }).withMessage('Version must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const version = parseInt(req.params.version);
  
  const { canRead } = await checkNoteAccess(noteId, req.user.id);

  if (!canRead) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  const versionData = await db.select()
    .from(noteVersions)
    .where(and(eq(noteVersions.noteId, noteId), eq(noteVersions.version, version)))
    .limit(1);

  if (!versionData.length) {
    throw new AppError('Version not found', 404, 'VERSION_NOT_FOUND');
  }

  res.json({
    success: true,
    data: versionData[0]
  });
}));

// Restore version
router.post('/:id/versions/:version/restore', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer'),
  param('version').isInt({ min: 1 }).withMessage('Version must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const version = parseInt(req.params.version);
  
  const { canWrite } = await checkNoteAccess(noteId, req.user.id, true);

  if (!canWrite) {
    throw new AppError('Write access denied', 403, 'WRITE_ACCESS_DENIED');
  }

  // Get version data
  const versionData = await db.select()
    .from(noteVersions)
    .where(and(eq(noteVersions.noteId, noteId), eq(noteVersions.version, version)))
    .limit(1);

  if (!versionData.length) {
    throw new AppError('Version not found', 404, 'VERSION_NOT_FOUND');
  }

  const { title, content, handwritingData } = versionData[0];

  // Calculate metrics
  const { wordCount, readTime } = calculateNoteMetrics(content, handwritingData);

  // Update note with version data
  const updatedNote = await db.update(notes)
    .set({
      title,
      content,
      handwritingData,
      wordCount,
      readTime,
      lastEdited: new Date(),
      updatedAt: new Date()
    })
    .where(eq(notes.id, noteId))
    .returning();

  // Create new version for the restore
  const latestVersion = await db.select({ version: noteVersions.version })
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.version))
    .limit(1);

  const newVersion = latestVersion.length ? latestVersion[0].version + 1 : 1;

  await db.insert(noteVersions)
    .values({
      noteId,
      userId: req.user.id,
      version: newVersion,
      title,
      content,
      handwritingData,
      changeDescription: `Restored from version ${version}`
    });

  res.json({
    success: true,
    message: 'Version restored successfully',
    data: updatedNote[0]
  });
}));

// Duplicate note
router.post('/:id/duplicate', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be less than 255 characters'),
  body('folderId').optional().isInt({ min: 1 }).withMessage('Folder ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { canRead } = await checkNoteAccess(noteId, req.user.id);

  if (!canRead) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Get original note
  const originalNote = await db.select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  const original = originalNote[0];
  const { title: newTitle, folderId: newFolderId } = req.body;

  // Create duplicate
  const duplicateNote = await db.insert(notes)
    .values({
      userId: req.user.id,
      folderId: newFolderId || original.folderId,
      title: newTitle || `${original.title} (Copy)`,
      content: original.content,
      handwritingData: original.handwritingData,
      tags: original.tags,
      isPublic: false, // Duplicates are always private initially
      shareCode: null,
      wordCount: original.wordCount,
      readTime: original.readTime,
      lastEdited: new Date()
    })
    .returning();

  // Create initial version for duplicate
  await db.insert(noteVersions)
    .values({
      noteId: duplicateNote[0].id,
      userId: req.user.id,
      version: 1,
      title: duplicateNote[0].title,
      content: duplicateNote[0].content,
      handwritingData: duplicateNote[0].handwritingData,
      changeDescription: `Duplicated from note ${noteId}`
    });

  res.status(201).json({
    success: true,
    message: 'Note duplicated successfully',
    data: duplicateNote[0]
  });
}));

// Share note (generate share code)
router.post('/:id/share', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { canWrite } = await checkNoteAccess(noteId, req.user.id, true);

  if (!canWrite) {
    throw new AppError('Write access denied', 403, 'WRITE_ACCESS_DENIED');
  }

  // Generate new share code
  const shareCode = uuidv4().substring(0, 8);

  // Update note with share code and make it public
  const updatedNote = await db.update(notes)
    .set({
      shareCode,
      isPublic: true,
      updatedAt: new Date()
    })
    .where(eq(notes.id, noteId))
    .returning();

  res.json({
    success: true,
    message: 'Note shared successfully',
    data: {
      shareCode,
      shareUrl: `${process.env.CLIENT_URL}/shared/notes/${shareCode}`
    }
  });
}));

// Unshare note
router.delete('/:id/share', [
  param('id').isInt({ min: 1 }).withMessage('Note ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const noteId = parseInt(req.params.id);
  const { canWrite } = await checkNoteAccess(noteId, req.user.id, true);

  if (!canWrite) {
    throw new AppError('Write access denied', 403, 'WRITE_ACCESS_DENIED');
  }

  // Remove share code and make private
  await db.update(notes)
    .set({
      shareCode: null,
      isPublic: false,
      updatedAt: new Date()
    })
    .where(eq(notes.id, noteId));

  res.json({
    success: true,
    message: 'Note unshared successfully'
  });
}));

// Get shared note by share code
router.get('/shared/:shareCode', [
  param('shareCode').isLength({ min: 8, max: 8 }).withMessage('Invalid share code')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { shareCode } = req.params;

  const sharedNote = await db.select()
    .from(notes)
    .where(and(eq(notes.shareCode, shareCode), eq(notes.isPublic, true)))
    .limit(1);

  if (!sharedNote.length) {
    throw new AppError('Shared note not found', 404, 'SHARED_NOTE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: sharedNote[0]
  });
}));

export default router;