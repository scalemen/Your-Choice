import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { 
  db, 
  users,
  aiModels,
  aiConversations,
  aiMessages,
  homeworkProblems,
  homeworkSubmissions,
  aiTutoringSessions,
  aiKnowledgeBase,
  learningAnalytics
} from '../db/index.js';
import { eq, and, or, desc, asc, sql, inArray, like, gte, lte, ne, count, exists } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import OpenAI from 'openai';
import multer from 'multer';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads (homework images, etc.)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// AI Models Management
router.get('/models', catchAsync(async (req, res) => {
  const models = await db.select({
    modelId: aiModels.modelId,
    name: aiModels.name,
    version: aiModels.version,
    provider: aiModels.provider,
    modelType: aiModels.modelType,
    capabilities: aiModels.capabilities,
    maxTokens: aiModels.maxTokens,
    costPerToken: aiModels.costPerToken,
    latency: aiModels.latency,
    reliability: aiModels.reliability,
    accuracy: aiModels.accuracy,
    subjectExpertise: aiModels.subjectExpertise,
    languageSupport: aiModels.languageSupport,
    isActive: aiModels.isActive,
    isDefault: aiModels.isDefault
  })
    .from(aiModels)
    .where(eq(aiModels.isActive, true))
    .orderBy(desc(aiModels.isDefault), desc(aiModels.reliability));

  // Get usage statistics
  const modelStats = await Promise.all(
    models.map(async (model) => {
      const usage = await db.select({
        totalConversations: sql`count(*)`.as('totalConversations'),
        totalMessages: sql`sum(${aiConversations.totalMessages})`.as('totalMessages'),
        avgSatisfaction: sql`avg(${aiConversations.userSatisfaction})`.as('avgSatisfaction')
      })
        .from(aiConversations)
        .where(eq(aiConversations.modelId, model.modelId));

      return {
        ...model,
        usage: usage[0] || { totalConversations: 0, totalMessages: 0, avgSatisfaction: null }
      };
    })
  );

  res.json({
    success: true,
    data: {
      models: modelStats,
      total: models.length
    }
  });
}));

router.post('/models', [
  body('name').notEmpty().isLength({ min: 1, max: 100 }),
  body('version').notEmpty().isLength({ min: 1, max: 50 }),
  body('provider').notEmpty().isLength({ min: 1, max: 50 }),
  body('modelType').notEmpty().isLength({ min: 1, max: 50 }),
  body('capabilities').isArray().notEmpty(),
  body('maxTokens').isInt({ min: 1 }),
  body('subjectExpertise').optional().isObject()
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
    version,
    provider,
    modelType,
    capabilities,
    maxTokens,
    costPerToken,
    subjectExpertise = {},
    languageSupport = ['en'],
    isDefault = false
  } = req.body;

  // If setting as default, unset other defaults
  if (isDefault) {
    await db.update(aiModels)
      .set({ isDefault: false })
      .where(eq(aiModels.isDefault, true));
  }

  const newModel = await db.insert(aiModels)
    .values({
      name,
      version,
      provider,
      modelType,
      capabilities,
      maxTokens,
      costPerToken: costPerToken ? parseFloat(costPerToken) : null,
      subjectExpertise,
      languageSupport,
      isDefault
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'AI model registered successfully',
    data: newModel[0]
  });
}));

// AI Conversations Management
router.get('/conversations', [
  query('type').optional().isIn(['chat', 'homework', 'tutor', 'quiz', 'study_buddy']),
  query('subject').optional().isString(),
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

  const {
    type,
    subject,
    limit = 20,
    offset = 0
  } = req.query;
  const userId = req.user.id;

  let query = db.select({
    conversationId: aiConversations.conversationId,
    title: aiConversations.title,
    description: aiConversations.description,
    conversationType: aiConversations.conversationType,
    currentSubject: aiConversations.currentSubject,
    difficultyLevel: aiConversations.difficultyLevel,
    aiPersonality: aiConversations.aiPersonality,
    responseStyle: aiConversations.responseStyle,
    isActive: aiConversations.isActive,
    lastInteraction: aiConversations.lastInteraction,
    totalMessages: aiConversations.totalMessages,
    userSatisfaction: aiConversations.userSatisfaction,
    helpfulnessRating: aiConversations.helpfulnessRating,
    createdAt: aiConversations.createdAt,
    // Model info
    modelName: aiModels.name,
    modelType: aiModels.modelType,
    modelProvider: aiModels.provider
  })
    .from(aiConversations)
    .innerJoin(aiModels, eq(aiConversations.modelId, aiModels.id))
    .where(eq(aiConversations.userId, userId));

  if (type) {
    query = query.where(eq(aiConversations.conversationType, type));
  }

  if (subject) {
    query = query.where(eq(aiConversations.currentSubject, subject));
  }

  const conversations = await query
    .orderBy(desc(aiConversations.lastInteraction))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  // Get total count for pagination
  const totalCount = await db.select({ count: sql`count(*)` })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId));

  res.json({
    success: true,
    data: {
      conversations,
      pagination: {
        total: totalCount[0].count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + conversations.length < totalCount[0].count
      }
    }
  });
}));

router.post('/conversations', [
  body('conversationType').isIn(['chat', 'homework', 'tutor', 'quiz', 'study_buddy']),
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('modelId').optional().isUUID(),
  body('currentSubject').optional().isString(),
  body('difficultyLevel').optional().isIn(['beginner', 'medium', 'advanced']),
  body('learningGoals').optional().isArray()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    conversationType,
    title,
    description,
    modelId,
    currentSubject,
    difficultyLevel = 'medium',
    learningGoals = [],
    aiPersonality = 'helpful',
    responseStyle = 'detailed',
    languagePreference = 'en'
  } = req.body;
  const userId = req.user.id;

  // Get default model if not specified
  let selectedModelId = modelId;
  if (!selectedModelId) {
    const defaultModel = await db.select()
      .from(aiModels)
      .where(and(eq(aiModels.isDefault, true), eq(aiModels.isActive, true)))
      .limit(1);
    
    if (defaultModel.length > 0) {
      selectedModelId = defaultModel[0].modelId;
    } else {
      throw new AppError('No AI model available', 500, 'NO_MODEL_AVAILABLE');
    }
  }

  // Get user context for personalization
  const userAnalytics = await db.select()
    .from(learningAnalytics)
    .where(eq(learningAnalytics.userId, userId))
    .limit(1);

  const userContext = userAnalytics.length > 0 ? {
    learningStyle: userAnalytics[0].detectedLearningStyle,
    knowledgeMap: userAnalytics[0].knowledgeMap,
    strengthAreas: userAnalytics[0].strengthAreas,
    improvementAreas: userAnalytics[0].improvementAreas
  } : {};

  const newConversation = await db.insert(aiConversations)
    .values({
      userId,
      modelId: selectedModelId,
      title: title || `${conversationType.charAt(0).toUpperCase() + conversationType.slice(1)} Session`,
      description,
      conversationType,
      userContext,
      currentSubject,
      difficultyLevel,
      learningGoals,
      aiPersonality,
      responseStyle,
      languagePreference
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'AI conversation started',
    data: newConversation[0]
  });
}));

