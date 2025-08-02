import express from 'express';
import { eq, desc, asc, and, or, like, gte, lte, inArray, sql, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  skillCategories,
  skills,
  skillAssessments,
  userSkillAssessments,
  userSkillProfiles,
  mentorProfiles,
  mentorshipSessions,
  expertNetworkPosts,
  careerPaths,
  userCareerGoals,
  professionalProfiles,
  realWorldProjects,
  projectApplications,
  projectTeams,
  industryTrends,
  salaryBenchmarks,
  jobMarketAnalytics,
  learningPaths,
  userLearningProgress
} from '../db/professional-features-schema.js';
import { users } from '../db/schema.js';

const router = express.Router();

// Skills Assessment & Certification Endpoints

// Get all skill categories
router.get('/skills/categories', async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(skillCategories)
      .where(eq(skillCategories.isActive, true))
      .orderBy(asc(skillCategories.sortOrder), asc(skillCategories.name));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill categories'
    });
  }
});

// Get skills by category
router.get('/skills/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { difficulty, marketDemand } = req.query;

    let query = db
      .select()
      .from(skills)
      .where(and(
        eq(skills.categoryId, categoryId),
        eq(skills.isActive, true)
      ));

    if (difficulty) {
      query = query.where(eq(skills.difficulty, difficulty));
    }

    if (marketDemand) {
      query = query.where(gte(skills.marketDemand, parseInt(marketDemand)));
    }

    const skillsData = await query.orderBy(desc(skills.marketDemand), asc(skills.name));

    res.json({
      success: true,
      data: skillsData
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skills'
    });
  }
});

// Get skill assessments for a skill
router.get('/skills/:skillId/assessments', async (req, res) => {
  try {
    const { skillId } = req.params;

    const assessments = await db
      .select()
      .from(skillAssessments)
      .where(and(
        eq(skillAssessments.skillId, skillId),
        eq(skillAssessments.isActive, true)
      ))
      .orderBy(asc(skillAssessments.difficulty));

    res.json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessments'
    });
  }
});

// Take a skill assessment
router.post('/assessments/:assessmentId/take', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    // Get assessment details
    const assessment = await db
      .select()
      .from(skillAssessments)
      .where(eq(skillAssessments.id, assessmentId))
      .limit(1);

    if (!assessment.length) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Calculate score (simplified scoring logic)
    const questions = assessment[0].questions || [];
    let score = 0;
    let maxScore = questions.length;

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (question.type === 'multiple_choice' && userAnswer === question.correctAnswer) {
        score++;
      } else if (question.type === 'true_false' && userAnswer === question.correctAnswer) {
        score++;
      }
    });

    const percentageScore = Math.round((score / maxScore) * 100);
    const passed = percentageScore >= assessment[0].passingScore;

    // Save assessment result
    const result = await db
      .insert(userSkillAssessments)
      .values({
        userId,
        assessmentId,
        score: percentageScore,
        maxScore: 100,
        answers: JSON.stringify(answers),
        status: passed ? 'completed' : 'failed',
        certificateIssued: passed && assessment[0].certificationType,
        completedAt: new Date()
      })
      .returning();

    res.json({
      success: true,
      data: {
        result: result[0],
        passed,
        score: percentageScore,
        feedback: passed ? 'Congratulations! You passed the assessment.' : 'Please review the material and try again.'
      }
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment'
    });
  }
});

// Get user skill profile
router.get('/profile/skills', async (req, res) => {
  try {
    const userId = req.user.id;

    const userSkills = await db
      .select({
        skill: skills,
        profile: userSkillProfiles,
        category: skillCategories
      })
      .from(userSkillProfiles)
      .leftJoin(skills, eq(userSkillProfiles.skillId, skills.id))
      .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
      .where(eq(userSkillProfiles.userId, userId))
      .orderBy(desc(userSkillProfiles.proficiencyLevel));

    res.json({
      success: true,
      data: userSkills
    });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user skills'
    });
  }
});

// Mentorship & Expert Network Endpoints

// Get mentor profiles
router.get('/mentors', async (req, res) => {
  try {
    const { industry, expertise, rating, availability } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        mentor: mentorProfiles,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          profilePicture: users.profilePicture
        }
      })
      .from(mentorProfiles)
      .leftJoin(users, eq(mentorProfiles.userId, users.id))
      .where(and(
        eq(mentorProfiles.isActive, true),
        eq(mentorProfiles.isVerified, true)
      ));

    if (industry) {
      query = query.where(eq(mentorProfiles.industry, industry));
    }

    if (rating) {
      query = query.where(gte(mentorProfiles.rating, parseFloat(rating)));
    }

    const mentors = await query
      .orderBy(desc(mentorProfiles.rating), desc(mentorProfiles.totalSessions))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(mentorProfiles)
      .where(and(
        eq(mentorProfiles.isActive, true),
        eq(mentorProfiles.isVerified, true)
      ));

    res.json({
      success: true,
      data: mentors,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentors'
    });
  }
});

// Book mentorship session
router.post('/mentorship/book', async (req, res) => {
  try {
    const menteeId = req.user.id;
    const {
      mentorId,
      title,
      description,
      scheduledAt,
      duration = 60,
      sessionType = 'one_on_one'
    } = req.body;

    // Check if mentor exists and is available
    const mentor = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.id, mentorId))
      .limit(1);

    if (!mentor.length) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Create mentorship session
    const session = await db
      .insert(mentorshipSessions)
      .values({
        mentorId,
        menteeId,
        title,
        description,
        sessionType,
        duration,
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled',
        cost: mentor[0].hourlyRate * (duration / 60)
      })
      .returning();

    res.json({
      success: true,
      data: session[0],
      message: 'Mentorship session booked successfully!'
    });
  } catch (error) {
    console.error('Error booking session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book mentorship session'
    });
  }
});

// Get user's mentorship sessions
router.get('/mentorship/sessions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    let query = db
      .select({
        session: mentorshipSessions,
        mentor: mentorProfiles,
        mentorUser: {
          id: users.id,
          fullName: users.fullName,
          profilePicture: users.profilePicture
        }
      })
      .from(mentorshipSessions)
      .leftJoin(mentorProfiles, eq(mentorshipSessions.mentorId, mentorProfiles.id))
      .leftJoin(users, eq(mentorProfiles.userId, users.id))
      .where(or(
        eq(mentorshipSessions.menteeId, userId),
        eq(mentorProfiles.userId, userId)
      ));

    if (status) {
      query = query.where(eq(mentorshipSessions.status, status));
    }

    const sessions = await query.orderBy(desc(mentorshipSessions.scheduledAt));

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship sessions'
    });
  }
});

// Career Development Endpoints

// Get career paths
router.get('/career-paths', async (req, res) => {
  try {
    const { industry, category, marketDemand } = req.query;

    let query = db
      .select()
      .from(careerPaths)
      .where(eq(careerPaths.isActive, true));

    if (industry) {
      query = query.where(eq(careerPaths.industry, industry));
    }

    if (category) {
      query = query.where(eq(careerPaths.category, category));
    }

    if (marketDemand) {
      query = query.where(gte(careerPaths.marketDemand, parseInt(marketDemand)));
    }

    const paths = await query.orderBy(desc(careerPaths.marketDemand));

    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    console.error('Error fetching career paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career paths'
    });
  }
});

// Create career goal
router.post('/career-goals', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      careerPathId,
      currentPosition,
      targetPosition,
      targetTimeframe,
      currentSalary,
      targetSalary,
      motivation,
      priority = 'medium'
    } = req.body;

    const goal = await db
      .insert(userCareerGoals)
      .values({
        userId,
        careerPathId,
        currentPosition,
        targetPosition,
        targetTimeframe,
        currentSalary,
        targetSalary,
        motivation,
        priority,
        status: 'active'
      })
      .returning();

    res.json({
      success: true,
      data: goal[0],
      message: 'Career goal created successfully!'
    });
  } catch (error) {
    console.error('Error creating career goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create career goal'
    });
  }
});

