import React, { useState } from 'react'
import { BarChart3, Table, RefreshCw } from 'lucide-react'
import DataTable from './DataTable'
import Charts from './Charts'
import GlobalFilters from './GlobalFilters'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('table')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Global filter states
  const [globalFilters, setGlobalFilters] = useState({
    searchTerm: '',
    statusFilter: '',
    employeeFilter: '',
    showGold: false
  })

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  const updateGlobalFilter = (key, value) => {
    setGlobalFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const resetGlobalFilters = () => {
    setGlobalFilters({
      searchTerm: '',
      statusFilter: '',
      employeeFilter: '',
      showGold: false
    })
  }

  const tabs = [
    {
      id: 'table',
      name: 'Bảng dữ liệu',
      icon: Table,
      component: DataTable
    },
    {
      id: 'charts',
      name: 'Biểu đồ thống kê',
      icon: BarChart3,
      component: Charts
    }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Lịch Khám
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Hệ thống quản lý lịch khám sức khỏe - HMSG CHC
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="btn btn-secondary flex items-center space-x-2 px-4 py-2"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Làm mới</span>
              </button>
              
              <div className="text-sm text-gray-500">
                Cập nhật: {new Date().toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Filters */}
        <GlobalFilters
          searchTerm={globalFilters.searchTerm}
          setSearchTerm={(value) => updateGlobalFilter('searchTerm', value)}
          statusFilter={globalFilters.statusFilter}
          setStatusFilter={(value) => updateGlobalFilter('statusFilter', value)}
          employeeFilter={globalFilters.employeeFilter}
          setEmployeeFilter={(value) => updateGlobalFilter('employeeFilter', value)}
          showGold={globalFilters.showGold}
          setShowGold={(value) => updateGlobalFilter('showGold', value)}
          onReset={resetGlobalFilters}
        />
        
        <div className="fade-in">
          {ActiveComponent && <ActiveComponent key={refreshKey} globalFilters={globalFilters} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 HMSG CHC - Hệ thống quản lý lịch khám sức khỏe
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Phiên bản: 1.0.0</span>
              <span>•</span>
              <span>Dữ liệu từ: Supabase</span>
              <span>•</span>
              <span>Đồng bộ: Google Apps Script</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard