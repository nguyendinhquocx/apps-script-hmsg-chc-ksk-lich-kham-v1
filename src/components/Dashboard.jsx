import React, { useState } from 'react'
import { BarChart3, Table, RefreshCw, Target, FileText } from 'lucide-react'
import DataTable from './DataTable'
import Charts from './Charts'
import Benchmark from './Benchmark'
import TraHoSo from './TraHoSo'
import GlobalFilters from './GlobalFilters'
import { getCurrentMonth } from '../utils/vietnamese'
import useEmployeeList from '../hooks/useEmployeeList'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('table')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Get employee list for global filters
  const { employeeList } = useEmployeeList()
  
  // Global filter states
  const [globalFilters, setGlobalFilters] = useState({
    searchTerm: '',
    statusFilter: '',
    employeeFilter: '',
    showGold: false,
    monthFilter: getCurrentMonth(),
    dateFilter: {
      startDate: '',
      endDate: ''
    }
  })

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  const updateGlobalFilter = (key, value) => {
    setGlobalFilters(prev => ({ ...prev, [key]: value }))
  }
  
  // Reset global filters
  const resetGlobalFilters = () => {
    setGlobalFilters({
      searchTerm: '',
      statusFilter: '',
      employeeFilter: '',
      showGold: false,
      monthFilter: getCurrentMonth(),
      dateFilter: {
        startDate: '',
        endDate: ''
      }
    })
  }

  const tabs = [
    {
      id: 'table',
      name: 'Lịch khám',
      component: DataTable
    },
    {
      id: 'charts',
      name: 'Cận lâm sàng',
      component: Charts
    },
    {
      id: 'benchmark',
      name: 'Phân tích & Dự báo',
      component: Benchmark
    },
    {
      id: 'tra-ho-so',
      name: 'Trả hồ sơ',
      component: TraHoSo
    }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white">
        <div className="w-full px-6">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl text-gray-900">
                <span className="font-bold">HMSG</span> | Khám sức khoẻ doanh nghiệp
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white">
        <div className="w-full px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
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
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        <div className="fade-in">
          {activeTab === 'table' && (
            <>
              {/* Global Filters for DataTable */}
              <GlobalFilters
                searchTerm={globalFilters.searchTerm}
                statusFilter={globalFilters.statusFilter}
                employeeFilter={globalFilters.employeeFilter}
                employeeList={employeeList}
                showGold={globalFilters.showGold}
                monthFilter={globalFilters.monthFilter}
                dateFilter={globalFilters.dateFilter}
                setMonthFilter={(monthFilter) => updateGlobalFilter('monthFilter', monthFilter)}
                onDateFilterChange={(dateFilter) => updateGlobalFilter('dateFilter', dateFilter)}
                onSearchChange={(value) => updateGlobalFilter('searchTerm', value)}
                onStatusChange={(value) => updateGlobalFilter('statusFilter', value)}
                onEmployeeChange={(value) => updateGlobalFilter('employeeFilter', value)}
                onGoldChange={(value) => updateGlobalFilter('showGold', value)}
                onReset={resetGlobalFilters}
              />
              <DataTable key={refreshKey} globalFilters={globalFilters} />
            </>
          )}
          {activeTab === 'charts' && (
            <Charts 
              key={refreshKey} 
              globalFilters={globalFilters}
              updateGlobalFilter={updateGlobalFilter}
              resetGlobalFilters={resetGlobalFilters}
            />
          )}
          {activeTab === 'benchmark' && (
            <>
              <GlobalFilters
                searchTerm={globalFilters.searchTerm}
                statusFilter={globalFilters.statusFilter}
                employeeFilter={globalFilters.employeeFilter}
                employeeList={employeeList}
                showGold={globalFilters.showGold}
                monthFilter={globalFilters.monthFilter}
                dateFilter={globalFilters.dateFilter}
                setMonthFilter={(monthFilter) => updateGlobalFilter('monthFilter', monthFilter)}
                onDateFilterChange={(dateFilter) => updateGlobalFilter('dateFilter', dateFilter)}
                onSearchChange={(value) => updateGlobalFilter('searchTerm', value)}
                onStatusChange={(value) => updateGlobalFilter('statusFilter', value)}
                onEmployeeChange={(value) => updateGlobalFilter('employeeFilter', value)}
                onGoldChange={(value) => updateGlobalFilter('showGold', value)}
                onReset={resetGlobalFilters}
              />
              <Benchmark key={refreshKey} filters={globalFilters} employeeList={employeeList} />
            </>
          )}
          {activeTab === 'tra-ho-so' && (
            <TraHoSo key={refreshKey} globalFilters={globalFilters} />
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard