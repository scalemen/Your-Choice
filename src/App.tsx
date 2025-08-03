import React, { useEffect, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'

// Store
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Toaster } from 'react-hot-toast'

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'

// Pages - Lazy loaded for code splitting
const LandingPage = React.lazy(() => import('@/pages/LandingPage'))
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'))
const ClassroomsPage = React.lazy(() => import('@/pages/classrooms/ClassroomsPage'))
const ClassroomDetailPage = React.lazy(() => import('@/pages/classrooms/ClassroomDetailPage'))
const FlashcardsPage = React.lazy(() => import('@/pages/flashcards/FlashcardsPage'))
const NotesPage = React.lazy(() => import('@/pages/notes/NotesPage'))
const StudyPlannerPage = React.lazy(() => import('@/pages/study-planner/StudyPlannerPage'))
const AITutorPage = React.lazy(() => import('@/pages/ai-tutor/AITutorPage'))
const StudyBuddyPage = React.lazy(() => import('@/pages/student-assistance/StudyBuddyPage'))
const WellnessPage = React.lazy(() => import('@/pages/student-assistance/WellnessPage'))
const PeerTutoringPage = React.lazy(() => import('@/pages/student-assistance/PeerTutoringPage'))
const AnalyticsPage = React.lazy(() => import('@/pages/student-assistance/AnalyticsPage'))
const SocialPage = React.lazy(() => import('@/pages/social/SocialPage'))
const VideoPlatformPage = React.lazy(() => import('@/pages/VideoPlatformPage'))
const StudyGramPage = React.lazy(() => import('@/pages/StudyGramPage'))
const GamesPage = React.lazy(() => import('@/pages/games/GamesPage'))
const SettingsPage = React.lazy(() => import('@/pages/settings/SettingsPage'))
const ProfilePage = React.lazy(() => import('@/pages/profile/ProfilePage'))
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'))

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route wrapper (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Loading fallback component
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-300">Loading StudyGenius...</p>
    </div>
  </div>
)

// Main App component
const App: React.FC = () => {
  const { initializeAuth } = useAuthStore()
  const { theme, initializeTheme } = useThemeStore()

  // Initialize app
  useEffect(() => {
    initializeAuth()
    initializeTheme()
  }, [initializeAuth, initializeTheme])

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <>
      <Helmet>
        <title>StudyGenius - The Ultimate Educational Platform</title>
        <meta name="description" content="Revolutionary AI-powered learning platform with flashcards, note-taking, study planning, and collaborative features. Transform your education with StudyGenius." />
      </Helmet>

      <AnimatePresence mode="wait">
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-gray-50 dark:bg-gray-900"
        >
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                }
              />
              
              {/* Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <LoginPage />
                    </AuthLayout>
                  </PublicRoute>
                }
              />
              
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <RegisterPage />
                    </AuthLayout>
                  </PublicRoute>
                }
              />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route index element={<DashboardPage />} />
                        <Route path="classrooms" element={<ClassroomsPage />} />
                        <Route path="classrooms/:classroomId" element={<ClassroomDetailPage />} />
                        <Route path="flashcards" element={<FlashcardsPage />} />
                        <Route path="notes" element={<NotesPage />} />
                        <Route path="study-planner" element={<StudyPlannerPage />} />
                        <Route path="ai-tutor" element={<AITutorPage />} />
                        
                        {/* Student Assistance Features */}
                        <Route path="study-buddy" element={<StudyBuddyPage />} />
                        <Route path="wellness" element={<WellnessPage />} />
                        <Route path="peer-tutoring" element={<PeerTutoringPage />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        
                        {/* Social & Gaming */}
                        <Route path="social" element={<SocialPage />} />
                        <Route path="video-platform/*" element={<VideoPlatformPage />} />
                        <Route path="studygram/*" element={<StudyGramPage />} />
                        <Route path="games" element={<GamesPage />} />
                        
                        {/* User Management */}
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Legacy route redirects */}
              <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/classroom/*" element={<Navigate to="/dashboard/classrooms" replace />} />

              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Global Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'font-medium',
          style: {
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  )
}

export default App