import React from 'react'
import { Search, Filter, RotateCcw } from 'lucide-react'

const GlobalFilters = ({ 
  searchTerm, 
  setSearchTerm,
  statusFilter, 
  setStatusFilter,
  employeeFilter, 
  setEmployeeFilter,
  showGold, 
  setShowGold,
  onReset
}) => {
  const statusOptions = [
    'Đã khám xong',
    'Chưa khám xong', 
    'Đang khám',
    'Hủy khám'
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc dữ liệu</h3>
        </div>
        <button
          onClick={onReset}
          className="btn btn-outline px-4 py-2 text-sm"
          title="Xóa tất cả bộ lọc"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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

        {/* Gold Filter */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showGold}
              onChange={(e) => setShowGold(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Chỉ hiển thị Gold</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default GlobalFilters