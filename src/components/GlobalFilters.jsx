import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentMonth, getMonthName } from '../utils/vietnamese'

const GlobalFilters = ({ 
  searchTerm, 
  onSearchChange,
  statusFilter, 
  onStatusChange,
  employeeFilter, 
  onEmployeeChange,
  showGold, 
  onGoldChange,
  monthFilter,
  setMonthFilter,
  dateFilter,
  onDateFilterChange,
  onReset
}) => {
  const statusOptions = [
    'Đã khám xong',
    'Chưa khám xong'
  ]
  
  const currentMonth = getCurrentMonth()
  
  const handlePreviousMonth = () => {
    const newMonth = monthFilter.month === 1 ? 12 : monthFilter.month - 1
    const newYear = monthFilter.month === 1 ? monthFilter.year - 1 : monthFilter.year
    setMonthFilter({ month: newMonth, year: newYear })
  }
  
  const handleNextMonth = () => {
    const newMonth = monthFilter.month === 12 ? 1 : monthFilter.month + 1
    const newYear = monthFilter.month === 12 ? monthFilter.year + 1 : monthFilter.year
    setMonthFilter({ month: newMonth, year: newYear })
  }

  return (
    <div className="w-full p-6 mb-8">
      <div className="flex flex-wrap gap-4 items-end justify-between">
        {/* Left side - Month and Date filters */}
        <div className="flex flex-wrap gap-4 items-end">
          {/* Month Filter - First position */}
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 bg-white text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[100px]">
                <div className="text-sm font-medium text-gray-900">
                  {getMonthName(monthFilter.month)}
                </div>
                <div className="text-xs text-gray-500">
                  {monthFilter.year}
                </div>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 bg-white text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Range Filter - Second position */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => onDateFilterChange({ ...dateFilter, startDate: e.target.value })}
              className="px-3 py-2 bg-white text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Từ ngày"
            />
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => onDateFilterChange({ ...dateFilter, endDate: e.target.value })}
              className="px-3 py-2 bg-white text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Đến ngày"
            />
          </div>
        </div>

        {/* Right side - Other filters */}
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm công ty..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Employee Filter - First */}
          <div>
            <input
              type="text"
              placeholder="Lọc theo nhân viên..."
              value={employeeFilter}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Reset Button and Gold Filter */}
          <div className="flex gap-2 items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showGold}
                onChange={(e) => onGoldChange(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Gold</span>
            </label>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white text-black text-sm hover:bg-gray-100 transition-colors duration-200"
              title="Xóa tất cả bộ lọc"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalFilters