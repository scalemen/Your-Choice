import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { db, aiChats, homeworkProblems, quizzes } from '../db/index.js';
import { eq, and, desc, like, sql } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import OpenAI from 'openai';
import { uploadHomeworkImage } from '../middleware/upload.js';
import Tesseract from 'tesseract.js';
import axios from 'axios';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Educational subjects and their contexts
const EDUCATIONAL_CONTEXTS = {
  mathematics: {
    system: "You are an expert mathematics tutor. Provide clear, step-by-step explanations for mathematical concepts and problems. Use proper mathematical notation and provide multiple examples when helpful.",
    keywords: ["math", "algebra", "calculus", "geometry", "statistics", "trigonometry", "arithmetic"]
  },
  science: {
    system: "You are a knowledgeable science educator covering physics, chemistry, biology, and earth sciences. Explain scientific concepts clearly with real-world examples and applications.",
    keywords: ["physics", "chemistry", "biology", "science", "atoms", "molecules", "cells", "energy"]
  },
  history: {
    system: "You are a history expert who can explain historical events, periods, and figures with context and engaging narratives. Focus on accurate information and multiple perspectives.",
    keywords: ["history", "historical", "war", "civilization", "empire", "revolution", "ancient", "modern"]
  },
  literature: {
    system: "You are a literature and language arts expert. Help with reading comprehension, writing skills, grammar, and analysis of literary works.",
    keywords: ["literature", "writing", "grammar", "poetry", "novel", "essay", "reading", "language"]
  },
  programming: {
    system: "You are a programming instructor. Provide clear code examples, explain programming concepts, and help with debugging. Focus on best practices and proper syntax.",
    keywords: ["programming", "code", "javascript", "python", "html", "css", "algorithm", "function"]
  }
};

// Content filter for educational appropriateness
function isEducationallyAppropriate(content) {
  const inappropriateKeywords = [
    'violence', 'drugs', 'alcohol', 'gambling', 'adult content',
    'inappropriate', 'illegal', 'harmful', 'dangerous'
  ];
  
  const lowerContent = content.toLowerCase();
  return !inappropriateKeywords.some(keyword => lowerContent.includes(keyword));
}

// Determine subject from content
function detectSubject(content) {
  const lowerContent = content.toLowerCase();
  
  for (const [subject, context] of Object.entries(EDUCATIONAL_CONTEXTS)) {
    if (context.keywords.some(keyword => lowerContent.includes(keyword))) {
      return subject;
    }
  }
  
  return 'general';
}

// Get or create AI chat session
router.post('/chat/start', [
  body('subject').optional().isIn(['mathematics', 'science', 'history', 'literature', 'programming', 'general']).withMessage('Invalid subject'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be less than 255 characters'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    subject = 'general',
    title = 'New Chat Session',
    difficulty = 'intermediate'
  } = req.body;

  // Create new chat session
  const newChat = await db.insert(aiChats)
    .values({
      userId: req.user.id,
      title,
      subject,
      difficulty,
      messages: [],
      context: {
        subject,
        difficulty,
        userPreferences: {
          learningStyle: req.user.learningStyle || 'visual',
          educationLevel: req.user.educationLevel || 'undergraduate'
        }
      }
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Chat session created successfully',
    data: newChat[0]
  });
}));

