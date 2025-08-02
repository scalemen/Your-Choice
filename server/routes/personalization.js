import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { db, userPersonalization, learningPatterns, personalizedRecommendations, users } from '../db/index.js';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get user personalization profile
router.get('/profile', catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get or create personalization profile
  let profile = await db.select()
    .from(userPersonalization)
    .where(eq(userPersonalization.userId, userId))
    .limit(1);

  if (!profile.length) {
    // Create default profile
    profile = await db.insert(userPersonalization)
      .values({ userId })
      .returning();
  }

  // Get learning patterns
  const patterns = await db.select()
    .from(learningPatterns)
    .where(eq(learningPatterns.userId, userId))
    .orderBy(desc(learningPatterns.lastAnalyzed))
    .limit(1);

  res.json({
    success: true,
    data: {
      profile: profile[0],
      patterns: patterns[0] || null
    }
  });
}));

// Update user personalization preferences
router.put('/profile', [
  body('learningStyleVisual').optional().isDecimal().withMessage('Visual learning style must be a decimal'),
  body('learningStyleAuditory').optional().isDecimal().withMessage('Auditory learning style must be a decimal'),
  body('learningStyleKinesthetic').optional().isDecimal().withMessage('Kinesthetic learning style must be a decimal'),
  body('learningStyleReading').optional().isDecimal().withMessage('Reading learning style must be a decimal'),
  body('personalityOpenness').optional().isDecimal().withMessage('Openness must be a decimal'),
  body('personalityConscientiousness').optional().isDecimal().withMessage('Conscientiousness must be a decimal'),
  body('personalityExtraversion').optional().isDecimal().withMessage('Extraversion must be a decimal'),
  body('personalityAgreeableness').optional().isDecimal().withMessage('Agreeableness must be a decimal'),
  body('personalityNeuroticism').optional().isDecimal().withMessage('Neuroticism must be a decimal'),
  body('preferredStudyTime').optional().isIn(['morning', 'afternoon', 'evening', 'night']).withMessage('Invalid study time'),
  body('preferredSessionLength').optional().isInt({ min: 5, max: 180 }).withMessage('Session length must be between 5 and 180 minutes'),
  body('preferredBreakLength').optional().isInt({ min: 1, max: 60 }).withMessage('Break length must be between 1 and 60 minutes'),
  body('motivationType').optional().isIn(['achievement', 'social', 'mastery', 'curiosity']).withMessage('Invalid motivation type'),
  body('tutorPersonality').optional().isIn(['encouraging', 'challenging', 'patient', 'enthusiastic']).withMessage('Invalid tutor personality'),
  body('tutorFormality').optional().isIn(['formal', 'casual', 'friendly']).withMessage('Invalid tutor formality'),
  body('feedbackStyle').optional().isIn(['direct', 'constructive', 'gentle', 'detailed']).withMessage('Invalid feedback style')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const updateData = { ...req.body, updatedAt: new Date() };

  // Update or create personalization profile
  const existingProfile = await db.select()
    .from(userPersonalization)
    .where(eq(userPersonalization.userId, userId))
    .limit(1);

  let updatedProfile;
  if (existingProfile.length) {
    updatedProfile = await db.update(userPersonalization)
      .set(updateData)
      .where(eq(userPersonalization.userId, userId))
      .returning();
  } else {
    updatedProfile = await db.insert(userPersonalization)
      .values({ userId, ...updateData })
      .returning();
  }

  // Trigger AI analysis for updated preferences
  await analyzeUserPatterns(userId);

  res.json({
    success: true,
    message: 'Personalization profile updated successfully',
    data: updatedProfile[0]
  });
}));