// AI Messages and Chat
router.get('/conversations/:conversationId/messages', [
  param('conversationId').isUUID(),
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

  const { conversationId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user.id;

  // Verify conversation ownership
  const conversation = await db.select()
    .from(aiConversations)
    .where(and(
      eq(aiConversations.conversationId, conversationId),
      eq(aiConversations.userId, userId)
    ))
    .limit(1);

  if (!conversation.length) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const messages = await db.select({
    messageId: aiMessages.messageId,
    role: aiMessages.role,
    messageType: aiMessages.messageType,
    content: aiMessages.content,
    richContent: aiMessages.richContent,
    attachments: aiMessages.attachments,
    codeBlocks: aiMessages.codeBlocks,
    mathExpressions: aiMessages.mathExpressions,
    tokensUsed: aiMessages.tokensUsed,
    processingTime: aiMessages.processingTime,
    confidence: aiMessages.confidence,
    reasoning: aiMessages.reasoning,
    sources: aiMessages.sources,
    followUpSuggestions: aiMessages.followUpSuggestions,
    hasInteractiveElements: aiMessages.hasInteractiveElements,
    interactiveData: aiMessages.interactiveData,
    userFeedback: aiMessages.userFeedback,
    feedbackDetails: aiMessages.feedbackDetails,
    createdAt: aiMessages.createdAt,
    // Model info
    modelName: aiModels.name,
    modelType: aiModels.modelType
  })
    .from(aiMessages)
    .leftJoin(aiModels, eq(aiMessages.modelUsed, aiModels.id))
    .where(eq(aiMessages.conversationId, conversation[0].id))
    .orderBy(asc(aiMessages.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  res.json({
    success: true,
    data: {
      messages,
      conversation: conversation[0],
      total: messages.length
    }
  });
}));

router.post('/conversations/:conversationId/messages', [
  param('conversationId').isUUID(),
  body('content').notEmpty(),
  body('messageType').optional().isIn(['text', 'image', 'audio', 'code', 'math', 'file']),
  body('attachments').optional().isArray()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { conversationId } = req.params;
  const {
    content,
    messageType = 'text',
    attachments = []
  } = req.body;
  const userId = req.user.id;

  // Verify conversation ownership
  const conversation = await db.select()
    .from(aiConversations)
    .where(and(
      eq(aiConversations.conversationId, conversationId),
      eq(aiConversations.userId, userId)
    ))
    .limit(1);

  if (!conversation.length) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  const conversationData = conversation[0];

  // Get the AI model for this conversation
  const model = await db.select()
    .from(aiModels)
    .where(eq(aiModels.id, conversationData.modelId))
    .limit(1);

  if (!model.length) {
    throw new AppError('AI model not found', 404, 'MODEL_NOT_FOUND');
  }

  // Insert user message
  const userMessage = await db.insert(aiMessages)
    .values({
      conversationId: conversationData.id,
      role: 'user',
      messageType,
      content,
      attachments
    })
    .returning();

  // Prepare context for AI response
  const recentMessages = await db.select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationData.id))
    .orderBy(desc(aiMessages.createdAt))
    .limit(10);

  const messageHistory = recentMessages.reverse().map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Generate AI response
  const startTime = Date.now();
  
  try {
    const systemPrompt = generateSystemPrompt(conversationData, model[0]);
    
    const completion = await openai.chat.completions.create({
      model: model[0].modelType === 'gpt' ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messageHistory,
        { role: 'user', content }
      ],
      max_tokens: Math.min(model[0].maxTokens, 2000),
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;
    const processingTime = Date.now() - startTime;

    // Insert AI response
    const aiMessage = await db.insert(aiMessages)
      .values({
        conversationId: conversationData.id,
        role: 'assistant',
        messageType: 'text',
        content: aiResponse,
        modelUsed: model[0].id,
        tokensUsed,
        processingTime,
        confidence: 0.95, // This would typically be calculated
        followUpSuggestions: generateFollowUpSuggestions(content, aiResponse, conversationData.conversationType)
      })
      .returning();

    // Update conversation metadata
    await db.update(aiConversations)
      .set({
        lastInteraction: new Date(),
        totalMessages: sql`${aiConversations.totalMessages} + 2` // User + AI message
      })
      .where(eq(aiConversations.id, conversationData.id));

    res.status(201).json({
      success: true,
      data: {
        userMessage: userMessage[0],
        aiMessage: aiMessage[0]
      }
    });

  } catch (error) {
    console.error('AI response error:', error);
    throw new AppError('Failed to generate AI response', 500, 'AI_RESPONSE_ERROR');
  }
}));