// Get user's career goals
router.get('/career-goals', async (req, res) => {
  try {
    const userId = req.user.id;

    const goals = await db
      .select({
        goal: userCareerGoals,
        careerPath: careerPaths
      })
      .from(userCareerGoals)
      .leftJoin(careerPaths, eq(userCareerGoals.careerPathId, careerPaths.id))
      .where(eq(userCareerGoals.userId, userId))
      .orderBy(desc(userCareerGoals.priority), desc(userCareerGoals.createdAt));

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching career goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career goals'
    });
  }
});

// Professional Profile Endpoints

// Get/Create professional profile
router.get('/profile/professional', async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      // Create default profile
      profile = await db
        .insert(professionalProfiles)
        .values({
          userId,
          profileCompleteness: 10
        })
        .returning();
    }

    res.json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    console.error('Error fetching professional profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professional profile'
    });
  }
});

// Update professional profile
router.put('/profile/professional', async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Calculate completeness score
    const fields = ['professionalSummary', 'currentRole', 'currentCompany', 'industry', 'experienceLevel'];
    let completeness = 10; // base score
    fields.forEach(field => {
      if (updateData[field]) completeness += 18; // 90% / 5 fields
    });

    const updatedProfile = await db
      .update(professionalProfiles)
      .set({
        ...updateData,
        profileCompleteness: Math.min(completeness, 100),
        lastUpdated: new Date()
      })
      .where(eq(professionalProfiles.userId, userId))
      .returning();

    res.json({
      success: true,
      data: updatedProfile[0],
      message: 'Professional profile updated successfully!'
    });
  } catch (error) {
    console.error('Error updating professional profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update professional profile'
    });
  }
});

// Project-Based Learning Endpoints

// Get real-world projects
router.get('/projects', async (req, res) => {
  try {
    const { projectType, industry, difficulty, compensation } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        project: realWorldProjects,
        mentor: mentorProfiles,
        mentorUser: {
          fullName: users.fullName,
          profilePicture: users.profilePicture
        }
      })
      .from(realWorldProjects)
      .leftJoin(mentorProfiles, eq(realWorldProjects.mentorId, mentorProfiles.id))
      .leftJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(realWorldProjects.status, 'open'));

    if (projectType) {
      query = query.where(eq(realWorldProjects.projectType, projectType));
    }

    if (industry) {
      query = query.where(eq(realWorldProjects.industry, industry));
    }

    if (difficulty) {
      query = query.where(eq(realWorldProjects.difficulty, difficulty));
    }

    const projects = await query
      .orderBy(desc(realWorldProjects.featured), desc(realWorldProjects.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// Apply to project
router.post('/projects/:projectId/apply', async (req, res) => {
  try {
    const { projectId } = req.params;
    const applicantId = req.user.id;
    const {
      coverLetter,
      proposedApproach,
      estimatedTimeCommitment,
      relevantExperience,
      portfolioLinks,
      expectedLearning
    } = req.body;

    // Check if user already applied
    const existingApplication = await db
      .select()
      .from(projectApplications)
      .where(and(
        eq(projectApplications.projectId, projectId),
        eq(projectApplications.applicantId, applicantId)
      ))
      .limit(1);

    if (existingApplication.length) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project'
      });
    }

    const application = await db
      .insert(projectApplications)
      .values({
        projectId,
        applicantId,
        coverLetter,
        proposedApproach,
        estimatedTimeCommitment,
        relevantExperience,
        portfolioLinks: JSON.stringify(portfolioLinks),
        expectedLearning,
        status: 'pending'
      })
      .returning();

    // Update application count
    await db
      .update(realWorldProjects)
      .set({
        applicationCount: sql`${realWorldProjects.applicationCount} + 1`
      })
      .where(eq(realWorldProjects.id, projectId));

    res.json({
      success: true,
      data: application[0],
      message: 'Application submitted successfully!'
    });
  } catch (error) {
    console.error('Error applying to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// Market Intelligence Endpoints

// Get salary benchmarks
router.get('/market/salary-benchmarks', async (req, res) => {
  try {
    const { jobTitle, industry, location, experienceLevel } = req.query;

    let query = db
      .select()
      .from(salaryBenchmarks);

    const conditions = [];

    if (jobTitle) {
      conditions.push(like(salaryBenchmarks.jobTitle, `%${jobTitle}%`));
    }

    if (industry) {
      conditions.push(eq(salaryBenchmarks.industry, industry));
    }

    if (location) {
      conditions.push(like(salaryBenchmarks.location, `%${location}%`));
    }

    if (experienceLevel) {
      conditions.push(eq(salaryBenchmarks.experienceLevel, experienceLevel));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const benchmarks = await query
      .orderBy(desc(salaryBenchmarks.lastUpdated))
      .limit(50);

    res.json({
      success: true,
      data: benchmarks
    });
  } catch (error) {
    console.error('Error fetching salary benchmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary benchmarks'
    });
  }
});

// Get industry trends
router.get('/market/trends', async (req, res) => {
  try {
    const { industry, trendType, region = 'global' } = req.query;

    let query = db
      .select()
      .from(industryTrends)
      .where(eq(industryTrends.region, region));

    if (industry) {
      query = query.where(eq(industryTrends.industry, industry));
    }

    if (trendType) {
      query = query.where(eq(industryTrends.trendType, trendType));
    }

    const trends = await query
      .orderBy(desc(industryTrends.recordDate))
      .limit(100);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching industry trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch industry trends'
    });
  }
});

// Get job market analytics
router.get('/market/job-analytics', async (req, res) => {
  try {
    const { region, industry, jobFunction } = req.query;

    let query = db
      .select()
      .from(jobMarketAnalytics);

    const conditions = [];

    if (region) {
      conditions.push(eq(jobMarketAnalytics.region, region));
    }

    if (industry) {
      conditions.push(eq(jobMarketAnalytics.industry, industry));
    }

    if (jobFunction) {
      conditions.push(eq(jobMarketAnalytics.jobFunction, jobFunction));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const analytics = await query
      .orderBy(desc(jobMarketAnalytics.analysisDate))
      .limit(20);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching job market analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job market analytics'
    });
  }
});

