import express from 'express';
import { eq, desc, asc, count, and, or, gte, lte, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  studyPlans,
  studyMilestones,
  studySessions,
  studyCalendar,
  studyPlanTemplates,
  studyAnalytics,
  adaptiveLearningRecommendations
} from '../db/enhanced-study-planner-schema.js';
import { authenticateUser } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Apply authentication to all routes
router.use(authenticateUser);

// STUDY PLANS MANAGEMENT

// Get user's study plans
router.get('/plans', async (req, res) => {
  try {
    const { 
      status = 'active', 
      subject, 
      sortBy = 'updated', 
      order = 'desc', 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db.select({
      id: studyPlans.id,
      planId: studyPlans.planId,
      title: studyPlans.title,
      description: studyPlans.description,
      planType: studyPlans.planType,
      subject: studyPlans.subject,
      course: studyPlans.course,
      primaryGoal: studyPlans.primaryGoal,
      targetDate: studyPlans.targetDate,
      startDate: studyPlans.startDate,
      endDate: studyPlans.endDate,
      completionPercentage: studyPlans.completionPercentage,
      totalStudiedHours: studyPlans.totalStudiedHours,
      totalPlannedHours: studyPlans.totalPlannedHours,
      currentMilestone: studyPlans.currentMilestone,
      averageSessionRating: studyPlans.averageSessionRating,
      adherenceScore: studyPlans.adherenceScore,
      effectivenessScore: studyPlans.effectivenessScore,
      status: studyPlans.status,
      isShared: studyPlans.isShared,
      aiGenerated: studyPlans.aiGenerated,
      createdAt: studyPlans.createdAt,
      updatedAt: studyPlans.updatedAt,
      lastAccessedAt: studyPlans.lastAccessedAt
    }).from(studyPlans);

    // Add filters
    let conditions = [eq(studyPlans.userId, req.user.id)];

    if (status && status !== 'all') {
      conditions.push(eq(studyPlans.status, status));
    }

    if (subject) {
      conditions.push(eq(studyPlans.subject, subject));
    }

    query = query.where(and(...conditions));

    // Add sorting
    const orderDirection = order === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'title':
        query = query.orderBy(orderDirection(studyPlans.title));
        break;
      case 'created':
        query = query.orderBy(orderDirection(studyPlans.createdAt));
        break;
      case 'target':
        query = query.orderBy(orderDirection(studyPlans.targetDate));
        break;
      case 'progress':
        query = query.orderBy(orderDirection(studyPlans.completionPercentage));
        break;
      default:
        query = query.orderBy(orderDirection(studyPlans.updatedAt));
    }

    const plans = await query.limit(parseInt(limit)).offset(offset);

    // Get total count
    const totalQuery = db.select({ count: count() }).from(studyPlans).where(and(...conditions));
    const [{ count: totalCount }] = await totalQuery;

    res.json({
      plans,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching study plans:', error);
    res.status(500).json({ error: 'Failed to fetch study plans' });
  }
});

// Create new study plan
router.post('/plans', async (req, res) => {
  try {
    const {
      title,
      description,
      planType = 'custom',
      subject,
      course,
      gradeLevel,
      institution,
      primaryGoal,
      learningObjectives = [],
      targetGrade,
      targetDate,
      startDate,
      endDate,
      totalPlannedHours,
      dailyStudyTime,
      preferredStudyTimes = [],
      difficultyLevel = 'medium',
      pacingStrategy = 'balanced',
      adaptiveScheduling = true,
      reminderSettings = {},
      tags = []
    } = req.body;

    const [newPlan] = await db.insert(studyPlans).values({
      userId: req.user.id,
      title,
      description,
      planType,
      subject,
      course,
      gradeLevel,
      institution,
      primaryGoal,
      learningObjectives,
      targetGrade,
      targetDate: targetDate ? new Date(targetDate) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPlannedHours: parseFloat(totalPlannedHours) || null,
      dailyStudyTime: parseInt(dailyStudyTime) || null,
      preferredStudyTimes,
      difficultyLevel,
      pacingStrategy,
      adaptiveScheduling,
      reminderSettings,
      tags
    }).returning();

    res.status(201).json({
      message: 'Study plan created successfully',
      plan: newPlan
    });
  } catch (error) {
    console.error('Error creating study plan:', error);
    res.status(500).json({ error: 'Failed to create study plan' });
  }
});

// Get specific study plan with milestones
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    // Get plan details
    const [plan] = await db.select()
      .from(studyPlans)
      .where(
        and(
          eq(studyPlans.planId, planId),
          eq(studyPlans.userId, req.user.id)
        )
      );

    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    // Get milestones
    const milestones = await db.select()
      .from(studyMilestones)
      .where(eq(studyMilestones.planId, plan.id))
      .orderBy(asc(studyMilestones.order));

    // Get recent sessions
    const recentSessions = await db.select()
      .from(studySessions)
      .where(eq(studySessions.planId, plan.id))
      .orderBy(desc(studySessions.actualStartTime))
      .limit(10);

    // Get upcoming calendar events
    const upcomingEvents = await db.select()
      .from(studyCalendar)
      .where(
        and(
          eq(studyCalendar.planId, plan.id),
          gte(studyCalendar.startDateTime, new Date())
        )
      )
      .orderBy(asc(studyCalendar.startDateTime))
      .limit(5);

    res.json({
      plan,
      milestones,
      recentSessions,
      upcomingEvents,
      summary: {
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter(m => m.status === 'completed').length,
        totalSessions: recentSessions.length,
        studyStreak: calculateStudyStreak(recentSessions)
      }
    });
  } catch (error) {
    console.error('Error fetching study plan:', error);
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
});

// Generate AI study plan
router.post('/plans/ai-generate', async (req, res) => {
  try {
    const {
      subject,
      course,
      targetGrade,
      currentLevel,
      availableTime, // hours per week
      targetDate,
      learningStyle,
      specificTopics = [],
      weakAreas = [],
      strongAreas = [],
      examType
    } = req.body;

    const prompt = `Create a comprehensive study plan for:
- Subject: ${subject}
- Course: ${course}
- Target Grade: ${targetGrade}
- Current Level: ${currentLevel}
- Available Study Time: ${availableTime} hours per week
- Target Date: ${targetDate}
- Learning Style: ${learningStyle}
- Specific Topics: ${specificTopics.join(', ')}
- Weak Areas: ${weakAreas.join(', ')}
- Strong Areas: ${strongAreas.join(', ')}
- Exam Type: ${examType}

Please provide:
1. Overall study plan structure (phases/milestones)
2. Weekly study schedule
3. Recommended study methods for each topic
4. Time allocation for each subject area
5. Review and practice schedules
6. Assessment checkpoints

Format as JSON with the following structure:
{
  "title": "AI-Generated Study Plan",
  "description": "Detailed description",
  "totalWeeks": number,
  "phases": [
    {
      "name": "Phase name",
      "duration": "weeks",
      "goals": [],
      "topics": [],
      "studyMethods": [],
      "timeAllocation": {}
    }
  ],
  "weeklySchedule": {
    "totalHours": number,
    "dailyBreakdown": {}
  },
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Description",
      "targetWeek": number,
      "assessmentType": "type",
      "criteria": []
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational consultant and study planner. Create detailed, personalized study plans that maximize learning efficiency and retention.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const aiPlan = JSON.parse(completion.choices[0].message.content);

    // Create the study plan
    const [newPlan] = await db.insert(studyPlans).values({
      userId: req.user.id,
      title: aiPlan.title,
      description: aiPlan.description,
      planType: 'ai_generated',
      subject,
      course,
      targetGrade,
      targetDate: new Date(targetDate),
      startDate: new Date(),
      endDate: new Date(Date.now() + (aiPlan.totalWeeks * 7 * 24 * 60 * 60 * 1000)),
      totalPlannedHours: aiPlan.weeklySchedule.totalHours * aiPlan.totalWeeks,
      dailyStudyTime: Math.round(aiPlan.weeklySchedule.totalHours * 60 / 7), // Convert to minutes per day
      difficultyLevel: currentLevel,
      aiGenerated: true,
      mlRecommendations: aiPlan,
      learningPathOptimization: true
    }).returning();

    // Create milestones
    if (aiPlan.milestones && aiPlan.milestones.length > 0) {
      const milestonesToInsert = aiPlan.milestones.map((milestone, index) => ({
        planId: newPlan.id,
        title: milestone.title,
        description: milestone.description,
        order: index + 1,
        milestoneType: milestone.assessmentType || 'topic',
        learningOutcomes: milestone.criteria || [],
        estimatedDuration: Math.round(aiPlan.weeklySchedule.totalHours * 60 / aiPlan.milestones.length), // Minutes
        plannedStartDate: new Date(Date.now() + (milestone.targetWeek - 1) * 7 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + milestone.targetWeek * 7 * 24 * 60 * 60 * 1000)
      }));

      await db.insert(studyMilestones).values(milestonesToInsert);
    }

    res.status(201).json({
      message: 'AI study plan generated successfully',
      plan: newPlan,
      aiPlan
    });
  } catch (error) {
    console.error('Error generating AI study plan:', error);
    res.status(500).json({ error: 'Failed to generate AI study plan' });
  }
});

// STUDY SESSIONS

// Start study session
router.post('/sessions', async (req, res) => {
  try {
    const {
      planId,
      milestoneId,
      title,
      sessionType = 'study',
      subject,
      topics = [],
      plannedDuration, // minutes
      studyMethod,
      environment,
      learningGoals = []
    } = req.body;

    // Verify plan ownership if provided
    if (planId) {
      const [plan] = await db.select()
        .from(studyPlans)
        .where(
          and(
            eq(studyPlans.planId, planId),
            eq(studyPlans.userId, req.user.id)
          )
        );

      if (!plan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }
    }

    const [newSession] = await db.insert(studySessions).values({
      userId: req.user.id,
      planId: planId ? (await db.select().from(studyPlans).where(eq(studyPlans.planId, planId)))[0]?.id : null,
      milestoneId,
      title,
      sessionType,
      subject,
      topics,
      plannedDuration: parseInt(plannedDuration),
      studyMethod,
      environment,
      learningGoals,
      plannedStartTime: new Date(),
      actualStartTime: new Date()
    }).returning();

    res.status(201).json({
      message: 'Study session started successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ error: 'Failed to start study session' });
  }
});

// Complete study session
router.post('/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      actualDuration, // minutes
      activitiesCompleted = [],
      goalsAchieved = [],
      keyTakeaways = [],
      areasForImprovement = [],
      comprehensionScore,
      satisfactionRating,
      difficultyRating,
      focusScore,
      notesCreated = 0,
      questionsAsked = 0,
      pomodoroSessions = 0,
      breaksTaken = 0,
      distractionCount = 0
    } = req.body;

    // Verify session ownership
    const [session] = await db.select()
      .from(studySessions)
      .where(eq(studySessions.sessionId, sessionId));

    if (!session || session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const endTime = new Date();
    const actualDurationCalculated = actualDuration || Math.round((endTime - new Date(session.actualStartTime)) / 60000);

    const [completedSession] = await db.update(studySessions)
      .set({
        actualEndTime: endTime,
        actualDuration: actualDurationCalculated,
        activitiesCompleted,
        goalsAchieved,
        keyTakeaways,
        areasForImprovement,
        comprehensionScore: parseFloat(comprehensionScore) || null,
        satisfactionRating: parseInt(satisfactionRating) || null,
        difficultyRating: parseInt(difficultyRating) || null,
        focusScore: parseFloat(focusScore) || null,
        notesCreated: parseInt(notesCreated),
        questionsAsked: parseInt(questionsAsked),
        pomodoroSessions: parseInt(pomodoroSessions),
        breaksTaken: parseInt(breaksTaken),
        distractionCount: parseInt(distractionCount),
        status: 'completed',
        completionStatus: 'completed',
        updatedAt: new Date()
      })
      .where(eq(studySessions.sessionId, sessionId))
      .returning();

    // Update plan statistics if session is linked to a plan
    if (session.planId) {
      await db.update(studyPlans)
        .set({
          totalStudiedHours: sql`${studyPlans.totalStudiedHours} + ${actualDurationCalculated / 60}`,
          lastAccessedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(studyPlans.id, session.planId));
    }

    res.json({
      message: 'Study session completed successfully',
      session: completedSession
    });
  } catch (error) {
    console.error('Error completing study session:', error);
    res.status(500).json({ error: 'Failed to complete study session' });
  }
});

// CALENDAR INTEGRATION

// Get study calendar events
router.get('/calendar', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      planId, 
      eventType 
    } = req.query;

    let query = db.select()
      .from(studyCalendar)
      .where(eq(studyCalendar.userId, req.user.id));

    // Add filters
    let conditions = [eq(studyCalendar.userId, req.user.id)];

    if (startDate && endDate) {
      conditions.push(
        and(
          gte(studyCalendar.startDateTime, new Date(startDate)),
          lte(studyCalendar.startDateTime, new Date(endDate))
        )
      );
    }

    if (planId) {
      const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.planId, planId));
      if (plan) {
        conditions.push(eq(studyCalendar.planId, plan.id));
      }
    }

    if (eventType) {
      conditions.push(eq(studyCalendar.eventType, eventType));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(asc(studyCalendar.startDateTime));

    const events = await query;

    res.json({
      events,
      totalEvents: events.length
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Create calendar event
router.post('/calendar', async (req, res) => {
  try {
    const {
      planId,
      sessionId,
      title,
      description,
      eventType = 'study',
      startDateTime,
      endDateTime,
      allDay = false,
      location,
      isVirtual = false,
      meetingLink,
      priority = 'medium',
      reminders = [],
      isRecurring = false,
      recurrencePattern = {},
      color = '#3B82F6'
    } = req.body;

    const [newEvent] = await db.insert(studyCalendar).values({
      userId: req.user.id,
      planId: planId ? (await db.select().from(studyPlans).where(eq(studyPlans.planId, planId)))[0]?.id : null,
      sessionId: sessionId ? (await db.select().from(studySessions).where(eq(studySessions.sessionId, sessionId)))[0]?.id : null,
      title,
      description,
      eventType,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      allDay,
      location,
      isVirtual,
      meetingLink,
      priority,
      reminders,
      isRecurring,
      recurrencePattern,
      color
    }).returning();

    res.status(201).json({
      message: 'Calendar event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// ANALYTICS AND RECOMMENDATIONS

// Get user's study analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Get or create analytics record
    let [analytics] = await db.select()
      .from(studyAnalytics)
      .where(eq(studyAnalytics.userId, req.user.id));

    if (!analytics) {
      // Create initial analytics record
      [analytics] = await db.insert(studyAnalytics).values({
        userId: req.user.id
      }).returning();
    }

    // Calculate date range for period analysis
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get recent sessions for period analysis
    const recentSessions = await db.select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, req.user.id),
          gte(studySessions.actualStartTime, startDate),
          eq(studySessions.status, 'completed')
        )
      )
      .orderBy(desc(studySessions.actualStartTime));

    // Calculate period-specific metrics
    const periodMetrics = {
      totalSessions: recentSessions.length,
      totalStudyTime: recentSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
      averageSessionDuration: recentSessions.length > 0 ? 
        recentSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / recentSessions.length : 0,
      averageComprehensionScore: recentSessions.filter(s => s.comprehensionScore).length > 0 ?
        recentSessions.filter(s => s.comprehensionScore).reduce((sum, s) => sum + s.comprehensionScore, 0) / 
        recentSessions.filter(s => s.comprehensionScore).length : null,
      averageFocusScore: recentSessions.filter(s => s.focusScore).length > 0 ?
        recentSessions.filter(s => s.focusScore).reduce((sum, s) => sum + s.focusScore, 0) / 
        recentSessions.filter(s => s.focusScore).length : null,
      studyStreak: calculateStudyStreak(recentSessions)
    };

    res.json({
      analytics,
      periodMetrics,
      period,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching study analytics:', error);
    res.status(500).json({ error: 'Failed to fetch study analytics' });
  }
});

// Get adaptive learning recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { planId, status = 'pending', limit = 10 } = req.query;

    let query = db.select()
      .from(adaptiveLearningRecommendations)
      .where(eq(adaptiveLearningRecommendations.userId, req.user.id));

    // Add filters
    let conditions = [eq(adaptiveLearningRecommendations.userId, req.user.id)];

    if (planId) {
      const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.planId, planId));
      if (plan) {
        conditions.push(eq(adaptiveLearningRecommendations.planId, plan.id));
      }
    }

    if (status) {
      conditions.push(eq(adaptiveLearningRecommendations.status, status));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(
      desc(adaptiveLearningRecommendations.priority),
      desc(adaptiveLearningRecommendations.createdAt)
    );
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

// Accept/reject recommendation
router.post('/recommendations/:recommendationId/respond', async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { action, feedback } = req.body; // action: 'accept' or 'reject'

    // Verify recommendation ownership
    const [recommendation] = await db.select()
      .from(adaptiveLearningRecommendations)
      .where(eq(adaptiveLearningRecommendations.recommendationId, recommendationId));

    if (!recommendation || recommendation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const [updatedRecommendation] = await db.update(adaptiveLearningRecommendations)
      .set({
        status: newStatus,
        userFeedback: feedback,
        updatedAt: new Date()
      })
      .where(eq(adaptiveLearningRecommendations.recommendationId, recommendationId))
      .returning();

    res.json({
      message: `Recommendation ${action}ed successfully`,
      recommendation: updatedRecommendation
    });
  } catch (error) {
    console.error('Error responding to recommendation:', error);
    res.status(500).json({ error: 'Failed to respond to recommendation' });
  }
});

// STUDY PLAN TEMPLATES

// Get available study plan templates
router.get('/templates', async (req, res) => {
  try {
    const { category, subject, gradeLevel, difficulty, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(studyPlanTemplates)
      .where(
        or(
          eq(studyPlanTemplates.isPublic, true),
          eq(studyPlanTemplates.createdBy, req.user.id)
        )
      );

    // Add filters
    let conditions = [
      or(
        eq(studyPlanTemplates.isPublic, true),
        eq(studyPlanTemplates.createdBy, req.user.id)
      )
    ];

    if (category) {
      conditions.push(eq(studyPlanTemplates.category, category));
    }

    if (subject) {
      conditions.push(eq(studyPlanTemplates.subject, subject));
    }

    if (gradeLevel) {
      conditions.push(eq(studyPlanTemplates.gradeLevel, gradeLevel));
    }

    if (difficulty) {
      conditions.push(eq(studyPlanTemplates.difficulty, difficulty));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(desc(studyPlanTemplates.rating), desc(studyPlanTemplates.usageCount));

    const templates = await query.limit(parseInt(limit)).offset(offset);

    res.json({
      templates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(templates.length / limit),
        hasNextPage: templates.length === parseInt(limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Helper function to calculate study streak
function calculateStudyStreak(sessions) {
  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const studyDates = new Set();

  // Get unique study dates
  sessions.forEach(session => {
    const sessionDate = new Date(session.actualStartTime).toDateString();
    studyDates.add(sessionDate);
  });

  const sortedDates = Array.from(studyDates).sort((a, b) => new Date(b) - new Date(a));

  // Calculate streak from most recent date
  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

    if (daysDiff === i) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default router;