// Homework Solver with OCR
router.post('/homework/solve', upload.single('image'), [
  body('problemText').optional().isString(),
  body('subject').optional().isString(),
  body('explanationLevel').optional().isIn(['brief', 'detailed', 'step_by_step'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    problemText,
    subject,
    explanationLevel = 'detailed'
  } = req.body;
  const userId = req.user.id;

  let extractedText = problemText;
  let originalImage = null;

  // Process uploaded image with OCR
  if (req.file) {
    try {
      // Save original image
      const filename = `homework_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filepath = path.join(__dirname, '../uploads/homework', filename);
      
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      // Process and compress image
      const processedBuffer = await sharp(req.file.buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      await fs.writeFile(filepath, processedBuffer);
      originalImage = filename;

      // OCR processing
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text, confidence } } = await worker.recognize(processedBuffer);
      await worker.terminate();

      if (text.trim() && confidence > 0.5) {
        extractedText = text.trim();
      }

    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      // Continue without OCR if it fails
    }
  }

  if (!extractedText) {
    throw new AppError('No problem text provided or extracted from image', 400, 'NO_PROBLEM_TEXT');
  }

  // Create or get homework conversation
  let conversation = await db.select()
    .from(aiConversations)
    .where(and(
      eq(aiConversations.userId, userId),
      eq(aiConversations.conversationType, 'homework'),
      eq(aiConversations.isActive, true)
    ))
    .orderBy(desc(aiConversations.lastInteraction))
    .limit(1);

  if (!conversation.length) {
    const defaultModel = await db.select()
      .from(aiModels)
      .where(and(eq(aiModels.isDefault, true), eq(aiModels.isActive, true)))
      .limit(1);

    const newConv = await db.insert(aiConversations)
      .values({
        userId,
        modelId: defaultModel[0].id,
        title: 'Homework Helper',
        conversationType: 'homework',
        currentSubject: subject,
        aiPersonality: 'educational',
        responseStyle: 'step_by_step'
      })
      .returning();
    
    conversation = newConv;
  }

  const conversationData = conversation[0];

  // Check for similar problems in database
  const similarProblems = await db.select()
    .from(homeworkProblems)
    .where(and(
      like(homeworkProblems.problemText, `%${extractedText.substring(0, 50)}%`),
      subject ? eq(homeworkProblems.subject, subject) : sql`true`
    ))
    .limit(3);

  // Generate AI solution
  try {
    const model = await db.select()
      .from(aiModels)
      .where(eq(aiModels.id, conversationData.modelId))
      .limit(1);

    const systemPrompt = `You are an expert educational assistant specializing in helping students solve homework problems. 
    
Your role is to:
1. Analyze the problem step-by-step
2. Provide clear, educational explanations
3. Help students learn, not just give answers
4. Show multiple solution approaches when applicable
5. Explain the underlying concepts

Problem Context:
- Subject: ${subject || 'General'}
- Explanation Level: ${explanationLevel}
- Student needs to understand the process, not just the answer

Guidelines:
- Break down complex problems into manageable steps
- Explain the reasoning behind each step
- Use clear, grade-appropriate language
- Provide helpful tips and common mistake warnings
- Suggest related practice problems when relevant`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please help me solve this problem:\n\n${extractedText}` }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const aiSolution = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    // Parse solution into structured format
    const solutionSteps = parseSolutionSteps(aiSolution);
    const conceptsExplained = extractConcepts(aiSolution, subject);
    const relatedTopics = generateRelatedTopics(subject, extractedText);

    // Detect problem classification
    const detectedSubject = subject || await detectSubject(extractedText);
    const detectedTopic = await detectTopic(extractedText, detectedSubject);

    // Create homework submission record
    const submission = await db.insert(homeworkSubmissions)
      .values({
        userId,
        conversationId: conversationData.id,
        originalProblem: extractedText,
        originalImage,
        problemRecognition: {
          extractedText,
          confidence: req.file ? 0.8 : 1.0,
          ocrUsed: !!req.file
        },
        detectedSubject,
        detectedTopic,
        confidenceLevel: 0.9,
        aiSolution: {
          content: aiSolution,
          model: model[0].name,
          tokensUsed
        },
        solutionSteps,
        explanationLevel,
        conceptsExplained,
        relatedTopics,
        practiceProblems: generatePracticeProblems(detectedSubject, detectedTopic)
      })
      .returning();

    // Insert messages into conversation
    await db.insert(aiMessages)
      .values([
        {
          conversationId: conversationData.id,
          role: 'user',
          messageType: req.file ? 'image' : 'text',
          content: extractedText,
          attachments: req.file ? [{ filename: originalImage, type: 'image' }] : []
        },
        {
          conversationId: conversationData.id,
          role: 'assistant',
          messageType: 'text',
          content: aiSolution,
          modelUsed: model[0].id,
          tokensUsed,
          hasInteractiveElements: true,
          interactiveData: {
            steps: solutionSteps,
            concepts: conceptsExplained,
            practiceProblems: submission[0].practiceProblems
          }
        }
      ]);

    res.status(201).json({
      success: true,
      message: 'Problem solved successfully',
      data: {
        submission: submission[0],
        solution: aiSolution,
        steps: solutionSteps,
        concepts: conceptsExplained,
        relatedTopics,
        similarProblems: similarProblems.map(p => ({
          title: p.title,
          subject: p.subject,
          difficulty: p.difficultyLevel
        }))
      }
    });

  } catch (error) {
    console.error('Homework solving error:', error);
    throw new AppError('Failed to solve homework problem', 500, 'HOMEWORK_SOLVE_ERROR');
  }
}));

