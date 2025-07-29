import React, { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { isSameDay } from 'date-fns'
import GlobalFilters from './GlobalFilters'
import ExamStatsCards from './ExamStatsCards'
import MaxExamChart from './MaxExamChart'
import ExamDetailModal from './ExamDetailModal'
import { examCategories } from '../constants/examCategories'
import { useChartsExport } from '../hooks/useChartsExport'
import { useChartsData } from '../hooks/useChartsData'
import { useChartsFiltering } from '../hooks/useChartsFiltering'

const Charts = ({ globalFilters, updateGlobalFilter, resetGlobalFilters }) => {
  // Modal state
  const [selectedExam, setSelectedExam] = useState(null)
  const [showExamModal, setShowExamModal] = useState(false)

  // Sử dụng hook để xử lý data fetching
  const { data, loading, error } = useChartsData()
  
  // Sử dụng hook để xử lý data filtering
  const { filteredData } = useChartsFiltering(data, globalFilters)

  // Sử dụng hook để xử lý Excel export và các calculations
  const { exportToExcel, getExamCount, getMaxForDay, getDaysToShow, getExamDetailData } = useChartsExport(filteredData, globalFilters)

  const days = getDaysToShow() // Đã loại bỏ chủ nhật trong function

  // Handle exam cell click
  const handleExamClick = (date, categoryIndex, period) => {
    const companies = getExamDetailData(date, categoryIndex, period)
    const totalCount = getExamCount(date, categoryIndex, period)
    const category = examCategories[categoryIndex]
    
    if (totalCount > 0) {
      setSelectedExam({
        date,
        examType: category.name,
        companies,
        totalCount,
        period
      })
      setShowExamModal(true)
    }
  }

  // Close exam modal
  const closeExamModal = () => {
    setShowExamModal(false)
    setSelectedExam(null)
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
          <div className="text-gray-500">. _ .</div>
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
        getExamCount={getExamCount}
        getDaysToShow={getDaysToShow}
        monthFilter={globalFilters.monthFilter}
        dateFilter={globalFilters.dateFilter}
      />
      
      {/* Max Exam Chart */}
      <MaxExamChart 
        getMaxForDay={getMaxForDay}
        getDaysToShow={getDaysToShow}
        getExamCount={getExamCount}
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
                
                // Chỉ hiển thị những ngày có dữ liệu khi đã có filter
                const hasAnyFilter = globalFilters.searchTerm || 
                  (globalFilters.statusFilter && globalFilters.statusFilter !== 'all') ||
                  (globalFilters.employeeFilter && globalFilters.employeeFilter !== 'all') ||
                  globalFilters.showGold
                
                if (hasAnyFilter && !hasData) return null
                
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
                    
                    {(() => {
                      // Calculate max values for morning and afternoon for this day
                      const morningCounts = examCategories.map((_, categoryIndex) => 
                        getExamCount(dayInfo.date, categoryIndex, 'morning')
                      )
                      const afternoonCounts = examCategories.map((_, categoryIndex) => 
                        getExamCount(dayInfo.date, categoryIndex, 'afternoon')
                      )
                      
                      const maxMorning = Math.max(...morningCounts.filter(count => count > 0))
                      const maxAfternoon = Math.max(...afternoonCounts.filter(count => count > 0))
                      
                      // Tìm index của số lớn nhất đầu tiên cho mỗi buổi (để chỉ khoanh 1 số khi có nhiều số bằng nhau)
                      const maxMorningIndex = morningCounts.findIndex(count => count > 0 && count === maxMorning)
                      const maxAfternoonIndex = afternoonCounts.findIndex(count => count > 0 && count === maxAfternoon)
                      
                      const isPastDate = new Date(dayInfo.date) < new Date().setHours(0, 0, 0, 0)
                      
                      return (
                        <>
                          {/* Các cột sáng */}
                          {examCategories.map((category, categoryIndex) => {
                            const count = getExamCount(dayInfo.date, categoryIndex, 'morning')
                            // Chỉ khoanh tròn 1 số duy nhất (số đầu tiên có giá trị max)
                            const isMaxInPeriod = count > 0 && count === maxMorning && categoryIndex === maxMorningIndex
                            
                            // Xác định màu và style
                            let textColor = '#000000' // mặc định đen
                            
                            if (isMaxInPeriod) {
                              // Khoanh tròn cho số lớn nhất
                              textColor = isPastDate ? '#2962ff' : '#000000'
                            } else {
                              if (isPastDate) {
                                textColor = '#2962ff' // xanh nước biển nhạt cho ngày đã qua
                              } else if (count > 100) {
                                textColor = '#f23645' // đỏ nhạt cho số > 100
                              }
                            }
                            
                            return (
                              <td key={`morning-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center">
                                {count > 0 && (
                                  <span 
                                    className="text-xs font-normal cursor-pointer transition-all duration-200 inline-block"
                                    style={{
                                      color: textColor,
                                      ...(isMaxInPeriod ? {
                                        border: `1px solid ${isPastDate ? '#2962ff' : '#000000'}`,
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      } : {
                                        padding: '4px 8px',
                                        borderRadius: '9999px'
                                      })
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isMaxInPeriod) {
                                        e.target.style.backgroundColor = '#f3f4f6'
                                      } else {
                                        e.target.style.backgroundColor = '#f3f4f6'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent'
                                    }}
                                    onClick={() => handleExamClick(dayInfo.date, categoryIndex, 'morning')}
                                  >
                                    {count}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          
                          {/* Các cột chiều */}
                          {examCategories.map((category, categoryIndex) => {
                            const count = getExamCount(dayInfo.date, categoryIndex, 'afternoon')
                            // Chỉ khoanh tròn 1 số duy nhất (số đầu tiên có giá trị max)
                            const isMaxInPeriod = count > 0 && count === maxAfternoon && categoryIndex === maxAfternoonIndex
                            
                            // Xác định màu và style
                            let textColor = '#000000' // mặc định đen
                            
                            if (isMaxInPeriod) {
                              // Khoanh tròn cho số lớn nhất
                              textColor = isPastDate ? '#2962ff' : '#000000'
                            } else {
                              if (isPastDate) {
                                textColor = '#2962ff' // xanh nước biển nhạt cho ngày đã qua
                              } else if (count > 100) {
                                textColor = '#f23645' // đỏ nhạt cho số > 100
                              }
                            }
                            
                            return (
                              <td key={`afternoon-${categoryIndex}`} className="px-2 py-2 whitespace-nowrap text-center">
                                {count > 0 && (
                                  <span 
                                    className="text-xs font-normal cursor-pointer transition-all duration-200 inline-block"
                                    style={{
                                      color: textColor,
                                      ...(isMaxInPeriod ? {
                                        border: `1px solid ${isPastDate ? '#2962ff' : '#000000'}`,
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      } : {
                                        padding: '4px 8px',
                                        borderRadius: '9999px'
                                      })
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isMaxInPeriod) {
                                        e.target.style.backgroundColor = '#f3f4f6'
                                      } else {
                                        e.target.style.backgroundColor = '#f3f4f6'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent'
                                    }}
                                    onClick={() => handleExamClick(dayInfo.date, categoryIndex, 'afternoon')}
                                  >
                                    {count}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </>
                      )
                    })()}
                  </tr>
                )
              }).filter(Boolean)} {/* Lọc bỏ null values khi có filter */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Detail Modal */}
      <ExamDetailModal
        isOpen={showExamModal}
        onClose={closeExamModal}
        date={selectedExam?.date}
        examType={selectedExam?.examType}
        companies={selectedExam?.companies}
        totalCount={selectedExam?.totalCount}
        period={selectedExam?.period}
      />
    </div>
  )
}

export default Charts