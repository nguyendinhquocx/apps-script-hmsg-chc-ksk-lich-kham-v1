import React, { useState, useMemo, Fragment } from 'react'
import { FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react'
import { isSameDay } from 'date-fns'
import StatsCards from './StatsCards'
import LineChart from './LineChart'
import CompanyModal from './CompanyModal'
import DailySummaryModal from './DailySummaryModal'
import { getDisplayCompanyName, getTooltipCompanyName } from '../utils/companyName'
import { useTableData } from '../hooks/useTableData'
import { useExcelExport } from '../hooks/useExcelExport'
import { 
  getDateRange, 
  getDayOfWeek, 
  getExamCountForDate, 
  getExamCountForDateNew,
  getBloodTestDisplay, 
  calculateDailyTotals,
  calculateBloodTestTotals, 
  getCompanyDetails 
} from '../utils/examUtils'

const DataTable = ({ globalFilters = {} }) => {
  // Modal state for company details
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // Modal state for daily summary
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDailySummary, setShowDailySummary] = useState(false)
  
  // Dropdown state for daily totals breakdown
  const [expandedDays, setExpandedDays] = useState(new Set())
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(1000) // Show all records by default
  
  // Sorting states
  const [sortBy, setSortBy] = useState('ngay bat dau kham')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Use custom hooks
  const { data, loading, error, totalCount } = useTableData(
    globalFilters, 
    sortBy, 
    sortOrder, 
    currentPage, 
    pageSize
  )
  
  const { handleExportExcel } = useExcelExport()

  // Extract filters for utility functions
  const { 
    monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
    dateFilter = { startDate: '', endDate: '' } 
  } = globalFilters

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

  // Handle Excel export with loading state
  const handleExcelExportClick = async () => {
    try {
      await handleExportExcel(globalFilters, sortBy, sortOrder)
    } catch (err) {
      // Error handling can be done here if needed
      console.error('Export failed:', err)
    }
  }

  // Handle company click to show modal
  const handleCompanyClick = (record) => {
    setSelectedCompany(record)
    setShowModal(true)
  }

  // Toggle dropdown for all daily totals
  const [showAllBreakdown, setShowAllBreakdown] = useState(true)

  // Toggle dropdown for daily totals
  const toggleDayExpansion = (dayIndex) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex)
    } else {
      newExpanded.add(dayIndex)
    }
    setExpandedDays(newExpanded)
  }

  // Calculate morning/afternoon totals for a specific day
  const getDayBreakdown = (dayIndex) => {
    const targetDate = dateRange[dayIndex]
    if (!targetDate) return { morning: 0, afternoon: 0 }

    let morningTotal = 0
    let afternoonTotal = 0

    data.forEach(record => {
      const examResult = getExamCountForDateNew(record, targetDate)
      if (examResult.total > 0) {
        morningTotal += examResult.morning
        afternoonTotal += examResult.afternoon
      }
    })

    return { morning: morningTotal, afternoon: afternoonTotal }
  }

  // Get daily summary data for modal
  const getDailySummaryData = (dateIndex) => {
    const targetDate = dateRange[dateIndex]
    if (!targetDate) return null

    const companiesOnDate = []
    let totalPeople = 0
    let companyCount = 0

    data.forEach(record => {
      const examCount = getExamCountForDate(record, targetDate)
      if (examCount > 0) {
        companyCount++
        totalPeople += examCount
        
        const companyDetails = getCompanyDetails(record)
        companiesOnDate.push({
          name: record['ten cong ty'] || 'Không xác định',
          peopleCount: examCount,
          examiner: companyDetails.employee
        })
      }
    })

    const breakdown = getDayBreakdown(dateIndex)
    
    return {
      date: targetDate,
      companies: companiesOnDate,
      summary: {
        totalPeople,
        morningCount: breakdown.morning,
        afternoonCount: breakdown.afternoon,
        companyCount
      }
    }
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedCompany(null)
  }

  // Close daily summary modal
  const closeDailySummary = () => {
    setShowDailySummary(false)
    setSelectedDate(null)
  }

  // Memoized calculations
  const dateRange = useMemo(() => getDateRange(dateFilter, monthFilter), [dateFilter, monthFilter])
  const dailyTotals = useMemo(() => calculateDailyTotals(data, dateRange), [data, dateRange])
  const bloodTestTotals = useMemo(() => calculateBloodTestTotals(data, dateRange, dailyTotals), [data, dateRange, dailyTotals])
  
  // Sắp xếp dữ liệu: chưa khám xong trên, đã khám xong dưới (giữ nguyên thứ tự gốc trong từng nhóm)
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    
    const notCompleted = data.filter(record => record['trang thai kham'] !== 'Đã khám xong')
    const completed = data.filter(record => record['trang thai kham'] === 'Đã khám xong')
    
    // KHÔNG sắp xếp lại - giữ nguyên thứ tự gốc đã được sort bởi useTableData
    return [...notCompleted, ...completed]
  }, [data])

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <StatsCards data={data} monthFilter={monthFilter} dateFilter={dateFilter} />
      
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
              onClick={handleExcelExportClick}
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
          <span className="text-gray-600">. _ .</span>
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
                <td className="px-3 py-1.5 text-sm text-gray-900 font-medium sticky left-0 bg-white z-30">
                  <div className="flex items-center space-x-2">
                    <span>TỔNG</span>
                    <button
                      onClick={() => setShowAllBreakdown(!showAllBreakdown)}
                      className="text-[#2962ff] hover:text-blue-700 transition-colors font-bold"
                    >
                      {showAllBreakdown ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-sm text-gray-900 font-medium sticky left-[200px] bg-white z-20">
                  {data.reduce((total, record) => total + (parseInt(record['so nguoi kham']) || 0), 0).toLocaleString('vi-VN')}
                </td>
                {dailyTotals.map((total, index) => {
                  const today = new Date()
                  const isToday = dateRange[index] && isSameDay(dateRange[index], today)
                  
                  return (
                    <td key={index} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : ''}`}>
                      {total > 0 && (
                        <span 
                            className="text-xs font-bold cursor-pointer transition-colors inline-block px-2 py-1 rounded-full hover:bg-gray-100" 
                            style={{color: total > 100 ? '#f23645' : '#000000'}}
                            onClick={() => {
                              const summaryData = getDailySummaryData(index)
                              if (summaryData) {
                                setSelectedDate(summaryData)
                                setShowDailySummary(true)
                              }
                            }}
                          >
                            {total.toLocaleString('vi-VN')}
                          </span>
                      )}
                    </td>
                  )
                })}
              </tr>
              
              {/* Breakdown row - shown when expanded */}
              {showAllBreakdown && (
                <>
                  <tr className="bg-white">
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-bold sticky left-0 bg-white z-30">Sáng</td>
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-bold sticky left-[200px] bg-white z-20">-</td>
                    {dailyTotals.map((total, index) => {
                      const today = new Date()
                      const isToday = dateRange[index] && isSameDay(dateRange[index], today)
                      const breakdown = getDayBreakdown(index)
                      
                      return (
                        <td key={index} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                          {breakdown.morning > 0 && (
                            <span 
                              className="text-xs" 
                              style={{color: breakdown.morning > 100 ? '#f23645' : '#000000'}}
                            >
                              {breakdown.morning}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-medium sticky left-0 bg-white z-30">Chiều</td>
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-medium sticky left-[200px] bg-white z-20">-</td>
                    {dailyTotals.map((total, index) => {
                      const today = new Date()
                      const isToday = dateRange[index] && isSameDay(dateRange[index], today)
                      const breakdown = getDayBreakdown(index)
                      
                      return (
                        <td key={index} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                          {breakdown.afternoon > 0 && (
                            <span 
                              className="text-xs" 
                              style={{color: breakdown.afternoon > 100 ? '#f23645' : '#000000'}}
                            >
                              {breakdown.afternoon}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  
                  {/* Lấy máu ngoại viện row */}
                  <tr className="bg-white">
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-medium italic sticky left-0 bg-white z-30">Lấy máu ngoại viện</td>
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-medium sticky left-[200px] bg-white z-20">-</td>
                    {bloodTestTotals.map((bloodTest, index) => {
                      const today = new Date()
                      const isToday = dateRange[index] && isSameDay(dateRange[index], today)
                      
                      return (
                        <td key={index} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                          {bloodTest.external > 0 && (
                            <span 
                              className="italic" 
                              style={{color: '#666666', fontSize: '11px'}}
                            >
                              {bloodTest.external}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  
                  {/* Lấy máu nội viện row */}
                  <tr className="bg-white border-b border-gray-200">
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-medium italic sticky left-0 bg-white z-30">Lấy máu nội viện</td>
                    <td className="px-3 py-1.5 text-xs text-gray-600 font-medium sticky left-[200px] bg-white z-20">-</td>
                    {bloodTestTotals.map((bloodTest, index) => {
                      const today = new Date()
                      const isToday = dateRange[index] && isSameDay(dateRange[index], today)
                      
                      return (
                        <td key={index} className={`px-1 py-1.5 text-center ${isToday ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                          {bloodTest.internal > 0 && (
                            <span 
                              className="italic" 
                              style={{color: '#666666', fontSize: '11px'}}
                            >
                              {bloodTest.internal}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </>
              )}
            </thead>
            <tbody className="bg-white">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={dateRange.length + 2} className="px-4 py-12 text-center text-gray-500">
                    {error ? 'Có lỗi xảy ra khi tải dữ liệu' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                (() => {
                  // Tính notCompletedCount một lần duy nhất
                  const notCompletedCount = sortedData.filter(r => r['trang thai kham'] !== 'Đã khám xong').length
                  
                  return sortedData.map((record, index) => {
                    const isCompleted = record['trang thai kham'] === 'Đã khám xong'
                    
                    // Kiểm tra xem có cần thêm separator không (chuyển từ chưa xong sang đã xong)
                    const isFirstCompletedRow = index === notCompletedCount && notCompletedCount > 0 && index < sortedData.length
                  
                  return (
                    <Fragment key={record['ID'] || record.id || index}>
                      {/* Separator row giữa chưa khám xong và đã khám xong */}
                      {isFirstCompletedRow && (
                        <tr>
                          <td colSpan={dateRange.length + 2} className="px-0 py-2">
                            <div className="border-t border-dashed border-gray-300 opacity-60"></div>
                          </td>
                        </tr>
                      )}
                      
                      {/* Row công ty thường */}
                    <tr key={record['ID'] || record.id || index}>
                      <td className="px-3 py-1.5 text-sm font-normal sticky left-0 bg-white z-30" style={{width: '200px', color: isCompleted ? '#2962ff' : '#000000'}}>
                         <div 
                           className="truncate cursor-pointer rounded-lg px-2 py-1 hover:bg-gray-100 transition-colors" 
                           title={getTooltipCompanyName(record['ten cong ty'])}
                           onClick={() => handleCompanyClick(record)}
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
                          <td key={dateIndex} className={`px-1 py-1.5 text-center ${isToday && !isCompleted ? 'bg-[#f8f9fa]' : ''}`}>
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
                    </Fragment>
                  )
                  })
                })()
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Company Details Modal */}
      <CompanyModal
        isOpen={showModal}
        onClose={closeModal}
        company={selectedCompany}
        getCompanyDetails={getCompanyDetails}
      />

      {/* Daily Summary Modal */}
      <DailySummaryModal
        isOpen={showDailySummary}
        onClose={closeDailySummary}
        date={selectedDate?.date}
        companies={selectedDate?.companies}
        summary={selectedDate?.summary}
      />
    </div>
  )
}

export default DataTable
