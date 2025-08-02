import { pgTable, text, integer, timestamp, boolean, decimal, jsonb, uuid, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Skills Assessment & Certification System
export const skillCategories = pgTable('skill_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  industry: varchar('industry', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => skillCategories.id),
  difficulty: varchar('difficulty', { length: 20 }).default('beginner'), // beginner, intermediate, advanced, expert
  marketDemand: integer('market_demand').default(1), // 1-10 scale
  averageSalaryImpact: decimal('average_salary_impact', { precision: 10, scale: 2 }),
  timeToLearn: integer('time_to_learn'), // in hours
  prerequisites: jsonb('prerequisites'), // array of skill IDs
  relatedSkills: jsonb('related_skills'), // array of skill IDs
  certificationAvailable: boolean('certification_available').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('skills_name_idx').on(table.name),
  categoryIdx: index('skills_category_idx').on(table.categoryId),
  demandIdx: index('skills_demand_idx').on(table.marketDemand)
}));

export const skillAssessments = pgTable('skill_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  skillId: uuid('skill_id').references(() => skills.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).default('quiz'), // quiz, practical, project, interview
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  duration: integer('duration'), // in minutes
  passingScore: integer('passing_score').default(70),
  questions: jsonb('questions'), // array of question objects
  practicalInstructions: text('practical_instructions'),
  evaluationCriteria: jsonb('evaluation_criteria'),
  certificationType: varchar('certification_type', { length: 50 }),
  industryRecognition: varchar('industry_recognition', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const userSkillAssessments = pgTable('user_skill_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  assessmentId: uuid('assessment_id').references(() => skillAssessments.id),
  score: integer('score'),
  maxScore: integer('max_score'),
  timeSpent: integer('time_spent'), // in minutes
  answers: jsonb('answers'),
  feedback: text('feedback'),
  status: varchar('status', { length: 20 }).default('in_progress'), // in_progress, completed, failed, certified
  certificateIssued: boolean('certificate_issued').default(false),
  certificateUrl: text('certificate_url'),
  validUntil: timestamp('valid_until'),
  retakeCount: integer('retake_count').default(0),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('user_assessments_user_idx').on(table.userId),
  statusIdx: index('user_assessments_status_idx').on(table.status),
  uniqueUserAssessment: uniqueIndex('unique_user_assessment').on(table.userId, table.assessmentId)
}));

export const userSkillProfiles = pgTable('user_skill_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  skillId: uuid('skill_id').references(() => skills.id),
  proficiencyLevel: integer('proficiency_level').default(1), // 1-10 scale
  assessmentScore: integer('assessment_score'),
  experienceYears: decimal('experience_years', { precision: 3, scale: 1 }),
  lastPracticed: timestamp('last_practiced'),
  improvementGoal: integer('improvement_goal'), // target proficiency level
  learningPath: jsonb('learning_path'), // suggested courses, projects
  endorsements: integer('endorsements').default(0),
  projectsCompleted: integer('projects_completed').default(0),
  certificationsEarned: integer('certifications_earned').default(0),
  marketValue: decimal('market_value', { precision: 10, scale: 2 }),
  isPublic: boolean('is_public').default(true),
  isPrimarySkill: boolean('is_primary_skill').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('user_skills_user_idx').on(table.userId),
  skillIdx: index('user_skills_skill_idx').on(table.skillId),
  proficiencyIdx: index('user_skills_proficiency_idx').on(table.proficiencyLevel),
  uniqueUserSkill: uniqueIndex('unique_user_skill').on(table.userId, table.skillId)
}));

// Mentorship & Expert Network
export const mentorProfiles = pgTable('mentor_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 100 }),
  company: varchar('company', { length: 100 }),
  industry: varchar('industry', { length: 50 }),
  experience: integer('experience'), // years
  expertise: jsonb('expertise'), // array of skill IDs
  bio: text('bio'),
  achievements: jsonb('achievements'),
  mentoringStyle: varchar('mentoring_style', { length: 50 }),
  availability: jsonb('availability'), // schedule object
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  freeSessionOffered: boolean('free_session_offered').default(false),
  maxMentees: integer('max_mentees').default(5),
  currentMentees: integer('current_mentees').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default(5.0),
  totalSessions: integer('total_sessions').default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default(0),
  languages: jsonb('languages'), // array of language codes
  timezone: varchar('timezone', { length: 50 }),
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  verificationDocument: text('verification_document'),
  linkedinProfile: text('linkedin_profile'),
  portfolioUrl: text('portfolio_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('mentor_profiles_user_idx').on(table.userId),
  industryIdx: index('mentor_profiles_industry_idx').on(table.industry),
  ratingIdx: index('mentor_profiles_rating_idx').on(table.rating),
  activeIdx: index('mentor_profiles_active_idx').on(table.isActive)
}));

export const mentorshipSessions = pgTable('mentorship_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').references(() => mentorProfiles.id),
  menteeId: uuid('mentee_id').references(() => users.id),
  title: varchar('title', { length: 200 }),
  description: text('description'),
  sessionType: varchar('session_type', { length: 30 }).default('one_on_one'), // one_on_one, group, workshop
  duration: integer('duration').default(60), // minutes
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, in_progress, completed, cancelled, no_show
  meetingLink: text('meeting_link'),
  agenda: jsonb('agenda'),
  notes: text('notes'),
  actionItems: jsonb('action_items'),
  resources: jsonb('resources'), // links, documents
  menteeRating: integer('mentee_rating'), // 1-5
  mentorRating: integer('mentor_rating'), // 1-5
  meneeFeedback: text('mentee_feedback'),
  mentorFeedback: text('mentor_feedback'),
  cost: decimal('cost', { precision: 8, scale: 2 }),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  paymentId: text('payment_id'),
  followUpScheduled: boolean('follow_up_scheduled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  mentorIdx: index('sessions_mentor_idx').on(table.mentorId),
  menteeIdx: index('sessions_mentee_idx').on(table.menteeId),
  statusIdx: index('sessions_status_idx').on(table.status),
  scheduledIdx: index('sessions_scheduled_idx').on(table.scheduledAt)
}));

export const expertNetworkPosts = pgTable('expert_network_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 20 }).default('article'), // article, tip, case_study, question
  industry: varchar('industry', { length: 50 }),
  skillTags: jsonb('skill_tags'), // array of skill IDs
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  readTime: integer('read_time'), // estimated minutes
  attachments: jsonb('attachments'), // files, links
  isExpert: boolean('is_expert').default(false),
  isPremium: boolean('is_premium').default(false),
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  bookmarkCount: integer('bookmark_count').default(0),
  status: varchar('status', { length: 20 }).default('published'), // draft, published, archived
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  authorIdx: index('expert_posts_author_idx').on(table.authorId),
  industryIdx: index('expert_posts_industry_idx').on(table.industry),
  statusIdx: index('expert_posts_status_idx').on(table.status),
  publishedIdx: index('expert_posts_published_idx').on(table.publishedAt)
}));

// Career Development Engine
export const careerPaths = pgTable('career_paths', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  industry: varchar('industry', { length: 50 }),
  category: varchar('category', { length: 50 }),
  entryLevel: varchar('entry_level', { length: 50 }),
  seniorLevel: varchar('senior_level', { length: 50 }),
  averageTimeframe: integer('average_timeframe'), // months
  requiredSkills: jsonb('required_skills'), // array of skill IDs with proficiency levels
  optionalSkills: jsonb('optional_skills'),
  typicalSalaryRange: jsonb('typical_salary_range'), // {min, max, currency}
  growthProjection: decimal('growth_projection', { precision: 5, scale: 2 }), // percentage
  marketDemand: integer('market_demand').default(5), // 1-10 scale
  workLifeBalance: integer('work_life_balance').default(5), // 1-10 scale
  remoteWorkPossible: boolean('remote_work_possible').default(true),
  educationRequirements: jsonb('education_requirements'),
  certificationRequirements: jsonb('certification_requirements'),
  milestones: jsonb('milestones'), // career progression steps
  commonTransitions: jsonb('common_transitions'), // other career paths
  dayInTheLife: text('day_in_the_life'),
  challenges: jsonb('challenges'),
  rewards: jsonb('rewards'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  industryIdx: index('career_paths_industry_idx').on(table.industry),
  categoryIdx: index('career_paths_category_idx').on(table.category),
  demandIdx: index('career_paths_demand_idx').on(table.marketDemand)
}));

export const userCareerGoals = pgTable('user_career_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  careerPathId: uuid('career_path_id').references(() => careerPaths.id),
  currentPosition: varchar('current_position', { length: 100 }),
  targetPosition: varchar('target_position', { length: 100 }),
  targetTimeframe: integer('target_timeframe'), // months
  currentSalary: decimal('current_salary', { precision: 12, scale: 2 }),
  targetSalary: decimal('target_salary', { precision: 12, scale: 2 }),
  motivation: text('motivation'),
  obstacles: jsonb('obstacles'),
  supportNeeded: jsonb('support_needed'),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, critical
  status: varchar('status', { length: 20 }).default('active'), // active, paused, achieved, abandoned
  progress: integer('progress').default(0), // 0-100 percentage
  skillGaps: jsonb('skill_gaps'), // identified missing skills
  actionPlan: jsonb('action_plan'), // steps to achieve goal
  milestoneProgress: jsonb('milestone_progress'),
  nextReviewDate: timestamp('next_review_date'),
  achievedAt: timestamp('achieved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('career_goals_user_idx').on(table.userId),
  statusIdx: index('career_goals_status_idx').on(table.status),
  priorityIdx: index('career_goals_priority_idx').on(table.priority)
}));

export const professionalProfiles = pgTable('professional_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  professionalSummary: text('professional_summary'),
  currentRole: varchar('current_role', { length: 100 }),
  currentCompany: varchar('current_company', { length: 100 }),
  industry: varchar('industry', { length: 50 }),
  experienceLevel: varchar('experience_level', { length: 20 }), // entry, junior, mid, senior, executive
  totalExperience: decimal('total_experience', { precision: 4, scale: 1 }), // years
  currentSalary: decimal('current_salary', { precision: 12, scale: 2 }),
  salaryExpectation: decimal('salary_expectation', { precision: 12, scale: 2 }),
  workAuthorization: varchar('work_authorization', { length: 50 }),
  preferredWorkType: varchar('preferred_work_type', { length: 20 }), // remote, hybrid, onsite
  willingToRelocate: boolean('willing_to_relocate').default(false),
  preferredLocations: jsonb('preferred_locations'),
  availabilityDate: timestamp('availability_date'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  githubUrl: text('github_url'),
  personalWebsite: text('personal_website'),
  resume: text('resume'), // file path or content
  coverLetter: text('cover_letter'),
  achievements: jsonb('achievements'),
  publications: jsonb('publications'),
  patents: jsonb('patents'),
  languages: jsonb('languages'), // array with proficiency levels
  isOpenToOpportunities: boolean('is_open_to_opportunities').default(false),
  isPublic: boolean('is_public').default(false),
  profileCompleteness: integer('profile_completeness').default(0), // 0-100 percentage
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: uniqueIndex('professional_profiles_user_idx').on(table.userId),
  industryIdx: index('professional_profiles_industry_idx').on(table.industry),
  experienceIdx: index('professional_profiles_experience_idx').on(table.experienceLevel),
  opportunitiesIdx: index('professional_profiles_opportunities_idx').on(table.isOpenToOpportunities)
}));

// Project-Based Learning Hub
export const realWorldProjects = pgTable('real_world_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 300 }),
  projectType: varchar('project_type', { length: 30 }).default('practice'), // practice, freelance, startup, corporate, open_source
  industry: varchar('industry', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  estimatedDuration: integer('estimated_duration'), // hours
  maxParticipants: integer('max_participants').default(1),
  currentParticipants: integer('current_participants').default(0),
  requiredSkills: jsonb('required_skills'), // array of skill IDs with levels
  learningObjectives: jsonb('learning_objectives'),
  deliverables: jsonb('deliverables'),
  milestones: jsonb('milestones'),
  resources: jsonb('resources'), // documents, links, tools
  mentorId: uuid('mentor_id').references(() => mentorProfiles.id),
  clientId: uuid('client_id').references(() => users.id), // for real client projects
  compensation: decimal('compensation', { precision: 10, scale: 2 }),
  compensationType: varchar('compensation_type', { length: 20 }).default('none'), // none, fixed, hourly, revenue_share, equity
  deadline: timestamp('deadline'),
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, completed, cancelled
  applicationDeadline: timestamp('application_deadline'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isSponsored: boolean('is_sponsored').default(false),
  sponsorCompany: varchar('sponsor_company', { length: 100 }),
  featured: boolean('featured').default(false),
  viewCount: integer('view_count').default(0),
  applicationCount: integer('application_count').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default(0),
  reviewCount: integer('review_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  typeIdx: index('projects_type_idx').on(table.projectType),
  industryIdx: index('projects_industry_idx').on(table.industry),
  statusIdx: index('projects_status_idx').on(table.status),
  difficultyIdx: index('projects_difficulty_idx').on(table.difficulty),
  deadlineIdx: index('projects_deadline_idx').on(table.deadline)
}));

export const projectApplications = pgTable('project_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => realWorldProjects.id),
  applicantId: uuid('applicant_id').references(() => users.id),
  coverLetter: text('cover_letter'),
  proposedApproach: text('proposed_approach'),
  estimatedTimeCommitment: integer('estimated_time_commitment'), // hours per week
  relevantExperience: text('relevant_experience'),
  portfolioLinks: jsonb('portfolio_links'),
  expectedLearning: text('expected_learning'),
  questions: text('questions'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected, withdrawn
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  projectIdx: index('applications_project_idx').on(table.projectId),
  applicantIdx: index('applications_applicant_idx').on(table.applicantId),
  statusIdx: index('applications_status_idx').on(table.status),
  uniqueApplication: uniqueIndex('unique_project_application').on(table.projectId, table.applicantId)
}));

export const projectTeams = pgTable('project_teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => realWorldProjects.id),
  memberId: uuid('member_id').references(() => users.id),
  role: varchar('role', { length: 50 }).default('contributor'), // lead, contributor, reviewer, mentor
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  contributionHours: integer('contribution_hours').default(0),
  performance: decimal('performance', { precision: 3, scale: 2 }).default(0), // 0-10 scale
  feedback: text('feedback'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  projectIdx: index('teams_project_idx').on(table.projectId),
  memberIdx: index('teams_member_idx').on(table.memberId),
  roleIdx: index('teams_role_idx').on(table.role),
  uniqueTeamMember: uniqueIndex('unique_team_member').on(table.projectId, table.memberId)
}));

