import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '../utils/vietnamese'

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
    <div className="w-full p-3 sm:p-4 lg:p-6 mb-6 lg:mb-8">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 items-end">
        {/* Month Filter */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 order-1">
          <button
            onClick={handlePreviousMonth}
            className="p-1 bg-white text-gray-600 rounded-md hover:bg-gray-100 hover:shadow-sm transition-all duration-300 ease-out"
            title="Tháng trước"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <div className="text-center min-w-[60px] sm:min-w-[70px] lg:min-w-[80px] px-1">
            <div className="text-xs sm:text-sm font-medium text-gray-900">
              {getMonthName(monthFilter.month)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              {monthFilter.year}
            </div>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1 bg-white text-gray-600 rounded-md hover:bg-gray-100 hover:shadow-sm transition-all duration-300 ease-out"
            title="Tháng sau"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-1 order-2">
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => onDateFilterChange({ ...dateFilter, startDate: e.target.value })}
            className="px-2 py-1 bg-white text-[10px] sm:text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-[85px] sm:w-[100px] lg:w-[110px]"
            title="Từ ngày"
          />
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => onDateFilterChange({ ...dateFilter, endDate: e.target.value })}
            className="px-2 py-1 bg-white text-[10px] sm:text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-[85px] sm:w-[100px] lg:w-[110px]"
            title="Đến ngày"
          />
        </div>

        {/* Search */}
        <div className="order-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm công ty..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-2 py-1 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[110px] md:w-[125px] lg:w-[135px]"
          />
        </div>

        {/* Employee Filter */}
        <div className="order-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Lọc nhân viên..."
            value={employeeFilter}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="px-2 py-1 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[110px] md:w-[125px] lg:w-[135px]"
          />
        </div>

        {/* Status Filter */}
        <div className="order-5">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-2 py-1 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out cursor-pointer w-[90px] sm:w-[105px] lg:w-[120px]"
          >
            <option value="">Tất cả</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Gold Filter */}
        <div className="order-6">
          <label className="flex items-center cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-300 ease-out">
            <input
              type="checkbox"
              checked={showGold}
              onChange={(e) => onGoldChange(e.target.checked)}
              className="mr-1 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-200 scale-90"
            />
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Gold</span>
          </label>
        </div>

        {/* Reset Button */}
        <div className="order-7">
          <button
            onClick={onReset}
            className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-300 ease-out whitespace-nowrap"
            title="Xóa tất cả bộ lọc"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default GlobalFilters