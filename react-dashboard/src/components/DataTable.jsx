import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, CheckCircle } from 'lucide-react'
import { LichKhamService } from '../services/supabase'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useNotifications } from './NotificationSystem'
import LoadingSpinner, { LoadingOverlay, TableSkeleton, LoadingButton } from './LoadingSpinner'
import { 
  UI_CONFIG, 
  STATUS_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  EXPORT_CONFIG,
  FEATURES 
} from '../constants'
import { 
  formatDate, 
  formatDateTime, 
  getStatusBadgeClass, 
  normalizeStatus,
  sanitizeInput,
  validatePaginationParams,
  debounce,
  getErrorMessage,
  downloadFile
} from '../utils'

const DataTable = ({ onDataUpdate }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 0, resetTime: 0 })
  const { showSuccess, showError, showWarning } = useNotifications()


  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [goldFilter, setGoldFilter] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(UI_CONFIG.PAGINATION?.PAGE_SIZE_OPTIONS?.[1] || 20)
  
  // Sorting states
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Available status options (sẽ được cập nhật từ dữ liệu thực tế)
  const [statusOptions, setStatusOptions] = useState([
    'Đã khám xong',
    'Chưa khám xong',
    'Đang khám',
    'Hủy khám'
  ])

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // Test connection to Supabase first
    try {
      console.log('Testing Supabase connection...')
      const connectionTest = await LichKhamService.testConnection()
      console.log('Connection test result:', connectionTest)
      
      if (!connectionTest.success) {
        throw new Error(`Supabase connection failed: ${connectionTest.error}`)
      }
    } catch (connErr) {
      console.error('Connection test error:', connErr)
      setError(`Lỗi kết nối Supabase: ${connErr.message}`)
      showError('Lỗi kết nối Supabase', connErr.message)
      setLoading(false)
      return
    }
    
    try {
      const result = await LichKhamService.getLichKhamData({
        page: currentPage,
        limit: itemsPerPage,
        search: sanitizeInput(searchTerm),
        status: statusFilter,
        employee: employeeFilter,
        goldStatus: goldFilter,
        sortBy,
        sortOrder
      })
      
      setData(result.data || [])
      setTotalCount(result.count || 0)
      
      // Update rate limit info
      if (result.rateLimitInfo) {
        setRateLimitInfo(result.rateLimitInfo)
      }
      
      // Notify parent component about data update
      if (onDataUpdate) {
        onDataUpdate(result.data || [])
      }
      
      if (result.data?.length > 0) {
        showSuccess('Tải dữ liệu thành công', `Đã tải ${result.data.length} bản ghi`)
      }
    } catch (err) {
      if (FEATURES.DEBUG_LOGS) {
        console.error('Error fetching data:', err)
      }
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Lỗi tải dữ liệu', errorMsg)
      setData([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, employeeFilter, goldFilter, sortBy, sortOrder, onDataUpdate])





  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      setCurrentPage(1)
      fetchData()
    }, UI_CONFIG.DEBOUNCE_DELAY || 300),
    []
  )

  // Effect for search term changes
  useEffect(() => {
    if (searchTerm !== undefined) {
      debouncedSearch(searchTerm)
    }
  }, [searchTerm, debouncedSearch])

  // Auto-clear error messages (success messages handled by notification system)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000) // 5 seconds timeout
      return () => clearTimeout(timer)
    }
  }, [error])

  // Effect to fetch data when filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchData()
  }, [statusFilter, employeeFilter, goldFilter, sortBy, sortOrder])

  // Effect to fetch data when page changes
  useEffect(() => {
    fetchData()
  }, [currentPage, itemsPerPage])

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startRecord = (currentPage - 1) * itemsPerPage + 1
  const endRecord = Math.min(currentPage * itemsPerPage, totalCount)

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      // Lấy tất cả dữ liệu với filter hiện tại (không phân trang)
      const result = await LichKhamService.getLichKhamData({
        page: 1,
        limit: EXPORT_CONFIG.MAX_EXPORT_RECORDS,
        search: sanitizeInput(searchTerm),
        status: statusFilter,
        employee: employeeFilter,
        goldStatus: goldFilter,
        sortBy,
        sortOrder
      })
      
      if (result.error) {
        setError(ERROR_MESSAGES.EXPORT_FAILED + ': ' + result.error)
        return
      }
      
      const timestamp = format(new Date(), EXPORT_CONFIG.FILENAME_DATE_FORMAT)
      const filename = `${EXPORT_CONFIG.FILENAME_PREFIX}_${timestamp}.csv`
      
      downloadFile(result.data, filename, 'csv')
      showSuccess('Xuất dữ liệu thành công', `Đã xuất ${result.data.length} bản ghi`)
    } catch (err) {
      if (FEATURES.DEBUG_LOGS) {
        console.error('Export error:', err)
      }
      const errorMsg = getErrorMessage(err, ERROR_MESSAGES.EXPORT_FAILED)
      setError(errorMsg)
      showError('Lỗi xuất dữ liệu', errorMsg)
    } finally {
      setIsExporting(false)
    }
  }

  // Memoized unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(data.map(item => item[STATUS_CONFIG.COLUMN_NAME]).filter(Boolean))]
    return statuses.sort()
  }, [data])

  const uniqueEmployees = useMemo(() => {
    const employees = [...new Set(data.map(item => item['ten nhan vien']).filter(Boolean))]
    return employees.sort()
  }, [data])

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setEmployeeFilter('')
    setGoldFilter('')
    setCurrentPage(1)
    showSuccess('Đã reset bộ lọc', 'Tất cả bộ lọc đã được xóa')
  }

  return (
    <div className="card p-6">




      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Danh sách lịch khám</h2>
          <p className="text-gray-600">
            Hiển thị {startRecord}-{endRecord} trong tổng số {totalCount} bản ghi
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <button
            onClick={resetFilters}
            className="btn btn-outline px-4 py-2"
            title="Xóa bộ lọc"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </button>
          
          <LoadingButton
            onClick={handleExport}
            loading={isExporting}
            disabled={loading || data.length === 0}
            loadingText="Đang xuất..."
            className="btn btn-primary px-4 py-2"
            title="Xuất file CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </LoadingButton>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Employee Filter */}
        <div>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="select"
          >
            <option value="">Tất cả nhân viên</option>
            {uniqueEmployees.map(employee => (
              <option key={employee} value={employee}>{employee}</option>
            ))}
          </select>
        </div>

        {/* Gold Filter */}
        <div>
          <select
            value={goldFilter}
            onChange={(e) => setGoldFilter(e.target.value)}
            className="select"
          >
            <option value="">Tất cả Gold status</option>
            <option value="gold">Chỉ Gold</option>
            <option value="non-gold">Không Gold</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Lỗi:</p>
            <p>{error}</p>
          </div>
        </div>
      )}



      {/* Loading State */}
      {loading && (
        <div className="py-12">
          <LoadingSpinner 
            size="lg" 
            text="Đang tải dữ liệu..." 
            className="py-8"
          />
        </div>
      )}

      {/* Table */}
      <LoadingOverlay loading={loading} className="overflow-x-auto">
        {!loading && data.length > 0 ? (
          <table className="table">
            <thead className="table-header">
              <tr>
                <th 
                  className="table-head cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ten cong ty')}
                >
                  <div className="flex items-center">
                    Tên Công Ty
                    {sortBy === 'ten cong ty' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="table-head cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ngay bat dau kham')}
                >
                  <div className="flex items-center">
                    Ngày Bắt Đầu
                    {sortBy === 'ngay bat dau kham' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="table-head cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('ngay ket thuc kham')}
                >
                  <div className="flex items-center">
                    Ngày Kết Thúc
                    {sortBy === 'ngay ket thuc kham' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="table-head cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('so nguoi kham')}
                >
                  <div className="flex items-center">
                    Số Người Khám
                    {sortBy === 'so nguoi kham' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="table-head">Trạng Thái</th>
                <th className="table-head">Nhân Viên</th>
                <th className="table-head">Sáng/Chiều</th>
                <th className="table-head">Gold</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-cell text-center py-12 text-gray-500">
                    {error ? 'Có lỗi xảy ra khi tải dữ liệu' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                data.map((record, index) => (
                  <tr key={record['ID'] || record.id || index} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">
                        {record['ten cong ty'] || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      {formatDate(record['ngay bat dau kham'])}
                    </td>
                    <td className="table-cell">
                      {formatDate(record['ngay ket thuc kham'])}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-primary-600">
                        {record['so nguoi kham'] || 0}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadgeClass(normalizeStatus(record['trang thai kham']))}>
                        {record['trang thai kham'] || 'Không xác định'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-gray-700">
                        {record['ten nhan vien'] || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div>S: {record['trung binh ngay sang'] || 0}</div>
                        <div>C: {record['trung binh ngay chieu'] || 0}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {(record['gold'] === 'x' || record['gold'] === 'X') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ Gold
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : !loading && data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">Không có dữ liệu</p>
            <p className="text-gray-400 text-sm">Thử thay đổi bộ lọc hoặc tải lại trang</p>
          </div>
        ) : (
          <TableSkeleton rows={10} columns={8} />
        )}
      </LoadingOverlay>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Hiển thị:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="select w-20"
            >
              {(UI_CONFIG.PAGINATION?.PAGE_SIZE_OPTIONS || [10, 20, 50, 100]).map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-gray-700">bản ghi</span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Page Info */}
          <div className="text-sm text-gray-700">
            Trang {currentPage} / {totalPages}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable