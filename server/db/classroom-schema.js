import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Educational Institutions and Schools
export const institutions = pgTable('institutions', {
  id: serial('id').primaryKey(),
  institutionId: uuid('institution_id').defaultRandom().notNull().unique(),
  
  // Institution details
  name: varchar('name', { length: 200 }).notNull(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // university, high_school, middle_school, elementary, training_center
  
  // Contact and location
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  country: varchar('country', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 100 }),
  website: text('website'),
  
  // Academic configuration
  academicYear: varchar('academic_year', { length: 20 }), // 2023-2024
  gradingSystem: varchar('grading_system', { length: 50 }).default('letter'), // letter, percentage, points, pass_fail
  gradingScale: jsonb('grading_scale').default({
    'A': { min: 90, max: 100 },
    'B': { min: 80, max: 89 },
    'C': { min: 70, max: 79 },
    'D': { min: 60, max: 69 },
    'F': { min: 0, max: 59 }
  }),
  
  // Settings and preferences
  timeZone: varchar('time_zone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  enablePublicClassrooms: boolean('enable_public_classrooms').default(false),
  enableGuestAccess: boolean('enable_guest_access').default(false),
  
  // Branding
  logo: text('logo'), // URL to logo image
  colors: jsonb('colors').default({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#06b6d4'
  }),
  
  // Subscription and limits
  subscriptionTier: varchar('subscription_tier', { length: 30 }).default('basic'), // basic, premium, enterprise
  maxClassrooms: integer('max_classrooms').default(10),
  maxStudentsPerClass: integer('max_students_per_class').default(30),
  maxTeachers: integer('max_teachers').default(5),
  storageLimit: bigint('storage_limit', { mode: 'number' }).default(1073741824), // 1GB in bytes
  
  // Status
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('institutions_name_idx').on(table.name),
  typeIdx: index('institutions_type_idx').on(table.type),
  activeIdx: index('institutions_active_idx').on(table.isActive)
}));

// Virtual Classrooms
export const classrooms = pgTable('classrooms', {
  id: serial('id').primaryKey(),
  classroomId: uuid('classroom_id').defaultRandom().notNull().unique(),
  
  institutionId: integer('institution_id').references(() => institutions.id),
  
  // Basic classroom info
  name: varchar('name', { length: 200 }).notNull(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 100 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 50 }),
  academicPeriod: varchar('academic_period', { length: 50 }), // Fall 2023, Spring 2024, etc.
  
  // Classroom configuration
  classCode: varchar('class_code', { length: 12 }).notNull().unique(), // Unique join code
  maxStudents: integer('max_students').default(30),
  allowLateSubmissions: boolean('allow_late_submissions').default(true),
  defaultLatePenalty: decimal('default_late_penalty', { precision: 5, scale: 2 }).default('0'), // Percentage penalty per day
  
  // Schedule and meeting info
  meetingSchedule: jsonb('meeting_schedule').default([]), // Array of meeting times
  meetingLink: text('meeting_link'), // Zoom, Meet, Teams link
  classroomLocation: varchar('classroom_location', { length: 100 }), // Physical location
  
  // Settings
  visibility: varchar('visibility', { length: 20 }).default('private'), // private, institution, public
  allowStudentPosts: boolean('allow_student_posts').default(true),
  allowPeerReview: boolean('allow_peer_review').default(false),
  enableDiscussions: boolean('enable_discussions').default(true),
  enableCollaboration: boolean('enable_collaboration').default(true),
  enableGamification: boolean('enable_gamification').default(true),
  
  // Integration settings
  enableStudyGenius: boolean('enable_study_genius').default(true),
  autoCreateFlashcards: boolean('auto_create_flashcards').default(false),
  enableAiTutor: boolean('enable_ai_tutor').default(true),
  enableGroupStudy: boolean('enable_group_study').default(true),
  
  // Appearance
  theme: varchar('theme', { length: 30 }).default('default'),
  headerImage: text('header_image'),
  colors: jsonb('colors').default({}),
  
  // Analytics and insights
  totalStudents: integer('total_students').default(0),
  totalAssignments: integer('total_assignments').default(0),
  averageGrade: decimal('average_grade', { precision: 5, scale: 2 }),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }),
  
  // Status
  isActive: boolean('is_active').default(true),
  isArchived: boolean('is_archived').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  archivedAt: timestamp('archived_at')
}, (table) => ({
  codeIdx: index('classrooms_code_idx').on(table.classCode),
  institutionIdx: index('classrooms_institution_idx').on(table.institutionId),
  subjectIdx: index('classrooms_subject_idx').on(table.subject),
  activeIdx: index('classrooms_active_idx').on(table.isActive)
}));

// Classroom Memberships (Teachers and Students)
export const classroomMemberships = pgTable('classroom_memberships', {
  id: serial('id').primaryKey(),
  membershipId: uuid('membership_id').defaultRandom().notNull().unique(),
  
  classroomId: integer('classroom_id').references(() => classrooms.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Role and permissions
  role: varchar('role', { length: 20 }).notNull(), // teacher, student, teaching_assistant, observer
  permissions: jsonb('permissions').default([]), // Array of specific permissions
  
  // Academic info
  studentId: varchar('student_id', { length: 50 }), // Institution student ID
  section: varchar('section', { length: 20 }), // Class section
  enrollmentType: varchar('enrollment_type', { length: 30 }).default('regular'), // regular, audit, credit, non_credit
  
  // Performance and engagement
  currentGrade: decimal('current_grade', { precision: 5, scale: 2 }),
  gradeLetterEquivalent: varchar('grade_letter_equivalent', { length: 5 }),
  attendanceRate: decimal('attendance_rate', { precision: 5, scale: 2 }),
  participationScore: decimal('participation_score', { precision: 5, scale: 2 }),
  engagementLevel: varchar('engagement_level', { length: 20 }), // high, medium, low
  
  // StudyGenius integration data
  totalStudyTime: integer('total_study_time').default(0), // Minutes
  flashcardsCreated: integer('flashcards_created').default(0),
  notesCreated: integer('notes_created').default(0),
  quizzesCompleted: integer('quizzes_completed').default(0),
  gameScores: jsonb('game_scores').default({}),
  
  // Status and dates
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, dropped, completed
  joinedAt: timestamp('joined_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  droppedAt: timestamp('dropped_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  classroomUserIdx: index('classroom_memberships_classroom_user_idx').on(table.classroomId, table.userId),
  roleIdx: index('classroom_memberships_role_idx').on(table.role),
  statusIdx: index('classroom_memberships_status_idx').on(table.status),
  joinedIdx: index('classroom_memberships_joined_idx').on(table.joinedAt)
}));

// Assignments and Projects
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  assignmentId: uuid('assignment_id').defaultRandom().notNull().unique(),
  
  classroomId: integer('classroom_id').references(() => classrooms.id).notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  
  // Assignment details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  
  // Assignment type and category
  type: varchar('type', { length: 50 }).notNull(), // homework, quiz, project, exam, discussion, flashcard_deck, study_plan
  category: varchar('category', { length: 50 }), // formative, summative, practice
  subject: varchar('subject', { length: 100 }),
  topics: jsonb('topics').default([]),
  
  // Grading configuration
  totalPoints: decimal('total_points', { precision: 8, scale: 2 }).notNull(),
  gradingRubric: jsonb('grading_rubric').default({}),
  gradingType: varchar('grading_type', { length: 30 }).default('points'), // points, percentage, letter, pass_fail
  weightInFinalGrade: decimal('weight_in_final_grade', { precision: 5, scale: 2 }).default('1'),
  
  // Timing and availability
  assignedDate: timestamp('assigned_date').defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  availableFrom: timestamp('available_from').defaultNow(),
  availableUntil: timestamp('available_until'),
  
  // Submission settings
  submissionType: varchar('submission_type', { length: 50 }).notNull(), // file_upload, text_entry, link, quiz, flashcards, notes
  allowedFileTypes: jsonb('allowed_file_types').default([]), // ['.pdf', '.docx', '.txt']
  maxFileSize: bigint('max_file_size', { mode: 'number' }).default(52428800), // 50MB in bytes
  maxSubmissions: integer('max_submissions').default(1),
  allowLateSubmissions: boolean('allow_late_submissions').default(true),
  latePenaltyPerDay: decimal('late_penalty_per_day', { precision: 5, scale: 2 }).default('10'),
  
  // StudyGenius integration
  requireFlashcards: boolean('require_flashcards').default(false),
  minimumFlashcards: integer('minimum_flashcards').default(10),
  requireStudyPlan: boolean('require_study_plan').default(false),
  enablePeerReview: boolean('enable_peer_review').default(false),
  peerReviewCount: integer('peer_review_count').default(2),
  
  // Auto-grading and AI features
  enableAutoGrading: boolean('enable_auto_grading').default(false),
  aiGradingPrompt: text('ai_grading_prompt'),
  plagiarismCheck: boolean('plagiarism_check').default(false),
  
  // Resources and materials
  attachments: jsonb('attachments').default([]),
  relatedMaterials: jsonb('related_materials').default([]),
  preloadedContent: jsonb('preloaded_content').default([]), // IDs of preloaded flashcard collections
  
  // Analytics
  totalSubmissions: integer('total_submissions').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }),
  averageTimeSpent: integer('average_time_spent'), // Minutes
  difficultyRating: decimal('difficulty_rating', { precision: 3, scale: 2 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, grading, completed, archived
  isTemplate: boolean('is_template').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at')
}, (table) => ({
  classroomIdx: index('assignments_classroom_idx').on(table.classroomId),
  typeIdx: index('assignments_type_idx').on(table.type),
  dueDateIdx: index('assignments_due_date_idx').on(table.dueDate),
  statusIdx: index('assignments_status_idx').on(table.status),
  createdByIdx: index('assignments_created_by_idx').on(table.createdBy)
}));

