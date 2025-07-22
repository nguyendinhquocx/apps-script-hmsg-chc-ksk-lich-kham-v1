import React from 'react'
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentMonth, getMonthName } from '../utils/vietnamese'

const GlobalFilters = ({ 
  searchTerm, 
  setSearchTerm,
  statusFilter, 
  setStatusFilter,
  employeeFilter, 
  setEmployeeFilter,
  showGold, 
  setShowGold,
  monthFilter,
  setMonthFilter,
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
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc dữ liệu</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm công ty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Employee Filter */}
        <div>
          <input
            type="text"
            placeholder="Lọc theo nhân viên..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="input"
          />
        </div>
        
        {/* Month Filter */}
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="btn btn-outline p-2"
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
              className="btn btn-outline p-2"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gold Filter */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showGold}
              onChange={(e) => setShowGold(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Gold</span>
          </label>
        </div>
        
        {/* Reset Button */}
        <div>
          <button
            onClick={onReset}
            className="btn btn-outline px-4 py-2 text-sm w-full"
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default GlobalFilters