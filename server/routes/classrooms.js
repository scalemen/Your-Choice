import express from 'express';
import { db } from '../db/index.js';
import { eq, desc, asc, count, and, or, gte, lte, inArray, sql, like, ilike, isNull } from 'drizzle-orm';
// Tables accessed via db.schema
// Tables accessed via db.schema
// Tables accessed via db.schema
import { authenticateUser } from '../middleware/auth.js';
import { uploadHandler } from '../middleware/upload.js';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Apply authentication to all routes
router.use(authenticateUser);

// INSTITUTIONS MANAGEMENT

// Get user's institutions
router.get('/institutions', async (req, res) => {
  try {
    const userInstitutions = await db.select()
      .from(institutions)
      .where(eq(institutions.isActive, true))
      .orderBy(asc(institutions.name));

    res.json({
      institutions: userInstitutions,
      totalInstitutions: userInstitutions.length
    });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// Create new institution
router.post('/institutions', async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      type,
      address,
      city,
      state,
      country,
      zipCode,
      phone,
      email,
      website,
      academicYear,
      gradingSystem,
      gradingScale,
      timeZone = 'UTC',
      language = 'en'
    } = req.body;

    const [institution] = await db.insert(institutions).values({
      name,
      displayName: displayName || name,
      description,
      type,
      address,
      city,
      state,
      country,
      zipCode,
      phone,
      email,
      website,
      academicYear,
      gradingSystem,
      gradingScale,
      timeZone,
      language
    }).returning();

    res.status(201).json({
      message: 'Institution created successfully',
      institution
    });
  } catch (error) {
    console.error('Error creating institution:', error);
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

// CLASSROOMS MANAGEMENT

// Get user's classrooms
router.get('/classrooms', async (req, res) => {
  try {
    const { role, status = 'active', archived = 'false' } = req.query;

    // Get user's classroom memberships
    let membershipQuery = db.select({
      classroom: classrooms,
      membership: classroomMemberships,
      institution: institutions
    })
    .from(classroomMemberships)
    .innerJoin(classrooms, eq(classroomMemberships.classroomId, classrooms.id))
    .leftJoin(institutions, eq(classrooms.institutionId, institutions.id))
    .where(
      and(
        eq(classroomMemberships.userId, req.user.id),
        eq(classroomMemberships.status, status),
        archived === 'true' 
          ? eq(classrooms.isArchived, true)
          : eq(classrooms.isArchived, false)
      )
    );

    if (role) {
      membershipQuery = membershipQuery.where(eq(classroomMemberships.role, role));
    }

    const userClassrooms = await membershipQuery.orderBy(desc(classroomMemberships.lastActiveAt));

    res.json({
      classrooms: userClassrooms.map(({ classroom, membership, institution }) => ({
        ...classroom,
        userRole: membership.role,
        userPermissions: membership.permissions,
        institution: institution,
        currentGrade: membership.currentGrade,
        engagementLevel: membership.engagementLevel
      })),
      totalClassrooms: userClassrooms.length
    });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// Create new classroom
router.post('/classrooms', async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      subject,
      gradeLevel,
      academicPeriod,
      institutionId,
      maxStudents = 30,
      visibility = 'private',
      allowStudentPosts = true,
      enableStudyGenius = true,
      autoCreateFlashcards = false,
      enableAiTutor = true,
      theme = 'default'
    } = req.body;

    // Generate unique class code
    const classCode = generateClassCode();

    const [classroom] = await db.insert(classrooms).values({
      name,
      displayName: displayName || name,
      description,
      subject,
      gradeLevel,
      academicPeriod,
      institutionId: institutionId || null,
      classCode,
      maxStudents,
      visibility,
      allowStudentPosts,
      enableStudyGenius,
      autoCreateFlashcards,
      enableAiTutor,
      theme
    }).returning();

    // Add creator as teacher
    await db.insert(classroomMemberships).values({
      classroomId: classroom.id,
      userId: req.user.id,
      role: 'teacher',
      permissions: ['all'],
      status: 'active'
    });

    res.status(201).json({
      message: 'Classroom created successfully',
      classroom
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// Get specific classroom details
router.get('/classrooms/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Get classroom with membership info
    const [classroomData] = await db.select({
      classroom: classrooms,
      membership: classroomMemberships,
      institution: institutions
    })
    .from(classrooms)
    .leftJoin(classroomMemberships, and(
      eq(classroomMemberships.classroomId, classrooms.id),
      eq(classroomMemberships.userId, req.user.id)
    ))
    .leftJoin(institutions, eq(classrooms.institutionId, institutions.id))
    .where(eq(classrooms.classroomId, classroomId));

    if (!classroomData || !classroomData.membership) {
      return res.status(403).json({ error: 'Access denied to this classroom' });
    }

    // Get recent activity and statistics
    const [recentAssignments, recentPosts, upcomingEvents, classStats] = await Promise.all([
      // Recent assignments
      db.select()
        .from(assignments)
        .where(eq(assignments.classroomId, classroomData.classroom.id))
        .orderBy(desc(assignments.createdAt))
        .limit(5),

      // Recent posts
      db.select({
        post: classroomPosts,
        author: {
          id: classroomMemberships.userId,
          role: classroomMemberships.role
        }
      })
      .from(classroomPosts)
      .leftJoin(classroomMemberships, and(
        eq(classroomMemberships.userId, classroomPosts.authorId),
        eq(classroomMemberships.classroomId, classroomData.classroom.id)
      ))
      .where(eq(classroomPosts.classroomId, classroomData.classroom.id))
      .orderBy(desc(classroomPosts.createdAt))
      .limit(5),

      // Upcoming events
      db.select()
        .from(classroomEvents)
        .where(
          and(
            eq(classroomEvents.classroomId, classroomData.classroom.id),
            gte(classroomEvents.startDateTime, new Date())
          )
        )
        .orderBy(asc(classroomEvents.startDateTime))
        .limit(5),

      // Class statistics
      db.select({
        totalStudents: count(classroomMemberships.id),
        totalAssignments: sql`(SELECT COUNT(*) FROM ${assignments} WHERE classroom_id = ${classroomData.classroom.id})`,
        totalPosts: sql`(SELECT COUNT(*) FROM ${classroomPosts} WHERE classroom_id = ${classroomData.classroom.id})`
      })
      .from(classroomMemberships)
      .where(
        and(
          eq(classroomMemberships.classroomId, classroomData.classroom.id),
          eq(classroomMemberships.status, 'active'),
          eq(classroomMemberships.role, 'student')
        )
      )
    ]);

    res.json({
      classroom: {
        ...classroomData.classroom,
        userRole: classroomData.membership.role,
        userPermissions: classroomData.membership.permissions,
        institution: classroomData.institution
      },
      recentAssignments,
      recentPosts: recentPosts.map(({ post, author }) => ({ ...post, authorRole: author?.role })),
      upcomingEvents,
      statistics: classStats[0] || { totalStudents: 0, totalAssignments: 0, totalPosts: 0 }
    });
  } catch (error) {
    console.error('Error fetching classroom details:', error);
    res.status(500).json({ error: 'Failed to fetch classroom details' });
  }
});

// Join classroom with class code
router.post('/classrooms/join', async (req, res) => {
  try {
    const { classCode } = req.body;

    // Find classroom by code
    const [classroom] = await db.select()
      .from(classrooms)
      .where(
        and(
          eq(classrooms.classCode, classCode),
          eq(classrooms.isActive, true)
        )
      );

    if (!classroom) {
      return res.status(404).json({ error: 'Invalid class code' });
    }

    // Check if user is already a member
    const [existingMembership] = await db.select()
      .from(classroomMemberships)
      .where(
        and(
          eq(classroomMemberships.classroomId, classroom.id),
          eq(classroomMemberships.userId, req.user.id)
        )
      );

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of this classroom' });
    }

    // Check classroom capacity
    const [memberCount] = await db.select({ count: count() })
      .from(classroomMemberships)
      .where(
        and(
          eq(classroomMemberships.classroomId, classroom.id),
          eq(classroomMemberships.status, 'active'),
          eq(classroomMemberships.role, 'student')
        )
      );

    if (memberCount.count >= classroom.maxStudents) {
      return res.status(400).json({ error: 'Classroom is at maximum capacity' });
    }

    // Add user as student
    const [membership] = await db.insert(classroomMemberships).values({
      classroomId: classroom.id,
      userId: req.user.id,
      role: 'student',
      status: 'active'
    }).returning();

    // Update classroom student count
    await db.update(classrooms)
      .set({
        totalStudents: sql`${classrooms.totalStudents} + 1`,
        updatedAt: new Date()
      })
      .where(eq(classrooms.id, classroom.id));

    res.status(201).json({
      message: 'Successfully joined classroom',
      classroom,
      membership
    });
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({ error: 'Failed to join classroom' });
  }
});

// ASSIGNMENTS MANAGEMENT

// Get classroom assignments
router.get('/classrooms/:classroomId/assignments', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { status, type, sortBy = 'dueDate', order = 'asc' } = req.query;

    // Verify access to classroom
    const hasAccess = await verifyClassroomAccess(req.user.id, classroomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this classroom' });
    }

    const [classroom] = await db.select()
      .from(classrooms)
      .where(eq(classrooms.classroomId, classroomId));

    let query = db.select({
      assignment: assignments,
      submissionCount: sql`(SELECT COUNT(*) FROM ${submissions} WHERE assignment_id = ${assignments.id})`,
      userSubmission: sql`(SELECT * FROM ${submissions} WHERE assignment_id = ${assignments.id} AND student_id = ${req.user.id} LIMIT 1)`
    })
    .from(assignments)
    .where(eq(assignments.classroomId, classroom.id));

    // Add filters
    let conditions = [eq(assignments.classroomId, classroom.id)];

    if (status) {
      conditions.push(eq(assignments.status, status));
    }

    if (type) {
      conditions.push(eq(assignments.type, type));
    }

    query = query.where(and(...conditions));

    // Add sorting
    const orderDirection = order === 'desc' ? desc : asc;
    switch (sortBy) {
      case 'title':
        query = query.orderBy(orderDirection(assignments.title));
        break;
      case 'created':
        query = query.orderBy(orderDirection(assignments.createdAt));
        break;
      case 'points':
        query = query.orderBy(orderDirection(assignments.totalPoints));
        break;
      default:
        query = query.orderBy(orderDirection(assignments.dueDate));
    }

    const classroomAssignments = await query;

    res.json({
      assignments: classroomAssignments,
      totalAssignments: classroomAssignments.length
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create new assignment
router.post('/classrooms/:classroomId/assignments', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const {
      title,
      description,
      instructions,
      type,
      category,
      subject,
      topics = [],
      totalPoints,
      gradingRubric = {},
      dueDate,
      availableFrom = new Date(),
      availableUntil,
      submissionType,
      allowedFileTypes = [],
      maxFileSize = 52428800,
      requireFlashcards = false,
      minimumFlashcards = 10,
      requireStudyPlan = false,
      enableAutoGrading = false,
      attachments = [],
      preloadedContent = []
    } = req.body;

    // Verify teacher access
    const hasTeacherAccess = await verifyClassroomAccess(req.user.id, classroomId, ['teacher']);
    if (!hasTeacherAccess) {
      return res.status(403).json({ error: 'Only teachers can create assignments' });
    }

    const [classroom] = await db.select()
      .from(classrooms)
      .where(eq(classrooms.classroomId, classroomId));

    const [assignment] = await db.insert(assignments).values({
      classroomId: classroom.id,
      createdBy: req.user.id,
      title,
      description,
      instructions,
      type,
      category,
      subject: subject || classroom.subject,
      topics,
      totalPoints,
      gradingRubric,
      dueDate: new Date(dueDate),
      availableFrom: new Date(availableFrom),
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      submissionType,
      allowedFileTypes,
      maxFileSize,
      requireFlashcards,
      minimumFlashcards,
      requireStudyPlan,
      enableAutoGrading,
      attachments,
      preloadedContent,
      status: 'published'
    }).returning();

    // Create calendar event for due date
    await db.insert(classroomEvents).values({
      classroomId: classroom.id,
      createdBy: req.user.id,
      title: `${assignment.title} - Due`,
      description: `Assignment due: ${assignment.title}`,
      type: 'assignment_due',
      startDateTime: new Date(dueDate),
      allDay: true,
      relatedAssignmentId: assignment.id,
      sendNotifications: true
    });

    // If preloaded content is included, create study integration records
    if (preloadedContent.length > 0) {
      const studyIntegrations = preloadedContent.map(contentId => ({
        classroomId: classroom.id,
        assignmentId: assignment.id,
        integrationType: 'assignment_flashcards',
        connectionType: 'optional',
        metadata: { preloadedCollectionId: contentId }
      }));

      // Note: This would need to be created for each student, but we'll handle that when they access the assignment
    }

    // Update classroom assignment count
    await db.update(classrooms)
      .set({
        totalAssignments: sql`${classrooms.totalAssignments} + 1`,
        updatedAt: new Date()
      })
      .where(eq(classrooms.id, classroom.id));

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get specific assignment details
router.get('/assignments/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const [assignmentData] = await db.select({
      assignment: assignments,
      classroom: classrooms,
      creator: {
        id: classroomMemberships.userId,
        role: classroomMemberships.role
      }
    })
    .from(assignments)
    .innerJoin(classrooms, eq(assignments.classroomId, classrooms.id))
    .leftJoin(classroomMemberships, and(
      eq(classroomMemberships.userId, assignments.createdBy),
      eq(classroomMemberships.classroomId, classrooms.id)
    ))
    .where(eq(assignments.assignmentId, assignmentId));

    if (!assignmentData) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify access to classroom
    const hasAccess = await verifyClassroomAccess(req.user.id, assignmentData.classroom.classroomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this assignment' });
    }

    // Get user's submission if exists
    const [userSubmission] = await db.select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentData.assignment.id),
          eq(submissions.studentId, req.user.id)
        )
      )
      .orderBy(desc(submissions.submissionAttempt));

    // Get related StudyGenius content if integrated
    let relatedContent = {};
    if (assignmentData.assignment.preloadedContent?.length > 0) {
      const preloadedCollections = await db.select()
        .from(preloadedFlashcardCollections)
        .where(inArray(preloadedFlashcardCollections.collectionId, assignmentData.assignment.preloadedContent));
      
      relatedContent.preloadedCollections = preloadedCollections;
    }

    // Check if user has related study materials
    const userStudyMaterials = await db.select()
      .from(classroomStudyIntegration)
      .where(
        and(
          eq(classroomStudyIntegration.assignmentId, assignmentData.assignment.id),
          eq(classroomStudyIntegration.studentId, req.user.id)
        )
      );

    res.json({
      assignment: assignmentData.assignment,
      classroom: assignmentData.classroom,
      userSubmission,
      relatedContent,
      userStudyMaterials
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
});

// Submit assignment
router.post('/assignments/:assignmentId/submit', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      textContent,
      links = [],
      flashcardDeckIds = [],
      noteIds = [],
      quizResultIds = [],
      studyPlanId,
      timeSpent
    } = req.body;

    // Get assignment details
    const [assignment] = await db.select({
      assignment: assignments,
      classroom: classrooms
    })
    .from(assignments)
    .innerJoin(classrooms, eq(assignments.classroomId, classrooms.id))
    .where(eq(assignments.assignmentId, assignmentId));

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify student access
    const hasAccess = await verifyClassroomAccess(req.user.id, assignment.classroom.classroomId, ['student']);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to submit this assignment' });
    }

    // Check if assignment is still accepting submissions
    const now = new Date();
    if (now > new Date(assignment.assignment.dueDate) && !assignment.assignment.allowLateSubmissions) {
      return res.status(400).json({ error: 'Assignment is past due and not accepting late submissions' });
    }

    // Check existing submissions
    const existingSubmissions = await db.select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignment.assignment.id),
          eq(submissions.studentId, req.user.id)
        )
      );

    if (existingSubmissions.length >= assignment.assignment.maxSubmissions) {
      return res.status(400).json({ error: 'Maximum number of submissions reached' });
    }

    // Validate StudyGenius requirements
    if (assignment.assignment.requireFlashcards && flashcardDeckIds.length === 0) {
      return res.status(400).json({ error: 'This assignment requires flashcard submission' });
    }

    if (assignment.assignment.requireStudyPlan && !studyPlanId) {
      return res.status(400).json({ error: 'This assignment requires a study plan' });
    }

    // Calculate if submission is late
    const isLate = now > new Date(assignment.assignment.dueDate);
    const daysPastDue = isLate ? Math.ceil((now - new Date(assignment.assignment.dueDate)) / (1000 * 60 * 60 * 24)) : 0;

    // Create submission
    const [submission] = await db.insert(submissions).values({
      assignmentId: assignment.assignment.id,
      studentId: req.user.id,
      textContent,
      links,
      flashcardDeckIds,
      noteIds,
      quizResultIds,
      studyPlanId,
      submissionAttempt: existingSubmissions.length + 1,
      timeSpent,
      status: 'submitted',
      isLate,
      daysPastDue,
      submittedAt: now
    }).returning();

    // Create StudyGenius integration records
    const integrations = [];
    
    if (flashcardDeckIds.length > 0) {
      flashcardDeckIds.forEach(deckId => {
        integrations.push({
          classroomId: assignment.classroom.id,
          studentId: req.user.id,
          assignmentId: assignment.assignment.id,
          flashcardDeckId: deckId,
          integrationType: 'assignment_flashcards',
          connectionType: assignment.assignment.requireFlashcards ? 'required' : 'optional',
          completionStatus: 'completed'
        });
      });
    }

    if (noteIds.length > 0) {
      noteIds.forEach(noteId => {
        integrations.push({
          classroomId: assignment.classroom.id,
          studentId: req.user.id,
          assignmentId: assignment.assignment.id,
          noteId,
          integrationType: 'class_notes',
          connectionType: 'optional',
          completionStatus: 'completed'
        });
      });
    }

    if (studyPlanId) {
      integrations.push({
        classroomId: assignment.classroom.id,
        studentId: req.user.id,
        assignmentId: assignment.assignment.id,
        studyPlanId,
        integrationType: 'study_plan',
        connectionType: assignment.assignment.requireStudyPlan ? 'required' : 'optional',
        completionStatus: 'completed'
      });
    }

    if (integrations.length > 0) {
      await db.insert(classroomStudyIntegration).values(integrations);
    }

    // Update assignment submission count
    await db.update(assignments)
      .set({
        totalSubmissions: sql`${assignments.totalSubmissions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(assignments.id, assignment.assignment.id));

    // Auto-grade if enabled
    if (assignment.assignment.enableAutoGrading) {
      await autoGradeSubmission(submission.id, assignment.assignment);
    }

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission,
      integrations: integrations.length
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// CLASSROOM POSTS AND ANNOUNCEMENTS

// Get classroom posts
router.get('/classrooms/:classroomId/posts', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { type, pinned, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Verify access
    const hasAccess = await verifyClassroomAccess(req.user.id, classroomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this classroom' });
    }

    const [classroom] = await db.select()
      .from(classrooms)
      .where(eq(classrooms.classroomId, classroomId));

    let query = db.select({
      post: classroomPosts,
      author: {
        id: classroomMemberships.userId,
        role: classroomMemberships.role
      }
    })
    .from(classroomPosts)
    .leftJoin(classroomMemberships, and(
      eq(classroomMemberships.userId, classroomPosts.authorId),
      eq(classroomMemberships.classroomId, classroom.id)
    ))
    .where(eq(classroomPosts.classroomId, classroom.id));

    // Add filters
    let conditions = [eq(classroomPosts.classroomId, classroom.id)];

    if (type) {
      conditions.push(eq(classroomPosts.contentType, type));
    }

    if (pinned === 'true') {
      conditions.push(eq(classroomPosts.isPinned, true));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(desc(classroomPosts.isPinned), desc(classroomPosts.publishedAt));
    query = query.limit(parseInt(limit)).offset(offset);

    const posts = await query;

    res.json({
      posts: posts.map(({ post, author }) => ({
        ...post,
        authorRole: author?.role
      })),
      pagination: {
        currentPage: parseInt(page),
        hasNextPage: posts.length === parseInt(limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create classroom post
router.post('/classrooms/:classroomId/posts', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const {
      title,
      content,
      contentType = 'text',
      attachments = [],
      relatedFlashcards = [],
      relatedNotes = [],
      relatedQuizzes = [],
      audienceType = 'everyone',
      specificAudience = []
    } = req.body;

    // Verify posting access
    const hasAccess = await verifyClassroomAccess(req.user.id, classroomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to post in this classroom' });
    }

    const [classroom] = await db.select()
      .from(classrooms)
      .where(eq(classrooms.classroomId, classroomId));

    // Check if student posting is allowed
    const [userMembership] = await db.select()
      .from(classroomMemberships)
      .where(
        and(
          eq(classroomMemberships.classroomId, classroom.id),
          eq(classroomMemberships.userId, req.user.id)
        )
      );

    if (userMembership.role === 'student' && !classroom.allowStudentPosts) {
      return res.status(403).json({ error: 'Student posts are not allowed in this classroom' });
    }

    const [post] = await db.insert(classroomPosts).values({
      classroomId: classroom.id,
      authorId: req.user.id,
      title,
      content,
      contentType,
      attachments,
      relatedFlashcards,
      relatedNotes,
      relatedQuizzes,
      audienceType,
      specificAudience,
      isPinned: userMembership.role === 'teacher' && contentType === 'announcement'
    }).returning();

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// STUDYGENIUS INTEGRATION ENDPOINTS

// Get assignment's StudyGenius integration suggestions
router.get('/assignments/:assignmentId/study-suggestions', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const [assignment] = await db.select({
      assignment: assignments,
      classroom: classrooms
    })
    .from(assignments)
    .innerJoin(classrooms, eq(assignments.classroomId, classrooms.id))
    .where(eq(assignments.assignmentId, assignmentId));

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify access
    const hasAccess = await verifyClassroomAccess(req.user.id, assignment.classroom.classroomId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get AI-powered study suggestions based on assignment content
    const suggestions = await generateStudySuggestions(assignment.assignment, req.user.id);

    res.json({
      suggestions,
      assignmentTitle: assignment.assignment.title,
      subject: assignment.assignment.subject
    });
  } catch (error) {
    console.error('Error fetching study suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch study suggestions' });
  }
});

// Create flashcards from assignment content
router.post('/assignments/:assignmentId/create-flashcards', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { deckTitle, cardCount = 10, difficultyLevel = 'medium' } = req.body;

    const [assignment] = await db.select()
      .from(assignments)
      .where(eq(assignments.assignmentId, assignmentId));

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Extract content for flashcard generation
    const contentToProcess = `
      Title: ${assignment.title}
      Description: ${assignment.description}
      Instructions: ${assignment.instructions}
      Subject: ${assignment.subject}
      Topics: ${assignment.topics?.join(', ')}
    `;

    // Use AI to generate flashcards
    const prompt = `Create ${cardCount} flashcards from this assignment content for ${assignment.subject}:

${contentToProcess}

Generate flashcards that help students understand key concepts, terms, and requirements. 
Difficulty level: ${difficultyLevel}

Format as JSON array:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "hint": "Optional hint",
    "explanation": "Detailed explanation",
    "tags": ["relevant", "tags"]
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an educational content creator. Create effective flashcards that help students study and understand the material.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const generatedCards = JSON.parse(completion.choices[0].message.content);

    // Create flashcard deck
    const [deck] = await db.insert(flashcardDecks).values({
      title: deckTitle || `${assignment.title} - Study Cards`,
      description: `Flashcards generated from assignment: ${assignment.title}`,
      subject: assignment.subject,
      createdBy: req.user.id,
      totalCards: generatedCards.length,
      aiGenerated: true,
      aiModel: 'gpt-4'
    }).returning();

    // Insert flashcards
    const cardsToInsert = generatedCards.map((card, index) => ({
      deckId: deck.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      explanation: card.explanation,
      tags: card.tags || [],
      order: index + 1,
      aiGenerated: true,
      aiModel: 'gpt-4',
      dueDate: new Date()
    }));

    await db.insert(flashcards).values(cardsToInsert);

    // Create integration record
    await db.insert(classroomStudyIntegration).values({
      classroomId: assignment.classroomId,
      studentId: req.user.id,
      assignmentId: assignment.id,
      flashcardDeckId: deck.deckId,
      integrationType: 'assignment_flashcards',
      connectionType: 'optional',
      completionStatus: 'completed'
    });

    res.status(201).json({
      message: 'Flashcards created successfully',
      deck,
      cardCount: generatedCards.length
    });
  } catch (error) {
    console.error('Error creating flashcards from assignment:', error);
    res.status(500).json({ error: 'Failed to create flashcards' });
  }
});

// GRADEBOOK AND GRADING

// Get classroom gradebook
router.get('/classrooms/:classroomId/gradebook', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { studentId } = req.query;

    // Verify teacher access for full gradebook, or student access for own grades
    const [userMembership] = await db.select()
      .from(classroomMemberships)
      .innerJoin(classrooms, eq(classroomMemberships.classroomId, classrooms.id))
      .where(
        and(
          eq(classrooms.classroomId, classroomId),
          eq(classroomMemberships.userId, req.user.id)
        )
      );

    if (!userMembership) {
      return res.status(403).json({ error: 'Access denied to this classroom' });
    }

    const isTeacher = userMembership.role === 'teacher';
    const targetStudentId = studentId || req.user.id;

    // Students can only view their own grades
    if (!isTeacher && targetStudentId !== req.user.id) {
      return res.status(403).json({ error: 'Students can only view their own grades' });
    }

    // Get grades and assignments
    let gradesQuery = db.select({
      grade: grades,
      assignment: assignments,
      student: {
        id: classroomMemberships.userId,
        role: classroomMemberships.role
      }
    })
    .from(grades)
    .innerJoin(assignments, eq(grades.assignmentId, assignments.id))
    .innerJoin(classroomMemberships, and(
      eq(classroomMemberships.userId, grades.studentId),
      eq(classroomMemberships.classroomId, assignments.classroomId)
    ))
    .where(eq(assignments.classroomId, userMembership.classroomId));

    if (!isTeacher) {
      gradesQuery = gradesQuery.where(eq(grades.studentId, req.user.id));
    } else if (studentId) {
      gradesQuery = gradesQuery.where(eq(grades.studentId, parseInt(studentId)));
    }

    const gradeData = await gradesQuery.orderBy(desc(assignments.dueDate));

    // Calculate overall statistics
    const totalPoints = gradeData.reduce((sum, item) => sum + parseFloat(item.grade.pointsPossible || 0), 0);
    const earnedPoints = gradeData.reduce((sum, item) => sum + parseFloat(item.grade.pointsEarned || 0), 0);
    const overallPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    res.json({
      grades: gradeData,
      statistics: {
        totalAssignments: gradeData.length,
        totalPointsPossible: totalPoints,
        totalPointsEarned: earnedPoints,
        overallPercentage: overallPercentage.toFixed(2),
        letterGrade: calculateLetterGrade(overallPercentage)
      }
    });
  } catch (error) {
    console.error('Error fetching gradebook:', error);
    res.status(500).json({ error: 'Failed to fetch gradebook' });
  }
});

// Grade submission
router.post('/submissions/:submissionId/grade', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const {
      pointsEarned,
      feedback,
      rubricScores = {},
      bonusPoints = 0,
      latePenalty = 0,
      letterGrade
    } = req.body;

    // Get submission and verify teacher access
    const [submissionData] = await db.select({
      submission: submissions,
      assignment: assignments,
      classroom: classrooms
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(classrooms, eq(assignments.classroomId, classrooms.id))
    .where(eq(submissions.submissionId, submissionId));

    if (!submissionData) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify teacher access
    const hasTeacherAccess = await verifyClassroomAccess(
      req.user.id, 
      submissionData.classroom.classroomId, 
      ['teacher']
    );
    if (!hasTeacherAccess) {
      return res.status(403).json({ error: 'Only teachers can grade submissions' });
    }

    // Calculate final score
    const finalScore = parseFloat(pointsEarned) + parseFloat(bonusPoints) - parseFloat(latePenalty);
    const percentage = (finalScore / parseFloat(submissionData.assignment.totalPoints)) * 100;

    // Update submission with grade
    await db.update(submissions)
      .set({
        score: finalScore,
        maxScore: submissionData.assignment.totalPoints,
        percentageScore: percentage,
        letterGrade: letterGrade || calculateLetterGrade(percentage),
        rubricScores,
        bonusPoints: parseFloat(bonusPoints),
        penaltyPoints: parseFloat(latePenalty),
        teacherFeedback: feedback,
        status: 'graded',
        gradedAt: new Date()
      })
      .where(eq(submissions.id, submissionData.submission.id));

    // Create or update grade record
    const [existingGrade] = await db.select()
      .from(grades)
      .where(
        and(
          eq(grades.assignmentId, submissionData.assignment.id),
          eq(grades.studentId, submissionData.submission.studentId)
        )
      );

    if (existingGrade) {
      await db.update(grades)
        .set({
          pointsEarned: finalScore,
          pointsPossible: submissionData.assignment.totalPoints,
          percentage,
          letterGrade: letterGrade || calculateLetterGrade(percentage),
          extraCredit: parseFloat(bonusPoints),
          latePenalty: parseFloat(latePenalty),
          feedback,
          rubricScores,
          gradedBy: req.user.id,
          gradedAt: new Date(),
          publishedAt: new Date()
        })
        .where(eq(grades.id, existingGrade.id));
    } else {
      await db.insert(grades).values({
        assignmentId: submissionData.assignment.id,
        studentId: submissionData.submission.studentId,
        gradedBy: req.user.id,
        pointsEarned: finalScore,
        pointsPossible: submissionData.assignment.totalPoints,
        percentage,
        letterGrade: letterGrade || calculateLetterGrade(percentage),
        extraCredit: parseFloat(bonusPoints),
        latePenalty: parseFloat(latePenalty),
        feedback,
        rubricScores,
        publishedAt: new Date()
      });
    }

    res.json({
      message: 'Submission graded successfully',
      finalScore,
      percentage: percentage.toFixed(2),
      letterGrade: letterGrade || calculateLetterGrade(percentage)
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// HELPER FUNCTIONS

async function verifyClassroomAccess(userId, classroomId, allowedRoles = null) {
  try {
    const [membership] = await db.select()
      .from(classroomMemberships)
      .innerJoin(classrooms, eq(classroomMemberships.classroomId, classrooms.id))
      .where(
        and(
          eq(classrooms.classroomId, classroomId),
          eq(classroomMemberships.userId, userId),
          eq(classroomMemberships.status, 'active')
        )
      );

    if (!membership) return false;

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      return false;
    }

    return membership;
  } catch (error) {
    console.error('Error verifying classroom access:', error);
    return false;
  }
}

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calculateLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

async function generateStudySuggestions(assignment, userId) {
  try {
    // Get user's existing study materials
    const userDecks = await db.select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.createdBy, userId))
      .limit(5);

    const userNotes = await db.select()
      .from(enhancedNotes)
      .where(eq(enhancedNotes.ownerId, userId))
      .limit(5);

    // Find relevant preloaded content
    const relevantContent = await db.select()
      .from(preloadedFlashcardCollections)
      .where(
        and(
          eq(preloadedFlashcardCollections.subject, assignment.subject),
          eq(preloadedFlashcardCollections.isActive, true)
        )
      )
      .limit(3);

    return {
      createFlashcards: {
        suggested: true,
        reason: 'Create flashcards to memorize key concepts',
        estimatedTime: '15 minutes'
      },
      reviewNotes: {
        suggested: userNotes.length > 0,
        reason: 'Review your existing notes on this topic',
        existingNotes: userNotes.length
      },
      studyPlan: {
        suggested: true,
        reason: 'Create a structured study plan for this assignment',
        estimatedTime: '5 minutes'
      },
      preloadedContent: relevantContent.map(content => ({
        id: content.collectionId,
        title: content.title,
        cardCount: content.cardCount,
        difficulty: content.difficulty,
        reason: 'Relevant study material from our library'
      }))
    };
  } catch (error) {
    console.error('Error generating study suggestions:', error);
    return {
      createFlashcards: { suggested: true, reason: 'Create flashcards to help study' },
      studyPlan: { suggested: true, reason: 'Create a study plan' },
      preloadedContent: []
    };
  }
}

async function autoGradeSubmission(submissionId, assignment) {
  try {
    // This is a simplified auto-grading implementation
    // In a real system, this would use more sophisticated AI analysis
    
    const [submission] = await db.select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission || !assignment.aiGradingPrompt) return;

    // Use AI to analyze the submission
    const prompt = `${assignment.aiGradingPrompt}

Submission Content:
${submission.textContent}

Please provide a score out of ${assignment.totalPoints} points and brief feedback.
Respond in JSON format:
{
  "score": number,
  "confidence": number (0-1),
  "feedback": "string"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an educational AI grader. Provide fair and constructive feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Update submission with AI grade
    await db.update(submissions)
      .set({
        aiGradeScore: result.score,
        aiConfidence: result.confidence,
        aiGeneratedFeedback: result.feedback
      })
      .where(eq(submissions.id, submissionId));

  } catch (error) {
    console.error('Error auto-grading submission:', error);
  }
}

export default router;