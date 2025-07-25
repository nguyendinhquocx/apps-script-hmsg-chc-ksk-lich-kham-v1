import React, { useState, useEffect, useMemo } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { isSameDay } from 'date-fns'
import GlobalFilters from './GlobalFilters'
import ExamStatsCards from './ExamStatsCards'
import MaxExamChart from './MaxExamChart'
import LichKhamService from '../services/supabase'
import { matchesSearch } from '../utils/vietnamese'
import { examCategories } from '../constants/examCategories'
import { useChartsExport } from '../hooks/useChartsExport'

const Charts = ({ globalFilters, updateGlobalFilter, resetGlobalFilters }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Lấy dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Test connection first
        console.log('Charts - Testing connection...')
        const testResult = await LichKhamService.testConnection()
        console.log('Charts - Connection test result:', testResult)
        
        if (!testResult.success) {
          setError(`Connection failed: ${testResult.error}`)
          setData([])
          setLoading(false)
          return
        }
        
        const result = await LichKhamService.getLichKhamData({
          page: 1,
          limit: 10000
        })
        
        if (result.error) {
          console.error('Charts - Error fetching data:', result.error)
          setError(result.error)
          setData([])
        } else {
          const fetchedData = result.data || []
          console.log('Charts - Fetched data:', {
            totalRecords: fetchedData.length,
            sampleRecord: fetchedData[0],
            allKeys: fetchedData[0] ? Object.keys(fetchedData[0]).sort() : []
          })
          
          // Kiểm tra các cột cận lâm sàng có tồn tại không
          if (fetchedData[0]) {
            const keys = Object.keys(fetchedData[0])
            const examColumns = examCategories.flatMap(cat => [cat.morning, cat.afternoon])
            const missingColumns = examColumns.filter(col => !keys.includes(col))
            const availableExamColumns = examColumns.filter(col => keys.includes(col))
            
            console.log('Charts - Column analysis:', {
              expectedExamColumns: examColumns,
              availableExamColumns,
              missingColumns,
              allAvailableKeys: keys.sort()
            })
            
          }
          
          setData(fetchedData)
        }
      } catch (error) {
        console.error('Charts - Fetch error:', error)
        setError(error.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
      
      return true
    })
  }, [data, globalFilters])

  // Sử dụng hook để xử lý Excel export và các calculations
  const { exportToExcel, getExamCount, getMaxForDay, getDaysToShow } = useChartsExport(filteredData, globalFilters)

  const days = getDaysToShow() // Đã loại bỏ chủ nhật trong function

  if (loading) {
    return (
      <div className="space-y-6">
        <GlobalFilters 
          searchTerm={globalFilters.searchTerm}
          onSearchChange={(value) => updateGlobalFilter('searchTerm', value)}
          statusFilter={globalFilters.statusFilter}
          onStatusChange={(value) => updateGlobalFilter('statusFilter', value)}
          employeeFilter={globalFilters.employeeFilter}
          onEmployeeChange={(value) => updateGlobalFilter('employeeFilter', value)}
          showGold={globalFilters.showGold}
          onGoldChange={(value) => updateGlobalFilter('showGold', value)}
          monthFilter={globalFilters.monthFilter}
          setMonthFilter={(value) => updateGlobalFilter('monthFilter', value)}
          dateFilter={globalFilters.dateFilter}
          onDateFilterChange={(value) => updateGlobalFilter('dateFilter', value)}
          onReset={resetGlobalFilters}
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Đang tải dữ liệu...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlobalFilters 
          searchTerm={globalFilters.searchTerm}
          onSearchChange={(value) => updateGlobalFilter('searchTerm', value)}
          statusFilter={globalFilters.statusFilter}
          onStatusChange={(value) => updateGlobalFilter('statusFilter', value)}
          employeeFilter={globalFilters.employeeFilter}
          onEmployeeChange={(value) => updateGlobalFilter('employeeFilter', value)}
          showGold={globalFilters.showGold}
          onGoldChange={(value) => updateGlobalFilter('showGold', value)}
          monthFilter={globalFilters.monthFilter}
          setMonthFilter={(value) => updateGlobalFilter('monthFilter', value)}
          dateFilter={globalFilters.dateFilter}
          onDateFilterChange={(value) => updateGlobalFilter('dateFilter', value)}
          onReset={resetGlobalFilters}
        />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-center">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <GlobalFilters 
        searchTerm={globalFilters.searchTerm}
        onSearchChange={(value) => updateGlobalFilter('searchTerm', value)}
        statusFilter={globalFilters.statusFilter}
        onStatusChange={(value) => updateGlobalFilter('statusFilter', value)}
        employeeFilter={globalFilters.employeeFilter}
        onEmployeeChange={(value) => updateGlobalFilter('employeeFilter', value)}
        showGold={globalFilters.showGold}
        onGoldChange={(value) => updateGlobalFilter('showGold', value)}
        monthFilter={globalFilters.monthFilter}
        setMonthFilter={(value) => updateGlobalFilter('monthFilter', value)}
        dateFilter={globalFilters.dateFilter}
        onDateFilterChange={(value) => updateGlobalFilter('dateFilter', value)}
        onReset={resetGlobalFilters}
      />
      
      {/* Exam Stats Cards */}
      <ExamStatsCards 
        data={filteredData}
        examCategories={examCategories}
      />
      
      {/* Max Exam Chart */}
      <MaxExamChart 
        data={filteredData}
        examCategories={examCategories}
        monthFilter={globalFilters.monthFilter}
        dateFilter={globalFilters.dateFilter}
      />

      
      {/* Bảng cận lâm sàng */}
      <div className="overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Bảng Cận Lâm Sàng</h2>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-black text-sm rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Header */}
            <thead>
              {/* Hàng tiêu đề chính */}
              <tr className="bg-white">
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Ngày
                </th>
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Max
                </th>
                <th colSpan={examCategories.length} className="px-3 py-2 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Sáng
                </th>
                <th colSpan={examCategories.length} className="px-3 py-2 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Chiều
                </th>
              </tr>
              {/* Hàng tiêu đề mục khám */}
              <tr className="bg-white border-b border-gray-300">
                {examCategories.map((category, index) => (
                  <th key={`morning-${index}`} className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 uppercase tracking-wider">
                    {category.name}
                  </th>
                ))}
                {examCategories.map((category, index) => (
                  <th key={`afternoon-${index}`} className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 uppercase tracking-wider">
                    {category.name}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody className="bg-white">
              {days.map((dayInfo, dayIndex) => {
                const today = new Date()
                const dayDate = new Date(dayInfo.date)
                const isToday = isSameDay(dayDate, today)
                
                // Kiểm tra xem ngày này có dữ liệu không
                const hasData = getMaxForDay(dayInfo.date) > 0 || 
                  examCategories.some((category, index) => 
                    getExamCount(dayInfo.date, index, 'morning') > 0 || 
                    getExamCount(dayInfo.date, index, 'afternoon') > 0
                  )
                
                // Nếu không có dữ liệu thì không hiển thị hàng
                if (!hasData) return null
                
                return (
                  <tr key={dayInfo.date} className={isToday ? 'bg-[#f8f9fa]' : 'bg-[#ffffff]'}>
                    {/* Cột ngày */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="text-black font-normal">{dayInfo.day}</div>
                      <div className="text-gray-500 text-xs">{dayInfo.dayOfWeek}</div>
                    </td>
                    
                    {/* Cột Max */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      <span className="text-xs font-bold" style={{color: '#000000'}}>
                        {getMaxForDay(dayInfo.date)}
                      </span>
                    </td>
                    
                    {/* Các cột sáng */}
                    {examCategories.map((category, categoryIndex) => {
                      const count = getExamCount(dayInfo.date, categoryIndex, 'morning')
                      // Kiểm tra ngày đã qua
                      const isPastDate = new Date(dayInfo.date) < new Date().setHours(0, 0, 0, 0)
                      // Xác định màu: đã qua -> xanh nước biển nhạt #2962ff, lớn hơn 100 -> đỏ nhạt #f23645, còn lại -> đen
                      let textColor = '#000000' // mặc định đen
                      if (isPastDate) {
                        textColor = '#2962ff' // xanh nước biển nhạt cho ngày đã qua
                      } else if (count > 100) {
                        textColor = '#f23645' // đỏ nhạt cho số > 100
                      }
                      
                      return (
                        <td key={`morning-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center">
                          {count > 0 && (
                            <span className="text-xs font-normal" style={{color: textColor}}>
                              {count}
                            </span>
                          )}
                        </td>
                      )
                    })}
                    
                    {/* Các cột chiều */}
                    {examCategories.map((category, categoryIndex) => {
                      const count = getExamCount(dayInfo.date, categoryIndex, 'afternoon')
                      // Kiểm tra ngày đã qua
                      const isPastDate = new Date(dayInfo.date) < new Date().setHours(0, 0, 0, 0)
                      // Xác định màu: đã qua -> xanh nước biển nhạt #2962ff, lớn hơn 100 -> đỏ nhạt #f23645, còn lại -> đen
                      let textColor = '#000000' // mặc định đen
                      if (isPastDate) {
                        textColor = '#2962ff' // xanh nước biển nhạt cho ngày đã qua
                      } else if (count > 100) {
                        textColor = '#f23645' // đỏ nhạt cho số > 100
                      }
                      
                      return (
                        <td key={`afternoon-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center">
                          {count > 0 && (
                            <span className="text-xs font-normal" style={{color: textColor}}>
                              {count}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              }).filter(Boolean)} {/* Lọc bỏ null values */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Charts