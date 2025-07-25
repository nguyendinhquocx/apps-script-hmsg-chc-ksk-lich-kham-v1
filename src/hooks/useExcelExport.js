import { format } from 'date-fns'
import LichKhamService from '../services/supabase'
import { matchesSearch, isDateInMonth } from '../utils/vietnamese'
import { getDisplayCompanyName } from '../utils/companyName'
import { getDateRange, getDayOfWeek, getExamCountForDate } from '../utils/examUtils'

export const useExcelExport = () => {
  const handleExportExcel = async (globalFilters, sortBy, sortOrder) => {
    try {
      // Extract global filters
      const { 
        searchTerm = '', 
        statusFilter = '', 
        employeeFilter = '', 
        showGold = false, 
        monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
        dateFilter = { startDate: '', endDate: '' } 
      } = globalFilters

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
        throw new Error('Không thể export dữ liệu: ' + result.error)
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
      const exportDateRange = getDateRange(dateFilter, monthFilter)
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
      
      return { success: true }
    } catch (err) {
      throw new Error('Có lỗi xảy ra khi export Excel: ' + err.message)
    }
  }

  return { handleExportExcel }
}
