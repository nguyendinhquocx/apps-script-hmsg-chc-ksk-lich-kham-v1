import { useMemo } from 'react'
import { matchesSearch } from '../utils/vietnamese'

export const useChartsFiltering = (data, globalFilters) => {
  // Lọc dữ liệu theo các bộ lọc toàn cục
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('Charts - No data to filter')
      return []
    }
    
    console.log('Charts - Filtering data:', {
      totalData: data.length,
      globalFilters,
      sampleItem: data[0]
    })
    
    return data.filter(item => {
      // Lọc theo tìm kiếm
      if (globalFilters.searchTerm) {
        const matchesCompany = matchesSearch(item['ten cong ty'], globalFilters.searchTerm)
        const matchesEmployee = matchesSearch(item['ten nhan vien'], globalFilters.searchTerm)
        if (!matchesCompany && !matchesEmployee) return false
      }
      
      // Lọc theo trạng thái
      if (globalFilters.statusFilter && globalFilters.statusFilter !== 'all') {
        if (item['trang thai kham'] !== globalFilters.statusFilter) return false
      }
      
      // Lọc theo nhân viên
      if (globalFilters.employeeFilter && globalFilters.employeeFilter !== 'all') {
        if (!matchesSearch(item['ten nhan vien'], globalFilters.employeeFilter)) return false
      }
      
      // Lọc theo khoảng ngày
      if (globalFilters.dateFilter && globalFilters.dateFilter.startDate && globalFilters.dateFilter.endDate) {
        const itemStartDate = new Date(item['ngay bat dau kham'])
        const itemEndDate = new Date(item['ngay ket thuc kham'])
        const filterStartDate = new Date(globalFilters.dateFilter.startDate)
        const filterEndDate = new Date(globalFilters.dateFilter.endDate)
        
        // Kiểm tra xem khoảng thời gian khám có giao với khoảng lọc không
        if (itemEndDate < filterStartDate || itemStartDate > filterEndDate) {
          return false
        }
      }
      
      // Lọc theo tháng (chỉ khi không có dateFilter)
      if (globalFilters.monthFilter && !globalFilters.dateFilter?.startDate && !globalFilters.dateFilter?.endDate) {
        const startDate = new Date(item['ngay bat dau kham'])
        const endDate = new Date(item['ngay ket thuc kham'])
        const { month, year } = globalFilters.monthFilter
        const filterDate = new Date(year, month - 1, 1)
        const filterEndDate = new Date(year, month, 0)
        
        // Kiểm tra xem khoảng thời gian khám có giao với tháng được lọc không
        if (endDate < filterDate || startDate > filterEndDate) {
          return false
        }
      }

      // Lọc theo Gold
      if (globalFilters.showGold) {
        const goldValue = item['gold'] || ''
        // Check if gold value is 'x' or 'X' (same logic as useTableData.js)
        if (goldValue !== 'x' && goldValue !== 'X') {
          return false
        }
      }
      
      return true
    })
  }, [data, globalFilters])

  return {
    filteredData
  }
}
