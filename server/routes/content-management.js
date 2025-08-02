import express from 'express';
import { db } from '../db/index.js';
import { eq, desc, asc, count, and, or, gte, lte, inArray, sql, like, ilike } from 'drizzle-orm';
// Tables accessed via db.schema
// Tables accessed via db.schema
// Tables will be accessed through db.schema
import { authenticateUser } from '../middleware/auth.js';
import { uploadHandler } from '../middleware/upload.js';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
// import csv from 'csv-parse'; // TODO: Install csv-parse package when needed

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Apply authentication to all routes
router.use(authenticateUser);

// PRELOADED CONTENT DISCOVERY

// Get content categories hierarchy
router.get('/categories', async (req, res) => {
  try {
    const { level, parentId, subject } = req.query;

    let query = db.select()
      .from(contentCategories)
      .where(eq(contentCategories.isActive, true));

    // Add filters
    let conditions = [eq(contentCategories.isActive, true)];

    if (level !== undefined) {
      conditions.push(eq(contentCategories.level, parseInt(level)));
    }

    if (parentId) {
      conditions.push(eq(contentCategories.parentCategoryId, parseInt(parentId)));
    } else if (level === '0') {
      conditions.push(eq(contentCategories.parentCategoryId, null));
    }

    if (subject) {
      conditions.push(eq(contentCategories.subject, subject));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(asc(contentCategories.sortOrder), asc(contentCategories.name));

    const categories = await query;

    res.json({
      categories,
      totalCategories: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Browse preloaded flashcard collections
router.get('/flashcard-collections', async (req, res) => {
  try {
    const {
      categoryId,
      subject,
      gradeLevel,
      difficulty,
      language = 'en',
      search,
      featured,
      sortBy = 'rating',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    let query = db.select({
      id: preloadedFlashcardCollections.id,
      collectionId: preloadedFlashcardCollections.collectionId,
      title: preloadedFlashcardCollections.title,
      description: preloadedFlashcardCollections.description,
      shortDescription: preloadedFlashcardCollections.shortDescription,
      subject: preloadedFlashcardCollections.subject,
      topic: preloadedFlashcardCollections.topic,
      gradeLevel: preloadedFlashcardCollections.gradeLevel,
      difficulty: preloadedFlashcardCollections.difficulty,
      cardCount: preloadedFlashcardCollections.cardCount,
      estimatedStudyTime: preloadedFlashcardCollections.estimatedStudyTime,
      collectionType: preloadedFlashcardCollections.collectionType,
      hasImages: preloadedFlashcardCollections.hasImages,
      hasAudio: preloadedFlashcardCollections.hasAudio,
      hasVideo: preloadedFlashcardCollections.hasVideo,
      qualityScore: preloadedFlashcardCollections.qualityScore,
      rating: preloadedFlashcardCollections.rating,
      ratingCount: preloadedFlashcardCollections.ratingCount,
      downloadCount: preloadedFlashcardCollections.downloadCount,
      tags: preloadedFlashcardCollections.tags,
      isPremium: preloadedFlashcardCollections.isPremium,
      price: preloadedFlashcardCollections.price,
      isFeatured: preloadedFlashcardCollections.isFeatured,
      createdAt: preloadedFlashcardCollections.createdAt
    }).from(preloadedFlashcardCollections);

    // Add filters
    let conditions = [
      eq(preloadedFlashcardCollections.isActive, true),
      eq(preloadedFlashcardCollections.isPublic, true)
    ];

    if (categoryId) {
      conditions.push(eq(preloadedFlashcardCollections.categoryId, parseInt(categoryId)));
    }

    if (subject) {
      conditions.push(eq(preloadedFlashcardCollections.subject, subject));
    }

    if (gradeLevel) {
      conditions.push(eq(preloadedFlashcardCollections.gradeLevel, gradeLevel));
    }

    if (difficulty) {
      conditions.push(eq(preloadedFlashcardCollections.difficulty, difficulty));
    }

    if (language) {
      conditions.push(eq(preloadedFlashcardCollections.language, language));
    }

    if (featured === 'true') {
      conditions.push(eq(preloadedFlashcardCollections.isFeatured, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(preloadedFlashcardCollections.title, `%${search}%`),
          ilike(preloadedFlashcardCollections.description, `%${search}%`),
          sql`${preloadedFlashcardCollections.tags}::text ILIKE ${`%${search}%`}`
        )
      );
    }

    query = query.where(and(...conditions));

    // Add sorting
    const orderDirection = order === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'title':
        query = query.orderBy(orderDirection(preloadedFlashcardCollections.title));
        break;
      case 'created':
        query = query.orderBy(orderDirection(preloadedFlashcardCollections.createdAt));
        break;
      case 'downloads':
        query = query.orderBy(orderDirection(preloadedFlashcardCollections.downloadCount));
        break;
      case 'cards':
        query = query.orderBy(orderDirection(preloadedFlashcardCollections.cardCount));
        break;
      case 'quality':
        query = query.orderBy(orderDirection(preloadedFlashcardCollections.qualityScore));
        break;
      default:
        query = query.orderBy(orderDirection(preloadedFlashcardCollections.rating));
    }

    const collections = await query.limit(parseInt(limit)).offset(offset);

    // Get total count
    const totalQuery = db.select({ count: count() })
      .from(preloadedFlashcardCollections)
      .where(and(...conditions));
    const [{ count: totalCount }] = await totalQuery;

    res.json({
      collections,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching flashcard collections:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard collections' });
  }
});

// Get specific preloaded flashcard collection with cards
router.get('/flashcard-collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { includeCards = true, cardLimit = 50 } = req.query;

    // Get collection details
    const [collection] = await db.select()
      .from(preloadedFlashcardCollections)
      .where(
        and(
          eq(preloadedFlashcardCollections.collectionId, collectionId),
          eq(preloadedFlashcardCollections.isActive, true),
          eq(preloadedFlashcardCollections.isPublic, true)
        )
      );

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    let cards = [];
    if (includeCards === 'true') {
      cards = await db.select()
        .from(preloadedFlashcards)
        .where(eq(preloadedFlashcards.collectionId, collection.id))
        .orderBy(asc(preloadedFlashcards.order))
        .limit(parseInt(cardLimit));
    }

    // Check if user has already imported this collection
    const [userLibraryEntry] = await db.select()
      .from(userContentLibrary)
      .where(
        and(
          eq(userContentLibrary.userId, req.user.id),
          eq(userContentLibrary.contentType, 'flashcard_collection'),
          eq(userContentLibrary.sourceId, collectionId)
        )
      );

    res.json({
      collection,
      cards,
      cardCount: cards.length,
      isImported: !!userLibraryEntry,
      importedAt: userLibraryEntry?.createdAt
    });
  } catch (error) {
    console.error('Error fetching collection details:', error);
    res.status(500).json({ error: 'Failed to fetch collection details' });
  }
});

// Import preloaded flashcard collection to user's library
router.post('/flashcard-collections/:collectionId/import', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { customTitle, targetDeckId, selectedCardIds = [] } = req.body;

    // Get collection details
    const [collection] = await db.select()
      .from(preloadedFlashcardCollections)
      .where(
        and(
          eq(preloadedFlashcardCollections.collectionId, collectionId),
          eq(preloadedFlashcardCollections.isActive, true),
          eq(preloadedFlashcardCollections.isPublic, true)
        )
      );

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if already imported
    const existingImport = await db.select()
      .from(userContentLibrary)
      .where(
        and(
          eq(userContentLibrary.userId, req.user.id),
          eq(userContentLibrary.contentType, 'flashcard_collection'),
          eq(userContentLibrary.sourceId, collectionId)
        )
      );

    if (existingImport.length > 0) {
      return res.status(400).json({ error: 'Collection already imported' });
    }

    // Get cards to import
    let cardsQuery = db.select()
      .from(preloadedFlashcards)
      .where(eq(preloadedFlashcards.collectionId, collection.id));

    if (selectedCardIds.length > 0) {
      cardsQuery = cardsQuery.where(inArray(preloadedFlashcards.cardId, selectedCardIds));
    }

    const cardsToImport = await cardsQuery.orderBy(asc(preloadedFlashcards.order));

    // Create or get target deck
    let targetDeck;
    if (targetDeckId) {
      const [existingDeck] = await db.select()
        .from(flashcardDecks)
        .where(
          and(
            eq(flashcardDecks.deckId, targetDeckId),
            eq(flashcardDecks.createdBy, req.user.id)
          )
        );
      targetDeck = existingDeck;
    }

    if (!targetDeck) {
      // Create new deck
      const [newDeck] = await db.insert(flashcardDecks).values({
        title: customTitle || collection.title,
        description: `Imported from: ${collection.title}`,
        subject: collection.subject,
        topic: collection.topic,
        gradeLevel: collection.gradeLevel,
        difficulty: collection.difficulty,
        createdBy: req.user.id,
        totalCards: cardsToImport.length
      }).returning();
      targetDeck = newDeck;
    }

    // Import cards
    const cardsToInsert = cardsToImport.map((card, index) => ({
      deckId: targetDeck.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      explanation: card.explanation,
      cardType: card.cardType,
      frontMedia: card.frontMedia,
      backMedia: card.backMedia,
      difficultyLevel: card.difficultyLevel,
      tags: card.tags,
      order: card.order,
      dueDate: new Date() // New cards are due immediately
    }));

    const importedCards = await db.insert(flashcards).values(cardsToInsert).returning();

    // Update deck card count if it was existing
    if (targetDeckId) {
      await db.update(flashcardDecks)
        .set({
          totalCards: sql`${flashcardDecks.totalCards} + ${cardsToImport.length}`,
          updatedAt: new Date()
        })
        .where(eq(flashcardDecks.id, targetDeck.id));
    }

    // Record in user's content library
    await db.insert(userContentLibrary).values({
      userId: req.user.id,
      contentType: 'flashcard_collection',
      sourceType: 'preloaded',
      sourceId: collectionId,
      title: customTitle || collection.title,
      description: `Imported from preloaded collection: ${collection.title}`
    });

    // Update collection download count
    await db.update(preloadedFlashcardCollections)
      .set({
        downloadCount: sql`${preloadedFlashcardCollections.downloadCount} + 1`,
        usageCount: sql`${preloadedFlashcardCollections.usageCount} + 1`
      })
      .where(eq(preloadedFlashcardCollections.id, collection.id));

    res.status(201).json({
      message: 'Collection imported successfully',
      deck: targetDeck,
      importedCardCount: importedCards.length,
      totalCardCount: cardsToImport.length
    });
  } catch (error) {
    console.error('Error importing collection:', error);
    res.status(500).json({ error: 'Failed to import collection' });
  }
});

// NOTES TO FLASHCARDS CONVERSION

// Convert notes to flashcards using AI
router.post('/notes/:noteId/convert-to-flashcards', async (req, res) => {
  try {
    const { noteId } = req.params;
    const {
      targetDeckId,
      conversionType = 'ai_generated',
      cardCount = 10,
      cardTypes = ['basic'],
      difficultyLevel = 'medium',
      focusAreas = [], // Specific sections or topics to focus on
      excludeAreas = [] // Areas to exclude
    } = req.body;

    // Get note content
    const [note] = await db.select()
      .from(enhancedNotes)
      .where(
        and(
          eq(enhancedNotes.noteId, noteId),
          eq(enhancedNotes.ownerId, req.user.id)
        )
      );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Extract text content from rich text and handwriting
    let sourceContent = '';
    
    // Add rich text content
    if (note.richTextContent && note.richTextContent.ops) {
      sourceContent += note.richTextContent.ops
        .map(op => typeof op.insert === 'string' ? op.insert : '')
        .join('');
    }

    // Add OCR text from handwriting
    if (note.ocrText) {
      sourceContent += '\n\n' + note.ocrText;
    }

    if (!sourceContent.trim()) {
      return res.status(400).json({ error: 'Note has no extractable text content' });
    }

    // Create conversion job
    const [job] = await db.insert(noteToFlashcardJobs).values({
      userId: req.user.id,
      noteId,
      conversionType,
      targetDeckId,
      cardCount: parseInt(cardCount),
      cardTypes,
      difficultyLevel,
      sourceContent,
      status: 'processing'
    }).returning();

    // Process with AI
    try {
      const prompt = `Convert the following note content into ${cardCount} high-quality flashcards:

NOTE CONTENT:
${sourceContent}

REQUIREMENTS:
- Card types: ${cardTypes.join(', ')}
- Difficulty level: ${difficultyLevel}
- Focus on key concepts, definitions, and important facts
- Create clear, concise questions and comprehensive answers
- Include explanations for complex concepts
${focusAreas.length > 0 ? `- Focus especially on: ${focusAreas.join(', ')}` : ''}
${excludeAreas.length > 0 ? `- Exclude content about: ${excludeAreas.join(', ')}` : ''}

Format each flashcard as JSON:
{
  "front": "Question or prompt",
  "back": "Answer or explanation", 
  "hint": "Optional hint",
  "explanation": "Detailed explanation if needed",
  "tags": ["relevant", "tags"],
  "cardType": "basic",
  "difficultyLevel": 1-5,
  "concepts": ["key concepts covered"]
}

Return only a JSON array of flashcards.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Create effective flashcards that promote active recall and spaced repetition learning.'
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

      // Extract key terms and concepts
      const keyTerms = extractKeyTerms(sourceContent);
      const concepts = extractConcepts(generatedCards);

      // Update job with results
      const [updatedJob] = await db.update(noteToFlashcardJobs)
        .set({
          status: 'completed',
          generatedCards,
          keyTerms,
          concepts,
          aiConfidence: 0.85, // Mock confidence score
          tokensUsed: completion.usage.total_tokens,
          processingTime: Date.now() - new Date(job.createdAt).getTime(),
          completedAt: new Date()
        })
        .where(eq(noteToFlashcardJobs.id, job.id))
        .returning();

      res.json({
        message: 'Flashcards generated successfully',
        job: updatedJob,
        generatedCards,
        keyTerms,
        concepts
      });

    } catch (aiError) {
      // Update job with error
      await db.update(noteToFlashcardJobs)
        .set({
          status: 'failed',
          errors: [{ error: aiError.message, timestamp: new Date() }]
        })
        .where(eq(noteToFlashcardJobs.id, job.id));

      console.error('AI conversion error:', aiError);
      res.status(500).json({ error: 'Failed to generate flashcards with AI' });
    }
  } catch (error) {
    console.error('Error converting notes to flashcards:', error);
    res.status(500).json({ error: 'Failed to convert notes to flashcards' });
  }
});

// Accept generated flashcards and add to deck
router.post('/note-conversions/:jobId/accept', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { selectedCards, targetDeckId, userSatisfaction } = req.body;

    // Get conversion job
    const [job] = await db.select()
      .from(noteToFlashcardJobs)
      .where(eq(noteToFlashcardJobs.jobId, jobId));

    if (!job || job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get or create target deck
    let targetDeck;
    if (targetDeckId) {
      const [existingDeck] = await db.select()
        .from(flashcardDecks)
        .where(
          and(
            eq(flashcardDecks.deckId, targetDeckId),
            eq(flashcardDecks.createdBy, req.user.id)
          )
        );
      targetDeck = existingDeck;
    }

    if (!targetDeck) {
      // Create new deck based on the note
      const [note] = await db.select()
        .from(enhancedNotes)
        .where(eq(enhancedNotes.noteId, job.noteId));

      const [newDeck] = await db.insert(flashcardDecks).values({
        title: `Flashcards from: ${note?.title || 'Note'}`,
        description: `Generated from note: ${note?.title}`,
        subject: note?.subject,
        createdBy: req.user.id,
        totalCards: selectedCards.length
      }).returning();
      targetDeck = newDeck;
    }

    // Get next order number
    const [{ maxOrder }] = await db.select({
      maxOrder: sql`COALESCE(MAX(${flashcards.order}), 0)`
    }).from(flashcards).where(eq(flashcards.deckId, targetDeck.id));

    // Insert selected cards
    const cardsToInsert = selectedCards.map((card, index) => ({
      deckId: targetDeck.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      explanation: card.explanation,
      tags: card.tags || [],
      cardType: card.cardType || 'basic',
      difficultyLevel: card.difficultyLevel,
      order: maxOrder + index + 1,
      aiGenerated: true,
      aiModel: 'gpt-4',
      dueDate: new Date()
    }));

    const insertedCards = await db.insert(flashcards).values(cardsToInsert).returning();

    // Update deck card count
    await db.update(flashcardDecks)
      .set({
        totalCards: sql`${flashcardDecks.totalCards} + ${selectedCards.length}`,
        updatedAt: new Date()
      })
      .where(eq(flashcardDecks.id, targetDeck.id));

    // Update job with acceptance info
    await db.update(noteToFlashcardJobs)
      .set({
        acceptedCards: selectedCards,
        userSatisfaction: parseInt(userSatisfaction) || null,
        updatedAt: new Date()
      })
      .where(eq(noteToFlashcardJobs.id, job.id));

    res.json({
      message: 'Flashcards created successfully',
      deck: targetDeck,
      cards: insertedCards,
      cardCount: insertedCards.length
    });
  } catch (error) {
    console.error('Error accepting flashcards:', error);
    res.status(500).json({ error: 'Failed to create flashcards' });
  }
});

// IMPORT/EXPORT FUNCTIONALITY

// Configure multer for file uploads
const uploadDir = 'uploads/content-imports';
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.txt', '.apkg', '.colpkg', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// Import content from file
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      contentType = 'flashcards',
      format,
      targetDeckId,
      autoDetectFormat = true
    } = req.body;

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let detectedFormat = format;

    // Auto-detect format if not specified
    if (autoDetectFormat && !format) {
      detectedFormat = detectFileFormat(fileExtension, req.file.originalname);
    }

    // Create import job record
    const [importJob] = await db.insert(contentTransferHistory).values({
      userId: req.user.id,
      transferType: 'import',
      contentType,
      format: detectedFormat,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      filePath: req.file.path,
      status: 'processing'
    }).returning();

    try {
      let processedData;
      
      // Process file based on format
      switch (detectedFormat) {
        case 'csv':
          processedData = await processCsvFile(req.file.path);
          break;
        case 'json':
          processedData = await processJsonFile(req.file.path);
          break;
        case 'anki':
          processedData = await processAnkiFile(req.file.path);
          break;
        case 'quizlet':
          processedData = await processQuizletFile(req.file.path);
          break;
        default:
          throw new Error(`Unsupported format: ${detectedFormat}`);
      }

      // Import the processed data
      const importResult = await importFlashcards(
        processedData,
        req.user.id,
        targetDeckId,
        contentType
      );

      // Update import job with results
      await db.update(contentTransferHistory)
        .set({
          status: 'completed',
          itemCount: processedData.length,
          successCount: importResult.successCount,
          errorCount: importResult.errorCount,
          errors: importResult.errors,
          createdContentIds: importResult.createdContentIds,
          completedAt: new Date()
        })
        .where(eq(contentTransferHistory.id, importJob.id));

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json({
        message: 'Import completed successfully',
        importJob: {
          ...importJob,
          status: 'completed',
          itemCount: processedData.length,
          successCount: importResult.successCount,
          errorCount: importResult.errorCount
        },
        result: importResult
      });

    } catch (processingError) {
      // Update job with error
      await db.update(contentTransferHistory)
        .set({
          status: 'failed',
          errors: [{ error: processingError.message, timestamp: new Date() }],
          completedAt: new Date()
        })
        .where(eq(contentTransferHistory.id, importJob.id));

      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }

      throw processingError;
    }
  } catch (error) {
    console.error('Error importing content:', error);
    res.status(500).json({ error: 'Failed to import content' });
  }
});

// Export content to file
router.post('/export', async (req, res) => {
  try {
    const {
      contentType = 'flashcards',
      contentIds = [],
      format = 'json',
      includeMetadata = true,
      includeMedia = false
    } = req.body;

    if (contentIds.length === 0) {
      return res.status(400).json({ error: 'No content selected for export' });
    }

    // Create export job record
    const [exportJob] = await db.insert(contentTransferHistory).values({
      userId: req.user.id,
      transferType: 'export',
      contentType,
      format,
      status: 'processing',
      itemCount: contentIds.length
    }).returning();

    try {
      let exportData;
      let fileName;

      switch (contentType) {
        case 'flashcards':
          exportData = await exportFlashcards(contentIds, req.user.id, includeMetadata, includeMedia);
          fileName = `flashcards-export-${Date.now()}.${format}`;
          break;
        case 'notes':
          exportData = await exportNotes(contentIds, req.user.id, includeMetadata);
          fileName = `notes-export-${Date.now()}.${format}`;
          break;
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }

      // Format the export data
      let formattedData;
      let mimeType;

      switch (format) {
        case 'json':
          formattedData = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          break;
        case 'csv':
          formattedData = convertToCsv(exportData);
          mimeType = 'text/csv';
          break;
        case 'anki':
          formattedData = convertToAnki(exportData);
          mimeType = 'application/octet-stream';
          fileName = fileName.replace('.anki', '.apkg');
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Update export job
      await db.update(contentTransferHistory)
        .set({
          status: 'completed',
          successCount: exportData.length,
          fileName,
          completedAt: new Date()
        })
        .where(eq(contentTransferHistory.id, exportJob.id));

      // Send file as download
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', mimeType);
      res.send(formattedData);

    } catch (processingError) {
      // Update job with error
      await db.update(contentTransferHistory)
        .set({
          status: 'failed',
          errors: [{ error: processingError.message, timestamp: new Date() }],
          completedAt: new Date()
        })
        .where(eq(contentTransferHistory.id, exportJob.id));

      throw processingError;
    }
  } catch (error) {
    console.error('Error exporting content:', error);
    res.status(500).json({ error: 'Failed to export content' });
  }
});

// Get import/export history
router.get('/transfer-history', async (req, res) => {
  try {
    const { 
      transferType, 
      contentType, 
      status, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(contentTransferHistory)
      .where(eq(contentTransferHistory.userId, req.user.id));

    let conditions = [eq(contentTransferHistory.userId, req.user.id)];

    if (transferType) {
      conditions.push(eq(contentTransferHistory.transferType, transferType));
    }

    if (contentType) {
      conditions.push(eq(contentTransferHistory.contentType, contentType));
    }

    if (status) {
      conditions.push(eq(contentTransferHistory.status, status));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(desc(contentTransferHistory.createdAt));
    query = query.limit(parseInt(limit)).offset(offset);

    const history = await query;

    res.json({
      history,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(history.length / limit),
        hasNextPage: history.length === parseInt(limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    res.status(500).json({ error: 'Failed to fetch transfer history' });
  }
});

// CONTENT RECOMMENDATIONS

// Get personalized content recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { 
      contentType, 
      recommendationType, 
      limit = 10 
    } = req.query;

    // Generate recommendations based on user activity
    await generateContentRecommendations(req.user.id);

    let query = db.select()
      .from(contentRecommendations)
      .where(
        and(
          eq(contentRecommendations.userId, req.user.id),
          eq(contentRecommendations.status, 'pending'),
          or(
            eq(contentRecommendations.expiresAt, null),
            gte(contentRecommendations.expiresAt, new Date())
          )
        )
      );

    let conditions = [
      eq(contentRecommendations.userId, req.user.id),
      eq(contentRecommendations.status, 'pending'),
      or(
        eq(contentRecommendations.expiresAt, null),
        gte(contentRecommendations.expiresAt, new Date())
      )
    ];

    if (contentType) {
      conditions.push(eq(contentRecommendations.contentType, contentType));
    }

    if (recommendationType) {
      conditions.push(eq(contentRecommendations.recommendationType, recommendationType));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(desc(contentRecommendations.relevanceScore));
    query = query.limit(parseInt(limit));

    const recommendations = await query;

    res.json({
      recommendations,
      totalRecommendations: recommendations.length
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// HELPER FUNCTIONS

function detectFileFormat(extension, filename) {
  const formatMap = {
    '.csv': 'csv',
    '.json': 'json',
    '.txt': 'csv', // Assume tab-separated
    '.apkg': 'anki',
    '.colpkg': 'anki'
  };

  // Special detection for Quizlet exports
  if (filename.toLowerCase().includes('quizlet')) {
    return 'quizlet';
  }

  return formatMap[extension] || 'unknown';
}

async function processCsvFile(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const records = [];
  
  // Simple CSV processing without external library
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length >= 2) {
      records.push({
        front: values[0] || '',
        back: values[1] || '',
        hint: values[2] || '',
        explanation: values[3] || '',
        tags: values[4] ? values[4].split('|').map(t => t.trim()).filter(Boolean) : []
      });
    }
  }
  
  return records;
}

async function processJsonFile(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  // Handle different JSON structures
  if (Array.isArray(data)) {
    return data;
  } else if (data.flashcards && Array.isArray(data.flashcards)) {
    return data.flashcards;
  } else if (data.cards && Array.isArray(data.cards)) {
    return data.cards;
  }
  
  throw new Error('Unsupported JSON structure');
}

async function processAnkiFile(filePath) {
  // This would require the anki-apkg-export library or similar
  // For now, return empty array with TODO
  throw new Error('Anki import not yet implemented. Please export as CSV or JSON.');
}

async function processQuizletFile(filePath) {
  // Similar to CSV but with Quizlet-specific handling
  return await processCsvFile(filePath);
}

async function importFlashcards(data, userId, targetDeckId, contentType) {
  const result = {
    successCount: 0,
    errorCount: 0,
    errors: [],
    createdContentIds: []
  };

  try {
    // Get or create target deck
    let targetDeck;
    if (targetDeckId) {
      const [existingDeck] = await db.select()
        .from(flashcardDecks)
        .where(
          and(
            eq(flashcardDecks.deckId, targetDeckId),
            eq(flashcardDecks.createdBy, userId)
          )
        );
      targetDeck = existingDeck;
    }

    if (!targetDeck) {
      const [newDeck] = await db.insert(flashcardDecks).values({
        title: `Imported Deck - ${new Date().toLocaleDateString()}`,
        description: 'Imported flashcard collection',
        createdBy: userId,
        totalCards: 0
      }).returning();
      targetDeck = newDeck;
    }

    // Get next order number
    const [{ maxOrder }] = await db.select({
      maxOrder: sql`COALESCE(MAX(${flashcards.order}), 0)`
    }).from(flashcards).where(eq(flashcards.deckId, targetDeck.id));

    // Import cards in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const cardsToInsert = batch.map((card, index) => {
        try {
          return {
            deckId: targetDeck.id,
            front: card.front || '',
            back: card.back || '',
            hint: card.hint,
            explanation: card.explanation,
            tags: Array.isArray(card.tags) ? card.tags : [],
            order: maxOrder + i + index + 1,
            dueDate: new Date()
          };
        } catch (error) {
          result.errors.push(`Row ${i + index + 1}: ${error.message}`);
          result.errorCount++;
          return null;
        }
      }).filter(Boolean);

      if (cardsToInsert.length > 0) {
        const insertedCards = await db.insert(flashcards).values(cardsToInsert).returning();
        result.successCount += insertedCards.length;
        result.createdContentIds.push(...insertedCards.map(c => c.cardId));
      }
    }

    // Update deck card count
    await db.update(flashcardDecks)
      .set({
        totalCards: sql`${flashcardDecks.totalCards} + ${result.successCount}`,
        updatedAt: new Date()
      })
      .where(eq(flashcardDecks.id, targetDeck.id));

    result.createdContentIds.push(targetDeck.deckId);

  } catch (error) {
    result.errorCount = data.length;
    result.errors.push(error.message);
  }

  return result;
}

async function exportFlashcards(deckIds, userId, includeMetadata, includeMedia) {
  const exportData = [];

  for (const deckId of deckIds) {
    // Get deck
    const [deck] = await db.select()
      .from(flashcardDecks)
      .where(
        and(
          eq(flashcardDecks.deckId, deckId),
          eq(flashcardDecks.createdBy, userId)
        )
      );

    if (!deck) continue;

    // Get cards
    const cards = await db.select()
      .from(flashcards)
      .where(eq(flashcards.deckId, deck.id))
      .orderBy(asc(flashcards.order));

    const deckData = {
      deck: {
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        ...(includeMetadata && {
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
          totalCards: deck.totalCards
        })
      },
      cards: cards.map(card => ({
        front: card.front,
        back: card.back,
        hint: card.hint,
        explanation: card.explanation,
        tags: card.tags,
        ...(includeMetadata && {
          cardType: card.cardType,
          difficultyLevel: card.difficultyLevel,
          totalReviews: card.totalReviews,
          correctReviews: card.correctReviews
        }),
        ...(includeMedia && {
          frontMedia: card.frontMedia,
          backMedia: card.backMedia
        })
      }))
    };

    exportData.push(deckData);
  }

  return exportData;
}

async function exportNotes(noteIds, userId, includeMetadata) {
  const notes = await db.select()
    .from(enhancedNotes)
    .where(
      and(
        inArray(enhancedNotes.noteId, noteIds),
        eq(enhancedNotes.ownerId, userId)
      )
    );

  return notes.map(note => ({
    title: note.title,
    content: note.richTextContent,
    ocrText: note.ocrText,
    subject: note.subject,
    tags: note.tags,
    ...(includeMetadata && {
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      viewCount: note.viewCount,
      studyTime: note.studyTime
    })
  }));
}

function convertToCsv(data) {
  if (data.length === 0) return '';

  // Flatten the data structure for CSV
  const csvData = [];
  
  data.forEach(item => {
    if (item.cards) {
      // Flashcard data
      item.cards.forEach(card => {
        csvData.push({
          type: 'flashcard',
          deck_title: item.deck.title,
          front: card.front,
          back: card.back,
          hint: card.hint,
          explanation: card.explanation,
          tags: Array.isArray(card.tags) ? card.tags.join(', ') : card.tags
        });
      });
    } else {
      // Note data
      csvData.push({
        type: 'note',
        title: item.title,
        content: item.content,
        subject: item.subject,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags
      });
    }
  });

  // Convert to CSV string
  const headers = Object.keys(csvData[0] || {});
  const csvRows = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if needed
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

function convertToAnki(data) {
  // This would require implementing Anki package format
  // For now, return JSON as placeholder
  return JSON.stringify(data, null, 2);
}

function extractKeyTerms(content) {
  // Simple keyword extraction - in production, use NLP libraries
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .filter(([word, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function extractConcepts(cards) {
  const concepts = new Set();
  
  cards.forEach(card => {
    if (card.concepts && Array.isArray(card.concepts)) {
      card.concepts.forEach(concept => concepts.add(concept));
    }
  });

  return Array.from(concepts);
}

async function generateContentRecommendations(userId) {
  // This would implement ML-based recommendations
  // For now, implement basic rule-based recommendations
  
  try {
    // Get user's recent activity
    const recentDecks = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.createdBy, userId))
      .orderBy(desc(flashcardDecks.lastStudied))
      .limit(5);

    // Find similar preloaded collections
    for (const deck of recentDecks) {
      if (deck.subject) {
        const similarCollections = await db.select()
          .from(preloadedFlashcardCollections)
          .where(
            and(
              eq(preloadedFlashcardCollections.subject, deck.subject),
              eq(preloadedFlashcardCollections.isActive, true),
              eq(preloadedFlashcardCollections.isPublic, true),
              gte(preloadedFlashcardCollections.rating, 4.0)
            )
          )
          .limit(3);

        // Create recommendations
        for (const collection of similarCollections) {
          // Check if already recommended recently
          const existing = await db.select()
            .from(contentRecommendations)
            .where(
              and(
                eq(contentRecommendations.userId, userId),
                eq(contentRecommendations.contentId, collection.collectionId),
                gte(contentRecommendations.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
              )
            );

          if (existing.length === 0) {
            await db.insert(contentRecommendations).values({
              userId,
              recommendationType: 'similar_content',
              contentType: 'flashcard_collection',
              contentId: collection.collectionId,
              title: collection.title,
              description: collection.shortDescription,
              reason: `Similar to your "${deck.title}" deck`,
              relevanceScore: 0.8,
              qualityScore: collection.qualityScore,
              basedOnContent: [deck.deckId],
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

export default router;