import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import LichKhamService from '../services/supabase'
import StatsCards from './StatsCards'
import LineChart from './LineChart'
import { matchesSearch, isDateInMonth } from '../utils/vietnamese'
import { getDisplayCompanyName, getTooltipCompanyName } from '../utils/companyName'

const DataTable = ({ globalFilters = {} }) => {
  // State management
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)


  
  // Extract global filters
  const { searchTerm = '', statusFilter = '', employeeFilter = '', showGold = false, monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, dateFilter = { startDate: '', endDate: '' } } = globalFilters
  
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
        
        // Custom sorting: "Chưa khám xong" first (by số người khám desc), then "Đã khám xong" (by số người khám desc)
        filteredData = filteredData.sort((a, b) => {
          const statusA = a['trang thai kham']
          const statusB = b['trang thai kham']
          const peopleA = parseInt(a['so nguoi kham']) || 0
          const peopleB = parseInt(b['so nguoi kham']) || 0
          
          // Priority: "Chưa khám xong" comes first
          if (statusA === 'Chưa khám xong' && statusB !== 'Chưa khám xong') {
            return -1
          }
          if (statusA !== 'Chưa khám xong' && statusB === 'Chưa khám xong') {
            return 1
          }
          
          // Within same status group, sort by số người khám (descending)
          return peopleB - peopleA
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


  
  // Handle Excel export
  const handleExportExcel = async () => {
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
      
      // Custom sorting: "Chưa khám xong" first (by số người khám desc), then "Đã khám xong" (by số người khám desc)
      filteredData = filteredData.sort((a, b) => {
        const statusA = a['trang thai kham']
        const statusB = b['trang thai kham']
        const peopleA = parseInt(a['so nguoi kham']) || 0
        const peopleB = parseInt(b['so nguoi kham']) || 0
        
        // Priority: "Chưa khám xong" comes first
        if (statusA === 'Chưa khám xong' && statusB !== 'Chưa khám xong') {
          return -1
        }
        if (statusA !== 'Chưa khám xong' && statusB === 'Chưa khám xong') {
          return 1
        }
        
        // Within same status group, sort by số người khám (descending)
        return peopleB - peopleA
      })
      
      // Prepare data for new table format
      const exportDateRange = getDateRange()
      const exportData = []
      
      // Add header rows
      const dayOfWeekRow = ['', 'Người', ...exportDateRange.map(date => getDayOfWeek(date))]
      const dateRow = ['Tên Công Ty', 'Người', ...exportDateRange.map(date => date.getDate())]
      
      // Add total row
      const totalRow = ['TỔNG', filteredData.reduce((total, record) => total + (parseInt(record['so nguoi kham']) || 0), 0)]
      exportDateRange.forEach(date => {
        const dailyTotal = filteredData.reduce((total, record) => {
          return total + getExamCountForDate(record, date)
        }, 0)
        totalRow.push(dailyTotal || '')
      })
      
      exportData.push(dayOfWeekRow)
      exportData.push(dateRow)
      exportData.push(totalRow)
      
      // Add company data rows
      filteredData.forEach(record => {
        const row = [
          getDisplayCompanyName(record['ten cong ty']) || '-',
          parseInt(record['so nguoi kham'] || 0)
        ]
        
        exportDateRange.forEach(date => {
          const examCount = getExamCountForDate(record, date)
          row.push(examCount || '')
        })
        
        exportData.push(row)
      })
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `lich_kham_${timestamp}.xlsx`
      
      // Convert to Excel format with new structure
      LichKhamService.downloadExcelFromArray(exportData, filename)
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

  // Generate date range for table columns
  const getDateRange = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      // Parse dates carefully to avoid timezone issues
      const start = new Date(dateFilter.startDate + 'T00:00:00')
      const end = new Date(dateFilter.endDate + 'T00:00:00')
      const dates = []
      const current = new Date(start)
      
      while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      return dates
    } else {
      // Default to current month - create dates in local timezone
      const year = monthFilter.year
      const month = monthFilter.month
      const daysInMonth = new Date(year, month, 0).getDate()
      const dates = []
      
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month - 1, day))
      }
      return dates
    }
  }

  // Get day of week in Vietnamese
  const getDayOfWeek = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    return days[date.getDay()]
  }

  // Helper function to count working days (excluding Sundays) between dates
  const countWorkingDays = (startDate, endDate) => {
    let count = 0
    const current = new Date(startDate)
    
    while (current <= endDate) {
      // Skip Sunday (getDay() === 0)
      if (current.getDay() !== 0) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  // Check if a company has examination on a specific date
  const getExamCountForDate = (record, date) => {
    // Parse dates carefully to avoid timezone issues
    const startDateStr = record['ngay bat dau kham']
    const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
    const specificDatesStr = record['cac ngay kham thuc te']
    const isCompleted = record['trang thai kham'] === 'Đã khám xong'
    const totalPeople = parseInt(record['so nguoi kham']) || 0
    
    if (!startDateStr) return 0
    
    // Create dates using local time to avoid timezone shifts
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Skip if current date is Sunday (hospital doesn't work on Sundays)
    if (checkDate.getDay() === 0) return 0
    
    // Check if there are specific examination dates
    if (specificDatesStr && specificDatesStr.trim()) {
      // Parse specific dates (format: MM/dd, MM/dd, ...)
      const specificDates = specificDatesStr.split(',').map(dateStr => {
        const trimmed = dateStr.trim()
        if (trimmed.includes('/')) {
          const [month, day] = trimmed.split('/')
          const year = date.getFullYear() // Use current year from the date range
          return new Date(year, parseInt(month) - 1, parseInt(day))
        }
        return null
      }).filter(d => d !== null)
      
      // Filter out Sundays from specific dates
      const workingSpecificDates = specificDates.filter(d => d.getDay() !== 0)
      
      // Check if current date matches any specific date (and it's not Sunday)
      const isSpecificDate = workingSpecificDates.some(specificDate => 
        checkDate.getTime() === specificDate.getTime()
      )
      
      if (isSpecificDate) {
        if (isCompleted) {
          // For completed exams with specific dates: total people ÷ number of working specific dates
          const dailyCount = totalPeople / workingSpecificDates.length
          return Math.round(dailyCount)
        } else {
          // For ongoing exams: use calculated averages
          const morningAvg = parseFloat(record['trung binh ngay sang']) || 0
          const afternoonAvg = parseFloat(record['trung binh ngay chieu']) || 0
          const dailyCount = Math.round(morningAvg + afternoonAvg)
          return dailyCount
        }
      }
      
      return 0
    } else {
      // Use original logic with start and end dates
      const startDate = new Date(startDateStr + 'T00:00:00')
      const endDate = new Date(endDateStr + 'T00:00:00')
      
      // Check if the date is within examination period
      if (checkDate >= startDate && checkDate <= endDate) {
        if (isCompleted) {
          // For completed exams: total people ÷ number of working days (excluding Sundays)
          const workingDays = countWorkingDays(startDate, endDate)
          const dailyCount = workingDays > 0 ? totalPeople / workingDays : 0
          return Math.round(dailyCount)
        } else {
          // For ongoing exams: use calculated averages
          const morningAvg = parseFloat(record['trung binh ngay sang']) || 0
          const afternoonAvg = parseFloat(record['trung binh ngay chieu']) || 0
          const dailyCount = Math.round(morningAvg + afternoonAvg)
          return dailyCount
        }
      }
      return 0
    }
  }

  // Check blood test date display for a specific date
  const getBloodTestDisplay = (record, date) => {
    const startDateStr = record['ngay bat dau kham']
    const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
    const bloodTestDateStr = record['ngay lay mau']
    const specificDatesStr = record['cac ngay kham thuc te']
    
    if (!startDateStr) return null
    
    // Create dates using local time to avoid timezone shifts
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Check if the date is within examination period (either specific dates or date range)
    let isInExamPeriod = false
    
    if (specificDatesStr && specificDatesStr.trim()) {
      // Parse specific dates (format: MM/dd, MM/dd, ...)
      const specificDates = specificDatesStr.split(',').map(dateStr => {
        const trimmed = dateStr.trim()
        if (trimmed.includes('/')) {
          const [month, day] = trimmed.split('/')
          const year = date.getFullYear() // Use current year from the date range
          return new Date(year, parseInt(month) - 1, parseInt(day))
        }
        return null
      }).filter(d => d !== null)
      
      // Check if current date matches any specific date
      isInExamPeriod = specificDates.some(specificDate => 
        checkDate.getTime() === specificDate.getTime()
      )
    } else {
      // Use original logic with start and end dates
      const startDate = new Date(startDateStr + 'T00:00:00')
      const endDate = new Date(endDateStr + 'T00:00:00')
      isInExamPeriod = checkDate >= startDate && checkDate <= endDate
    }
    
    if (isInExamPeriod) {
      const examCount = getExamCountForDate(record, date)
      
      // If there's a blood test date
      if (bloodTestDateStr) {
        const bloodTestDate = new Date(bloodTestDateStr + 'T00:00:00')
        
        // If blood test date matches the current exam date
        if (checkDate.getTime() === bloodTestDate.getTime()) {
          return {
            type: 'exam_with_blood',
            value: examCount,
            isBold: true
          }
        }
      }
      
      // Regular exam date
      return {
        type: 'exam_only',
        value: examCount,
        isBold: false
      }
    }
    
    // If not in exam period, check if it's a standalone blood test date
    if (bloodTestDateStr) {
      const bloodTestDate = new Date(bloodTestDateStr + 'T00:00:00')
      if (checkDate.getTime() === bloodTestDate.getTime()) {
        return {
          type: 'blood_only',
          value: '-',
          isBold: true
        }
      }
    }
    
    return null
  }

  // Calculate total for each date
  const calculateDailyTotals = (dates) => {
    return dates.map(date => {
      return data.reduce((total, record) => {
        return total + getExamCountForDate(record, date)
      }, 0)
    })
  }

  const dateRange = getDateRange()
  const dailyTotals = calculateDailyTotals(dateRange)

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <StatsCards data={data} />
      
      {/* Line Chart */}
      <LineChart data={data} monthFilter={monthFilter} dateFilter={dateFilter} />
      
      {/* Data Table */}
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Danh sách lịch khám</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
            <button
              onClick={handleExportExcel}
              disabled={loading || totalCount === 0}
              className="inline-flex items-center px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
          <table className="min-w-full">
            <thead className="bg-white">
              {/* Day of week row */}
              <tr className="bg-white">
                <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sticky left-0 bg-white z-30" style={{ width: '200px', minWidth: '200px' }}></th>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sticky left-[200px] bg-white z-20" style={{ width: '80px' }}></th>
                {dateRange.map((date, index) => {
                  const today = new Date()
                  const isToday = isSameDay(date, today)
                  return (
                    <th key={index} className={`px-1 py-1.5 text-center text-xs font-medium text-gray-900 uppercase tracking-wider ${isToday ? 'bg-[#f8f9fa]' : ''}`} style={{ width: '50px', minWidth: '50px' }}>
                      <div className="text-xs font-medium text-gray-600">
                        {getDayOfWeek(date)}
                      </div>
                    </th>
                  )
                })}
              </tr>
              
              {/* Date numbers row */}
              <tr className="bg-white">
                <th 
                  className="px-3 py-1.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky left-0 bg-white z-30"
                  onClick={() => handleSort('ten cong ty')}
                  style={{ width: '200px', minWidth: '200px' }}
                >
                  <div className="flex items-center">
                    Tên Công Ty
                    {sortBy === 'ten cong ty' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-1.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky left-[200px] bg-white z-20"
                  onClick={() => handleSort('so nguoi kham')}
                  style={{ width: '80px' }}
                >
                  <div className="flex items-center">
                    Người
                    {sortBy === 'so nguoi kham' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                {dateRange.map((date, index) => {
                  const today = new Date()
                  const isToday = isSameDay(date, today)
                  return (
                    <th key={index} className={`px-1 py-1.5 text-center text-xs font-medium text-gray-900 uppercase tracking-wider ${isToday ? 'bg-[#f8f9fa]' : ''}`} style={{ width: '50px', minWidth: '50px' }}>
                      <div className="text-sm font-normal">
                        {date.getDate()}
                      </div>
                    </th>
                  )
                })}
              </tr>
              
              {/* Total row */}
              <tr className="bg-white border-b-2 border-gray-300">
                <td className="px-3 py-1.5 text-sm text-gray-900 font-medium sticky left-0 bg-white z-30">TỔNG</td>
                <td className="px-3 py-1.5 text-sm text-gray-900 font-medium sticky left-[200px] bg-white z-20">
                  {data.reduce((total, record) => total + (parseInt(record['so nguoi kham']) || 0), 0).toLocaleString('vi-VN')}
                </td>
                {dailyTotals.map((total, index) => {
                  const today = new Date()
                  const isToday = dateRange[index] && isSameDay(dateRange[index], today)
                  return (
                    <td key={index} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : ''}`}>
                      {total > 0 && (
                        <span className="text-xs font-bold" style={{color: '#000000'}}>
                          {total.toLocaleString('vi-VN')}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={dateRange.length + 2} className="px-4 py-12 text-center text-gray-500">
                    {error ? 'Có lỗi xảy ra khi tải dữ liệu' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                data.map((record, index) => {
                  const isCompleted = record['trang thai kham'] === 'Đã khám xong'
                  return (
                    <tr key={record['ID'] || record.id || index}>
                      <td className="px-3 py-1.5 text-sm font-normal sticky left-0 bg-white z-30" style={{width: '200px', color: isCompleted ? '#2962ff' : '#000000'}}>
                         <div 
                           className="truncate" 
                           title={getTooltipCompanyName(record['ten cong ty'])}
                         >
                           {getDisplayCompanyName(record['ten cong ty']) || '-'}
                         </div>
                       </td>
                      <td className="px-3 py-1.5 text-sm font-normal sticky left-[200px] bg-white z-20" style={{width: '80px', color: isCompleted ? '#2962ff' : '#000000'}}>
                        {parseInt(record['so nguoi kham'] || 0).toLocaleString('vi-VN')}
                      </td>
                      {dateRange.map((date, dateIndex) => {
                        const bloodTestDisplay = getBloodTestDisplay(record, date)
                        const today = new Date()
                        const isToday = isSameDay(date, today)
                        
                        return (
                          <td key={dateIndex} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : ''}`}>
                            {bloodTestDisplay && bloodTestDisplay.value !== '-' && bloodTestDisplay.value > 0 && (
                              <span 
                                className={`text-xs ${bloodTestDisplay.isBold ? 'font-bold' : 'font-normal'}`} 
                                style={{
                                  color: isCompleted ? '#2962ff' : '#000000',
                                  fontWeight: bloodTestDisplay.isBold ? 'bold' : 'normal',
                                  ...(bloodTestDisplay.isBold ? {
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    border: `1px solid ${isCompleted ? '#2962ff' : '#000000'}`,
                                    borderRadius: '50%',
                                    minWidth: '20px',
                                    minHeight: '20px',
                                    lineHeight: '16px'
                                  } : {})
                                }}
                              >
                                {bloodTestDisplay.value.toLocaleString('vi-VN')}
                              </span>
                            )}
                            {bloodTestDisplay && bloodTestDisplay.value === '-' && (
                              <span 
                                className="text-xs font-bold" 
                                style={{
                                  color: isCompleted ? '#2962ff' : '#000000',
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  border: `1px solid ${isCompleted ? '#2962ff' : '#000000'}`,
                                  borderRadius: '50%',
                                  minWidth: '20px',
                                  minHeight: '20px',
                                  lineHeight: '16px'
                                }}
                              >
                                -
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}

export default DataTable