// Learning Path Endpoints

// Get learning paths
router.get('/learning-paths', async (req, res) => {
  try {
    const { category, targetAudience, difficulty } = req.query;

    let query = db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.isActive, true));

    if (category) {
      query = query.where(eq(learningPaths.category, category));
    }

    if (targetAudience) {
      query = query.where(eq(learningPaths.targetAudience, targetAudience));
    }

    if (difficulty) {
      query = query.where(eq(learningPaths.difficulty, difficulty));
    }

    const paths = await query
      .orderBy(desc(learningPaths.averageRating), desc(learningPaths.enrollmentCount));

    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning paths'
    });
  }
});

// Enroll in learning path
router.post('/learning-paths/:pathId/enroll', async (req, res) => {
  try {
    const { pathId } = req.params;
    const userId = req.user.id;

    // Check if already enrolled
    const existing = await db
      .select()
      .from(userLearningProgress)
      .where(and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.learningPathId, pathId)
      ))
      .limit(1);

    if (existing.length) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this learning path'
      });
    }

    const enrollment = await db
      .insert(userLearningProgress)
      .values({
        userId,
        learningPathId: pathId,
        progress: 0,
        isActive: true
      })
      .returning();

    // Update enrollment count
    await db
      .update(learningPaths)
      .set({
        enrollmentCount: sql`${learningPaths.enrollmentCount} + 1`
      })
      .where(eq(learningPaths.id, pathId));

    res.json({
      success: true,
      data: enrollment[0],
      message: 'Successfully enrolled in learning path!'
    });
  } catch (error) {
    console.error('Error enrolling in learning path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in learning path'
    });
  }
});

// Get user's learning progress
router.get('/learning-progress', async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await db
      .select({
        progress: userLearningProgress,
        learningPath: learningPaths
      })
      .from(userLearningProgress)
      .leftJoin(learningPaths, eq(userLearningProgress.learningPathId, learningPaths.id))
      .where(and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.isActive, true)
      ))
      .orderBy(desc(userLearningProgress.lastAccessedAt));

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching learning progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning progress'
    });
  }
});

export default router;