// Send message to AI
router.post('/chat/:id/message', [
  param('id').isInt({ min: 1 }).withMessage('Chat ID must be a positive integer'),
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required and must be less than 2000 characters'),
  body('includeContext').optional().isBoolean().withMessage('Include context must be a boolean')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const chatId = parseInt(req.params.id);
  const { message, includeContext = true } = req.body;

  // Check if content is educationally appropriate
  if (!isEducationallyAppropriate(message)) {
    throw new AppError('Please keep conversations educational and appropriate', 400, 'INAPPROPRIATE_CONTENT');
  }

  // Get chat session
  const chat = await db.select()
    .from(aiChats)
    .where(and(eq(aiChats.id, chatId), eq(aiChats.userId, req.user.id)))
    .limit(1);

  if (!chat.length) {
    throw new AppError('Chat session not found', 404, 'CHAT_NOT_FOUND');
  }

  const chatData = chat[0];
  
  // Detect subject if not already set
  const detectedSubject = detectSubject(message);
  const subject = chatData.subject === 'general' ? detectedSubject : chatData.subject;
  
  // Prepare conversation history
  const messages = [...chatData.messages];
  
  // Add user message
  const userMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  };
  messages.push(userMessage);

  try {
    // Prepare system message based on subject
    const systemContext = EDUCATIONAL_CONTEXTS[subject] || EDUCATIONAL_CONTEXTS.general;
    const systemMessage = {
      role: 'system',
      content: `${systemContext.system} 
      
      User context:
      - Education level: ${chatData.context.userPreferences?.educationLevel || 'undergraduate'}
      - Learning style: ${chatData.context.userPreferences?.learningStyle || 'visual'}
      - Difficulty preference: ${chatData.difficulty}
      
      Guidelines:
      1. Keep responses educational and appropriate
      2. Provide step-by-step explanations when solving problems
      3. Use examples relevant to the user's education level
      4. Encourage learning and critical thinking
      5. If asked about non-educational topics, gently redirect to educational content`
    };

    // Prepare OpenAI messages
    const openaiMessages = [systemMessage];
    
    // Include recent conversation history (last 10 messages for context)
    if (includeContext && messages.length > 1) {
      const recentMessages = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      openaiMessages.push(...recentMessages);
    } else {
      openaiMessages.push(userMessage);
    }

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: openaiMessages,
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const aiResponse = completion.choices[0].message.content;

    // Add AI response to messages
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      model: 'gpt-4',
      tokens: completion.usage.total_tokens
    };
    messages.push(assistantMessage);

    // Update chat in database
    await db.update(aiChats)
      .set({
        messages,
        subject: subject,
        totalMessages: messages.length,
        updatedAt: new Date()
      })
      .where(eq(aiChats.id, chatId));

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        tokensUsed: completion.usage.total_tokens,
        subject: subject
      }
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.response?.status === 429) {
      throw new AppError('AI service rate limit exceeded. Please try again later.', 429, 'AI_RATE_LIMIT');
    } else if (error.response?.status === 401) {
      throw new AppError('AI service authentication failed', 500, 'AI_AUTH_ERROR');
    }
    
    throw new AppError('AI service temporarily unavailable', 503, 'AI_SERVICE_UNAVAILABLE');
  }
}));

// Get chat history
router.get('/chat/:id', [
  param('id').isInt({ min: 1 }).withMessage('Chat ID must be a positive integer')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const chatId = parseInt(req.params.id);

  const chat = await db.select()
    .from(aiChats)
    .where(and(eq(aiChats.id, chatId), eq(aiChats.userId, req.user.id)))
    .limit(1);

  if (!chat.length) {
    throw new AppError('Chat session not found', 404, 'CHAT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: chat[0]
  });
}));

// Get all chat sessions
router.get('/chat', [
  query('subject').optional().isIn(['mathematics', 'science', 'history', 'literature', 'programming', 'general']).withMessage('Invalid subject'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
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
    subject,
    search,
    limit = 20,
    offset = 0
  } = req.query;

  let query = db.select({
    id: aiChats.id,
    title: aiChats.title,
    subject: aiChats.subject,
    difficulty: aiChats.difficulty,
    totalMessages: aiChats.totalMessages,
    isArchived: aiChats.isArchived,
    createdAt: aiChats.createdAt,
    updatedAt: aiChats.updatedAt
  }).from(aiChats);

  // Build where conditions
  let whereConditions = [eq(aiChats.userId, req.user.id)];

  if (subject) {
    whereConditions.push(eq(aiChats.subject, subject));
  }

  if (search) {
    whereConditions.push(
      like(aiChats.title, `%${search}%`)
    );
  }

  query = query.where(and(...whereConditions));
  query = query.orderBy(desc(aiChats.updatedAt));
  query = query.limit(parseInt(limit)).offset(parseInt(offset));

  const result = await query;

  res.json({
    success: true,
    data: result
  });
}));

// Solve homework problem with image
router.post('/homework/solve', uploadHomeworkImage, [
  body('subject').optional().isIn(['mathematics', 'science', 'physics', 'chemistry', 'biology']).withMessage('Invalid subject'),
  body('difficulty').optional().isIn(['elementary', 'middle_school', 'high_school', 'college']).withMessage('Invalid difficulty'),
  body('problemText').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Problem text must be less than 1000 characters')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    subject = 'mathematics',
    difficulty = 'high_school',
    problemText = ''
  } = req.body;

  let extractedText = problemText;
  let problemImage = null;

  // Process uploaded image if present
  if (req.file) {
    problemImage = req.file.url;
    
    try {
      // Extract text from image using OCR
      console.log('Processing image with OCR...');
      const ocrResult = await Tesseract.recognize(req.file.path, 'eng', {
        logger: m => console.log(m)
      });
      
      extractedText = ocrResult.data.text.trim();
      console.log('Extracted text:', extractedText);
      
      if (!extractedText || extractedText.length < 5) {
        throw new AppError('Unable to extract readable text from image. Please ensure the image is clear and contains text.', 400, 'OCR_FAILED');
      }
      
    } catch (error) {
      console.error('OCR error:', error);
      throw new AppError('Failed to process image. Please try uploading a clearer image.', 400, 'IMAGE_PROCESSING_FAILED');
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new AppError('No problem text provided. Please upload an image or enter the problem text.', 400, 'NO_PROBLEM_TEXT');
  }

  try {
    // Create homework problem record
    const newProblem = await db.insert(homeworkProblems)
      .values({
        userId: req.user.id,
        title: extractedText.substring(0, 100) + (extractedText.length > 100 ? '...' : ''),
        subject,
        difficulty,
        problemImage,
        problemText: extractedText,
        processingStatus: 'processing'
      })
      .returning();

    const problemId = newProblem[0].id;

    // Prepare AI prompt for problem solving
    const systemPrompt = `You are an expert educational tutor specializing in ${subject} at the ${difficulty} level. 
    
    Your task is to solve the given problem step-by-step and provide a clear, educational explanation.
    
    Guidelines:
    1. Analyze the problem carefully
    2. Break down the solution into clear, numbered steps
    3. Explain the reasoning behind each step
    4. Show all calculations and work
    5. Provide the final answer clearly
    6. Include relevant concepts or formulas used
    7. If the problem is unclear or incomplete, mention what additional information might be needed
    
    Format your response as JSON with the following structure:
    {
      "analysis": "Brief analysis of what the problem is asking",
      "steps": [
        {
          "step": 1,
          "description": "Description of what we're doing",
          "work": "Mathematical work or explanation",
          "result": "Result of this step"
        }
      ],
      "finalAnswer": "Clear final answer",
      "concepts": ["List of relevant concepts"],
      "confidence": 0.95
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Solve this ${subject} problem:\n\n${extractedText}` }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    let solution;
    try {
      solution = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      solution = {
        analysis: "Problem analysis",
        steps: [{
          step: 1,
          description: "Solution provided",
          work: completion.choices[0].message.content,
          result: "See detailed explanation above"
        }],
        finalAnswer: "Please see the detailed solution above",
        concepts: [subject],
        confidence: 0.8
      };
    }

    // Update problem with solution
    await db.update(homeworkProblems)
      .set({
        solution,
        steps: solution.steps || [],
        explanation: completion.choices[0].message.content,
        concepts: solution.concepts || [subject],
        confidence: solution.confidence || 0.8,
        processingStatus: 'completed',
        updatedAt: new Date()
      })
      .where(eq(homeworkProblems.id, problemId));

    res.json({
      success: true,
      message: 'Problem solved successfully',
      data: {
        problemId,
        solution,
        tokensUsed: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Homework solving error:', error);
    
    if (error.response?.status === 429) {
      throw new AppError('AI service rate limit exceeded. Please try again later.', 429, 'AI_RATE_LIMIT');
    }
    
    throw new AppError('Failed to solve problem. Please try again.', 500, 'PROBLEM_SOLVING_FAILED');
  }
}));

// Generate quiz from topic
router.post('/quiz/generate', [
  body('topic').trim().isLength({ min: 1, max: 200 }).withMessage('Topic is required and must be less than 200 characters'),
  body('subject').optional().isIn(['mathematics', 'science', 'history', 'literature', 'programming', 'general']).withMessage('Invalid subject'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('questionCount').optional().isInt({ min: 1, max: 20 }).withMessage('Question count must be between 1 and 20'),
  body('questionTypes').optional().isArray().withMessage('Question types must be an array')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    topic,
    subject = 'general',
    difficulty = 'medium',
    questionCount = 10,
    questionTypes = ['multiple_choice', 'true_false', 'short_answer']
  } = req.body;

  try {
    const systemPrompt = `You are an expert educational content creator. Generate a high-quality quiz about "${topic}" in the subject of ${subject} at ${difficulty} difficulty level.

    Create ${questionCount} questions using these types: ${questionTypes.join(', ')}.
    
    Return the quiz as JSON with this exact structure:
    {
      "title": "Quiz title",
      "description": "Brief description",
      "questions": [
        {
          "id": 1,
          "type": "multiple_choice",
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Why this is correct",
          "points": 1
        }
      ],
      "totalPoints": ${questionCount},
      "timeLimit": 15
    }
    
    Question types:
    - multiple_choice: 4 options (A, B, C, D)
    - true_false: options ["True", "False"]
    - short_answer: no options, correctAnswer is the expected answer
    
    Make questions educational, clear, and appropriate for the difficulty level.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${difficulty} quiz about: ${topic}` }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    let quizData;
    try {
      quizData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      throw new AppError('Failed to generate quiz structure. Please try again.', 500, 'QUIZ_GENERATION_FAILED');
    }

    // Create quiz in database
    const newQuiz = await db.insert(quizzes)
      .values({
        userId: req.user.id,
        title: quizData.title || `${topic} Quiz`,
        description: quizData.description || `Quiz about ${topic}`,
        subject,
        topic,
        difficulty,
        questions: quizData.questions || [],
        timeLimit: quizData.timeLimit || Math.max(10, questionCount * 2),
        passingScore: 70
      })
      .returning();

    res.json({
      success: true,
      message: 'Quiz generated successfully',
      data: {
        quiz: newQuiz[0],
        tokensUsed: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    if (error.response?.status === 429) {
      throw new AppError('AI service rate limit exceeded. Please try again later.', 429, 'AI_RATE_LIMIT');
    }
    
    throw new AppError('Failed to generate quiz. Please try again.', 500, 'QUIZ_GENERATION_FAILED');
  }
}));

// Explain topic comprehensively
router.post('/explain', [
  body('topic').trim().isLength({ min: 1, max: 200 }).withMessage('Topic is required and must be less than 200 characters'),
  body('subject').optional().isIn(['mathematics', 'science', 'history', 'literature', 'programming', 'general']).withMessage('Invalid subject'),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  body('focusAreas').optional().isArray().withMessage('Focus areas must be an array')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    topic,
    subject = 'general',
    level = 'intermediate',
    focusAreas = []
  } = req.body;

  try {
    const systemPrompt = `You are an expert educator specializing in ${subject}. Provide a comprehensive, educational explanation of the topic at ${level} level.

    Structure your response as JSON:
    {
      "overview": "Clear overview of the topic",
      "keyPoints": [
        {
          "title": "Key point title",
          "explanation": "Detailed explanation",
          "examples": ["example1", "example2"]
        }
      ],
      "practicalApplications": ["application1", "application2"],
      "relatedTopics": ["topic1", "topic2"],
      "studyTips": ["tip1", "tip2"],
      "commonMisconceptions": [
        {
          "misconception": "Common wrong belief",
          "correction": "Correct explanation"
        }
      ]
    }

    ${focusAreas.length > 0 ? `Focus especially on these areas: ${focusAreas.join(', ')}` : ''}
    
    Make it educational, engaging, and appropriate for ${level} learners.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Explain: ${topic}` }
      ],
      max_tokens: 1500,
      temperature: 0.6
    });

    let explanation;
    try {
      explanation = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback to plain text if JSON parsing fails
      explanation = {
        overview: completion.choices[0].message.content,
        keyPoints: [],
        practicalApplications: [],
        relatedTopics: [],
        studyTips: [],
        commonMisconceptions: []
      };
    }

    res.json({
      success: true,
      data: {
        topic,
        subject,
        level,
        explanation,
        tokensUsed: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Topic explanation error:', error);
    
    if (error.response?.status === 429) {
      throw new AppError('AI service rate limit exceeded. Please try again later.', 429, 'AI_RATE_LIMIT');
    }
    
    throw new AppError('Failed to generate explanation. Please try again.', 500, 'EXPLANATION_FAILED');
  }
}));

