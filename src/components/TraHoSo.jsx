import React, { useState } from 'react'
import useTraHoSoData from '../hooks/useTraHoSoData'

const TraHoSo = ({ globalFilters = {}, refreshKey = 0 }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Initialize hook với global filters
  const {
    data,
    loading,
    error,
    statistics,
    currentPage,
    totalPages,
    totalRecords,
    startRecord,
    endRecord,
    filters,
    employeeList,
    priorityList,
    statusList,
    updateFilter,
    resetFilters,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    exportToExcel
  } = useTraHoSoData(globalFilters)

  // Priority colors mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Ưu tiên 1': return 'bg-red-50 border-l-4 border-l-red-500'
      case 'Ưu tiên 2': return 'bg-yellow-50 border-l-4 border-l-yellow-500'
      case 'Ưu tiên 3': return 'bg-blue-50 border-l-4 border-l-blue-500'
      case 'X': return 'bg-green-50 border-l-4 border-l-green-500'
      default: return 'bg-gray-50'
    }
  }

  // Status colors mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã trả': return 'bg-green-100 text-green-800'
      case 'Chưa trả': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  // Priority summary cards - theo triết lý tối giản AGENTS.md
  const PrioritySummary = () => {
    const { priorityStats = {} } = statistics
    
    return (
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6">
          <p className="text-sm font-bold text-black mb-1">Ưu tiên 1</p>
          <p className="text-3xl font-bold text-black">{priorityStats['Ưu tiên 1'] || 0}</p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <p className="text-sm font-bold text-black mb-1">Ưu tiên 2</p>
          <p className="text-3xl font-bold text-black">{priorityStats['Ưu tiên 2'] || 0}</p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <p className="text-sm font-bold text-black mb-1">Ưu tiên 3</p>
          <p className="text-3xl font-bold text-black">{priorityStats['Ưu tiên 3'] || 0}</p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <p className="text-sm font-bold text-black mb-1">Hoàn thành</p>
          <p className="text-3xl font-bold text-black">{priorityStats['X'] || 0}</p>
        </div>
      </div>
    )
  }

  // Loading state - theo triết lý tối giản
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-black">Đang tải dữ liệu...</span>
      </div>
    )
  }

  // Error state - theo triết lý tối giản
  if (error) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div>
          <h3 className="text-sm font-bold text-black">Lỗi tải dữ liệu</h3>
          <p className="text-sm text-black mt-1">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Priority Summary Cards */}
      <PrioritySummary />

      {/* Controls - theo triết lý tối giản */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search - không icon */}
          <input
            type="text"
            placeholder="Tìm kiếm công ty..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-50 transition-colors outline-none"
          />

          {/* Filter Toggle - không icon */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors ${
              showFilters ? 'font-bold' : ''
            }`}
          >
            Bộ lọc
          </button>

          {/* Refresh - không icon */}
          <button
            onClick={refresh}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            Làm mới
          </button>
        </div>

        {/* Export - không icon */}
        <button
          onClick={exportToExcel}
          disabled={!data || data.length === 0}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Xuất Excel
        </button>
      </div>

      {/* Advanced Filters - theo triết lý tối giản */}
      {showFilters && (
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Nhân viên
              </label>
              <select
                value={filters.employee}
                onChange={(e) => updateFilter('employee', e.target.value)}
                className="w-full px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-50 transition-colors outline-none"
              >
                <option value="">Tất cả</option>
                {employeeList.map(employee => (
                  <option key={employee} value={employee}>{employee}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-50 transition-colors outline-none"
              >
                <option value="">Tất cả</option>
                {statusList.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Ưu tiên
              </label>
              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
                className="w-full px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-50 transition-colors outline-none"
              >
                <option value="">Tất cả</option>
                {priorityList.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table - theo triết lý AGENTS.md: không viền, text đen, chỉ 1 đường xám nhạt dưới tiêu đề */}
      <div className="bg-white rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Ưu tiên
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Nhân viên
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Công ty
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Số người
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Ngày cuối trả
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Số ngày trễ
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.map((record) => (
                <tr 
                  key={record.ID}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-black">
                      {record.uuTien}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">
                      {record['ten nhan vien'] || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black max-w-xs truncate">
                      {record['ten cong ty'] || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {record['so nguoi kham'] || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {formatDate(record['ngay cuoi tra ho so'])}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-black">
                      {record.soNgayTre === 'OK' ? 'OK' : 
                       record.soNgayTre ? `${record.soNgayTre} ngày` : 
                       'Chưa đến hạn'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-black">
                      {record.traHoSoStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black max-w-xs truncate">
                      {record['ghi chu'] || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State - theo triết lý tối giản */}
        {data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black">Không có dữ liệu để hiển thị</p>
          </div>
        )}

        {/* Pagination - theo triết lý tối giản, không viền */}
        {totalRecords > 0 && (
          <div className="bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-black">
                    Hiển thị{' '}
                    <span className="font-bold">{startRecord}</span>
                    {' '}-{' '}
                    <span className="font-bold">{endRecord}</span>
                    {' '}trong{' '}
                    <span className="font-bold">{totalRecords}</span>
                    {' '}kết quả
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 bg-white text-black rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chi tiết hồ sơ</h3>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Công ty:</span>
                  <p className="text-gray-900">{selectedRecord['ten cong ty'] || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Nhân viên:</span>
                  <p className="text-gray-900">{selectedRecord['ten nhan vien'] || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Số người khám:</span>
                  <p className="text-gray-900">{selectedRecord['so nguoi kham'] || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Ưu tiên:</span>
                  <p className="text-gray-900">{selectedRecord.uuTien || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Ngày kết thúc khám:</span>
                  <p className="text-gray-900">{formatDate(selectedRecord['ngay ket thuc kham'])}</p>
                </div>
                <div>
                  <span className="font-medium">Ngày cuối trả hồ sơ:</span>
                  <p className="text-gray-900">{formatDate(selectedRecord['ngay cuoi tra ho so'])}</p>
                </div>
                <div>
                  <span className="font-medium">Trạng thái trả:</span>
                  <p className="text-gray-900">{selectedRecord.traHoSoStatus || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Số ngày trễ:</span>
                  <p className="text-gray-900">{selectedRecord.soNgayTre || '-'}</p>
                </div>
              </div>
              {selectedRecord['ghi chu'] && (
                <div>
                  <span className="font-medium">Ghi chú:</span>
                  <p className="text-gray-900 mt-1">{selectedRecord['ghi chu']}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TraHoSo