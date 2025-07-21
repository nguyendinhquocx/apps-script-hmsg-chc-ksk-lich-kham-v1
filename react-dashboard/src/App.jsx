import React from 'react'
import Dashboard from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './components/NotificationSystem'
import { APP_CONFIG } from './constants'
import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="App">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {APP_CONFIG.TITLE}
                  </h1>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    v{APP_CONFIG.VERSION}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Hệ thống quản lý lịch khám sức khỏe
                </div>
              </div>
            </div>
          </header>
          <main className="min-h-screen bg-gray-50">
            <Dashboard />
          </main>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App