// Get YouTube video recommendations for topic
router.post('/resources/videos', [
  body('topic').trim().isLength({ min: 1, max: 200 }).withMessage('Topic is required and must be less than 200 characters'),
  body('subject').optional().isString().withMessage('Subject must be a string')
], catchAsync(async (req, res) => {
  const { topic, subject = '' } = req.body;

  if (!process.env.YOUTUBE_API_KEY) {
    throw new AppError('YouTube integration not configured', 503, 'YOUTUBE_NOT_CONFIGURED');
  }

  try {
    // Search for educational videos
    const searchQuery = `${topic} ${subject} tutorial education`.trim();
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoDuration: 'medium',
        videoDefinition: 'high',
        maxResults: 10,
        order: 'relevance',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    const videos = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    res.json({
      success: true,
      data: {
        topic,
        videos,
        totalResults: videos.length
      }
    });

  } catch (error) {
    console.error('YouTube API error:', error);
    
    if (error.response?.status === 403) {
      throw new AppError('YouTube API quota exceeded', 429, 'YOUTUBE_QUOTA_EXCEEDED');
    }
    
    throw new AppError('Failed to fetch video recommendations', 500, 'VIDEO_FETCH_FAILED');
  }
}));

// Delete chat session
router.delete('/chat/:id', [
  param('id').isInt({ min: 1 }).withMessage('Chat ID must be a positive integer')
], catchAsync(async (req, res) => {
  const chatId = parseInt(req.params.id);

  const result = await db.delete(aiChats)
    .where(and(eq(aiChats.id, chatId), eq(aiChats.userId, req.user.id)))
    .returning();

  if (!result.length) {
    throw new AppError('Chat session not found', 404, 'CHAT_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Chat session deleted successfully'
  });
}));

export default router;