// AI Tutoring Sessions
router.post('/tutoring/start', [
  body('subject').notEmpty().isString(),
  body('topics').optional().isArray(),
  body('learningObjectives').optional().isArray(),
  body('sessionType').optional().isIn(['structured', 'adaptive', 'review', 'practice']),
  body('plannedDuration').optional().isInt({ min: 5, max: 180 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    subject,
    topics = [],
    learningObjectives = [],
    sessionType = 'adaptive',
    plannedDuration = 30,
    learningStyle,
    currentLevel,
    preferredPace = 'normal'
  } = req.body;
  const userId = req.user.id;

  // Get user learning analytics for personalization
  const userAnalytics = await db.select()
    .from(learningAnalytics)
    .where(eq(learningAnalytics.userId, userId))
    .limit(1);

  const detectedLearningStyle = learningStyle || 
    (userAnalytics.length > 0 ? userAnalytics[0].detectedLearningStyle : 'visual');

  const userLevel = currentLevel || 
    (userAnalytics.length > 0 ? 
      userAnalytics[0].knowledgeMap?.[subject]?.level || 'intermediate' : 'intermediate');

  // Create tutoring conversation
  const defaultModel = await db.select()
    .from(aiModels)
    .where(and(eq(aiModels.isDefault, true), eq(aiModels.isActive, true)))
    .limit(1);

  const conversation = await db.insert(aiConversations)
    .values({
      userId,
      modelId: defaultModel[0].id,
      title: `${subject} Tutoring Session`,
      conversationType: 'tutor',
      currentSubject: subject,
      difficultyLevel: userLevel,
      learningGoals: learningObjectives,
      aiPersonality: 'encouraging',
      responseStyle: 'step_by_step'
    })
    .returning();

  // Create tutoring session
  const tutoringSession = await db.insert(aiTutoringSessions)
    .values({
      userId,
      conversationId: conversation[0].id,
      subject,
      topics,
      learningObjectives,
      learningStyle: detectedLearningStyle,
      currentLevel: userLevel,
      preferredPace,
      sessionType,
      plannedDuration
    })
    .returning();

  // Generate personalized session plan
  const sessionPlan = await generateSessionPlan(
    subject,
    topics,
    learningObjectives,
    detectedLearningStyle,
    userLevel,
    sessionType,
    plannedDuration
  );

  // Start with welcome message
  const welcomeMessage = `Welcome to your personalized ${subject} tutoring session! 

I've prepared a ${plannedDuration}-minute session tailored to your ${detectedLearningStyle} learning style and ${userLevel} level.

Session Plan:
${sessionPlan.map((item, index) => `${index + 1}. ${item.title} (${item.duration} min)`).join('\n')}

Let's start with: ${sessionPlan[0]?.title || 'our first topic'}

Are you ready to begin, or would you like to adjust anything?`;

  await db.insert(aiMessages)
    .values({
      conversationId: conversation[0].id,
      role: 'assistant',
      messageType: 'text',
      content: welcomeMessage,
      modelUsed: defaultModel[0].id,
      hasInteractiveElements: true,
      interactiveData: {
        sessionPlan,
        currentStep: 0,
        sessionType: 'tutoring'
      }
    });

  res.status(201).json({
    success: true,
    message: 'Tutoring session started',
    data: {
      session: tutoringSession[0],
      conversation: conversation[0],
      sessionPlan,
      welcomeMessage
    }
  });
}));

// Learning Analytics and Insights
router.get('/analytics', catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get or create user analytics
  let analytics = await db.select()
    .from(learningAnalytics)
    .where(eq(learningAnalytics.userId, userId))
    .limit(1);

  if (!analytics.length) {
    // Create initial analytics entry
    analytics = await db.insert(learningAnalytics)
      .values({
        userId,
        detectedLearningStyle: 'visual',
        learningStyleConfidence: 0.0,
        knowledgeMap: {},
        skillsAssessment: {},
        studyPatterns: {},
        overallProgress: 0.0,
        engagementLevel: 0.0,
        retentionRate: 0.0
      })
      .returning();
  }

  const analyticsData = analytics[0];

  // Get recent AI interactions for pattern analysis
  const recentConversations = await db.select({
    conversationType: aiConversations.conversationType,
    currentSubject: aiConversations.currentSubject,
    difficultyLevel: aiConversations.difficultyLevel,
    totalMessages: aiConversations.totalMessages,
    userSatisfaction: aiConversations.userSatisfaction,
    lastInteraction: aiConversations.lastInteraction,
    createdAt: aiConversations.createdAt
  })
    .from(aiConversations)
    .where(and(
      eq(aiConversations.userId, userId),
      gte(aiConversations.lastInteraction, sql`now() - interval '30 days'`)
    ))
    .orderBy(desc(aiConversations.lastInteraction))
    .limit(50);

  // Get homework performance
  const homeworkStats = await db.select({
    subject: homeworkSubmissions.detectedSubject,
    avgRating: sql`avg(${homeworkSubmissions.userRating})`.as('avgRating'),
    totalSubmissions: sql`count(*)`.as('totalSubmissions'),
    correctCount: sql`count(case when ${homeworkSubmissions.isCorrect} then 1 end)`.as('correctCount')
  })
    .from(homeworkSubmissions)
    .where(and(
      eq(homeworkSubmissions.userId, userId),
      gte(homeworkSubmissions.createdAt, sql`now() - interval '30 days'`)
    ))
    .groupBy(homeworkSubmissions.detectedSubject);

  // Calculate insights
  const insights = {
    learningStyle: analyticsData.detectedLearningStyle,
    strongSubjects: homeworkStats
      .filter(s => s.avgRating >= 4.0)
      .map(s => s.subject)
      .slice(0, 3),
    improvementAreas: homeworkStats
      .filter(s => s.avgRating < 3.0)
      .map(s => s.subject)
      .slice(0, 3),
    studyPatterns: {
      preferredTime: extractPreferredStudyTime(recentConversations),
      sessionLength: calculateAverageSessionLength(recentConversations),
      subjectPreferences: calculateSubjectPreferences(recentConversations)
    },
    progress: {
      overall: analyticsData.overallProgress,
      bySubject: analyticsData.knowledgeMap || {},
      recent: calculateRecentProgress(recentConversations, homeworkStats)
    },
    recommendations: generatePersonalizedRecommendations(
      analyticsData,
      recentConversations,
      homeworkStats
    )
  };

  res.json({
    success: true,
    data: {
      analytics: analyticsData,
      insights,
      recentActivity: {
        conversations: recentConversations.length,
        homeworkSolved: homeworkStats.reduce((sum, s) => sum + s.totalSubmissions, 0),
        avgSatisfaction: recentConversations
          .filter(c => c.userSatisfaction)
          .reduce((sum, c, _, arr) => sum + c.userSatisfaction / arr.length, 0)
      }
    }
  });
}));

// Knowledge Base Management
router.get('/knowledge', [
  query('subject').optional().isString(),
  query('topic').optional().isString(),
  query('resourceType').optional().isIn(['concept', 'formula', 'theorem', 'example', 'exercise']),
  query('gradeLevel').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    subject,
    topic,
    resourceType,
    gradeLevel,
    limit = 20
  } = req.query;

  let query = db.select({
    resourceId: aiKnowledgeBase.resourceId,
    title: aiKnowledgeBase.title,
    description: aiKnowledgeBase.description,
    resourceType: aiKnowledgeBase.resourceType,
    subject: aiKnowledgeBase.subject,
    topic: aiKnowledgeBase.topic,
    subtopic: aiKnowledgeBase.subtopic,
    gradeLevel: aiKnowledgeBase.gradeLevel,
    content: aiKnowledgeBase.content,
    formattedContent: aiKnowledgeBase.formattedContent,
    examples: aiKnowledgeBase.examples,
    prerequisites: aiKnowledgeBase.prerequisites,
    relatedConcepts: aiKnowledgeBase.relatedConcepts,
    difficultyLevel: aiKnowledgeBase.difficultyLevel,
    estimatedStudyTime: aiKnowledgeBase.estimatedStudyTime,
    isVerified: aiKnowledgeBase.isVerified,
    qualityScore: aiKnowledgeBase.qualityScore,
    timesAccessed: aiKnowledgeBase.timesAccessed,
    userRatings: aiKnowledgeBase.userRatings
  })
    .from(aiKnowledgeBase)
    .where(eq(aiKnowledgeBase.isVerified, true));

  if (subject) {
    query = query.where(eq(aiKnowledgeBase.subject, subject));
  }

  if (topic) {
    query = query.where(eq(aiKnowledgeBase.topic, topic));
  }

  if (resourceType) {
    query = query.where(eq(aiKnowledgeBase.resourceType, resourceType));
  }

  if (gradeLevel) {
    query = query.where(eq(aiKnowledgeBase.gradeLevel, gradeLevel));
  }

  const resources = await query
    .orderBy(desc(aiKnowledgeBase.qualityScore), desc(aiKnowledgeBase.userRatings))
    .limit(parseInt(limit));

  // Get available filters
  const subjects = await db.select({
    subject: aiKnowledgeBase.subject,
    count: sql`count(*)`.as('count')
  })
    .from(aiKnowledgeBase)
    .where(eq(aiKnowledgeBase.isVerified, true))
    .groupBy(aiKnowledgeBase.subject)
    .orderBy(desc(sql`count(*)`));

  res.json({
    success: true,
    data: {
      resources,
      filters: {
        subjects: subjects.map(s => ({ value: s.subject, count: s.count }))
      },
      total: resources.length
    }
  });
}));

