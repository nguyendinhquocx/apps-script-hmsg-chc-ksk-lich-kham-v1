import React, { useState, useEffect, useMemo } from 'react'
import GlobalFilters from './GlobalFilters'
import LichKhamService from '../services/supabase'

const Charts = ({ globalFilters, updateGlobalFilter, resetGlobalFilters }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Các mục khám cận lâm sàng
  const examCategories = [
    'Siêu âm bụng',
    'Khám phụ khoa',
    'X-quang phổi',
    'Điện tim',
    'Xét nghiệm máu',
    'Xét nghiệm nước tiểu',
    'Khám mắt',
    'Khám tai mũi họng'
  ]

  // Lấy dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await LichKhamService.getLichKhamData({
          page: 1,
          limit: 10000
        })
        
        if (result.error) {
          setError(result.error)
        } else {
          setData(result.data || [])
        }
      } catch (err) {
        setError('Không thể tải dữ liệu: ' + err.message)
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

  // Tính số người khám cho mỗi ngày và mục khám
  const getExamCount = (date, category, period) => {
    // Giả lập dữ liệu dựa trên ngày và mục khám
    const dayOfMonth = new Date(date).getDate()
    const categoryIndex = examCategories.indexOf(category)
    const periodMultiplier = period === 'morning' ? 1 : 0.8
    
    // Tạo số liệu giả định dựa trên công thức
    const baseCount = Math.floor((dayOfMonth + categoryIndex * 3) * periodMultiplier) % 15
    return Math.max(0, baseCount)
  }

  // Tính số max cho mỗi ngày
  const getMaxForDay = (date) => {
    const morningTotal = examCategories.reduce((sum, category) => {
      return sum + getExamCount(date, category, 'morning')
    }, 0)
    
    const afternoonTotal = examCategories.reduce((sum, category) => {
      return sum + getExamCount(date, category, 'afternoon')
    }, 0)
    
    return morningTotal + afternoonTotal
  }

  const days = getDaysInMonth()

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bảng Cận Lâm Sàng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Hiển thị số lượng người khám theo từng mục cận lâm sàng
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Header */}
            <thead>
              {/* Hàng tiêu đề chính */}
              <tr className="bg-gray-50">
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Ngày
                </th>
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Max
                </th>
                <th colSpan={examCategories.length} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Sáng
                </th>
                <th colSpan={examCategories.length} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chiều
                </th>
              </tr>
              {/* Hàng tiêu đề mục khám */}
              <tr className="bg-gray-50">
                {examCategories.map((category, index) => (
                  <th key={`morning-${index}`} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    {category}
                  </th>
                ))}
                {examCategories.map((category, index) => (
                  <th key={`afternoon-${index}`} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    {category}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {days.map((dayInfo, dayIndex) => (
                <tr key={dayInfo.date} className={dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Cột ngày */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200">
                    <div className="text-gray-900 font-medium">{dayInfo.day}</div>
                    <div className="text-gray-500 text-xs">{dayInfo.dayOfWeek}</div>
                  </td>
                  
                  {/* Cột Max */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-r border-gray-200">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {getMaxForDay(dayInfo.date)}
                    </span>
                  </td>
                  
                  {/* Các cột sáng */}
                  {examCategories.map((category, categoryIndex) => {
                    const count = getExamCount(dayInfo.date, category, 'morning')
                    return (
                      <td key={`morning-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center border-r border-gray-200">
                        {count > 0 && (
                          <button className="inline-flex items-center justify-center w-6 h-6 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer">
                            {count}
                          </button>
                        )}
                      </td>
                    )
                  })}
                  
                  {/* Các cột chiều */}
                  {examCategories.map((category, categoryIndex) => {
                    const count = getExamCount(dayInfo.date, category, 'afternoon')
                    return (
                      <td key={`afternoon-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center border-r border-gray-200">
                        {count > 0 && (
                          <button className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-medium rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer">
                            {count}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Charts