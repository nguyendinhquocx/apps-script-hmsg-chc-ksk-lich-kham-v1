import { useState, useEffect } from 'react'
import LichKhamService from '../services/supabase'
import { matchesSearch, isDateInMonth } from '../utils/vietnamese'
import { getExamCountForDate } from '../utils/examUtils'

export const useTableData = (globalFilters, sortBy, sortOrder, currentPage, pageSize) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  // Extract global filters
  const { 
    searchTerm = '', 
    statusFilter = '', 
    employeeFilter = '', 
    showGold = false, 
    monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
    dateFilter = { startDate: '', endDate: '' } 
  } = globalFilters

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
        
        // Filter by Gold - Show only Gold companies when checkbox is checked, show all when unchecked
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
        
        // Filter by date range
        if (dateFilter.startDate || dateFilter.endDate) {
          filteredData = filteredData.filter(item => {
            const startDate = item['ngay bat dau kham']
            const endDate = item['ngay ket thuc kham']
            
            if (dateFilter.startDate && dateFilter.endDate) {
              // Both dates specified - check if examination period overlaps with filter range
              const filterStart = new Date(dateFilter.startDate + 'T00:00:00')
              const filterEnd = new Date(dateFilter.endDate + 'T00:00:00')
              const examStart = new Date(startDate + 'T00:00:00')
              const examEnd = new Date((endDate || startDate) + 'T00:00:00')
              
              return (examStart <= filterEnd && examEnd >= filterStart)
            } else if (dateFilter.startDate) {
              // Only start date specified
              const filterStart = new Date(dateFilter.startDate + 'T00:00:00')
              const examEnd = new Date((endDate || startDate) + 'T00:00:00')
              return examEnd >= filterStart
            } else if (dateFilter.endDate) {
              // Only end date specified
              const filterEnd = new Date(dateFilter.endDate + 'T00:00:00')
              const examStart = new Date(startDate + 'T00:00:00')
              return examStart <= filterEnd
            }
            
            return true
          })
        }
        
        // Custom sorting: "Chưa khám xong" first, then "Đã khám xong"
        filteredData = filteredData.sort((a, b) => {
          const statusA = a['trang thai kham']
          const statusB = b['trang thai kham']
          const today = new Date()
          
          // Priority: "Chưa khám xong" comes first
          if (statusA === 'Chưa khám xong' && statusB !== 'Chưa khám xong') {
            return -1
          }
          if (statusA !== 'Chưa khám xong' && statusB === 'Chưa khám xong') {
            return 1
          }
          
          // Within same status group, sort differently
          if (statusA === 'Chưa khám xong' && statusB === 'Chưa khám xong') {
            // For companies currently being examined, sort by today's exam count (descending)
            const todayCountA = getExamCountForDate(a, today)
            const todayCountB = getExamCountForDate(b, today)
            
            if (todayCountA !== todayCountB) {
              return todayCountB - todayCountA
            }
            
            // If today's count is same, fallback to total people count
            const peopleA = parseInt(a['so nguoi kham']) || 0
            const peopleB = parseInt(b['so nguoi kham']) || 0
            return peopleB - peopleA
          } else {
            // For completed companies, sort by total số người khám (descending) as before
            const peopleA = parseInt(a['so nguoi kham']) || 0
            const peopleB = parseInt(b['so nguoi kham']) || 0
            return peopleB - peopleA
          }
        })
        
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
      fetchData()
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [globalFilters, sortBy, sortOrder, currentPage, pageSize])

  return {
    data,
    loading,
    error,
    totalCount,
    refetch: fetchData
  }
}