// Message Feedback
router.put('/messages/:messageId/feedback', [
  param('messageId').isUUID(),
  body('feedback').isIn(['thumbs_up', 'thumbs_down', 'helpful', 'not_helpful']),
  body('details').optional().isString()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { messageId } = req.params;
  const { feedback, details } = req.body;
  const userId = req.user.id;

  // Verify message ownership through conversation
  const message = await db.select({
    messageId: aiMessages.messageId,
    conversationId: aiMessages.conversationId,
    userId: aiConversations.userId
  })
    .from(aiMessages)
    .innerJoin(aiConversations, eq(aiMessages.conversationId, aiConversations.id))
    .where(and(
      eq(aiMessages.messageId, messageId),
      eq(aiConversations.userId, userId)
    ))
    .limit(1);

  if (!message.length) {
    throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }

  await db.update(aiMessages)
    .set({
      userFeedback: feedback,
      feedbackDetails: details,
      updatedAt: new Date()
    })
    .where(eq(aiMessages.messageId, messageId));

  res.json({
    success: true,
    message: 'Feedback recorded successfully'
  });
}));

// Helper Functions
function generateSystemPrompt(conversation, model) {
  return `You are ${conversation.aiPersonality} AI assistant specialized in ${conversation.conversationType}.

Context:
- Subject: ${conversation.currentSubject || 'General'}
- Difficulty Level: ${conversation.difficultyLevel}
- Learning Goals: ${JSON.stringify(conversation.learningGoals)}
- Response Style: ${conversation.responseStyle}
- Language: ${conversation.languagePreference}

Your capabilities include:
${model.capabilities.join(', ')}

Adapt your responses to be ${conversation.responseStyle} and maintain a ${conversation.aiPersonality} tone throughout the conversation.`;
}

function generateFollowUpSuggestions(userMessage, aiResponse, conversationType) {
  const suggestions = [];
  
  switch (conversationType) {
    case 'homework':
      suggestions.push(
        'Can you explain this step in more detail?',
        'Show me a similar practice problem',
        'What are common mistakes in this type of problem?'
      );
      break;
    case 'tutor':
      suggestions.push(
        'I need more examples',
        'Let\'s practice with exercises',
        'What should I study next?'
      );
      break;
    case 'chat':
      suggestions.push(
        'Tell me more about this topic',
        'How does this relate to real life?',
        'What are some advanced concepts?'
      );
      break;
  }
  
  return suggestions;
}

function parseSolutionSteps(solution) {
  // Parse AI solution into structured steps
  const steps = solution.split(/\n(?=\d+\.|\*|\-)/);
  return steps.map((step, index) => ({
    step: index + 1,
    content: step.trim(),
    explanation: extractExplanation(step)
  }));
}

function extractConcepts(solution, subject) {
  // Extract key concepts mentioned in the solution
  const concepts = [];
  const conceptPatterns = {
    math: ['theorem', 'formula', 'equation', 'function', 'derivative', 'integral'],
    science: ['law', 'principle', 'reaction', 'element', 'force', 'energy'],
    general: ['concept', 'theory', 'method', 'approach', 'technique']
  };
  
  const patterns = conceptPatterns[subject] || conceptPatterns.general;
  patterns.forEach(pattern => {
    const regex = new RegExp(`\\b\\w*${pattern}\\w*\\b`, 'gi');
    const matches = solution.match(regex);
    if (matches) {
      concepts.push(...matches);
    }
  });
  
  return [...new Set(concepts)]; // Remove duplicates
}

function generateRelatedTopics(subject, problemText) {
  // Generate related topics based on subject and problem content
  const topics = [];
  // This would typically use NLP/ML to extract topics
  // For now, return placeholder topics
  return [`Advanced ${subject}`, `${subject} Applications`, `${subject} Practice`];
}

function generatePracticeProblems(subject, topic) {
  // Generate related practice problems
  return [
    {
      title: `${topic} Practice Problem 1`,
      difficulty: 'easy',
      estimated_time: 5
    },
    {
      title: `${topic} Practice Problem 2`,
      difficulty: 'medium',
      estimated_time: 10
    }
  ];
}

async function detectSubject(problemText) {
  // Use NLP to detect subject from problem text
  // Simplified implementation
  const mathKeywords = ['equation', 'solve', 'calculate', 'derivative', 'integral', 'algebra'];
  const scienceKeywords = ['element', 'reaction', 'force', 'energy', 'physics', 'chemistry'];
  
  const text = problemText.toLowerCase();
  
  if (mathKeywords.some(keyword => text.includes(keyword))) {
    return 'Mathematics';
  }
  if (scienceKeywords.some(keyword => text.includes(keyword))) {
    return 'Science';
  }
  
  return 'General';
}

async function detectTopic(problemText, subject) {
  // Detect specific topic within subject
  return 'General Topic'; // Placeholder
}

function extractExplanation(step) {
  // Extract explanation from solution step
  return step.split(':').slice(1).join(':').trim();
}

async function generateSessionPlan(subject, topics, objectives, learningStyle, level, sessionType, duration) {
  // Generate personalized tutoring session plan
  const plan = [
    {
      title: `Introduction to ${topics[0] || subject}`,
      duration: Math.ceil(duration * 0.2),
      type: 'introduction'
    },
    {
      title: 'Core Concepts',
      duration: Math.ceil(duration * 0.5),
      type: 'learning'
    },
    {
      title: 'Practice & Application',
      duration: Math.ceil(duration * 0.2),
      type: 'practice'
    },
    {
      title: 'Summary & Next Steps',
      duration: Math.ceil(duration * 0.1),
      type: 'summary'
    }
  ];
  
  return plan;
}

function extractPreferredStudyTime(conversations) {
  // Analyze conversation timestamps to determine preferred study times
  const hours = conversations.map(c => new Date(c.lastInteraction).getHours());
  const hourCounts = {};
  hours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const preferredHour = Object.keys(hourCounts).reduce((a, b) => 
    hourCounts[a] > hourCounts[b] ? a : b
  );
  
  return `${preferredHour}:00`;
}

function calculateAverageSessionLength(conversations) {
  // Calculate average session length from conversation data
  return conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length || 0;
}

function calculateSubjectPreferences(conversations) {
  // Calculate subject preferences from conversation history
  const subjects = {};
  conversations.forEach(c => {
    if (c.currentSubject) {
      subjects[c.currentSubject] = (subjects[c.currentSubject] || 0) + 1;
    }
  });
  
  return subjects;
}

function calculateRecentProgress(conversations, homeworkStats) {
  // Calculate recent progress metrics
  const recentConversations = conversations.filter(c => 
    new Date(c.lastInteraction) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  return {
    conversationsThisWeek: recentConversations.length,
    homeworkSolved: homeworkStats.reduce((sum, s) => sum + s.totalSubmissions, 0),
    averageRating: homeworkStats.reduce((sum, s) => sum + s.avgRating, 0) / homeworkStats.length || 0
  };
}

function generatePersonalizedRecommendations(analytics, conversations, homeworkStats) {
  const recommendations = [];
  
  // Learning style recommendations
  if (analytics.detectedLearningStyle === 'visual') {
    recommendations.push({
      type: 'study_method',
      title: 'Try Visual Learning Techniques',
      description: 'Use diagrams, charts, and mind maps to enhance your learning'
    });
  }
  
  // Subject-specific recommendations
  const weakSubjects = homeworkStats.filter(s => s.avgRating < 3.0);
  weakSubjects.forEach(subject => {
    recommendations.push({
      type: 'improvement',
      title: `Focus on ${subject.subject}`,
      description: `Consider additional practice in ${subject.subject} to improve your understanding`
    });
  });
  
  // Study pattern recommendations
  if (conversations.length > 0) {
    const avgSessionLength = calculateAverageSessionLength(conversations);
    if (avgSessionLength < 5) {
      recommendations.push({
        type: 'study_habit',
        title: 'Extend Study Sessions',
        description: 'Try longer study sessions (15-30 minutes) for better retention'
      });
    }
  }
  
  return recommendations;
}

export default router;