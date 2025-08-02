import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AcademicCapIcon,
  BuildingLibraryIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ArrowRightIcon,
  BookOpenIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShareIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  AcademicCapIcon as AcademicCapIconSolid,
  BuildingLibraryIcon as BuildingLibraryIconSolid,
  UsersIcon as UsersIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

// Mock data interfaces
interface Institution {
  id: string;
  name: string;
  type: 'university' | 'school' | 'corporate' | 'other';
  logo?: string;
  description: string;
  address: string;
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  isActive: boolean;
  createdAt: string;
}

interface Classroom {
  id: string;
  institutionId: string;
  name: string;
  description: string;
  subject: string;
  code: string;
  thumbnail?: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  assignmentCount: number;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  color: string;
}

interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  type: 'homework' | 'quiz' | 'project' | 'exam' | 'discussion';
  dueDate: string;
  maxPoints: number;
  isPublished: boolean;
  submissionCount: number;
  totalStudents: number;
  attachments: string[];
  createdAt: string;
}

interface ClassroomPost {
  id: string;
  classroomId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'announcement' | 'material' | 'assignment';
  attachments: string[];
  createdAt: string;
  commentCount: number;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  attachments: string[];
  grade?: number;
  feedback?: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'late' | 'missing';
}

const ClassroomsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'classrooms' | 'assignments' | 'analytics'>('overview');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'teacher' | 'student' | 'archived'>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'institution' | 'classroom' | 'assignment'>('classroom');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const queryClient = useQueryClient();

  // Mock data
  const mockInstitutions: Institution[] = [
    {
      id: '1',
      name: 'Stanford University',
      type: 'university',
      logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=200',
      description: 'Leading research university in California',
      address: 'Stanford, CA 94305',
      totalStudents: 17249,
      totalTeachers: 2240,
      totalClassrooms: 156,
      isActive: true,
      createdAt: '2023-01-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'Lincoln High School',
      type: 'school',
      logo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200',
      description: 'Excellence in secondary education',
      address: '123 Main St, Lincoln, NE',
      totalStudents: 1250,
      totalTeachers: 75,
      totalClassrooms: 45,
      isActive: true,
      createdAt: '2023-02-01T00:00:00Z'
    }
  ];

  const mockClassrooms: Classroom[] = [
    {
      id: '1',
      institutionId: '1',
      name: 'Advanced Calculus I',
      description: 'Differential and integral calculus with applications',
      subject: 'Mathematics',
      code: 'MATH-201',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      teacherId: 'teacher1',
      teacherName: 'Dr. Sarah Johnson',
      studentCount: 45,
      assignmentCount: 12,
      isActive: true,
      createdAt: '2024-01-15T00:00:00Z',
      lastActivity: '2024-01-25T14:30:00Z',
      color: 'blue'
    },
    {
      id: '2',
      institutionId: '1',
      name: 'Organic Chemistry Lab',
      description: 'Laboratory experiments in organic chemistry',
      subject: 'Chemistry',
      code: 'CHEM-315L',
      thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400',
      teacherId: 'teacher2',
      teacherName: 'Prof. Michael Chen',
      studentCount: 32,
      assignmentCount: 8,
      isActive: true,
      createdAt: '2024-01-10T00:00:00Z',
      lastActivity: '2024-01-24T16:45:00Z',
      color: 'green'
    },
    {
      id: '3',
      institutionId: '2',
      name: 'AP English Literature',
      description: 'Advanced Placement English Literature and Composition',
      subject: 'English',
      code: 'ENG-AP',
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      teacherId: 'teacher3',
      teacherName: 'Ms. Emily Davis',
      studentCount: 28,
      assignmentCount: 15,
      isActive: true,
      createdAt: '2024-01-08T00:00:00Z',
      lastActivity: '2024-01-25T10:15:00Z',
      color: 'purple'
    }
  ];

  const mockAssignments: Assignment[] = [
    {
      id: '1',
      classroomId: '1',
      title: 'Limits and Continuity Problem Set',
      description: 'Complete problems 1-20 from Chapter 2. Show all work and explain your reasoning.',
      type: 'homework',
      dueDate: '2024-02-01T23:59:00Z',
      maxPoints: 100,
      isPublished: true,
      submissionCount: 38,
      totalStudents: 45,
      attachments: ['problem_set_2.pdf'],
      createdAt: '2024-01-20T00:00:00Z'
    },
    {
      id: '2',
      classroomId: '2',
      title: 'Synthesis of Aspirin Lab Report',
      description: 'Write a comprehensive lab report following the provided template.',
      type: 'project',
      dueDate: '2024-02-05T23:59:00Z',
      maxPoints: 150,
      isPublished: true,
      submissionCount: 25,
      totalStudents: 32,
      attachments: ['lab_template.docx', 'aspirin_synthesis.pdf'],
      createdAt: '2024-01-18T00:00:00Z'
    },
    {
      id: '3',
      classroomId: '3',
      title: 'Poetry Analysis Essay',
      description: 'Analyze the use of symbolism in one of the assigned poems.',
      type: 'homework',
      dueDate: '2024-01-30T23:59:00Z',
      maxPoints: 100,
      isPublished: true,
      submissionCount: 26,
      totalStudents: 28,
      attachments: ['essay_rubric.pdf'],
      createdAt: '2024-01-15T00:00:00Z'
    }
  ];

  // Queries
  const { data: institutions, isLoading: institutionsLoading } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => Promise.resolve(mockInstitutions),
    staleTime: 10 * 60 * 1000
  });

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms', selectedInstitution, searchQuery, filterBy],
    queryFn: () => Promise.resolve(mockClassrooms.filter(classroom => 
      (selectedInstitution === 'all' || classroom.institutionId === selectedInstitution) &&
      classroom.name.toLowerCase().includes(searchQuery.toLowerCase())
    )),
    staleTime: 5 * 60 * 1000
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => Promise.resolve(mockAssignments),
    staleTime: 5 * 60 * 1000
  });

  // Mutations
  const createClassroomMutation = useMutation({
    mutationFn: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Classroom created successfully!');
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
    onError: () => {
      toast.error('Failed to create classroom. Please try again.');
    }
  });

  const joinClassroomMutation = useMutation({
    mutationFn: async (classroomCode: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Successfully joined classroom!');
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
    onError: () => {
      toast.error('Failed to join classroom. Please check the code.');
    }
  });

  // Helper functions
  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Mathematics': 'text-blue-600 bg-blue-50',
      'Chemistry': 'text-green-600 bg-green-50',
      'English': 'text-purple-600 bg-purple-50',
      'Physics': 'text-red-600 bg-red-50',
      'Biology': 'text-emerald-600 bg-emerald-50',
      'History': 'text-orange-600 bg-orange-50',
      'Computer Science': 'text-indigo-600 bg-indigo-50'
    };
    return colors[subject] || 'text-gray-600 bg-gray-50';
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'text-blue-600 bg-blue-100';
      case 'quiz': return 'text-yellow-600 bg-yellow-100';
      case 'project': return 'text-purple-600 bg-purple-100';
      case 'exam': return 'text-red-600 bg-red-100';
      case 'discussion': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getCompletionRate = (submitted: number, total: number) => {
    return Math.round((submitted / total) * 100);
  };

  return (
    <>
      <Helmet>
        <title>Classrooms - StudyGenius</title>
        <meta name="description" content="Manage your classrooms, assignments, and academic activities." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <AcademicCapIconSolid className="h-8 w-8 text-white" />
                  </div>
                  Classrooms
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage your educational journey and collaborate with peers
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCreateType('classroom');
                    setShowCreateModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Create Classroom
                </button>
                <button
                  onClick={() => {
                    const code = prompt('Enter classroom code:');
                    if (code) joinClassroomMutation.mutate(code);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Join Classroom
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 p-1 rounded-xl backdrop-blur-sm">
              {[
                { id: 'overview', label: 'Overview', icon: BuildingLibraryIcon },
                { id: 'classrooms', label: 'My Classrooms', icon: AcademicCapIcon },
                { id: 'assignments', label: 'Assignments', icon: ClipboardDocumentListIcon },
                { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Active Classrooms', value: '12', icon: AcademicCapIconSolid, color: 'blue' },
                  { label: 'Pending Assignments', value: '8', icon: ClipboardDocumentListIconSolid, color: 'yellow' },
                  { label: 'Total Students', value: '245', icon: UsersIconSolid, color: 'green' },
                  { label: 'Institutions', value: '3', icon: BuildingLibraryIconSolid, color: 'purple' }
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className={cn(
                        'p-3 rounded-xl',
                        stat.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                        stat.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                        stat.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                        stat.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30'
                      )}>
                        <stat.icon className={cn(
                          'h-6 w-6',
                          stat.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                          stat.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                          stat.color === 'green' && 'text-green-600 dark:text-green-400',
                          stat.color === 'purple' && 'text-purple-600 dark:text-purple-400'
                        )} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {[
                    { action: 'New assignment posted', classroom: 'Advanced Calculus I', time: '2 hours ago', type: 'assignment' },
                    { action: 'Student submission received', classroom: 'Organic Chemistry Lab', time: '4 hours ago', type: 'submission' },
                    { action: 'Classroom announcement', classroom: 'AP English Literature', time: '1 day ago', type: 'announcement' },
                    { action: 'New student joined', classroom: 'Advanced Calculus I', time: '2 days ago', type: 'join' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={cn(
                        'p-2 rounded-full',
                        activity.type === 'assignment' && 'bg-blue-100 dark:bg-blue-900/30',
                        activity.type === 'submission' && 'bg-green-100 dark:bg-green-900/30',
                        activity.type === 'announcement' && 'bg-yellow-100 dark:bg-yellow-900/30',
                        activity.type === 'join' && 'bg-purple-100 dark:bg-purple-900/30'
                      )}>
                        {activity.type === 'assignment' && <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        {activity.type === 'submission' && <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {activity.type === 'announcement' && <BellIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {activity.type === 'join' && <UserPlusIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.classroom}</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BuildingLibraryIconSolid className="h-5 w-5" />
                    Institutions
                  </h3>
                  <button
                    onClick={() => {
                      setCreateType('institution');
                      setShowCreateModal(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Add Institution
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutions?.map((institution) => (
                    <div key={institution.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {institution.logo && (
                          <img
                            src={institution.logo}
                            alt={institution.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{institution.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{institution.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{institution.totalStudents.toLocaleString()} students</span>
                            <span>{institution.totalTeachers} teachers</span>
                            <span>{institution.totalClassrooms} classrooms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Classrooms Tab */}
          {activeTab === 'classrooms' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search classrooms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Institutions</option>
                    {institutions?.map((institution) => (
                      <option key={institution.id} value={institution.id}>{institution.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Classrooms</option>
                    <option value="teacher">Teaching</option>
                    <option value="student">Enrolled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Classrooms Grid */}
              {classroomsLoading ? (
                <LoadingSpinner size="lg" label="Loading classrooms..." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms?.map((classroom, index) => (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedClassroom(classroom);
                        setShowClassroomModal(true);
                      }}
                    >
                      {classroom.thumbnail && (
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={classroom.thumbnail}
                            alt={classroom.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium text-white bg-white/20 backdrop-blur-sm')}>
                              {classroom.code}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {classroom.name}
                          </h3>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {classroom.description}
                        </p>

                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className={cn('px-2 py-1 rounded-full font-medium', getSubjectColor(classroom.subject))}>
                            {classroom.subject}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {classroom.teacherName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <UsersIcon className="h-4 w-4" />
                              {classroom.studentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClipboardDocumentListIcon className="h-4 w-4" />
                              {classroom.assignmentCount}
                            </span>
                          </div>
                          <span>
                            {new Date(classroom.lastActivity).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {assignmentsLoading ? (
                <LoadingSpinner size="lg" label="Loading assignments..." />
              ) : (
                <div className="space-y-4">
                  {assignments?.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {assignment.title}
                            </h3>
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getAssignmentTypeColor(assignment.type))}>
                              {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {assignment.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Due Date</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatDueDate(assignment.dueDate)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Max Points</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {assignment.maxPoints}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {assignment.submissionCount}/{assignment.totalStudents}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Completion</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {getCompletionRate(assignment.submissionCount, assignment.totalStudents)}%
                              </div>
                            </div>
                          </div>

                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getCompletionRate(assignment.submissionCount, assignment.totalStudents)}%` }}
                            />
                          </div>

                          {assignment.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {assignment.attachments.map((attachment, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                                >
                                  📎 {attachment}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowAssignmentModal(true);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <ShareIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Average Grade</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">87.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Assignments Completed</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/28</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">95.2%</span>
                    </div>
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Performance</h3>
                  <div className="space-y-3">
                    {['Mathematics', 'Chemistry', 'English'].map((subject) => (
                      <div key={subject}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{subject}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {subject === 'Mathematics' ? '92%' : subject === 'Chemistry' ? '85%' : '89%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ 
                              width: subject === 'Mathematics' ? '92%' : subject === 'Chemistry' ? '85%' : '89%' 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Activity</h3>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{day}</div>
                      <div
                        className="bg-blue-100 dark:bg-blue-900/30 rounded-lg h-16 flex items-end justify-center"
                        style={{ height: `${Math.random() * 60 + 20}px` }}
                      >
                        <div className="bg-blue-500 w-full rounded-lg" style={{ height: '100%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Classroom Details Modal */}
        <AnimatePresence>
          {showClassroomModal && selectedClassroom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowClassroomModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedClassroom.thumbnail && (
                  <div className="relative">
                    <img
                      src={selectedClassroom.thumbnail}
                      alt={selectedClassroom.name}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                    <button
                      onClick={() => setShowClassroomModal(false)}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedClassroom.name}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className={cn('px-2 py-1 rounded-full font-medium', getSubjectColor(selectedClassroom.subject))}>
                          {selectedClassroom.subject}
                        </span>
                        <span>{selectedClassroom.code}</span>
                        <span>{selectedClassroom.teacherName}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {selectedClassroom.description}
                  </p>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Students</h4>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedClassroom.studentCount}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Assignments</h4>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedClassroom.assignmentCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <ArrowRightIcon className="h-5 w-5" />
                      Enter Classroom
                    </button>
                    <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <Cog6ToothIcon className="h-5 w-5" />
                      Settings
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Create {createType.charAt(0).toUpperCase() + createType.slice(1)}
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter ${createType} name`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter ${createType} description`}
                      />
                    </div>

                    {createType === 'classroom' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subject
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Mathematics</option>
                            <option>Chemistry</option>
                            <option>English</option>
                            <option>Physics</option>
                            <option>Biology</option>
                            <option>History</option>
                            <option>Computer Science</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Institution
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            {institutions?.map((institution) => (
                              <option key={institution.id} value={institution.id}>
                                {institution.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => createClassroomMutation.mutate({})}
                      disabled={createClassroomMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {createClassroomMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <PlusIcon className="h-4 w-4" />
                      )}
                      Create
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ClassroomsPage;