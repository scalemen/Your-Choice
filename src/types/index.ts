// ============================================================================
// STUDYGENIUS - COMPREHENSIVE TYPE DEFINITIONS
// ============================================================================

// Base Types
export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt: string
}

export interface TimestampEntity extends BaseEntity {
  createdAt: string
  updatedAt: string
}

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User extends BaseEntity {
  email: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  profilePicture?: string
  emailVerified: boolean
  isActive: boolean
  role: 'student' | 'teacher' | 'admin' | 'parent'
  preferences?: UserPreferences
  stats?: UserStats
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: NotificationSettings
  studyReminders: boolean
  publicProfile: boolean
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  assignments: boolean
  grades: boolean
  social: boolean
  wellness: boolean
  streaks: boolean
}

export interface UserStats {
  totalStudyTime: number
  streakCount: number
  flashcardsStudied: number
  notesCreated: number
  quizzesCompleted: number
  assignmentsSubmitted: number
  averageGrade: number
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  role: 'student' | 'teacher'
  inviteCode?: string
}

// ============================================================================
// CLASSROOM TYPES
// ============================================================================

export interface Institution extends BaseEntity {
  institutionId: string
  name: string
  displayName: string
  description?: string
  type: 'university' | 'high_school' | 'middle_school' | 'elementary' | 'training_center'
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  phone?: string
  email?: string
  website?: string
  academicYear?: string
  gradingSystem: 'letter' | 'percentage' | 'points' | 'pass_fail'
  gradingScale: Record<string, { min: number; max: number }>
  timeZone: string
  language: string
  enablePublicClassrooms: boolean
  enableGuestAccess: boolean
  logo?: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  subscriptionTier: 'basic' | 'premium' | 'enterprise'
  maxClassrooms: number
  maxStudentsPerClass: number
  maxTeachers: number
  storageLimit: number
  isActive: boolean
  isVerified: boolean
}

export interface Classroom extends BaseEntity {
  classroomId: string
  institutionId?: number
  name: string
  displayName: string
  description?: string
  subject: string
  gradeLevel?: string
  academicPeriod?: string
  classCode: string
  maxStudents: number
  allowLateSubmissions: boolean
  defaultLatePenalty: number
  meetingSchedule: Array<{
    day: string
    startTime: string
    endTime: string
    location?: string
  }>
  meetingLink?: string
  classroomLocation?: string
  visibility: 'private' | 'institution' | 'public'
  allowStudentPosts: boolean
  allowPeerReview: boolean
  enableDiscussions: boolean
  enableCollaboration: boolean
  enableGamification: boolean
  enableStudyGenius: boolean
  autoCreateFlashcards: boolean
  enableAiTutor: boolean
  enableGroupStudy: boolean
  theme: string
  headerImage?: string
  colors: Record<string, string>
  totalStudents: number
  totalAssignments: number
  averageGrade?: number
  engagementScore?: number
  isActive: boolean
  isArchived: boolean
  archivedAt?: string
  institution?: Institution
  userRole?: ClassroomRole
  userPermissions?: string[]
  currentGrade?: number
  engagementLevel?: 'high' | 'medium' | 'low'
}

export type ClassroomRole = 'teacher' | 'student' | 'teaching_assistant' | 'observer'

export interface ClassroomMembership extends BaseEntity {
  membershipId: string
  classroomId: number
  userId: number
  role: ClassroomRole
  permissions: string[]
  studentId?: string
  section?: string
  enrollmentType: 'regular' | 'audit' | 'credit' | 'non_credit'
  currentGrade?: number
  gradeLetterEquivalent?: string
  attendanceRate?: number
  participationScore?: number
  engagementLevel?: 'high' | 'medium' | 'low'
  totalStudyTime: number
  flashcardsCreated: number
  notesCreated: number
  quizzesCompleted: number
  gameScores: Record<string, number>
  status: 'active' | 'inactive' | 'dropped' | 'completed'
  joinedAt: string
  lastActiveAt: string
  droppedAt?: string
}

