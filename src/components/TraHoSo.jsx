import React, { useState } from 'react'
import useTraHoSoData from '../hooks/useTraHoSoData'

const TraHoSo = ({ globalFilters = {}, refreshKey = 0 }) => {
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Initialize hook với global filters
  const {
    data,
    loading,
    searchLoading,
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
          <p className="text-3xl font-bold text-black">{priorityStats['X'] || "[x]"}</p>
        </div>
      </div>
    )
  }

  // Loading state - theo triết lý tối giản
  // Chỉ hiển thị loading khi initial load hoặc khi không có data
  if (loading && data.length === 0) {
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

      {/* Filters - theo style GlobalFilters */}
      <div className="w-full p-3 sm:p-4 lg:p-6 mb-6 lg:mb-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 items-end">
          
          {/* Search */}
          <div className="order-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Tìm công ty..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[140px] md:w-[160px] lg:w-[180px]"
            />
          </div>

          {/* Employee Filter */}
          <div className="order-2 w-full sm:w-auto">
            <select
              value={filters.employee}
              onChange={(e) => updateFilter('employee', e.target.value)}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[140px] md:w-[160px] lg:w-[180px]"
            >
              <option value="">Tất cả nv</option>
              {employeeList.map(employee => (
                <option key={employee} value={employee}>{employee}</option>
              ))}
            </select>
          </div>

          {/* Exam Status Filter */}
          <div className="order-3 w-full sm:w-auto">
            <select
              value={filters.examStatus}
              onChange={(e) => updateFilter('examStatus', e.target.value)}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[140px] md:w-[160px] lg:w-[180px]"
            >
              <option value="">Tất cả trạng thái khám</option>
              <option value="Đã khám xong">Đã khám xong</option>
              <option value="Chưa khám xong">Chưa khám xong</option>
            </select>
          </div>

          {/* Return Status Filter */}
          <div className="order-4 w-full sm:w-auto">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[140px] md:w-[160px] lg:w-[180px]"
            >
              <option value="">Trả hồ sơ</option>
              {statusList.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="order-5 w-full sm:w-auto">
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out w-full sm:w-[140px] md:w-[160px] lg:w-[180px]"
            >
              <option value="">Tất cả ưu tiên</option>
              {priorityList.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 order-6">
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-300 ease-out"
            >
              Reset
            </button>
            <button
              onClick={exportToExcel}
              disabled={data.length === 0}
              className="px-3 py-2 bg-white text-xs rounded-lg hover:bg-gray-100 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out"
            >
              Xuất Excel
            </button>
          </div>

        </div>
      </div>


      {/* Table - theo triết lý AGENTS.md: không viền, text đen, chỉ 1 đường xám nhạt dưới tiêu đề */}
      <div className="bg-white rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Công ty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Số người
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Thực tế
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Số ngày trễ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Trạng thái khám
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Trả hồ sơ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Ghi chú
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-black">
                  Bảng kê
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {(() => {
                let currentPriority = null
                return data.map((record, index) => {
                  const showGroupHeader = currentPriority !== record.uuTien
                  if (showGroupHeader) {
                    currentPriority = record.uuTien
                  }

                  return (
                    <React.Fragment key={record.ID}>
                      {showGroupHeader && (
                        <tr className="bg-gray-100">
                          <td colSpan="10" className="px-4 py-2">
                            <span className="text-sm font-bold text-black">
                              {record.uuTien} ({data.filter(r => r.uuTien === record.uuTien).length})
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-xs text-black">
                            {record['ten nhan vien'] || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-black max-w-xs truncate">
                            {record['ten cong ty'] || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-black">
                          {record['so nguoi kham'] || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-black">
                          {formatDate(record['ngay ket thuc kham'])}
                        </td>
                        <td className="px-4 py-3 text-xs text-black">
                          {formatDate(record['ngay ket thuc kham thuc te'])}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-black">
                            {record.soNgayTre === 'OK' ? 'OK' : 
                             record.soNgayTre ? `${record.soNgayTre}` : 
                             'Chưa đến hạn'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${
                            record['trang thai kham'] === 'Đã khám xong' ? 'text-blue-600' :
                            'text-black'
                          }`}>
                            {record['trang thai kham'] || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${
                            record.traHoSoStatus === 'Chưa trả' ? 'text-red-600' :
                            record.traHoSoStatus === 'Đã trả' ? 'text-blue-600' :
                            'text-black'
                          }`}>
                            {record.traHoSoStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-black max-w-xs truncate">
                            {record['ghi chu'] || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-black">
                            {record['ngay gui bang ke'] ? 'Có' : 'Chưa'}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>

        {/* Empty State - theo triết lý tối giản */}
        {data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black">Không có dữ liệu để hiển thị</p>
          </div>
        )}

      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedRecord(null)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 break-words uppercase">
                {selectedRecord['ten cong ty']}
              </h3>
            </div>

            {/* Record Details */}
            <div className="space-y-2">
              {/* Priority */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Ưu tiên:</span>
                <span className="text-sm text-gray-900">{selectedRecord.uuTien || '-'}</span>
              </div>
              
              {/* Employee */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Nhân viên phụ trách:</span>
                <span className="text-sm text-gray-900">{selectedRecord['ten nhan vien'] || '-'}</span>
              </div>
              
              {/* Number of people */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Số người khám:</span>
                <span className="text-sm text-gray-900">{selectedRecord['so nguoi kham'] ? selectedRecord['so nguoi kham'].toLocaleString('vi-VN') : '-'} người</span>
              </div>
              
              {/* End date */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Ngày kết thúc khám:</span>
                <span className="text-sm text-gray-900">{formatDate(selectedRecord['ngay ket thuc kham'])}</span>
              </div>
              
              {/* Actual end date - only show if exists and different */}
              {selectedRecord['ngay ket thuc kham thuc te'] && selectedRecord['ngay ket thuc kham thuc te'] !== selectedRecord['ngay ket thuc kham'] && (
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Ngày kết thúc thực tế:</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedRecord['ngay ket thuc kham thuc te'])}</span>
                </div>
              )}
              
              {/* Return deadline */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Ngày cuối trả hồ sơ:</span>
                <span className="text-sm text-gray-900">{formatDate(selectedRecord['ngay cuoi tra ho so'])}</span>
              </div>
              
              {/* Days overdue */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Số ngày trễ:</span>
                <span className="text-sm text-gray-900">
                  {selectedRecord.soNgayTre === 'OK' ? 'OK' : 
                   selectedRecord.soNgayTre ? `${selectedRecord.soNgayTre} ngày` : 
                   'Chưa đến hạn'}
                </span>
              </div>
              
              {/* Exam status */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Trạng thái khám:</span>
                <span className={`text-sm ${selectedRecord['trang thai kham'] === 'Đã khám xong' ? 'text-blue-600' : 'text-gray-900'}`}>
                  {selectedRecord['trang thai kham'] || '-'}
                </span>
              </div>
              
              {/* Return status */}
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-600">Trạng thái trả:</span>
                <span className={`text-sm ${
                  selectedRecord.traHoSoStatus === 'Chưa trả' ? 'text-red-600' :
                  selectedRecord.traHoSoStatus === 'Đã trả' ? 'text-blue-600' :
                  'text-gray-900'
                }`}>
                  {selectedRecord.traHoSoStatus || '-'}
                </span>
              </div>
              
              {/* Notes - only show if exists */}
              {selectedRecord['ghi chu'] && (
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Ghi chú:</span>
                  <span className="text-sm text-gray-900 text-right max-w-xs break-words">
                    {selectedRecord['ghi chu']}
                  </span>
                </div>
              )}
              
              {/* Bảng kê */}
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-600">Bảng kê:</span>
                <span className="text-sm text-gray-900">
                  {selectedRecord['ngay gui bang ke'] ? 
                    `Đã gửi (${formatDate(selectedRecord['ngay gui bang ke'])})` : 
                    'Chưa gửi'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TraHoSo