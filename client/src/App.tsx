import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Store imports
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSocketStore } from '@/stores/socketStore';

// Component imports
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import AuthLayout from '@/components/layout/AuthLayout';

// Lazy-loaded page components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const Notes = lazy(() => import('@/pages/notes/Notes'));
const NoteEditor = lazy(() => import('@/pages/notes/NoteEditor'));
const SharedNote = lazy(() => import('@/pages/notes/SharedNote'));
const AIChat = lazy(() => import('@/pages/ai/AIChat'));
const HomeworkSolver = lazy(() => import('@/pages/ai/HomeworkSolver'));
const TopicExplorer = lazy(() => import('@/pages/ai/TopicExplorer'));
const StudyPlanner = lazy(() => import('@/pages/study/StudyPlanner'));
const StudySession = lazy(() => import('@/pages/study/StudySession'));
const Quizzes = lazy(() => import('@/pages/quizzes/Quizzes'));
const QuizTaker = lazy(() => import('@/pages/quizzes/QuizTaker'));
const Flashcards = lazy(() => import('@/pages/flashcards/Flashcards'));
const FlashcardReview = lazy(() => import('@/pages/flashcards/FlashcardReview'));
const Games = lazy(() => import('@/pages/games/Games'));
const GamePlayer = lazy(() => import('@/pages/games/GamePlayer'));
const Chat = lazy(() => import('@/pages/communication/Chat'));
const VideoCall = lazy(() => import('@/pages/communication/VideoCall'));
const Workspaces = lazy(() => import('@/pages/workspaces/Workspaces'));
const WorkspaceDetail = lazy(() => import('@/pages/workspaces/WorkspaceDetail'));
const Analytics = lazy(() => import('@/pages/analytics/Analytics'));
const Leaderboards = lazy(() => import('@/pages/Leaderboards'));
const Personalization = lazy(() => import('@/components/Personalization'));
const Social = lazy(() => import('@/pages/Social'));
const EnhancedSocial = lazy(() => import('@/pages/EnhancedSocial'));
const Profile = lazy(() => import('@/pages/profile/Profile'));
const Settings = lazy(() => import('@/pages/settings/Settings'));
const Help = lazy(() => import('@/pages/help/Help'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Create query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
});

// Loading component with better UX
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-primary-900">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4"
    >
      <LoadingSpinner size="lg" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-medium text-secondary-600 dark:text-secondary-300"
      >
        Loading StudyGenius...
      </motion.p>
    </motion.div>
  </div>
);

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects authenticated users)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();
  const { theme, initializeTheme } = useThemeStore();
  const { initializeSocket, disconnect } = useSocketStore();

  // Initialize app on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize theme first
        initializeTheme();
        
        // Initialize authentication
        await initializeAuth();
        
        // Initialize socket connection if authenticated
        const token = localStorage.getItem('token');
        if (token) {
          initializeSocket(token);
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initApp();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [initializeAuth, initializeTheme, initializeSocket, disconnect]);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white transition-colors duration-300">
            <AnimatePresence mode="wait">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <Login />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <Register />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <ForgotPassword />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <ResetPassword />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />

                  {/* Shared Note (Public) */}
                  <Route path="/shared/notes/:shareCode" element={<SharedNote />} />

                  {/* Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Navigate to="/dashboard" replace />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Notes */}
                  <Route
                    path="/notes"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Notes />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notes/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NoteEditor />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notes/new"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NoteEditor />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* AI Features */}
                  <Route
                    path="/ai/chat"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <AIChat />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai/homework"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <HomeworkSolver />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai/explore"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <TopicExplorer />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Study */}
                  <Route
                    path="/study/planner"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <StudyPlanner />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/study/session/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <StudySession />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Quizzes */}
                  <Route
                    path="/quizzes"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Quizzes />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quizzes/:id/take"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <QuizTaker />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Flashcards */}
                  <Route
                    path="/flashcards"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Flashcards />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/flashcards/:deckId/review"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <FlashcardReview />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Games */}
                  <Route
                    path="/games"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Games />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/games/:gameId/play"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <GamePlayer />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Communication */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Chat />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/video/:sessionId"
                    element={
                      <ProtectedRoute>
                        <VideoCall />
                      </ProtectedRoute>
                    }
                  />

                  {/* Workspaces */}
                  <Route
                    path="/workspaces"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Workspaces />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workspaces/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <WorkspaceDetail />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Analytics */}
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Leaderboards */}
                  <Route
                    path="/leaderboards"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Leaderboards />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Personalization */}
                  <Route
                    path="/personalization"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Personalization />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Social */}
                  <Route
                    path="/social"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Social />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Enhanced Social (Discord-style) */}
                  <Route
                    path="/enhanced-social"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <EnhancedSocial />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Profile & Settings */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Settings />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Help */}
                  <Route
                    path="/help"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Help />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AnimatePresence>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: theme === 'dark' ? '#1e293b' : '#ffffff',
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff'
                  }
                }
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;