import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { 
  db, 
  users,
  noteTemplates,
  enhancedNotes,
  collaborationSessions,
  collaborationParticipants,
  noteComments,
  noteSharing,
  handwritingAnalysis,
  enhancedFolders,
  noteSearchIndex
} from '../db/index.js';
import { eq, and, or, desc, asc, sql, inArray, like, gte, lte, ne, count, exists } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import multer from 'multer';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Note Templates Management
router.get('/templates', [
  query('category').optional().isString(),
  query('subject').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { category, subject, limit = 20 } = req.query;
  const userId = req.user.id;

  let query = db.select({
    templateId: noteTemplates.templateId,
    name: noteTemplates.name,
    description: noteTemplates.description,
    category: noteTemplates.category,
    subjectType: noteTemplates.subjectType,
    layout: noteTemplates.layout,
    pageSize: noteTemplates.pageSize,
    orientation: noteTemplates.orientation,
    backgroundImage: noteTemplates.backgroundImage,
    overlayElements: noteTemplates.overlayElements,
    mathTools: noteTemplates.mathTools,
    scienceTools: noteTemplates.scienceTools,
    languageTools: noteTemplates.languageTools,
    isPublic: noteTemplates.isPublic,
    usageCount: noteTemplates.usageCount,
    rating: noteTemplates.rating,
    version: noteTemplates.version,
    createdAt: noteTemplates.createdAt
  })
    .from(noteTemplates)
    .where(or(
      eq(noteTemplates.isPublic, true),
      eq(noteTemplates.createdById, userId)
    ));

  if (category) {
    query = query.where(eq(noteTemplates.category, category));
  }

  if (subject) {
    query = query.where(eq(noteTemplates.subjectType, subject));
  }

  const templates = await query
    .orderBy(desc(noteTemplates.rating), desc(noteTemplates.usageCount))
    .limit(parseInt(limit));

  // Get template categories for filtering
  const categories = await db.select({
    category: noteTemplates.category,
    count: sql`count(*)`.as('count')
  })
    .from(noteTemplates)
    .where(eq(noteTemplates.isPublic, true))
    .groupBy(noteTemplates.category)
    .orderBy(desc(sql`count(*)`));

  res.json({
    success: true,
    data: {
      templates,
      categories,
      total: templates.length
    }
  });
}));

router.post('/templates', [
  body('name').notEmpty().isLength({ min: 1, max: 100 }),
  body('category').notEmpty().isLength({ min: 1, max: 50 }),
  body('layout').isObject(),
  body('pageSize').optional().isString(),
  body('orientation').optional().isString(),
  body('subjectType').optional().isString(),
  body('isPublic').optional().isBoolean()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    name,
    description,
    category,
    layout,
    pageSize = 'a4',
    orientation = 'portrait',
    backgroundImage,
    overlayElements = [],
    subjectType,
    mathTools = {},
    scienceTools = {},
    languageTools = {},
    isPublic = false
  } = req.body;
  const userId = req.user.id;

  const newTemplate = await db.insert(noteTemplates)
    .values({
      name,
      description,
      category,
      layout,
      pageSize,
      orientation,
      backgroundImage,
      overlayElements,
      subjectType,
      mathTools,
      scienceTools,
      languageTools,
      isPublic,
      createdById: userId
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Template created successfully',
    data: newTemplate[0]
  });
}));