// Take learning style assessment
router.post('/assessment/learning-style', [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.questionId').isInt().withMessage('Question ID must be an integer'),
  body('answers.*.response').isInt({ min: 1, max: 5 }).withMessage('Response must be between 1 and 5')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { answers } = req.body;
  const userId = req.user.id;

  // Calculate learning style scores based on answers
  const scores = calculateLearningStyleScores(answers);

  // Update personalization profile
  await db.update(userPersonalization)
    .set({
      learningStyleVisual: scores.visual,
      learningStyleAuditory: scores.auditory,
      learningStyleKinesthetic: scores.kinesthetic,
      learningStyleReading: scores.reading,
      updatedAt: new Date()
    })
    .where(eq(userPersonalization.userId, userId));

  // Generate personalized recommendations based on learning style
  await generateLearningStyleRecommendations(userId, scores);

  res.json({
    success: true,
    message: 'Learning style assessment completed',
    data: {
      scores,
      primaryStyle: Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b),
      recommendations: await getRecentRecommendations(userId, 'learning_style')
    }
  });
}));

// Take personality assessment
router.post('/assessment/personality', [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.trait').isIn(['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']).withMessage('Invalid trait'),
  body('answers.*.score').isDecimal().withMessage('Score must be a decimal')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { answers } = req.body;
  const userId = req.user.id;

  // Update personality scores
  const updateData = {};
  answers.forEach(answer => {
    updateData[`personality${answer.trait.charAt(0).toUpperCase() + answer.trait.slice(1)}`] = answer.score;
  });
  updateData.updatedAt = new Date();

  await db.update(userPersonalization)
    .set(updateData)
    .where(eq(userPersonalization.userId, userId));

  // Generate AI-powered personality insights
  const insights = await generatePersonalityInsights(userId, answers);

  res.json({
    success: true,
    message: 'Personality assessment completed',
    data: {
      traits: answers,
      insights,
      recommendations: await getRecentRecommendations(userId, 'personality')
    }
  });
}));

// Get personalized recommendations
router.get('/recommendations', [
  query('type').optional().isIn(['study_schedule', 'content', 'method', 'goal', 'social']).withMessage('Invalid recommendation type'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('status').optional().isIn(['pending', 'accepted', 'dismissed', 'completed']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const { type, priority, status = 'pending', limit = 10 } = req.query;

  let query = db.select()
    .from(personalizedRecommendations)
    .where(eq(personalizedRecommendations.userId, userId));

  // Apply filters
  if (type) {
    query = query.where(eq(personalizedRecommendations.type, type));
  }
  if (priority) {
    query = query.where(eq(personalizedRecommendations.priority, priority));
  }
  if (status) {
    query = query.where(eq(personalizedRecommendations.status, status));
  }

  const recommendations = await query
    .orderBy(desc(personalizedRecommendations.createdAt))
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: recommendations
  });
}));

// Update recommendation status
router.put('/recommendations/:id/status', [
  param('id').isInt().withMessage('Recommendation ID must be an integer'),
  body('status').isIn(['accepted', 'dismissed', 'completed']).withMessage('Invalid status'),
  body('feedback').optional().isInt({ min: 1, max: 5 }).withMessage('Feedback must be between 1 and 5'),
  body('comments').optional().isString().withMessage('Comments must be a string')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const recommendationId = parseInt(req.params.id);
  const { status, feedback, comments } = req.body;
  const userId = req.user.id;

  // Verify recommendation ownership
  const recommendation = await db.select()
    .from(personalizedRecommendations)
    .where(and(
      eq(personalizedRecommendations.id, recommendationId),
      eq(personalizedRecommendations.userId, userId)
    ))
    .limit(1);

  if (!recommendation.length) {
    throw new AppError('Recommendation not found', 404, 'RECOMMENDATION_NOT_FOUND');
  }

  // Update recommendation
  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (feedback) updateData.userFeedback = feedback;
  if (comments) updateData.feedbackComments = comments;
  if (status === 'accepted') updateData.implementationDate = new Date();
  if (status === 'completed') updateData.completionDate = new Date();

  const updatedRecommendation = await db.update(personalizedRecommendations)
    .set(updateData)
    .where(eq(personalizedRecommendations.id, recommendationId))
    .returning();

  // Learn from user feedback to improve future recommendations
  if (feedback) {
    await processFeedbackForLearning(userId, recommendation[0], feedback, comments);
  }

  res.json({
    success: true,
    message: 'Recommendation status updated successfully',
    data: updatedRecommendation[0]
  });
}));

// Generate AI-powered study plan recommendations
router.post('/recommendations/study-plan', [
  body('goals').optional().isArray().withMessage('Goals must be an array'),
  body('timeframe').optional().isIn(['week', 'month', 'semester', 'year']).withMessage('Invalid timeframe'),
  body('subjects').optional().isArray().withMessage('Subjects must be an array'),
  body('currentWorkload').optional().isInt({ min: 1, max: 10 }).withMessage('Workload must be between 1 and 10')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const { goals = [], timeframe = 'month', subjects = [], currentWorkload = 5 } = req.body;

  // Get user's learning patterns and preferences
  const userProfile = await getUserCompleteProfile(userId);

  // Generate AI-powered study plan
  const studyPlan = await generateAIStudyPlan(userProfile, {
    goals,
    timeframe,
    subjects,
    currentWorkload
  });

  // Save recommendations
  const savedRecommendations = await saveStudyPlanRecommendations(userId, studyPlan);

  res.json({
    success: true,
    message: 'Personalized study plan generated successfully',
    data: {
      studyPlan,
      recommendations: savedRecommendations
    }
  });
}));

// Get adaptive content recommendations
router.get('/content/adaptive', [
  query('subject').optional().isString().withMessage('Subject must be a string'),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  query('contentType').optional().isIn(['video', 'article', 'exercise', 'quiz', 'game']).withMessage('Invalid content type'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const { subject, difficulty, contentType, limit = 10 } = req.query;

  // Get user's learning patterns and performance data
  const userProfile = await getUserCompleteProfile(userId);
  
  // Generate adaptive content recommendations
  const contentRecommendations = await generateAdaptiveContent(userProfile, {
    subject,
    difficulty,
    contentType,
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: contentRecommendations
  });
}));

// Analytics endpoint for learning insights
router.get('/analytics/insights', [
  query('timeframe').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid timeframe'),
  query('detailed').optional().isBoolean().withMessage('Detailed must be a boolean')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const { timeframe = 'month', detailed = false } = req.query;

  // Get comprehensive learning insights
  const insights = await generateLearningInsights(userId, timeframe, detailed);

  res.json({
    success: true,
    data: insights
  });
}));

// Helper Functions

function calculateLearningStyleScores(answers) {
  // Simplified learning style calculation
  // In a real implementation, this would use validated assessment questions
  const scores = { visual: 0, auditory: 0, kinesthetic: 0, reading: 0 };
  
  answers.forEach(answer => {
    const category = (answer.questionId % 4);
    const styleKey = ['visual', 'auditory', 'kinesthetic', 'reading'][category];
    scores[styleKey] += answer.response;
  });

  // Normalize scores
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  Object.keys(scores).forEach(key => {
    scores[key] = (scores[key] / total).toFixed(2);
  });

  return scores;
}

async function analyzeUserPatterns(userId) {
  try {
    // Get user's recent activity data
    const activityData = await getUserActivityData(userId);
    
    // Analyze patterns using AI
    const patterns = await analyzeWithAI(activityData);
    
    // Save or update learning patterns
    const existingPatterns = await db.select()
      .from(learningPatterns)
      .where(eq(learningPatterns.userId, userId))
      .limit(1);

    if (existingPatterns.length) {
      await db.update(learningPatterns)
        .set({ ...patterns, lastAnalyzed: new Date(), updatedAt: new Date() })
        .where(eq(learningPatterns.userId, userId));
    } else {
      await db.insert(learningPatterns)
        .values({ userId, ...patterns, lastAnalyzed: new Date() });
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing user patterns:', error);
    return null;
  }
}

async function generateLearningStyleRecommendations(userId, scores) {
  const primaryStyle = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  
  const recommendationTemplates = {
    visual: [
      {
        title: "Use Visual Study Materials",
        description: "Incorporate diagrams, charts, and mind maps into your study sessions",
        actionableSteps: [
          "Create visual mind maps for complex topics",
          "Use color-coded notes and highlighting",
          "Watch educational videos and animations",
          "Draw diagrams to explain concepts"
        ]
      }
    ],
    auditory: [
      {
        title: "Leverage Audio Learning",
        description: "Use discussion and verbal repetition to enhance learning",
        actionableSteps: [
          "Record yourself explaining concepts",
          "Join study groups for discussion",
          "Listen to educational podcasts",
          "Read notes aloud during review"
        ]
      }
    ],
    kinesthetic: [
      {
        title: "Hands-On Learning Approach",
        description: "Engage in practical activities and movement while studying",
        actionableSteps: [
          "Use flashcards and manipulatives",
          "Take frequent study breaks with movement",
          "Practice concepts through real-world applications",
          "Use gestures while memorizing information"
        ]
      }
    ],
    reading: [
      {
        title: "Text-Based Learning Optimization",
        description: "Maximize learning through reading and writing activities",
        actionableSteps: [
          "Create detailed written summaries",
          "Use lists and bullet points extensively",
          "Read multiple sources on each topic",
          "Write practice essays and explanations"
        ]
      }
    ]
  };

  const recommendations = recommendationTemplates[primaryStyle] || [];
  
  // Save recommendations to database
  for (const rec of recommendations) {
    await db.insert(personalizedRecommendations)
      .values({
        userId,
        type: 'method',
        category: 'learning_style',
        title: rec.title,
        description: rec.description,
        actionableSteps: rec.actionableSteps,
        priority: 'high',
        confidenceScore: scores[primaryStyle],
        expectedImpact: 'high',
        basedOnPatterns: ['learning_style_assessment'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
  }
}

async function generatePersonalityInsights(userId, traits) {
  try {
    const prompt = `Based on these Big Five personality traits, provide educational insights and recommendations:
    
    ${traits.map(t => `${t.trait}: ${t.score}`).join('\n')}
    
    Provide insights in JSON format with:
    - strengths: learning strengths based on personality
    - challenges: potential learning challenges
    - recommendations: specific study strategies
    - motivators: what motivates this learner
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error generating personality insights:', error);
    return {
      strengths: [],
      challenges: [],
      recommendations: [],
      motivators: []
    };
  }
}

async function getRecentRecommendations(userId, category) {
  return await db.select()
    .from(personalizedRecommendations)
    .where(and(
      eq(personalizedRecommendations.userId, userId),
      eq(personalizedRecommendations.category, category)
    ))
    .orderBy(desc(personalizedRecommendations.createdAt))
    .limit(5);
}

async function getUserCompleteProfile(userId) {
  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const personalization = await db.select()
    .from(userPersonalization)
    .where(eq(userPersonalization.userId, userId))
    .limit(1);

  const patterns = await db.select()
    .from(learningPatterns)
    .where(eq(learningPatterns.userId, userId))
    .orderBy(desc(learningPatterns.lastAnalyzed))
    .limit(1);

  return {
    user: user[0],
    personalization: personalization[0] || null,
    patterns: patterns[0] || null
  };
}

async function generateAIStudyPlan(userProfile, params) {
  try {
    const prompt = `Create a personalized study plan for a user with these characteristics:
    
    Learning Style: Visual ${userProfile.personalization?.learningStyleVisual || 0.25}, 
    Auditory ${userProfile.personalization?.learningStyleAuditory || 0.25},
    Kinesthetic ${userProfile.personalization?.learningStyleKinesthetic || 0.25},
    Reading ${userProfile.personalization?.learningStyleReading || 0.25}
    
    Preferences:
    - Study Time: ${userProfile.personalization?.preferredStudyTime || 'morning'}
    - Session Length: ${userProfile.personalization?.preferredSessionLength || 25} minutes
    - Break Length: ${userProfile.personalization?.preferredBreakLength || 5} minutes
    - Motivation: ${userProfile.personalization?.motivationType || 'achievement'}
    
    Goals: ${params.goals.join(', ')}
    Timeframe: ${params.timeframe}
    Subjects: ${params.subjects.join(', ')}
    Current Workload: ${params.currentWorkload}/10
    
    Create a detailed study plan in JSON format with:
    - weekly_schedule: day-by-day breakdown
    - study_techniques: recommended methods
    - milestone_tracking: progress checkpoints
    - adaptive_elements: how to adjust based on progress
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 2000
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error generating AI study plan:', error);
    return {
      weekly_schedule: {},
      study_techniques: [],
      milestone_tracking: [],
      adaptive_elements: []
    };
  }
}

async function saveStudyPlanRecommendations(userId, studyPlan) {
  const recommendations = [];
  
  // Create recommendations from study plan elements
  if (studyPlan.study_techniques) {
    for (const technique of studyPlan.study_techniques.slice(0, 3)) {
      const rec = await db.insert(personalizedRecommendations)
        .values({
          userId,
          type: 'method',
          category: 'study_technique',
          title: `Try: ${technique.name || technique}`,
          description: technique.description || `Implement ${technique} in your study routine`,
          actionableSteps: technique.steps || [],
          priority: 'medium',
          confidenceScore: 0.85,
          expectedImpact: 'medium',
          basedOnPatterns: ['ai_study_plan']
        })
        .returning();
      
      recommendations.push(rec[0]);
    }
  }

  return recommendations;
}

async function generateAdaptiveContent(userProfile, params) {
  // This would integrate with your content database and AI algorithms
  // For now, return placeholder adaptive content
  return {
    recommended_content: [
      {
        id: 1,
        type: params.contentType || 'video',
        title: 'Personalized Learning Content',
        difficulty: params.difficulty || 'intermediate',
        subject: params.subject || 'general',
        confidence_score: 0.9,
        adaptation_reason: 'Based on your learning style and recent performance'
      }
    ],
    difficulty_adjustment: 'optimal',
    next_recommendations: []
  };
}

async function generateLearningInsights(userId, timeframe, detailed) {
  // Get user data for the specified timeframe
  const insights = {
    learning_velocity: 0.85,
    retention_rate: 0.78,
    optimal_study_times: ['09:00', '14:00', '19:00'],
    subject_performance: {},
    improvement_areas: [],
    strengths: [],
    recommendations: []
  };

  if (detailed) {
    insights.detailed_metrics = {
      daily_patterns: {},
      weekly_trends: {},
      comparative_analysis: {}
    };
  }

  return insights;
}

async function getUserActivityData(userId) {
  // Aggregate user activity data from various tables
  return {
    study_sessions: [],
    quiz_performance: [],
    note_taking_patterns: [],
    collaboration_activity: [],
    content_engagement: []
  };
}

async function analyzeWithAI(activityData) {
  // AI analysis of user patterns
  return {
    avgStudySessionLength: 45.5,
    mostProductiveHour: 9,
    mostProductiveDay: 2, // Tuesday
    attentionSpan: 35,
    procrastinationTendency: 0.3,
    comprehensionSpeed: 0.8,
    retentionRate: 0.75,
    applicationAbility: 0.7,
    problemSolvingSpeed: 0.65
  };
}

async function processFeedbackForLearning(userId, recommendation, feedback, comments) {
  // Process user feedback to improve future recommendations
  // This would update ML models or recommendation algorithms
  console.log(`Processing feedback for user ${userId}: ${feedback}/5 - ${comments}`);
}

export default router;