export interface Assignment extends BaseEntity {
  assignmentId: string
  classroomId: number
  createdBy: number
  title: string
  description?: string
  instructions?: string
  type: 'homework' | 'quiz' | 'project' | 'exam' | 'discussion' | 'flashcard_deck' | 'study_plan'
  category?: 'formative' | 'summative' | 'practice'
  subject?: string
  topics: string[]
  totalPoints: number
  gradingRubric: Record<string, any>
  gradingType: 'points' | 'percentage' | 'letter' | 'pass_fail'
  weightInFinalGrade: number
  assignedDate: string
  dueDate: string
  availableFrom: string
  availableUntil?: string
  submissionType: 'file_upload' | 'text_entry' | 'link' | 'quiz' | 'flashcards' | 'notes'
  allowedFileTypes: string[]
  maxFileSize: number
  maxSubmissions: number
  allowLateSubmissions: boolean
  latePenaltyPerDay: number
  requireFlashcards: boolean
  minimumFlashcards: number
  requireStudyPlan: boolean
  enablePeerReview: boolean
  peerReviewCount: number
  enableAutoGrading: boolean
  aiGradingPrompt?: string
  plagiarismCheck: boolean
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  relatedMaterials: Array<{
    id: string
    title: string
    type: string
    url: string
  }>
  preloadedContent: string[]
  totalSubmissions: number
  averageScore?: number
  averageTimeSpent?: number
  difficultyRating?: number
  status: 'draft' | 'published' | 'grading' | 'completed' | 'archived'
  isTemplate: boolean
  publishedAt?: string
  classroom?: Classroom
  userSubmission?: Submission
  relatedContent?: {
    preloadedCollections?: PreloadedFlashcardCollection[]
  }
  userStudyMaterials?: ClassroomStudyIntegration[]
}

export interface Submission extends BaseEntity {
  submissionId: string
  assignmentId: number
  studentId: number
  textContent?: string
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  links: Array<{
    url: string
    title?: string
  }>
  flashcardDeckIds: string[]
  noteIds: string[]
  quizResultIds: string[]
  studyPlanId?: string
  submissionAttempt: number
  timeSpent?: number
  wordCount?: number
  characterCount?: number
  score?: number
  maxScore?: number
  percentageScore?: number
  letterGrade?: string
  rubricScores: Record<string, number>
  bonusPoints: number
  penaltyPoints: number
  aiGradeScore?: number
  aiConfidence?: number
  plagiarismScore?: number
  teacherFeedback?: string
  aiGeneratedFeedback?: string
  peerFeedback: Array<{
    reviewerId: number
    rating: number
    comments: string
    createdAt: string
  }>
  status: 'draft' | 'submitted' | 'late_submitted' | 'graded' | 'returned'
  isLate: boolean
  daysPastDue: number
  submittedAt?: string
  gradedAt?: string
  returnedAt?: string
  assignment?: Assignment
  student?: User
}

export interface ClassroomPost extends BaseEntity {
  postId: string
  classroomId: number
  authorId: number
  parentPostId?: number
  title?: string
  content: string
  contentType: 'text' | 'announcement' | 'question' | 'discussion'
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  embeddedContent: Array<{
    type: 'video' | 'link' | 'image'
    url: string
    title?: string
    thumbnail?: string
  }>
  relatedFlashcards: string[]
  relatedNotes: string[]
  relatedQuizzes: string[]
  suggestedContent: Array<{
    type: string
    id: string
    title: string
  }>
  isPinned: boolean
  allowComments: boolean
  allowReactions: boolean
  audienceType: 'everyone' | 'students' | 'teachers' | 'specific_users'
  specificAudience: number[]
  viewCount: number
  likeCount: number
  commentCount: number
  reactionCounts: Record<string, number>
  status: 'draft' | 'published' | 'archived' | 'deleted'
  publishedAt: string
  author?: User
  authorRole?: ClassroomRole
  replies?: ClassroomPost[]
}

export interface ClassroomEvent extends BaseEntity {
  eventId: string
  classroomId: number
  createdBy: number
  title: string
  description?: string
  type: 'assignment_due' | 'exam' | 'class_session' | 'study_group' | 'office_hours' | 'field_trip'
  startDateTime: string
  endDateTime?: string
  allDay: boolean
  timeZone?: string
  isRecurring: boolean
  recurrencePattern: Record<string, any>
  recurrenceEndDate?: string
  location?: string
  meetingLink?: string
  meetingId?: string
  relatedAssignmentId?: number
  relatedMaterials: Array<{
    id: string
    title: string
    url: string
  }>
  suggestedStudyMaterials: Array<{
    type: string
    id: string
    title: string
  }>
  autoCreateStudyReminders: boolean
  attendeeList: Array<{
    userId: number
    status: 'going' | 'maybe' | 'not_going'
    responseDate: string
  }>
  requireRsvp: boolean
  maxAttendees?: number
  sendNotifications: boolean
  reminderIntervals: number[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  classroom?: Classroom
  relatedAssignment?: Assignment
}

export interface Grade extends BaseEntity {
  gradeId: string
  assignmentId: number
  studentId: number
  gradedBy?: number
  pointsEarned?: number
  pointsPossible?: number
  percentage?: number
  letterGrade?: string
  extraCredit: number
  latePenalty: number
  manualAdjustment: number
  adjustmentReason?: string
  feedback?: string
  privateNotes?: string
  previousGrade?: number
  gradeChangeReason?: string
  changeHistory: Array<{
    previousGrade: number
    newGrade: number
    reason: string
    changedBy: number
    changedAt: string
  }>
  status: 'draft' | 'final' | 'disputed' | 'under_review'
  isExempt: boolean
  exemptReason?: string
  gradedAt: string
  publishedAt?: string
  assignment?: Assignment
  student?: User
  gradedByUser?: User
}

export interface ClassroomStudyIntegration extends BaseEntity {
  integrationId: string
  classroomId: number
  studentId: number
  assignmentId?: number
  flashcardDeckId?: string
  noteId?: string
  quizId?: string
  studyPlanId?: string
  integrationType: 'assignment_flashcards' | 'class_notes' | 'study_plan' | 'quiz_results'
  connectionType: 'required' | 'optional' | 'bonus' | 'extra_credit'
  studyTimeContributed: number
  completionStatus: 'in_progress' | 'completed' | 'overdue'
  qualityScore?: number
  impactOnGrade: number
  bonusPointsEarned: number
  sharedWithClassmates: boolean
  collaboratorIds: number[]
  peerRatings: Array<{
    raterId: number
    rating: number
    comments?: string
    createdAt: string
  }>
  metadata: Record<string, any>
  completedAt?: string
  classroom?: Classroom
  student?: User
  assignment?: Assignment
}

// ============================================================================
// FLASHCARD TYPES
// ============================================================================

export interface FlashcardDeck extends BaseEntity {
  deckId: string
  title: string
  description?: string
  subject?: string
  tags: string[]
  createdBy: number
  isPublic: boolean
  totalCards: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language: string
  
  // Spaced Repetition Settings
  spacedRepetitionEnabled: boolean
  algorithm: 'anki' | 'sm2' | 'fsrs'
  newCardsPerDay: number
  maxReviewsPerDay: number
  learningSteps: number[]
  graduatingInterval: number
  easyInterval: number
  
  // Study Statistics
  totalStudyTime: number
  totalReviews: number
  averageRetention: number
  masteredCards: number
  
  // AI & Gamification
  aiGenerated: boolean
  aiModel?: string
  aiPrompt?: string
  difficultyScore: number
  qualityRating: number
  
  // Collaboration
  isCollaborative: boolean
  collaborators: Array<{
    userId: number
    role: 'editor' | 'viewer'
    permissions: string[]
  }>
  
  // Analytics
  studyStreak: number
  lastStudiedAt?: string
  nextReviewAt?: string
  
  // Status
  status: 'active' | 'archived' | 'deleted'
  
  cards?: Flashcard[]
  creator?: User
}

export interface Flashcard extends BaseEntity {
  cardId: string
  deckId: number
  front: string
  back: string
  hint?: string
  explanation?: string
  tags: string[]
  order: number
  
  // Media
  frontImage?: string
  backImage?: string
  frontAudio?: string
  backAudio?: string
  
  // Spaced Repetition Data
  ease: number
  interval: number
  dueDate: string
  reviewCount: number
  lapseCount: number
  
  // Study Statistics
  averageResponseTime: number
  correctCount: number
  incorrectCount: number
  lastReviewedAt?: string
  lastGrade?: 'again' | 'hard' | 'good' | 'easy'
  
  // AI Features
  aiGenerated: boolean
  aiModel?: string
  difficultyLevel: number
  
  // Status
  status: 'new' | 'learning' | 'review' | 'relearning' | 'mastered'
  
  deck?: FlashcardDeck
}

export interface FlashcardStudySession extends BaseEntity {
  sessionId: string
  deckId: number
  userId: number
  sessionType: 'new_cards' | 'review' | 'cram' | 'test'
  cardsStudied: number
  correctAnswers: number
  totalTime: number
  averageResponseTime: number
  completedAt?: string
  
  // Performance Metrics
  accuracy: number
  efficiency: number
  focusScore: number
  
  // Session Data
  cardReviews: Array<{
    cardId: string
    response: 'again' | 'hard' | 'good' | 'easy'
    responseTime: number
    wasCorrect: boolean
  }>
  
  deck?: FlashcardDeck
  user?: User
}

// ============================================================================
// PRELOADED CONTENT TYPES
// ============================================================================

export interface ContentCategory extends BaseEntity {
  categoryId: string
  name: string
  description?: string
  parentId?: number
  level: number
  path: string
  subject: string
  gradeLevel?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon?: string
  color?: string
  isActive: boolean
  sortOrder: number
  metadata: Record<string, any>
  
  parent?: ContentCategory
  children?: ContentCategory[]
  collections?: PreloadedFlashcardCollection[]
}

export interface PreloadedFlashcardCollection extends BaseEntity {
  collectionId: string
  categoryId: number
  title: string
  description: string
  subject: string
  gradeLevel?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language: string
  cardCount: number
  estimatedStudyTime: number
  
  // Educational Metadata
  learningObjectives: string[]
  prerequisites: string[]
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  bloomsTaxonomy: string[]
  
  // Content Quality
  qualityScore: number
  reviewCount: number
  averageRating: number
  
  // Usage Statistics
  importCount: number
  lastImportedAt?: string
  
  // Content Management
  version: string
  lastUpdated: string
  createdBy?: string
  reviewedBy?: string
  approvedAt?: string
  
  // Tags and Search
  tags: string[]
  keywords: string[]
  searchableContent: string
  
  // Status
  isActive: boolean
  isFeatured: boolean
  isVerified: boolean
  
  category?: ContentCategory
  cards?: PreloadedFlashcard[]
}

export interface PreloadedFlashcard extends BaseEntity {
  cardId: string
  collectionId: number
  front: string
  back: string
  hint?: string
  explanation?: string
  tags: string[]
  order: number
  
  // Content Quality
  difficultyLevel: number
  complexity: number
  
  // Media
  frontImage?: string
  backImage?: string
  
  // Educational Data
  learningObjective?: string
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  keywords: string[]
  
  // Metadata
  sourceUrl?: string
  sourceTitle?: string
  createdBy?: string
  
  collection?: PreloadedFlashcardCollection
}

export interface UserContentLibrary extends BaseEntity {
  libraryId: string
  userId: number
  contentType: 'flashcard_collection' | 'note' | 'quiz'
  sourceType: 'preloaded' | 'imported' | 'cloned'
  sourceId: string
  title: string
  description?: string
  
  // Import Data
  importedAt: string
  originalId?: string
  originalTitle?: string
  modifications: number
  
  // Usage Statistics
  accessCount: number
  lastAccessedAt?: string
  studyTime: number
  
  // User Organization
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
  customMetadata: Record<string, any>
  
  user?: User
}

export interface ContentTransferHistory extends BaseEntity {
  transferId: string
  userId: number
  operationType: 'import' | 'export'
  contentType: 'flashcards' | 'notes' | 'mixed'
  format: 'csv' | 'json' | 'anki' | 'quizlet'
  sourceFile?: string
  destinationFile?: string
  
  // Transfer Statistics
  itemsProcessed: number
  itemsSuccessful: number
  itemsFailed: number
  
  // Status and Results
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  processingTime: number
  
  // Transfer Data
  transferData: {
    collections?: number
    cards?: number
    notes?: number
    attachments?: number
  }
  
  user?: User
}

// ============================================================================
// STUDENT ASSISTANCE TYPES
// ============================================================================

export interface AIStudyBuddy extends BaseEntity {
  buddyId: string
  userId: number
  name: string
  personality: 'encouraging' | 'strict' | 'humorous' | 'professional' | 'friendly'
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing'
  
  // Adaptive Learning Profile
  knowledgeAreas: Record<string, number>
  learningPace: 'slow' | 'medium' | 'fast'
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'adaptive'
  
  // Interaction History
  totalInteractions: number
  totalStudyTime: number
  successfulSessions: number
  
  // AI Memory and Context
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    context?: Record<string, any>
  }>
  studentPreferences: Record<string, any>
  learningInsights: Record<string, any>
  
  // Performance Tracking
  helpfulnessRating?: number
  engagementScore?: number
  
  // Configuration
  isActive: boolean
  customInstructions?: string
  lastInteractionAt?: string
  
  user?: User
  conversations?: StudyBuddyConversation[]
}

export interface StudyBuddyConversation extends BaseEntity {
  conversationId: string
  buddyId: number
  userId: number
  sessionType: 'study_help' | 'motivation' | 'quiz_practice' | 'concept_explanation' | 'stress_support'
  subject?: string
  topic?: string
  difficulty?: string
  
  // Messages
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    emotionalState?: string
    recommendations?: Array<{
      type: string
      title: string
      description: string
    }>
  }>
  
  // Session Outcomes
  duration?: number
  helpfulnessRating?: number
  conceptsLearned: string[]
  strugglingAreas: string[]
  
  // AI Analysis
  emotionalState?: 'confident' | 'frustrated' | 'tired' | 'motivated' | 'confused'
  learningProgress?: number
  recommendedActions: Array<{
    type: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
  }>
  
  // Status
  status: 'active' | 'completed' | 'paused'
  completedAt?: string
  
  buddy?: AIStudyBuddy
  user?: User
}

export interface StudentWellness extends BaseEntity {
  recordId: string
  userId: number
  date: string
  
  // Daily Wellness Metrics
  stressLevel?: number // 1-10 scale
  energyLevel?: number // 1-10 scale
  motivationLevel?: number // 1-10 scale
  sleepQuality?: number // 1-10 scale
  sleepHours?: number
  
  // Study-Related Wellness
  studyFocus?: number // 1-10 scale
  workloadManageability?: number // 1-10 scale
  assignmentAnxiety?: number // 1-10 scale
  
  // Mood and Emotional State
  overallMood?: 'happy' | 'neutral' | 'stressed' | 'overwhelmed' | 'excited' | 'tired'
  emotionalTags: string[]
  
  // Study Environment
  studyLocation?: string
  studyDistractions: string[]
  studyDuration?: number
  actualStudyTime?: number
  
  // Academic Pressure
  upcomingDeadlines?: number
  assignmentLoad?: 'light' | 'moderate' | 'heavy' | 'overwhelming'
  examPressure?: number // 1-10 scale
  
  // Social and Support
  socialInteraction?: number // 1-10 scale
  supportSystemAccess?: number // 1-10 scale
  
  // Reflections
  dailyReflection?: string
  gratitudeNote?: string
  tomorrowGoals: string[]
  
  // AI Analysis
  wellnessScore?: number
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical'
  aiRecommendations: Array<{
    type: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
  }>
  
  user?: User
}

export interface PeerTutoringSession extends BaseEntity {
  sessionId: string
  tutorId: number
  studentId: number
  classroomId?: number
  subject: string
  topic?: string
  difficulty?: string
  sessionType: 'one_on_one' | 'group' | 'drop_in' | 'scheduled'
  
  // Timing
  scheduledStartTime?: string
  scheduledEndTime?: string
  actualStartTime?: string
  actualEndTime?: string
  duration?: number
  
  // Format and Location
  format: 'online' | 'in_person' | 'hybrid'
  location?: string
  meetingLink?: string
  
  // Content and Resources
  sessionGoals: string[]
  materialsUsed: Array<{
    type: string
    id: string
    title: string
  }>
  studyGeniusContent: Array<{
    type: 'flashcard' | 'note' | 'quiz'
    id: string
    title: string
  }>
  
  // Session Outcomes
  conceptsCovered: string[]
  improvementAreas: string[]
  homeworkHelp: Array<{
    assignment: string
    helpProvided: string
  }>
  
  // Feedback and Ratings
  tutorRating?: number // 1-5 from student
  studentRating?: number // 1-5 from tutor
  tutorFeedback?: string
  studentFeedback?: string
  
  // Quality Metrics
  knowledgeGain?: number
  confidenceImprovement?: number // 1-10 scale
  sessionEffectiveness?: number
  
  // Points and Rewards
  pointsEarned: number
  pointsSpent: number
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  
  tutor?: User
  student?: User
  classroom?: Classroom
}

export interface StudyStreak extends BaseEntity {
  streakId: string
  userId: number
  streakType: 'daily_study' | 'flashcard_review' | 'assignment_submission' | 'note_taking' | 'quiz_completion'
  currentStreak: number
  longestStreak: number
  totalDays: number
  
  // Configuration
  minimumRequirement: number
  requirementType: 'minutes' | 'count' | 'completion'
  
  // Time Tracking
  lastActivityDate?: string
  streakStartDate?: string
  lastBrokenDate?: string
  
  // Rewards and Milestones
  milestonesReached: Array<{
    milestone: number
    reachedAt: string
    reward?: string
  }>
  totalPointsEarned: number
  currentRewardTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  
  // Progress Insights
  weeklyAverage?: number
  monthlyAverage?: number
  consistencyScore?: number
  
  // Motivation
  motivationalLevel: 'building' | 'maintaining' | 'strong' | 'champion'
  reminderPreferences: {
    enabled: boolean
    time?: string
    frequency: 'daily' | 'weekly'
    motivationalMessages: boolean
  }
  
  // Status
  isActive: boolean
  isPaused: boolean
  pauseReason?: string
  
  user?: User
}

export interface LearningAnalytics extends BaseEntity {
  analyticsId: string
  userId: number
  periodType: 'daily' | 'weekly' | 'monthly' | 'semester'
  periodStart: string
  periodEnd: string
  
  // Study Metrics
  totalStudyTime: number
  averageDailyStudyTime?: number
  studySessionCount: number
  averageSessionLength?: number
  
  // Content Engagement
  flashcardsStudied: number
  flashcardAccuracy?: number
  notesCreated: number
  notesReviewed: number
  quizzesCompleted: number
  quizAverageScore?: number
  
  // Academic Performance
  assignmentsSubmitted: number
  assignmentAverageGrade?: number
  improvementTrend?: 'improving' | 'stable' | 'declining'
  
  // Learning Patterns
  mostActiveTimeOfDay?: string
  preferredStudyDuration?: number
  peakPerformanceDays: string[]
  strugglingSubjects: string[]
  strongSubjects: string[]
  
  // Behavioral Insights
  procrastinationScore?: number
  consistencyScore?: number
  motivationTrend?: 'increasing' | 'stable' | 'decreasing'
  stressTrend?: 'increasing' | 'stable' | 'decreasing'
  
  // AI-Generated Insights
  keyInsights: string[]
  recommendations: Array<{
    type: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    estimatedImpact: 'low' | 'medium' | 'high'
  }>
  predictionAccuracy?: number
  
  // Comparison Metrics
  percentileRank?: number
  improvementRate?: number
  
  user?: User
}

export interface AcademicSupportTicket extends BaseEntity {
  ticketId: string
  userId: number
  classroomId?: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
  supportType: 'academic_help' | 'technical_issue' | 'wellness_concern' | 'assignment_clarification' | 'study_strategy'
  subject?: string
  
  // Problem Description
  title: string
  description: string
  specificConcerns: string[]
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  
  // Academic Context
  assignmentId?: string
  dueDate?: string
  currentGrade?: number
  strugglingAreas: string[]
  
  // Support Provided
  responseTime?: number
  resolutionTime?: number
  supportActions: Array<{
    action: string
    takenBy: number
    takenAt: string
    result?: string
  }>
  resourcesProvided: Array<{
    type: string
    title: string
    url?: string
    description: string
  }>
  
  // Follow-up
  followUpRequired: boolean
  followUpDate?: string
  satisfactionRating?: number // 1-5
  
  // Staff Assignment
  assignedStaffId?: number
  
  // Status
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'critical'
  resolvedAt?: string
  
  user?: User
  classroom?: Classroom
  assignedStaff?: User
}

export interface StudyRecommendation extends BaseEntity {
  recommendationId: string
  userId: number
  recommendationType: 'study_method' | 'content_review' | 'time_management' | 'stress_reduction' | 'skill_building'
  category?: 'flashcards' | 'notes' | 'quizzes' | 'study_groups' | 'breaks' | 'exercise'
  
  // Recommendation Details
  title: string
  description: string
  actionItems: Array<{
    action: string
    estimatedTime?: number
    priority: 'low' | 'medium' | 'high'
  }>
  estimatedTimeRequired?: number
  
  // AI Analysis
  basedOnData: Array<{
    dataType: string
    dataPoint: string
    weight: number
  }>
  confidenceScore?: number
  relevanceScore?: number
  
  // Targeting
  subject?: string
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  learningStyle?: string
  
  // Expected Outcomes
  expectedBenefits: string[]
  successMetrics: Array<{
    metric: string
    targetValue: number
    timeframe: string
  }>
  
  // User Interaction
  viewedAt?: string
  implementedAt?: string
  dismissedAt?: string
  feedbackRating?: number // 1-5
  userFeedback?: string
  
  // Results Tracking
  wasImplemented: boolean
  wasEffective?: boolean
  effectivenessScore?: number
  
  // Status
  status: 'pending' | 'viewed' | 'implemented' | 'dismissed' | 'expired'
  priority: 'low' | 'medium' | 'high'
  expiresAt?: string
  
  user?: User
}

// ============================================================================
// NOTE-TAKING TYPES
// ============================================================================

export interface Note extends BaseEntity {
  noteId: string
  title: string
  content: string
  ownerId: number
  folderId?: number
  
  // Content Types
  contentType: 'rich_text' | 'handwriting' | 'mixed'
  richTextContent?: string
  handwritingStrokes?: Array<{
    x: number
    y: number
    pressure: number
    timestamp: number
  }>
  
  // Media and Attachments
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  
  // Organization
  tags: string[]
  subject?: string
  
  // Collaboration
  isShared: boolean
  shareSettings: {
    visibility: 'private' | 'shared' | 'public'
    allowComments: boolean
    allowEditing: boolean
    shareLink?: string
  }
  
  // AI Features
  aiSummary?: string
  extractedConcepts: string[]
  
  // Status
  status: 'draft' | 'published' | 'archived'
  
  owner?: User
  folder?: NoteFolder
}

export interface NoteFolder extends BaseEntity {
  folderId: string
  name: string
  description?: string
  ownerId: number
  parentId?: number
  color?: string
  icon?: string
  
  // Organization
  sortOrder: number
  
  // Settings
  isShared: boolean
  
  owner?: User
  parent?: NoteFolder
  children?: NoteFolder[]
  notes?: Note[]
}

// ============================================================================
// QUIZ TYPES
// ============================================================================

export interface Quiz extends BaseEntity {
  quizId: string
  title: string
  description?: string
  subject?: string
  createdBy: number
  
  // Configuration
  timeLimit?: number
  questionCount: number
  isRandomized: boolean
  showCorrectAnswers: boolean
  allowRetakes: boolean
  maxAttempts: number
  
  // Difficulty and Grading
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  passingScore: number
  totalPoints: number
  
  // AI Features
  aiGenerated: boolean
  adaptiveDifficulty: boolean
  
  // Status
  status: 'draft' | 'published' | 'archived'
  isPublic: boolean
  
  creator?: User
  questions?: QuizQuestion[]
  attempts?: QuizAttempt[]
}

export interface QuizQuestion extends BaseEntity {
  questionId: string
  quizId: number
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'drag_drop'
  question: string
  options?: string[]
  correctAnswer: string | number | string[]
  explanation?: string
  points: number
  order: number
  
  // Media
  imageUrl?: string
  audioUrl?: string
  
  // Difficulty
  difficultyLevel: number
  
  // Analytics
  answerCount: number
  correctCount: number
  averageResponseTime: number
  
  quiz?: Quiz
}

export interface QuizAttempt extends BaseEntity {
  attemptId: string
  quizId: number
  userId: number
  attemptNumber: number
  
  // Timing
  startedAt: string
  completedAt?: string
  timeSpent: number
  
  // Results
  score: number
  percentage: number
  passed: boolean
  
  // Answers
  answers: Array<{
    questionId: string
    answer: string | number | string[]
    isCorrect: boolean
    responseTime: number
  }>
  
  // Analysis
  strengthAreas: string[]
  weaknessAreas: string[]
  
  quiz?: Quiz
  user?: User
}

// ============================================================================
// STUDY PLANNER TYPES
// ============================================================================

export interface StudyPlan extends BaseEntity {
  planId: string
  title: string
  description?: string
  userId: number
  subject?: string
  
  // Timeline
  startDate: string
  endDate: string
  totalHours: number
  
  // Goals and Milestones
  goals: Array<{
    id: string
    title: string
    description?: string
    dueDate: string
    completed: boolean
    completedAt?: string
  }>
  
  // Schedule
  sessions: Array<{
    id: string
    title: string
    description?: string
    date: string
    startTime: string
    endTime: string
    duration: number
    type: 'study' | 'review' | 'practice' | 'break'
    completed: boolean
    actualDuration?: number
  }>
  
  // Progress
  completedSessions: number
  totalSessions: number
  hoursCompleted: number
  progressPercentage: number
  
  // AI Recommendations
  aiGenerated: boolean
  adaptiveScheduling: boolean
  recommendations: Array<{
    type: string
    suggestion: string
    reason: string
  }>
  
  // Status
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  
  user?: User
}

// ============================================================================
// SOCIAL TYPES
// ============================================================================

export interface Friendship extends BaseEntity {
  friendshipId: string
  userId: number
  friendId: number
  status: 'pending' | 'accepted' | 'blocked'
  initiatedBy: number
  
  // Settings
  nickname?: string
  isFavorite: boolean
  notificationsEnabled: boolean
  
  user?: User
  friend?: User
}

export interface StudyGroup extends BaseEntity {
  groupId: string
  name: string
  description?: string
  subject?: string
  createdBy: number
  
  // Configuration
  isPublic: boolean
  maxMembers: number
  currentMembers: number
  
  // Settings
  allowInvites: boolean
  requireApproval: boolean
  
  // Activity
  lastActivityAt?: string
  
  creator?: User
  members?: StudyGroupMember[]
}

export interface StudyGroupMember extends BaseEntity {
  membershipId: string
  groupId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  
  // Activity
  lastActiveAt?: string
  contributionScore: number
  
  group?: StudyGroup
  user?: User
}

// ============================================================================
// GAMING TYPES
// ============================================================================

export interface Game extends BaseEntity {
  gameId: string
  title: string
  description: string
  category: string
  subject?: string
  difficulty: 'easy' | 'medium' | 'hard'
  
  // Game Configuration
  maxPlayers: number
  estimatedDuration: number
  rules: string
  
  // Scoring
  maxScore: number
  scoreMultiplier: number
  
  // Status
  isActive: boolean
  
  sessions?: GameSession[]
}

export interface GameSession extends BaseEntity {
  sessionId: string
  gameId: number
  userId: number
  
  // Session Data
  score: number
  level: number
  timeSpent: number
  completed: boolean
  
  // Performance
  accuracy: number
  efficiency: number
  
  game?: Game
  user?: User
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ListResponse<T = any> {
  items: T[]
  total: number
  hasMore?: boolean
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

export interface TableState {
  sorting: Array<{
    id: string
    desc: boolean
  }>
  pagination: {
    pageIndex: number
    pageSize: number
  }
  filters: Array<{
    id: string
    value: any
  }>
}

export interface ModalState {
  isOpen: boolean
  type?: string
  data?: any
}

// ============================================================================
// THEME TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  systemTheme: 'light' | 'dark'
  accentColor: string
  fontSize: 'sm' | 'base' | 'lg'
  reducedMotion: boolean
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification extends BaseEntity {
  notificationId: string
  userId: number
  type: 'assignment' | 'grade' | 'social' | 'system' | 'wellness' | 'streak'
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: string
  
  // Actions
  actions?: Array<{
    id: string
    label: string
    url?: string
    action?: string
  }>
  
  user?: User
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchResult {
  type: 'user' | 'classroom' | 'assignment' | 'flashcard' | 'note' | 'quiz'
  id: string
  title: string
  description?: string
  url: string
  relevance: number
  highlight?: {
    title?: string
    description?: string
  }
}

export interface SearchFilters {
  type?: string[]
  subject?: string[]
  difficulty?: string[]
  dateRange?: {
    start: string
    end: string
  }
  tags?: string[]
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export all types for easy importing
}