// Market Intelligence & Analytics
export const industryTrends = pgTable('industry_trends', {
  id: uuid('id').defaultRandom().primaryKey(),
  industry: varchar('industry', { length: 50 }).notNull(),
  trendType: varchar('trend_type', { length: 30 }), // skill_demand, salary, job_growth, technology
  metric: varchar('metric', { length: 50 }).notNull(),
  value: decimal('value', { precision: 15, scale: 4 }),
  change: decimal('change', { precision: 10, scale: 4 }), // percentage change
  period: varchar('period', { length: 20 }), // monthly, quarterly, yearly
  dataSource: varchar('data_source', { length: 100 }),
  region: varchar('region', { length: 50 }).default('global'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default(0.95), // confidence level
  forecastedValue: decimal('forecasted_value', { precision: 15, scale: 4 }),
  forecastPeriod: varchar('forecast_period', { length: 20 }),
  insights: text('insights'),
  implications: text('implications'),
  recommendations: jsonb('recommendations'),
  relatedSkills: jsonb('related_skills'), // skill IDs
  recordDate: timestamp('record_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  industryIdx: index('trends_industry_idx').on(table.industry),
  metricIdx: index('trends_metric_idx').on(table.metric),
  dateIdx: index('trends_date_idx').on(table.recordDate),
  regionIdx: index('trends_region_idx').on(table.region)
}));

export const salaryBenchmarks = pgTable('salary_benchmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobTitle: varchar('job_title', { length: 100 }).notNull(),
  industry: varchar('industry', { length: 50 }),
  experienceLevel: varchar('experience_level', { length: 20 }),
  location: varchar('location', { length: 100 }),
  companySize: varchar('company_size', { length: 20 }), // startup, small, medium, large, enterprise
  salaryMin: decimal('salary_min', { precision: 12, scale: 2 }),
  salaryMax: decimal('salary_max', { precision: 12, scale: 2 }),
  salaryMedian: decimal('salary_median', { precision: 12, scale: 2 }),
  salaryAverage: decimal('salary_average', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  bonusAverage: decimal('bonus_average', { precision: 12, scale: 2 }),
  stockOptionsAverage: decimal('stock_options_average', { precision: 12, scale: 2 }),
  benefitsValue: decimal('benefits_value', { precision: 12, scale: 2 }),
  totalCompensationAverage: decimal('total_compensation_average', { precision: 12, scale: 2 }),
  sampleSize: integer('sample_size'),
  dataQuality: varchar('data_quality', { length: 20 }).default('good'), // poor, fair, good, excellent
  skillsPremium: jsonb('skills_premium'), // skills that add salary premium
  remoteWorkImpact: decimal('remote_work_impact', { precision: 5, scale: 2 }), // percentage
  growthProjection: decimal('growth_projection', { precision: 5, scale: 2 }),
  demandIndex: decimal('demand_index', { precision: 5, scale: 2 }), // 0-100
  competitionIndex: decimal('competition_index', { precision: 5, scale: 2 }), // 0-100
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  titleIdx: index('salary_title_idx').on(table.jobTitle),
  industryIdx: index('salary_industry_idx').on(table.industry),
  locationIdx: index('salary_location_idx').on(table.location),
  experienceIdx: index('salary_experience_idx').on(table.experienceLevel)
}));

export const jobMarketAnalytics = pgTable('job_market_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  region: varchar('region', { length: 100 }).notNull(),
  industry: varchar('industry', { length: 50 }),
  jobFunction: varchar('job_function', { length: 50 }),
  analysisDate: timestamp('analysis_date').notNull(),
  totalJobs: integer('total_jobs'),
  newJobs: integer('new_jobs'),
  jobGrowthRate: decimal('job_growth_rate', { precision: 5, scale: 2 }),
  averageTimeToFill: integer('average_time_to_fill'), // days
  competitionLevel: varchar('competition_level', { length: 20 }), // low, medium, high, very_high
  topSkillsInDemand: jsonb('top_skills_in_demand'),
  emergingSkills: jsonb('emerging_skills'),
  decliningSkills: jsonb('declining_skills'),
  salaryTrends: jsonb('salary_trends'),
  remoteWorkPercentage: decimal('remote_work_percentage', { precision: 5, scale: 2 }),
  contractVsFullTime: jsonb('contract_vs_full_time'),
  topHiringCompanies: jsonb('top_hiring_companies'),
  educationRequirements: jsonb('education_requirements'),
  experienceRequirements: jsonb('experience_requirements'),
  marketSentiment: varchar('market_sentiment', { length: 20 }), // very_negative, negative, neutral, positive, very_positive
  keyInsights: jsonb('key_insights'),
  predictions: jsonb('predictions'),
  recommendations: jsonb('recommendations'),
  dataSource: varchar('data_source', { length: 100 }),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default(0.95),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  regionIdx: index('market_region_idx').on(table.region),
  industryIdx: index('market_industry_idx').on(table.industry),
  dateIdx: index('market_date_idx').on(table.analysisDate),
  functionIdx: index('market_function_idx').on(table.jobFunction)
}));

// Professional Development Tracking
export const learningPaths = pgTable('learning_paths', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }), // technical, business, leadership, creative
  targetAudience: varchar('target_audience', { length: 50 }), // student, professional, career_changer
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  estimatedDuration: integer('estimated_duration'), // hours
  careerPathIds: jsonb('career_path_ids'), // array of career path IDs
  skillIds: jsonb('skill_ids'), // array of skills this path teaches
  prerequisites: jsonb('prerequisites'), // required skills/experience
  learningModules: jsonb('learning_modules'), // ordered array of modules
  practicalProjects: jsonb('practical_projects'), // hands-on projects
  assessments: jsonb('assessments'), // quizzes, tests, certifications
  completionCriteria: jsonb('completion_criteria'),
  certificationType: varchar('certification_type', { length: 50 }),
  industryRecognition: varchar('industry_recognition', { length: 100 }),
  cost: decimal('cost', { precision: 10, scale: 2 }).default(0),
  isPremium: boolean('is_premium').default(false),
  enrollmentCount: integer('enrollment_count').default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default(0),
  reviewCount: integer('review_count').default(0),
  createdBy: uuid('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  categoryIdx: index('learning_paths_category_idx').on(table.category),
  difficultyIdx: index('learning_paths_difficulty_idx').on(table.difficulty),
  targetIdx: index('learning_paths_target_idx').on(table.targetAudience),
  ratingIdx: index('learning_paths_rating_idx').on(table.averageRating)
}));

export const userLearningProgress = pgTable('user_learning_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  learningPathId: uuid('learning_path_id').references(() => learningPaths.id),
  currentModule: integer('current_module').default(0),
  completedModules: jsonb('completed_modules'), // array of module IDs
  progress: integer('progress').default(0), // 0-100 percentage
  timeSpent: integer('time_spent').default(0), // minutes
  lastAccessedAt: timestamp('last_accessed_at'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  certificateEarned: boolean('certificate_earned').default(false),
  certificateUrl: text('certificate_url'),
  finalScore: integer('final_score'),
  feedback: text('feedback'),
  rating: integer('rating'), // 1-5 stars
  review: text('review'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('learning_progress_user_idx').on(table.userId),
  pathIdx: index('learning_progress_path_idx').on(table.learningPathId),
  progressIdx: index('learning_progress_progress_idx').on(table.progress),
  uniqueUserPath: uniqueIndex('unique_user_learning_path').on(table.userId, table.learningPathId)
}));

// Relations
export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
  assessments: many(skillAssessments),
  userProfiles: many(userSkillProfiles),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id],
  }),
  sessions: many(mentorshipSessions),
  projects: many(realWorldProjects),
}));

export const careerPathsRelations = relations(careerPaths, ({ many }) => ({
  userGoals: many(userCareerGoals),
}));

export const realWorldProjectsRelations = relations(realWorldProjects, ({ one, many }) => ({
  mentor: one(mentorProfiles, {
    fields: [realWorldProjects.mentorId],
    references: [mentorProfiles.id],
  }),
  client: one(users, {
    fields: [realWorldProjects.clientId],
    references: [users.id],
  }),
  applications: many(projectApplications),
  team: many(projectTeams),
}));

export const learningPathsRelations = relations(learningPaths, ({ one, many }) => ({
  creator: one(users, {
    fields: [learningPaths.createdBy],
    references: [users.id],
  }),
  userProgress: many(userLearningProgress),
}));