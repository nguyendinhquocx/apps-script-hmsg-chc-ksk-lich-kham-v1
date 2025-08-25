import { useState, useEffect, useCallback, useMemo } from 'react'
import { TraHoSoService } from '../services/supabase'

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export const useTraHoSoData = (initialFilters = {}) => {
  // State management
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize] = useState(1000) // Debug: hiển thị tất cả để thấy ưu tiên 1,2

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'Chưa trả', // Focus on unreturned files to see priorities 1,2,3
    examStatus: 'Đã khám xong', // Focus on completed exams
    employee: '',
    priority: '',
    sortBy: 'ngay cuoi tra ho so', // Server đã sắp xếp theo priority
    sortOrder: 'desc',
    ...initialFilters
  })

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300)

  // Fetch data từ Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const options = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm, // Use debounced search
        status: filters.status,
        examStatus: filters.examStatus,
        employee: filters.employee,
        priority: filters.priority,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }

      const result = await TraHoSoService.getTraHoSoData(options)

      if (result.error) {
        throw new Error(result.error)
      }

      setData(result.data)
      setFilteredData(result.data)
      setTotalRecords(result.count)

    } catch (err) {
      console.error('Error fetching TraHoSo data:', err)
      setError(err.message)
      setData([])
      setFilteredData([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearchTerm, filters.status, filters.examStatus, filters.employee, filters.priority, filters.sortBy, filters.sortOrder])

  // Fetch statistics separately for ALL filtered data (không phân trang)
  const fetchStatistics = useCallback(async () => {
    try {
      const options = {
        page: 1,
        limit: 10000, // Lấy tất cả để tính statistics
        search: debouncedSearchTerm,
        status: filters.status,
        examStatus: filters.examStatus,
        employee: filters.employee,
        priority: filters.priority,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }

      const result = await TraHoSoService.getTraHoSoData(options)
      
      if (result.error) {
        console.error('Statistics fetch error:', result.error)
        return
      }

      // Tính toán statistics từ toàn bộ data
      const priorityStats = {
        'Ưu tiên 1': 0,
        'Ưu tiên 2': 0, 
        'Ưu tiên 3': 0,
        'X': 0
      }

      result.data.forEach(record => {
        const priority = record.uuTien
        if (priorityStats.hasOwnProperty(priority)) {
          priorityStats[priority]++
        }
      })

      setStatistics({
        totalRecords: result.data.length,
        priorityStats
      })

    } catch (err) {
      console.error('Error fetching statistics:', err)
    }
  }, [debouncedSearchTerm, filters.status, filters.examStatus, filters.employee, filters.priority, filters.sortBy, filters.sortOrder])

  // Load data on mount và khi dependencies thay đổi
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch statistics when filters change
  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  // Filter functions
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    // Reset về trang 1 khi filter
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [currentPage])

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'Chưa trả',
      examStatus: 'Đã khám xong',
      employee: '',
      priority: '',
      sortBy: 'ngay cuoi tra ho so', // Server sắp xếp theo priority rồi
      sortOrder: 'desc'
    })
    setCurrentPage(1)
  }, [])

  // Pagination functions
  const goToPage = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(totalRecords / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [currentPage, totalRecords, pageSize])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  // Refresh data
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Export functions
  const exportToExcel = useCallback(() => {
    if (filteredData && filteredData.length > 0) {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `tra_ho_so_export_${timestamp}.xlsx`
      TraHoSoService.downloadTraHoSoExcel(filteredData, filename)
    } else {
      console.warn('Không có dữ liệu để export')
    }
  }, [filteredData])

  // Get unique values for filter options
  const getUniqueValues = useCallback((field) => {
    const values = new Set()
    data.forEach(record => {
      const value = record[field]
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    return Array.from(values).sort()
  }, [data])

  // Get employee list for filter
  const employeeList = getUniqueValues('ten nhan vien')

  // Get priority list for filter  
  const priorityList = ['Ưu tiên 1', 'Ưu tiên 2', 'Ưu tiên 3', 'X']

  // Get status list for filter
  const statusList = ['Đã trả', 'Chưa trả']

  // Calculate pagination info
  const totalPages = Math.ceil(totalRecords / pageSize)
  const startRecord = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endRecord = Math.min(currentPage * pageSize, totalRecords)

  return {
    // Data
    data: filteredData,
    loading,
    searchLoading,
    error,
    statistics,

    // Pagination
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    startRecord,
    endRecord,

    // Filters
    filters,
    employeeList,
    priorityList,
    statusList,

    // Actions
    updateFilter,
    resetFilters,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    exportToExcel,

    // Utility
    getUniqueValues
  }
}

export default useTraHoSoData