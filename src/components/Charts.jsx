import React from 'react'
import GlobalFilters from './GlobalFilters'

const Charts = ({ globalFilters = {}, updateGlobalFilter, resetGlobalFilters }) => {
  const {
    searchTerm = '',
    statusFilter = '',
    employeeFilter = '',
    showGold = false,
    monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    dateFilter = { startDate: '', endDate: '' }
  } = globalFilters

  const handleSearchChange = (value) => {
    updateGlobalFilter('searchTerm', value)
  }

  const handleStatusChange = (value) => {
    updateGlobalFilter('statusFilter', value)
  }

  const handleEmployeeChange = (value) => {
    updateGlobalFilter('employeeFilter', value)
  }

  const handleGoldChange = (value) => {
    updateGlobalFilter('showGold', value)
  }

  const handleMonthFilterChange = (value) => {
    updateGlobalFilter('monthFilter', value)
  }

  const handleDateFilterChange = (value) => {
    updateGlobalFilter('dateFilter', value)
  }

  const handleReset = () => {
    resetGlobalFilters()
  }

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <GlobalFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        employeeFilter={employeeFilter}
        onEmployeeChange={handleEmployeeChange}
        showGold={showGold}
        onGoldChange={handleGoldChange}
        monthFilter={monthFilter}
        setMonthFilter={handleMonthFilterChange}
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        onReset={handleReset}
      />
      
      {/* Content area - currently empty as charts are removed */}
      <div className="card p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Biểu đồ thống kê</p>
          <p className="text-sm">Các biểu đồ đã được loại bỏ theo yêu cầu. Chỉ giữ lại bộ lọc.</p>
        </div>
      </div>
    </div>
  )
}

export default Charts