// Student Submissions
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  submissionId: uuid('submission_id').defaultRandom().notNull().unique(),
  
  assignmentId: integer('assignment_id').references(() => assignments.id).notNull(),
  studentId: integer('student_id').references(() => users.id).notNull(),
  
  // Submission content
  textContent: text('text_content'),
  attachments: jsonb('attachments').default([]),
  links: jsonb('links').default([]),
  
  // StudyGenius content integration
  flashcardDeckIds: jsonb('flashcard_deck_ids').default([]),
  noteIds: jsonb('note_ids').default([]),
  quizResultIds: jsonb('quiz_result_ids').default([]),
  studyPlanId: varchar('study_plan_id', { length: 100 }),
  
  // Submission metadata
  submissionAttempt: integer('submission_attempt').default(1),
  timeSpent: integer('time_spent'), // Minutes spent working
  wordCount: integer('word_count'),
  characterCount: integer('character_count'),
  
  // Grading and feedback
  score: decimal('score', { precision: 8, scale: 2 }),
  maxScore: decimal('max_score', { precision: 8, scale: 2 }),
  percentageScore: decimal('percentage_score', { precision: 5, scale: 2 }),
  letterGrade: varchar('letter_grade', { length: 5 }),
  
  // Detailed scoring
  rubricScores: jsonb('rubric_scores').default({}),
  bonusPoints: decimal('bonus_points', { precision: 8, scale: 2 }).default('0'),
  penaltyPoints: decimal('penalty_points', { precision: 8, scale: 2 }).default('0'),
  
  // AI and auto-grading
  aiGradeScore: decimal('ai_grade_score', { precision: 8, scale: 2 }),
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  plagiarismScore: decimal('plagiarism_score', { precision: 5, scale: 2 }),
  
  // Feedback and comments
  teacherFeedback: text('teacher_feedback'),
  aiGeneratedFeedback: text('ai_generated_feedback'),
  peerFeedback: jsonb('peer_feedback').default([]),
  
  // Status and timing
  status: varchar('status', { length: 20 }).default('draft'), // draft, submitted, late_submitted, graded, returned
  isLate: boolean('is_late').default(false),
  daysPastDue: integer('days_past_due').default(0),
  
  submittedAt: timestamp('submitted_at'),
  gradedAt: timestamp('graded_at'),
  returnedAt: timestamp('returned_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  assignmentStudentIdx: index('submissions_assignment_student_idx').on(table.assignmentId, table.studentId),
  statusIdx: index('submissions_status_idx').on(table.status),
  submittedIdx: index('submissions_submitted_idx').on(table.submittedAt),
  gradeIdx: index('submissions_grade_idx').on(table.score)
}));

// Classroom Announcements and Posts
export const classroomPosts = pgTable('classroom_posts', {
  id: serial('id').primaryKey(),
  postId: uuid('post_id').defaultRandom().notNull().unique(),
  
  classroomId: integer('classroom_id').references(() => classrooms.id).notNull(),
  authorId: integer('author_id').references(() => users.id).notNull(),
  parentPostId: integer('parent_post_id').references(() => classroomPosts.id), // For replies
  
  // Post content
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 30 }).default('text'), // text, announcement, question, discussion
  
  // Media and attachments
  attachments: jsonb('attachments').default([]),
  embeddedContent: jsonb('embedded_content').default([]), // Videos, links, etc.
  
  // StudyGenius integration
  relatedFlashcards: jsonb('related_flashcards').default([]),
  relatedNotes: jsonb('related_notes').default([]),
  relatedQuizzes: jsonb('related_quizzes').default([]),
  suggestedContent: jsonb('suggested_content').default([]),
  
  // Post settings
  isPinned: boolean('is_pinned').default(false),
  allowComments: boolean('allow_comments').default(true),
  allowReactions: boolean('allow_reactions').default(true),
  
  // Audience and visibility
  audienceType: varchar('audience_type', { length: 20 }).default('everyone'), // everyone, students, teachers, specific_users
  specificAudience: jsonb('specific_audience').default([]), // User IDs for specific targeting
  
  // Engagement metrics
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  reactionCounts: jsonb('reaction_counts').default({}),
  
  // Status
  status: varchar('status', { length: 20 }).default('published'), // draft, published, archived, deleted
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at').defaultNow()
}, (table) => ({
  classroomIdx: index('classroom_posts_classroom_idx').on(table.classroomId),
  authorIdx: index('classroom_posts_author_idx').on(table.authorId),
  parentIdx: index('classroom_posts_parent_idx').on(table.parentPostId),
  typeIdx: index('classroom_posts_type_idx').on(table.contentType),
  pinnedIdx: index('classroom_posts_pinned_idx').on(table.isPinned),
  publishedIdx: index('classroom_posts_published_idx').on(table.publishedAt)
}));

// Classroom Calendar Events
export const classroomEvents = pgTable('classroom_events', {
  id: serial('id').primaryKey(),
  eventId: uuid('event_id').defaultRandom().notNull().unique(),
  
  classroomId: integer('classroom_id').references(() => classrooms.id).notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  
  // Event details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // assignment_due, exam, class_session, study_group, office_hours, field_trip
  
  // Timing
  startDateTime: timestamp('start_date_time').notNull(),
  endDateTime: timestamp('end_date_time'),
  allDay: boolean('all_day').default(false),
  timeZone: varchar('time_zone', { length: 50 }),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern').default({}), // RRULE format
  recurrenceEndDate: timestamp('recurrence_end_date'),
  
  // Location and meeting info
  location: varchar('location', { length: 200 }),
  meetingLink: text('meeting_link'),
  meetingId: varchar('meeting_id', { length: 100 }),
  
  // Related content
  relatedAssignmentId: integer('related_assignment_id').references(() => assignments.id),
  relatedMaterials: jsonb('related_materials').default([]),
  
  // StudyGenius integration
  suggestedStudyMaterials: jsonb('suggested_study_materials').default([]),
  autoCreateStudyReminders: boolean('auto_create_study_reminders').default(false),
  
  // Attendees and RSVPs
  attendeeList: jsonb('attendee_list').default([]),
  requireRsvp: boolean('require_rsvp').default(false),
  maxAttendees: integer('max_attendees'),
  
  // Notifications
  sendNotifications: boolean('send_notifications').default(true),
  reminderIntervals: jsonb('reminder_intervals').default([1440, 60]), // Minutes before event
  
  // Status
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, in_progress, completed, cancelled
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  classroomIdx: index('classroom_events_classroom_idx').on(table.classroomId),
  startDateIdx: index('classroom_events_start_date_idx').on(table.startDateTime),
  typeIdx: index('classroom_events_type_idx').on(table.type),
  statusIdx: index('classroom_events_status_idx').on(table.status)
}));

// Gradebook and Grade Categories
export const gradeCategories = pgTable('grade_categories', {
  id: serial('id').primaryKey(),
  categoryId: uuid('category_id').defaultRandom().notNull().unique(),
  
  classroomId: integer('classroom_id').references(() => classrooms.id).notNull(),
  
  // Category details
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Grading configuration
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(), // Percentage of final grade
  dropLowestScores: integer('drop_lowest_scores').default(0),
  
  // Category settings
  color: varchar('color', { length: 7 }).default('#6366f1'),
  icon: varchar('icon', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  classroomIdx: index('grade_categories_classroom_idx').on(table.classroomId),
  sortOrderIdx: index('grade_categories_sort_order_idx').on(table.sortOrder)
}));