// Enhanced Notes CRUD Operations
router.get('/notes', [
  query('folderId').optional().isInt(),
  query('subject').optional().isString(),
  query('status').optional().isIn(['draft', 'published', 'archived']),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['created', 'updated', 'title', 'views'])
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
    subject,
    status,
    search,
    limit = 20,
    offset = 0,
    sortBy = 'updated'
  } = req.query;
  const userId = req.user.id;

  let query = db.select({
    noteId: enhancedNotes.noteId,
    title: enhancedNotes.title,
    description: enhancedNotes.description,
    contentType: enhancedNotes.contentType,
    subject: enhancedNotes.subject,
    course: enhancedNotes.course,
    chapter: enhancedNotes.chapter,
    tags: enhancedNotes.tags,
    isPublic: enhancedNotes.isPublic,
    status: enhancedNotes.status,
    viewCount: enhancedNotes.viewCount,
    editCount: enhancedNotes.editCount,
    shareCount: enhancedNotes.shareCount,
    studyTime: enhancedNotes.studyTime,
    version: enhancedNotes.version,
    createdAt: enhancedNotes.createdAt,
    updatedAt: enhancedNotes.updatedAt,
    lastAccessedAt: enhancedNotes.lastAccessedAt,
    // Include folder info if exists
    folderName: enhancedFolders.name,
    folderColor: enhancedFolders.color
  })
    .from(enhancedNotes)
    .leftJoin(enhancedFolders, eq(enhancedNotes.folderId, enhancedFolders.id))
    .where(eq(enhancedNotes.ownerId, userId));

  // Apply filters
  if (folderId) {
    query = query.where(eq(enhancedNotes.folderId, parseInt(folderId)));
  }

  if (subject) {
    query = query.where(eq(enhancedNotes.subject, subject));
  }

  if (status) {
    query = query.where(eq(enhancedNotes.status, status));
  }

  if (search) {
    query = query.where(or(
      like(enhancedNotes.title, `%${search}%`),
      like(enhancedNotes.description, `%${search}%`),
      like(enhancedNotes.ocrText, `%${search}%`)
    ));
  }

  // Apply sorting
  const sortOptions = {
    created: desc(enhancedNotes.createdAt),
    updated: desc(enhancedNotes.updatedAt),
    title: asc(enhancedNotes.title),
    views: desc(enhancedNotes.viewCount)
  };

  const notes = await query
    .orderBy(sortOptions[sortBy] || desc(enhancedNotes.updatedAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  // Get total count for pagination
  const totalCount = await db.select({ count: sql`count(*)` })
    .from(enhancedNotes)
    .where(eq(enhancedNotes.ownerId, userId));

  // Get subjects for filtering
  const subjects = await db.select({
    subject: enhancedNotes.subject,
    count: sql`count(*)`.as('count')
  })
    .from(enhancedNotes)
    .where(and(eq(enhancedNotes.ownerId, userId), ne(enhancedNotes.subject, null)))
    .groupBy(enhancedNotes.subject)
    .orderBy(desc(sql`count(*)`));

  res.json({
    success: true,
    data: {
      notes,
      pagination: {
        total: totalCount[0].count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + notes.length < totalCount[0].count
      },
      filters: {
        subjects: subjects.map(s => ({ value: s.subject, count: s.count }))
      }
    }
  });
}));

router.get('/notes/:noteId', [
  param('noteId').isUUID()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { noteId } = req.params;
  const userId = req.user.id;

  const note = await db.select()
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.noteId, noteId),
      or(
        eq(enhancedNotes.ownerId, userId),
        eq(enhancedNotes.isPublic, true),
        exists(
          db.select().from(noteSharing)
            .where(and(
              eq(noteSharing.noteId, enhancedNotes.id),
              eq(noteSharing.sharedWithUserId, userId),
              eq(noteSharing.isActive, true)
            ))
        )
      )
    ))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
  }

  const noteData = note[0];

  // Update view count and last accessed time
  await db.update(enhancedNotes)
    .set({
      viewCount: sql`${enhancedNotes.viewCount} + 1`,
      lastAccessedAt: new Date()
    })
    .where(eq(enhancedNotes.id, noteData.id));

  // Get handwriting analysis if available
  const handwritingData = await db.select()
    .from(handwritingAnalysis)
    .where(eq(handwritingAnalysis.noteId, noteData.id))
    .orderBy(desc(handwritingAnalysis.createdAt))
    .limit(1);

  // Get AI analysis data
  const aiData = {
    summary: noteData.aiSummary,
    keyPoints: noteData.aiKeyPoints,
    questions: noteData.aiQuestions,
    relatedContent: noteData.relatedContent
  };

  // Get template info if used
  let templateData = null;
  if (noteData.templateId) {
    const template = await db.select()
      .from(noteTemplates)
      .where(eq(noteTemplates.id, noteData.templateId))
      .limit(1);
    templateData = template[0] || null;
  }

  res.json({
    success: true,
    data: {
      ...noteData,
      handwritingAnalysis: handwritingData[0] || null,
      aiAnalysis: aiData,
      template: templateData
    }
  });
}));

router.post('/notes', upload.array('attachments', 10), [
  body('title').notEmpty().isLength({ min: 1, max: 200 }),
  body('contentType').optional().isIn(['text', 'handwriting', 'mixed', 'multimedia']),
  body('templateId').optional().isInt(),
  body('folderId').optional().isInt(),
  body('subject').optional().isString(),
  body('course').optional().isString(),
  body('chapter').optional().isString(),
  body('tags').optional().isArray()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    title,
    description,
    contentType = 'mixed',
    richTextContent = {},
    handwritingData = [],
    templateId,
    folderId,
    subject,
    course,
    chapter,
    tags = [],
    customStyling = {},
    fontSize = 14,
    fontFamily = 'Inter',
    lineSpacing = 1.5,
    isPublic = false,
    allowComments = true,
    allowEditing = false,
    citationStyle = 'apa'
  } = req.body;
  const userId = req.user.id;

  // Process uploaded attachments
  let attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.originalname.split('.').pop()}`;
      const filepath = path.join(__dirname, '../uploads/notes', filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      // Process images with sharp
      if (file.mimetype.startsWith('image/')) {
        const processedBuffer = await sharp(file.buffer)
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        await fs.writeFile(filepath, processedBuffer);
      } else {
        await fs.writeFile(filepath, file.buffer);
      }

      attachments.push({
        id: Math.random().toString(36).substring(7),
        filename: file.originalname,
        filepath: filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      });
    }
  }

  const newNote = await db.insert(enhancedNotes)
    .values({
      title,
      description,
      contentType,
      richTextContent,
      handwritingData,
      templateId: templateId ? parseInt(templateId) : null,
      folderId: folderId ? parseInt(folderId) : null,
      subject,
      course,
      chapter,
      tags,
      customStyling,
      fontSize: parseInt(fontSize),
      fontFamily,
      lineSpacing: parseFloat(lineSpacing),
      attachments,
      ownerId: userId,
      isPublic,
      allowComments,
      allowEditing,
      citationStyle
    })
    .returning();

  // Process handwriting recognition if handwriting data exists
  if (handwritingData && handwritingData.length > 0) {
    // This would typically call an OCR service
    // For now, we'll create a placeholder analysis
    await db.insert(handwritingAnalysis)
      .values({
        noteId: newNote[0].id,
        recognizedText: 'Handwriting recognition pending...',
        confidence: 0.0,
        language: 'en',
        style: 'mixed',
        processingModel: 'tesseract-v5'
      });
  }

  // Update folder note count if note is in a folder
  if (folderId) {
    await db.update(enhancedFolders)
      .set({
        noteCount: sql`${enhancedFolders.noteCount} + 1`,
        totalSize: sql`${enhancedFolders.totalSize} + ${attachments.reduce((sum, att) => sum + att.size, 0)}`,
        updatedAt: new Date()
      })
      .where(eq(enhancedFolders.id, parseInt(folderId)));
  }

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: newNote[0]
  });
}));

router.put('/notes/:noteId', upload.array('newAttachments', 10), [
  param('noteId').isUUID(),
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('richTextContent').optional().isObject(),
  body('handwritingData').optional().isArray()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { noteId } = req.params;
  const userId = req.user.id;

  // Check note ownership or edit permissions
  const note = await db.select()
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.noteId, noteId),
      or(
        eq(enhancedNotes.ownerId, userId),
        and(
          eq(enhancedNotes.allowEditing, true),
          exists(
            db.select().from(noteSharing)
              .where(and(
                eq(noteSharing.noteId, enhancedNotes.id),
                eq(noteSharing.sharedWithUserId, userId),
                eq(noteSharing.canEdit, true),
                eq(noteSharing.isActive, true)
              ))
          )
        )
      )
    ))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found or insufficient permissions', 404, 'NOTE_NOT_FOUND');
  }

  const noteData = note[0];
  const updateData = { ...req.body };

  // Process new attachments
  if (req.files && req.files.length > 0) {
    const existingAttachments = noteData.attachments || [];
    const newAttachments = [];

    for (const file of req.files) {
      const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.originalname.split('.').pop()}`;
      const filepath = path.join(__dirname, '../uploads/notes', filename);
      
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      if (file.mimetype.startsWith('image/')) {
        const processedBuffer = await sharp(file.buffer)
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        await fs.writeFile(filepath, processedBuffer);
      } else {
        await fs.writeFile(filepath, file.buffer);
      }

      newAttachments.push({
        id: Math.random().toString(36).substring(7),
        filename: file.originalname,
        filepath: filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      });
    }

    updateData.attachments = [...existingAttachments, ...newAttachments];
  }

  // Create revision history entry
  const currentRevision = {
    version: noteData.version,
    content: noteData.richTextContent,
    handwriting: noteData.handwritingData,
    editedBy: noteData.lastEditedBy,
    editedAt: noteData.updatedAt,
    changes: Object.keys(updateData)
  };

  const existingHistory = noteData.revisionHistory || [];
  updateData.revisionHistory = [currentRevision, ...existingHistory.slice(0, 49)]; // Keep last 50 revisions

  // Update version and metadata
  updateData.version = noteData.version + 1;
  updateData.lastEditedBy = userId;
  updateData.editCount = noteData.editCount + 1;
  updateData.updatedAt = new Date();

  const updatedNote = await db.update(enhancedNotes)
    .set(updateData)
    .where(eq(enhancedNotes.id, noteData.id))
    .returning();

  // Re-process handwriting recognition if handwriting data changed
  if (updateData.handwritingData) {
    await db.insert(handwritingAnalysis)
      .values({
        noteId: noteData.id,
        recognizedText: 'Handwriting recognition pending...',
        confidence: 0.0,
        language: 'en',
        style: 'mixed',
        processingModel: 'tesseract-v5'
      });
  }

  res.json({
    success: true,
    message: 'Note updated successfully',
    data: updatedNote[0]
  });
}));

// Real-time Collaboration
router.post('/notes/:noteId/collaborate', [
  param('noteId').isUUID(),
  body('maxParticipants').optional().isInt({ min: 1, max: 100 }),
  body('allowAnonymous').optional().isBoolean(),
  body('requireApproval').optional().isBoolean()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { noteId } = req.params;
  const {
    maxParticipants = 50,
    allowAnonymous = false,
    requireApproval = false,
    defaultPermissions = {
      canEdit: false,
      canComment: true,
      canViewHistory: false,
      canExport: false
    }
  } = req.body;
  const userId = req.user.id;

  // Check note ownership
  const note = await db.select()
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.noteId, noteId),
      eq(enhancedNotes.ownerId, userId)
    ))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found or insufficient permissions', 404, 'NOTE_NOT_FOUND');
  }

  // Check for existing active session
  const existingSession = await db.select()
    .from(collaborationSessions)
    .where(and(
      eq(collaborationSessions.noteId, note[0].id),
      eq(collaborationSessions.status, 'active')
    ))
    .limit(1);

  if (existingSession.length > 0) {
    return res.json({
      success: true,
      message: 'Collaboration session already active',
      data: existingSession[0]
    });
  }

  const newSession = await db.insert(collaborationSessions)
    .values({
      noteId: note[0].id,
      hostId: userId,
      maxParticipants,
      allowAnonymous,
      requireApproval,
      defaultPermissions
    })
    .returning();

  // Add host as first participant
  await db.insert(collaborationParticipants)
    .values({
      sessionId: newSession[0].id,
      userId,
      role: 'host',
      permissions: {
        canEdit: true,
        canComment: true,
        canViewHistory: true,
        canExport: true
      }
    });

  res.status(201).json({
    success: true,
    message: 'Collaboration session started',
    data: newSession[0]
  });
}));

// Comments and Annotations
router.get('/notes/:noteId/comments', [
  param('noteId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { noteId } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  // Verify access to note
  const note = await db.select()
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.noteId, noteId),
      or(
        eq(enhancedNotes.ownerId, userId),
        eq(enhancedNotes.isPublic, true),
        exists(
          db.select().from(noteSharing)
            .where(and(
              eq(noteSharing.noteId, enhancedNotes.id),
              eq(noteSharing.sharedWithUserId, userId),
              eq(noteSharing.isActive, true)
            ))
        )
      )
    ))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
  }

  const comments = await db.select({
    commentId: noteComments.commentId,
    content: noteComments.content,
    commentType: noteComments.commentType,
    anchorPoint: noteComments.anchorPoint,
    selectedText: noteComments.selectedText,
    pageNumber: noteComments.pageNumber,
    parentCommentId: noteComments.parentCommentId,
    threadDepth: noteComments.threadDepth,
    reactions: noteComments.reactions,
    upvotes: noteComments.upvotes,
    downvotes: noteComments.downvotes,
    status: noteComments.status,
    isResolved: noteComments.isResolved,
    isPrivate: noteComments.isPrivate,
    createdAt: noteComments.createdAt,
    updatedAt: noteComments.updatedAt,
    // Author info
    authorId: users.id,
    authorName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
    authorAvatar: users.avatar
  })
    .from(noteComments)
    .innerJoin(users, eq(noteComments.authorId, users.id))
    .where(and(
      eq(noteComments.noteId, note[0].id),
      eq(noteComments.status, 'active'),
      or(
        eq(noteComments.isPrivate, false),
        eq(noteComments.authorId, userId)
      )
    ))
    .orderBy(asc(noteComments.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  // Build comment threads
  const commentMap = new Map();
  const rootComments = [];

  comments.forEach(comment => {
    commentMap.set(comment.commentId, { ...comment, replies: [] });
    
    if (!comment.parentCommentId) {
      rootComments.push(comment.commentId);
    }
  });

  comments.forEach(comment => {
    if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
      commentMap.get(comment.parentCommentId).replies.push(commentMap.get(comment.commentId));
    }
  });

  const threadedComments = rootComments.map(id => commentMap.get(id));

  res.json({
    success: true,
    data: {
      comments: threadedComments,
      total: comments.length
    }
  });
}));

router.post('/notes/:noteId/comments', [
  param('noteId').isUUID(),
  body('content').notEmpty().isLength({ min: 1, max: 2000 }),
  body('commentType').optional().isIn(['text', 'voice', 'drawing']),
  body('anchorPoint').optional().isObject(),
  body('parentCommentId').optional().isUUID()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { noteId } = req.params;
  const {
    content,
    commentType = 'text',
    anchorPoint,
    selectedText,
    pageNumber,
    parentCommentId,
    isPrivate = false
  } = req.body;
  const userId = req.user.id;

  // Verify access to note and comment permissions
  const note = await db.select()
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.noteId, noteId),
      or(
        eq(enhancedNotes.ownerId, userId),
        and(
          eq(enhancedNotes.allowComments, true),
          or(
            eq(enhancedNotes.isPublic, true),
            exists(
              db.select().from(noteSharing)
                .where(and(
                  eq(noteSharing.noteId, enhancedNotes.id),
                  eq(noteSharing.sharedWithUserId, userId),
                  eq(noteSharing.canComment, true),
                  eq(noteSharing.isActive, true)
                ))
            )
          )
        )
      )
    ))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found or commenting not allowed', 404, 'COMMENT_NOT_ALLOWED');
  }

  // Calculate thread depth for nested comments
  let threadDepth = 0;
  if (parentCommentId) {
    const parentComment = await db.select()
      .from(noteComments)
      .where(eq(noteComments.commentId, parentCommentId))
      .limit(1);
    
    if (parentComment.length > 0) {
      threadDepth = parentComment[0].threadDepth + 1;
    }
  }

  const newComment = await db.insert(noteComments)
    .values({
      noteId: note[0].id,
      authorId: userId,
      content,
      commentType,
      anchorPoint,
      selectedText,
      pageNumber,
      parentCommentId,
      threadDepth,
      isPrivate
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: newComment[0]
  });
}));

// Note Sharing
router.post('/notes/:noteId/share', [
  param('noteId').isUUID(),
  body('shareType').isIn(['direct', 'link', 'qr_code', 'email']),
  body('sharedWithUserId').optional().isInt(),
  body('permissions').isObject(),
  body('expiresAt').optional().isISO8601(),
  body('passwordProtected').optional().isBoolean()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { noteId } = req.params;
  const {
    shareType,
    sharedWithUserId,
    permissions = {
      canView: true,
      canEdit: false,
      canComment: true,
      canShare: false,
      canDownload: true
    },
    expiresAt,
    maxViews,
    passwordProtected = false,
    accessPassword
  } = req.body;
  const userId = req.user.id;

  // Verify note ownership
  const note = await db.select()
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.noteId, noteId),
      eq(enhancedNotes.ownerId, userId)
    ))
    .limit(1);

  if (!note.length) {
    throw new AppError('Note not found or insufficient permissions', 404, 'NOTE_NOT_FOUND');
  }

  const shareData = {
    noteId: note[0].id,
    sharedByUserId: userId,
    shareType,
    canView: permissions.canView,
    canEdit: permissions.canEdit,
    canComment: permissions.canComment,
    canShare: permissions.canShare,
    canDownload: permissions.canDownload,
    passwordProtected,
    accessPassword: passwordProtected ? accessPassword : null
  };

  if (sharedWithUserId) {
    shareData.sharedWithUserId = sharedWithUserId;
  }

  if (expiresAt) {
    shareData.expiresAt = new Date(expiresAt);
  }

  if (maxViews) {
    shareData.maxViews = maxViews;
  }

  const newShare = await db.insert(noteSharing)
    .values(shareData)
    .returning();

  // Update note share count
  await db.update(enhancedNotes)
    .set({
      shareCount: sql`${enhancedNotes.shareCount} + 1`
    })
    .where(eq(enhancedNotes.id, note[0].id));

  res.status(201).json({
    success: true,
    message: 'Note shared successfully',
    data: {
      ...newShare[0],
      shareUrl: shareType === 'link' ? `/shared-note/${newShare[0].shareToken}` : null
    }
  });
}));

// Search and Discovery
router.get('/search', [
  query('q').notEmpty().isLength({ min: 1, max: 200 }),
  query('type').optional().isIn(['title', 'content', 'handwriting', 'all']),
  query('subject').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 50 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { q, type = 'all', subject, limit = 20 } = req.query;
  const userId = req.user.id;

  let searchQuery = db.select({
    noteId: enhancedNotes.noteId,
    title: enhancedNotes.title,
    description: enhancedNotes.description,
    subject: enhancedNotes.subject,
    course: enhancedNotes.course,
    chapter: enhancedNotes.chapter,
    tags: enhancedNotes.tags,
    contentType: enhancedNotes.contentType,
    createdAt: enhancedNotes.createdAt,
    updatedAt: enhancedNotes.updatedAt,
    // Relevance score (simplified)
    relevance: sql`
      CASE 
        WHEN ${enhancedNotes.title} ILIKE ${`%${q}%`} THEN 10
        WHEN ${enhancedNotes.description} ILIKE ${`%${q}%`} THEN 8
        WHEN ${enhancedNotes.ocrText} ILIKE ${`%${q}%`} THEN 6
        ELSE 1
      END
    `.as('relevance')
  })
    .from(enhancedNotes)
    .where(and(
      eq(enhancedNotes.ownerId, userId),
      or(
        type === 'all' ? or(
          like(enhancedNotes.title, `%${q}%`),
          like(enhancedNotes.description, `%${q}%`),
          like(enhancedNotes.ocrText, `%${q}%`)
        ) : undefined,
        type === 'title' ? like(enhancedNotes.title, `%${q}%`) : undefined,
        type === 'content' ? like(enhancedNotes.description, `%${q}%`) : undefined,
        type === 'handwriting' ? like(enhancedNotes.ocrText, `%${q}%`) : undefined
      )
    ));

  if (subject) {
    searchQuery = searchQuery.where(eq(enhancedNotes.subject, subject));
  }

  const results = await searchQuery
    .orderBy(desc(sql`relevance`), desc(enhancedNotes.updatedAt))
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      results,
      query: q,
      type,
      total: results.length
    }
  });
}));

export default router;