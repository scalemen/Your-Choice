import React from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard Layout
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Coming soon - Full dashboard with navigation, sidebar, and content areas
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout