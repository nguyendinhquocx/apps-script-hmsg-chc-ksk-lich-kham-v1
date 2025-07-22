import React, { useState, useEffect, useMemo } from 'react'
import { Download, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import LichKhamService from '../services/supabase'
import StatsCards from './StatsCards'
import LineChart from './LineChart'
import { matchesSearch, isDateInMonth } from '../utils/vietnamese'

const DataTable = ({ globalFilters = {} }) => {
  // State management
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)


  
  // Extract global filters
  const { searchTerm = '', statusFilter = '', employeeFilter = '', showGold = false, monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() } } = globalFilters
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(1000) // Show all records by default
  
  // Sorting states
  const [sortBy, setSortBy] = useState('ngay bat dau kham')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Available status options
  const [statusOptions, setStatusOptions] = useState([
    'Đã khám xong',
    'Chưa khám xong'
  ])

  // Fetch data function
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await LichKhamService.getLichKhamData({
        page: 1,
        limit: 10000, // Get all data for client-side filtering
        search: '',
        status: '',
        employee: '',
        showGold: false,
        sortBy: sortBy,
        sortOrder: sortOrder
      })
      
      if (result.error) {
        setError(result.error)
        setData([])
        setTotalCount(0)
      } else {
        // Apply client-side filtering
        let filteredData = result.data
        
        // Filter by search term
        if (searchTerm) {
          filteredData = filteredData.filter(item => 
            matchesSearch(item['ten cong ty'], searchTerm)
          )
        }
        
        // Filter by status
        if (statusFilter) {
          filteredData = filteredData.filter(item => 
            item['trang thai kham'] === statusFilter
          )
        }
        
        // Filter by employee (with diacritics support)
        if (employeeFilter) {
          filteredData = filteredData.filter(item => 
            matchesSearch(item['ten nhan vien'], employeeFilter)
          )
        }
        
        // Filter by Gold
        if (showGold) {
          filteredData = filteredData.filter(item => 
            item['gold'] === 'x' || item['gold'] === 'X'
          )
        }
        
        // Filter by month
        if (monthFilter) {
          filteredData = filteredData.filter(item => {
            const startDate = item['ngay bat dau kham']
            const endDate = item['ngay ket thuc kham']
            return isDateInMonth(startDate, monthFilter.month, monthFilter.year) ||
                   isDateInMonth(endDate, monthFilter.month, monthFilter.year)
          })
        }
        
        // Apply pagination
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedData = filteredData.slice(startIndex, endIndex)
        
        setData(paginatedData)
        setTotalCount(filteredData.length)
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu')
      setData([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }





  // Effect to fetch data when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when filters change
      fetchData()
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [globalFilters, sortBy, sortOrder])

  // Effect to fetch data when page changes
  useEffect(() => {
    fetchData()
  }, [currentPage, pageSize])

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize)
  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalCount)

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      setLoading(true)
      // Get all filtered data
      const result = await LichKhamService.getLichKhamData({
        page: 1,
        limit: 10000,
        search: '',
        status: '',
        employee: '',
        showGold: false,
        sortBy: sortBy,
        sortOrder: sortOrder
      })
      
      if (result.error) {
        setError('Không thể export dữ liệu: ' + result.error)
        return
      }
      
      // Apply same filters as display
      let filteredData = result.data
      
      if (searchTerm) {
        filteredData = filteredData.filter(item => 
          matchesSearch(item['ten cong ty'], searchTerm)
        )
      }
      
      if (statusFilter) {
        filteredData = filteredData.filter(item => 
          item['trang thai kham'] === statusFilter
        )
      }
      
      if (employeeFilter) {
        filteredData = filteredData.filter(item => 
          matchesSearch(item['ten nhan vien'], employeeFilter)
        )
      }
      
      if (showGold) {
        filteredData = filteredData.filter(item => 
          item['gold'] === 'x' || item['gold'] === 'X'
        )
      }
      
      if (monthFilter) {
        filteredData = filteredData.filter(item => {
          const startDate = item['ngay bat dau kham']
          const endDate = item['ngay ket thuc kham']
          return isDateInMonth(startDate, monthFilter.month, monthFilter.year) ||
                 isDateInMonth(endDate, monthFilter.month, monthFilter.year)
        })
      }
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `lich_kham_${timestamp}.csv`
      
      LichKhamService.downloadCSV(filteredData, filename)
    } catch (err) {
      setError('Có lỗi xảy ra khi export CSV')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      setLoading(true)
      // Get all filtered data (same logic as CSV)
      const result = await LichKhamService.getLichKhamData({
        page: 1,
        limit: 10000,
        search: '',
        status: '',
        employee: '',
        showGold: false,
        sortBy: sortBy,
        sortOrder: sortOrder
      })
      
      if (result.error) {
        setError('Không thể export dữ liệu: ' + result.error)
        return
      }
      
      // Apply same filters as display
      let filteredData = result.data
      
      if (searchTerm) {
        filteredData = filteredData.filter(item => 
          matchesSearch(item['ten cong ty'], searchTerm)
        )
      }
      
      if (statusFilter) {
        filteredData = filteredData.filter(item => 
          item['trang thai kham'] === statusFilter
        )
      }
      
      if (employeeFilter) {
        filteredData = filteredData.filter(item => 
          matchesSearch(item['ten nhan vien'], employeeFilter)
        )
      }
      
      if (showGold) {
        filteredData = filteredData.filter(item => 
          item['gold'] === 'x' || item['gold'] === 'X'
        )
      }
      
      if (monthFilter) {
        filteredData = filteredData.filter(item => {
          const startDate = item['ngay bat dau kham']
          const endDate = item['ngay ket thuc kham']
          return isDateInMonth(startDate, monthFilter.month, monthFilter.year) ||
                 isDateInMonth(endDate, monthFilter.month, monthFilter.year)
        })
      }
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `lich_kham_${timestamp}.xlsx`
      
      // Convert to Excel format
      LichKhamService.downloadExcel(filteredData, filename)
    } catch (err) {
      setError('Có lỗi xảy ra khi export Excel')
    } finally {
      setLoading(false)
    }
  }



  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    } catch {
      return dateString
    }
  }

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase().trim()
    if (statusLower.includes('đã khám xong') || statusLower.includes('da kham xong')) {
      return 'status-badge status-completed'
    }
    if (statusLower.includes('đang khám') || statusLower.includes('dang kham')) {
      return 'status-badge status-in-progress'
    }
    if (statusLower.includes('hủy') || statusLower.includes('huy')) {
      return 'status-badge status-cancelled'
    }
    return 'status-badge status-pending'
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <StatsCards data={data} />
      
      {/* Line Chart */}
      <LineChart data={data} />
      
      {/* Data Table */}
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
              onClick={handleExportCSV}
              disabled={loading || totalCount === 0}
              className="btn btn-primary px-4 py-2"
              title="Xuất file CSV"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={loading || totalCount === 0}
              className="btn btn-secondary px-4 py-2"
              title="Xuất file Excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Lỗi:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner w-8 h-8 mr-3"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
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
                      <span className={getStatusBadgeClass(record['trang thai kham'])}>
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
        </div>
      )}

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="select w-20"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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
    </div>
  )
}

export default DataTable