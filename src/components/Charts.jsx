import React, { useState, useEffect, useMemo } from 'react'
import GlobalFilters from './GlobalFilters'
import LichKhamService from '../services/supabase'

const Charts = ({ globalFilters, updateGlobalFilter, resetGlobalFilters }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Danh sách các hạng mục khám cận lâm sàng với tên cột đúng từ database
  const examCategories = [
    { name: 'Siêu âm bụng', morning: 'sieu am bung sang', afternoon: 'sieu am bung chieu' },
    { name: 'Siêu âm vú', morning: 'sieu am vu sang', afternoon: 'sieu am vu chieu' },
    { name: 'Khám phụ khoa', morning: 'kham phu khoa sang', afternoon: 'kham phu khoa chieu' },
    { name: 'Siêu âm tim', morning: 'sieu am tim sang', afternoon: 'sieu am tim chieu' },
    { name: 'Nội soi', morning: 'noi soi sang', afternoon: 'noi soi chieu' },
    { name: 'X-quang', morning: 'x quang sang', afternoon: 'x quang chieu' },
    { name: 'CT Scanner', morning: 'ct scanner sang', afternoon: 'ct scanner chieu' },
    { name: 'MRI', morning: 'mri sang', afternoon: 'mri chieu' },
    { name: 'Xét nghiệm máu', morning: 'xet nghiem mau sang', afternoon: 'xet nghiem mau chieu' },
    { name: 'Xét nghiệm nước tiểu', morning: 'xet nghiem nuoc tieu sang', afternoon: 'xet nghiem nuoc tieu chieu' },
    { name: 'Điện tim', morning: 'dien tim sang', afternoon: 'dien tim chieu' }
  ]

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

  // Tạo danh sách ngày trong tháng
  const getDaysInMonth = () => {
    const { monthFilter } = globalFilters
    const { month, year } = monthFilter || { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      days.push({
        day,
        date: date.toISOString().split('T')[0],
        dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
      })
    }
    
    return days
  }

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
        const searchLower = globalFilters.searchTerm.toLowerCase()
        const matchesSearch = 
          item['ten cong ty']?.toLowerCase().includes(searchLower) ||
          item['ten nhan vien']?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      // Lọc theo trạng thái
      if (globalFilters.statusFilter && globalFilters.statusFilter !== 'all') {
        if (item['trang thai kham'] !== globalFilters.statusFilter) return false
      }
      
      // Lọc theo nhân viên
      if (globalFilters.employeeFilter && globalFilters.employeeFilter !== 'all') {
        if (item['ten nhan vien'] !== globalFilters.employeeFilter) return false
      }
      
      // Lọc theo ngày
      if (globalFilters.dateFilter) {
        const startDate = new Date(item['ngay bat dau kham']).toISOString().split('T')[0]
        const endDate = new Date(item['ngay ket thuc kham']).toISOString().split('T')[0]
        if (globalFilters.dateFilter < startDate || globalFilters.dateFilter > endDate) {
          return false
        }
      }
      
      // Lọc theo tháng
      if (globalFilters.monthFilter) {
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

  // Tính số người khám cho mỗi ngày và mục khám từ dữ liệu thực
  const getExamCount = (date, categoryIndex, period) => {
    const category = examCategories[categoryIndex]
    const columnName = period === 'morning' ? category.morning : category.afternoon
    
    // Debug: Log để kiểm tra dữ liệu
    if (categoryIndex === 0 && period === 'morning' && date.endsWith('01')) {
      console.log('Debug getExamCount:', {
        date,
        columnName,
        filteredDataLength: filteredData.length,
        sampleData: filteredData.slice(0, 2)
      })
    }
    
    // Lọc dữ liệu cho ngày cụ thể
    const dayData = filteredData.filter(item => {
      const startDate = new Date(item['ngay bat dau kham']).toISOString().split('T')[0]
      const endDate = new Date(item['ngay ket thuc kham']).toISOString().split('T')[0]
      
      // Kiểm tra xem ngày có nằm trong khoảng thời gian khám không
      return date >= startDate && date <= endDate
    })
    
    // Tính tổng số lượng từ cột tương ứng
    let totalCount = 0
    dayData.forEach(item => {
      const count = parseInt(item[columnName]) || 0
      totalCount += count
    })
    
    return totalCount
  }

  // Tính số max cho mỗi ngày từ dữ liệu thực
  const getMaxForDay = (date) => {
    const dayData = filteredData.filter(item => {
      const startDate = new Date(item['ngay bat dau kham']).toISOString().split('T')[0]
      const endDate = new Date(item['ngay ket thuc kham']).toISOString().split('T')[0]
      
      // Kiểm tra xem ngày có nằm trong khoảng thời gian khám không
      return date >= startDate && date <= endDate
    })
    
    // Tính tổng số người khám trong ngày
    return dayData.reduce((total, item) => {
      return total + (parseInt(item['so nguoi kham']) || 0)
    }, 0)
  }

  const days = getDaysInMonth().filter(day => day.dayOfWeek !== 'CN') // Loại bỏ chủ nhật

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
      

      
      {/* Bảng cận lâm sàng */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Bảng Cận Lâm Sàng</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Header */}
            <thead>
              {/* Hàng tiêu đề chính */}
              <tr className="bg-white">
                <th rowSpan={2} className="px-3 py-2 text-left text-xs text-black border-r border-gray-300">
                  Ngày
                </th>
                <th rowSpan={2} className="px-3 py-2 text-left text-xs text-black">
                  Max
                </th>
                <th colSpan={examCategories.length} className="px-3 py-2 text-center text-xs text-black border-r border-gray-300">
                  Sáng
                </th>
                <th colSpan={examCategories.length} className="px-3 py-2 text-center text-xs text-black">
                  Chiều
                </th>
              </tr>
              {/* Hàng tiêu đề mục khám */}
              <tr className="bg-white border-b border-gray-300">
                {examCategories.map((category, index) => (
                  <th key={`morning-${index}`} className="px-2 py-2 text-center text-xs text-black">
                    {category.name}
                  </th>
                ))}
                {examCategories.map((category, index) => (
                  <th key={`afternoon-${index}`} className="px-2 py-2 text-center text-xs text-black">
                    {category.name}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody className="bg-white">
              {days.map((dayInfo, dayIndex) => {
                const isToday = dayInfo.date === new Date().toISOString().split('T')[0]
                return (
                  <tr key={dayInfo.date} className={isToday ? 'bg-gray-50' : 'bg-white'}>
                    {/* Cột ngày */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-300">
                      <div className="text-black font-medium">{dayInfo.day}</div>
                      <div className="text-gray-500 text-xs">{dayInfo.dayOfWeek}</div>
                    </td>
                    
                    {/* Cột Max */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-white border border-black text-black text-xs font-medium rounded-full">
                        {getMaxForDay(dayInfo.date)}
                      </span>
                    </td>
                    
                    {/* Các cột sáng */}
                    {examCategories.map((category, categoryIndex) => {
                      const count = getExamCount(dayInfo.date, categoryIndex, 'morning')
                      const isLastMorning = categoryIndex === examCategories.length - 1
                      return (
                        <td key={`morning-${categoryIndex}`} className={`px-2 py-2 whitespace-nowrap text-center ${isLastMorning ? 'border-r border-gray-300' : ''}`}>
                          {count > 0 && (
                            <button className={`inline-flex items-center justify-center w-6 h-6 ${count > 100 ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'bg-white border border-black hover:bg-black hover:text-white text-black'} text-xs font-medium rounded-full transition-all duration-200 cursor-pointer`}>
                              {count}
                            </button>
                          )}
                        </td>
                      )
                    })}
                    
                    {/* Các cột chiều */}
                    {examCategories.map((category, categoryIndex) => {
                      const count = getExamCount(dayInfo.date, categoryIndex, 'afternoon')
                      return (
                        <td key={`afternoon-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center">
                          {count > 0 && (
                            <button className={`inline-flex items-center justify-center w-6 h-6 ${count > 100 ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'bg-white border border-black hover:bg-black hover:text-white text-black'} text-xs font-medium rounded-full transition-all duration-200 cursor-pointer`}>
                              {count}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Charts