import React, { useState, useEffect, useMemo } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import GlobalFilters from './GlobalFilters'
import LichKhamService from '../services/supabase'
import { matchesSearch } from '../utils/vietnamese'

const Charts = ({ globalFilters, updateGlobalFilter, resetGlobalFilters }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Danh sách các hạng mục khám cận lâm sàng với tên cột đúng từ database
  const examCategories = [
    { name: 'Siêu âm bụng', morning: 'sieu am bung sang', afternoon: 'sieu am bung chieu' },
    { name: 'Siêu âm vú', morning: 'sieu am vu sang', afternoon: 'sieu am vu chieu' },
    { name: 'Siêu âm giáp', morning: 'sieu am giap sang', afternoon: 'sieu am giap chieu' },
    { name: 'Siêu âm tim', morning: 'sieu am tim sang', afternoon: 'sieu am tim chieu' },
    { name: 'SA động mạch cảnh', morning: 'sieu am dong mach canh sang', afternoon: 'sieu am dong mach canh chieu' },
    { name: 'SA đàn hồi mô gan', morning: 'sieu am dan hoi mo gan sang', afternoon: 'sieu am dan hoi mo gan chieu' },
    { name: 'SA đầu dò âm đạo', morning: 'sieu am dau do am dao sang', afternoon: 'sieu am dau do am dao chieu' },
    { name: 'X-quang', morning: 'x quang sang', afternoon: 'x quang chieu' },
    { name: 'Điện tâm đồ', morning: 'dien tam do sang', afternoon: 'dien tam do chieu' },
    { name: 'Khám phụ khoa', morning: 'kham phu khoa sang', afternoon: 'kham phu khoa chieu' },
    { name: 'Đo loãng xương', morning: 'do loang xuong sang', afternoon: 'do loang xuong chieu' }
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

  // Tạo danh sách ngày dựa trên bộ lọc
  const getDaysToShow = () => {
    // Nếu có dateFilter với startDate và endDate, hiển thị theo khoảng ngày đó
    if (globalFilters.dateFilter && globalFilters.dateFilter.startDate && globalFilters.dateFilter.endDate) {
      const startDate = new Date(globalFilters.dateFilter.startDate)
      const endDate = new Date(globalFilters.dateFilter.endDate)
      const days = []
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        // Chỉ thêm các ngày không phải chủ nhật
        if (date.getDay() !== 0) {
          days.push({
            day: date.getDate(),
            date: date.toISOString().split('T')[0],
            dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
          })
        }
      }
      
      return days
    }
    
    // Nếu không có dateFilter, hiển thị theo tháng
    const { monthFilter } = globalFilters
    const { month, year } = monthFilter || { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      // Chỉ thêm các ngày không phải chủ nhật
      if (date.getDay() !== 0) {
        days.push({
          day,
          date: date.toISOString().split('T')[0],
          dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
        })
      }
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

  // Tính số người khám cho mỗi ngày và mục khám từ dữ liệu thực
  const getExamCount = (date, categoryIndex, period) => {
    const category = examCategories[categoryIndex]
    const columnName = period === 'morning' ? category.morning : category.afternoon
    
    // Lọc dữ liệu cho ngày cụ thể (tính cho các ngày trong tuần trừ chủ nhật)
    const dayData = filteredData.filter(item => {
      const startDate = new Date(item['ngay bat dau kham'])
      const endDate = new Date(item['ngay ket thuc kham'])
      const currentDate = new Date(date)
      
      // Kiểm tra xem ngày có nằm trong khoảng thời gian khám không
      // và không phải chủ nhật (0 = chủ nhật)
      const isInRange = currentDate >= startDate && currentDate <= endDate
      const isNotSunday = currentDate.getDay() !== 0
      
      return isInRange && isNotSunday
    })
    
    // Tính tổng số lượng từ cột tương ứng cho ngày đó
    let totalCount = 0
    dayData.forEach(item => {
      const count = parseInt(item[columnName]) || 0
      totalCount += count
    })
    
    return totalCount
  }

  // Tính số max cho mỗi ngày từ dữ liệu thực (trừ chủ nhật) - lấy giá trị lớn nhất
  const getMaxForDay = (date) => {
    const currentDate = new Date(date)
    
    // Không tính chủ nhật
    if (currentDate.getDay() === 0) {
      return 0
    }
    
    const dayData = filteredData.filter(item => {
      const startDate = new Date(item['ngay bat dau kham'])
      const endDate = new Date(item['ngay ket thuc kham'])
      
      // Kiểm tra xem ngày có nằm trong khoảng thời gian khám không
      return currentDate >= startDate && currentDate <= endDate
    })
    
    // Tìm giá trị lớn nhất trong tất cả các hạng mục cận lâm sàng của ngày đó
    let maxCount = 0
    
    dayData.forEach(item => {
      examCategories.forEach(category => {
        const morningCount = parseInt(item[category.morning]) || 0
        const afternoonCount = parseInt(item[category.afternoon]) || 0
        maxCount = Math.max(maxCount, morningCount, afternoonCount)
      })
    })
    
    return maxCount
  }

  const days = getDaysToShow() // Đã loại bỏ chủ nhật trong function

  // Hàm xuất Excel cho bảng cận lâm sàng
  const exportToExcel = () => {
    // Tạo dữ liệu cho Excel
    const excelData = []
    
    // Header row 1 - Tiêu đề chính
    const header1 = ['Ngày', 'Max']
    examCategories.forEach(() => header1.push('Sáng'))
    examCategories.forEach(() => header1.push('Chiều'))
    
    // Header row 2 - Tên hạng mục
    const header2 = ['', '']
    examCategories.forEach(cat => header2.push(cat.name))
    examCategories.forEach(cat => header2.push(cat.name))
    
    excelData.push(header1)
    excelData.push(header2)
    
    // Dữ liệu từng ngày
    days.forEach(dayInfo => {
      const row = [
        `${dayInfo.day} (${dayInfo.dayOfWeek})`,
        getMaxForDay(dayInfo.date)
      ]
      
      // Thêm dữ liệu sáng
      examCategories.forEach((category, index) => {
        const count = getExamCount(dayInfo.date, index, 'morning')
        row.push(count > 0 ? count : '')
      })
      
      // Thêm dữ liệu chiều
      examCategories.forEach((category, index) => {
        const count = getExamCount(dayInfo.date, index, 'afternoon')
        row.push(count > 0 ? count : '')
      })
      
      excelData.push(row)
    })
    
    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(excelData)
    
    // Styling cho header
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell1 = XLSX.utils.encode_cell({ r: 0, c: C })
      const cell2 = XLSX.utils.encode_cell({ r: 1, c: C })
      
      if (ws[cell1]) {
        ws[cell1].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EEEEEE" } },
          alignment: { horizontal: "center" }
        }
      }
      
      if (ws[cell2]) {
        ws[cell2].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "F8F8F8" } },
          alignment: { horizontal: "center" }
        }
      }
    }
    
    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // Ngày
      { width: 8 },  // Max
      ...Array(examCategories.length * 2).fill({ width: 12 }) // Các hạng mục
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Bảng Cận Lâm Sàng')
    
    // Tạo tên file với ngày hiện tại
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const fileName = `Bang_Can_Lam_Sang_${dateStr}.xlsx`
    
    XLSX.writeFile(wb, fileName)
  }

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
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg text-black">Bảng Cận Lâm Sàng</h2>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
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
                
                // Kiểm tra xem ngày này có dữ liệu không
                const hasData = getMaxForDay(dayInfo.date) > 0 || 
                  examCategories.some((category, index) => 
                    getExamCount(dayInfo.date, index, 'morning') > 0 || 
                    getExamCount(dayInfo.date, index, 'afternoon') > 0
                  )
                
                // Nếu không có dữ liệu thì không hiển thị hàng
                if (!hasData) return null
                
                return (
                  <tr key={dayInfo.date} className={isToday ? 'bg-[#e9edc9]' : 'bg-[#fefae0]'}>
                    {/* Cột ngày */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-300">
                      <div className="text-black font-medium">{dayInfo.day}</div>
                      <div className="text-gray-500 text-xs">{dayInfo.dayOfWeek}</div>
                    </td>
                    
                    {/* Cột Max */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 border border-green-600 text-green-800 text-xs font-medium rounded-full hover:scale-110 transition-transform duration-200 cursor-pointer">
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
                            <button className={`inline-flex items-center justify-center w-8 h-8 ${count > 100 ? 'bg-red-100 border-red-600 text-red-800' : 'bg-green-100 border-green-600 text-green-800'} text-xs font-medium rounded-full transition-transform duration-200 cursor-pointer hover:scale-110`}>
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
                            <button className={`inline-flex items-center justify-center w-8 h-8 ${count > 100 ? 'bg-red-100 border-red-600 text-red-800' : 'bg-green-100 border-green-600 text-green-800'} text-xs font-medium rounded-full transition-transform duration-200 cursor-pointer hover:scale-110`}>
                              {count}
                            </button>
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