// Individual Grade Records
export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  gradeId: uuid('grade_id').defaultRandom().notNull().unique(),
  
  assignmentId: integer('assignment_id').references(() => assignments.id).notNull(),
  studentId: integer('student_id').references(() => users.id).notNull(),
  gradedBy: integer('graded_by').references(() => users.id),
  
  // Grade values
  pointsEarned: decimal('points_earned', { precision: 8, scale: 2 }),
  pointsPossible: decimal('points_possible', { precision: 8, scale: 2 }),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  letterGrade: varchar('letter_grade', { length: 5 }),
  
  // Grade adjustments
  extraCredit: decimal('extra_credit', { precision: 8, scale: 2 }).default('0'),
  latePenalty: decimal('late_penalty', { precision: 8, scale: 2 }).default('0'),
  manualAdjustment: decimal('manual_adjustment', { precision: 8, scale: 2 }).default('0'),
  adjustmentReason: text('adjustment_reason'),
  
  // Feedback and comments
  feedback: text('feedback'),
  privateNotes: text('private_notes'), // Only visible to teachers
  
  // Grade history and changes
  previousGrade: decimal('previous_grade', { precision: 8, scale: 2 }),
  gradeChangeReason: text('grade_change_reason'),
  changeHistory: jsonb('change_history').default([]),
  
  // Status and timing
  status: varchar('status', { length: 20 }).default('final'), // draft, final, disputed, under_review
  isExempt: boolean('is_exempt').default(false),
  exemptReason: text('exempt_reason'),
  
  gradedAt: timestamp('graded_at').defaultNow(),
  publishedAt: timestamp('published_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  assignmentStudentIdx: index('grades_assignment_student_idx').on(table.assignmentId, table.studentId),
  studentIdx: index('grades_student_idx').on(table.studentId),
  gradedByIdx: index('grades_graded_by_idx').on(table.gradedBy),
  statusIdx: index('grades_status_idx').on(table.status)
}));

// StudyGenius Integration Records
export const classroomStudyIntegration = pgTable('classroom_study_integration', {
  id: serial('id').primaryKey(),
  integrationId: uuid('integration_id').defaultRandom().notNull().unique(),
  
  classroomId: integer('classroom_id').references(() => classrooms.id).notNull(),
  studentId: integer('student_id').references(() => users.id).notNull(),
  
  // Content associations
  assignmentId: integer('assignment_id').references(() => assignments.id),
  flashcardDeckId: varchar('flashcard_deck_id', { length: 100 }),
  noteId: varchar('note_id', { length: 100 }),
  quizId: varchar('quiz_id', { length: 100 }),
  studyPlanId: varchar('study_plan_id', { length: 100 }),
  
  // Integration type and status
  integrationType: varchar('integration_type', { length: 50 }).notNull(), // assignment_flashcards, class_notes, study_plan, quiz_results
  connectionType: varchar('connection_type', { length: 30 }).notNull(), // required, optional, bonus, extra_credit
  
  // Performance tracking
  studyTimeContributed: integer('study_time_contributed').default(0), // Minutes
  completionStatus: varchar('completion_status', { length: 20 }).default('in_progress'), // in_progress, completed, overdue
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  
  // Academic impact
  impactOnGrade: decimal('impact_on_grade', { precision: 5, scale: 2 }).default('0'),
  bonusPointsEarned: decimal('bonus_points_earned', { precision: 8, scale: 2 }).default('0'),
  
  // Collaboration data
  sharedWithClassmates: boolean('shared_with_classmates').default(false),
  collaboratorIds: jsonb('collaborator_ids').default([]),
  peerRatings: jsonb('peer_ratings').default([]),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  classroomStudentIdx: index('classroom_study_integration_classroom_student_idx').on(table.classroomId, table.studentId),
  typeIdx: index('classroom_study_integration_type_idx').on(table.integrationType),
  statusIdx: index('classroom_study_integration_status_idx').on(table.completionStatus),
  assignmentIdx: index('classroom_study_integration_assignment_idx').on(table.assignmentId)
}));

// Parent/Guardian Access
export const parentAccess = pgTable('parent_access', {
  id: serial('id').primaryKey(),
  accessId: uuid('access_id').defaultRandom().notNull().unique(),
  
  parentUserId: integer('parent_user_id').references(() => users.id).notNull(),
  studentUserId: integer('student_user_id').references(() => users.id).notNull(),
  classroomId: integer('classroom_id').references(() => classrooms.id),
  
  // Access levels and permissions
  accessLevel: varchar('access_level', { length: 30 }).default('basic'), // basic, detailed, full
  canViewGrades: boolean('can_view_grades').default(true),
  canViewAssignments: boolean('can_view_assignments').default(true),
  canViewAttendance: boolean('can_view_attendance').default(true),
  canViewBehavior: boolean('can_view_behavior').default(false),
  canCommunicateWithTeacher: boolean('can_communicate_with_teacher').default(true),
  
  // StudyGenius integration access
  canViewStudyProgress: boolean('can_view_study_progress').default(true),
  canViewFlashcards: boolean('can_view_flashcards').default(false),
  canViewNotes: boolean('can_view_notes').default(false),
  canViewStudyTime: boolean('can_view_study_time').default(true),
  
  // Notification preferences
  gradeNotifications: boolean('grade_notifications').default(true),
  assignmentNotifications: boolean('assignment_notifications').default(true),
  attendanceNotifications: boolean('attendance_notifications').default(true),
  behaviorNotifications: boolean('behavior_notifications').default(true),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, suspended, revoked
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at')
}, (table) => ({
  parentStudentIdx: index('parent_access_parent_student_idx').on(table.parentUserId, table.studentUserId),
  classroomIdx: index('parent_access_classroom_idx').on(table.classroomId),
  statusIdx: index('parent_access_status_idx').on(table.status)
}));

// Define relationships
export const institutionsRelations = relations(institutions, ({ many }) => ({
  classrooms: many(classrooms)
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [classrooms.institutionId],
    references: [institutions.id]
  }),
  memberships: many(classroomMemberships),
  assignments: many(assignments),
  posts: many(classroomPosts),
  events: many(classroomEvents),
  gradeCategories: many(gradeCategories),
  studyIntegrations: many(classroomStudyIntegration),
  parentAccess: many(parentAccess)
}));

export const classroomMembershipsRelations = relations(classroomMemberships, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomMemberships.classroomId],
    references: [classrooms.id]
  }),
  user: one(users, {
    fields: [classroomMemberships.userId],
    references: [users.id]
  })
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [assignments.classroomId],
    references: [classrooms.id]
  }),
  createdBy: one(users, {
    fields: [assignments.createdBy],
    references: [users.id]
  }),
  submissions: many(submissions),
  grades: many(grades),
  events: many(classroomEvents),
  studyIntegrations: many(classroomStudyIntegration)
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id]
  })
}));

export const classroomPostsRelations = relations(classroomPosts, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [classroomPosts.classroomId],
    references: [classrooms.id]
  }),
  author: one(users, {
    fields: [classroomPosts.authorId],
    references: [users.id]
  }),
  parentPost: one(classroomPosts, {
    fields: [classroomPosts.parentPostId],
    references: [classroomPosts.id]
  }),
  replies: many(classroomPosts, {
    relationName: 'parentPost'
  })
}));

export const classroomEventsRelations = relations(classroomEvents, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomEvents.classroomId],
    references: [classrooms.id]
  }),
  createdBy: one(users, {
    fields: [classroomEvents.createdBy],
    references: [users.id]
  }),
  relatedAssignment: one(assignments, {
    fields: [classroomEvents.relatedAssignmentId],
    references: [assignments.id]
  })
}));

export const gradeCategoriesRelations = relations(gradeCategories, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [gradeCategories.classroomId],
    references: [classrooms.id]
  })
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  assignment: one(assignments, {
    fields: [grades.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [grades.studentId],
    references: [users.id]
  }),
  gradedBy: one(users, {
    fields: [grades.gradedBy],
    references: [users.id]
  })
}));

export const classroomStudyIntegrationRelations = relations(classroomStudyIntegration, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomStudyIntegration.classroomId],
    references: [classrooms.id]
  }),
  student: one(users, {
    fields: [classroomStudyIntegration.studentId],
    references: [users.id]
  }),
  assignment: one(assignments, {
    fields: [classroomStudyIntegration.assignmentId],
    references: [assignments.id]
  })
}));

export const parentAccessRelations = relations(parentAccess, ({ one }) => ({
  parent: one(users, {
    fields: [parentAccess.parentUserId],
    references: [users.id]
  }),
  student: one(users, {
    fields: [parentAccess.studentUserId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [parentAccess.classroomId],
    references: [classrooms.id]
  })
}));