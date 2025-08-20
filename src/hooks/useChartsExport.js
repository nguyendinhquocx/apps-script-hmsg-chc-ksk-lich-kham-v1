import * as XLSX from 'xlsx'
import { useMemo } from 'react'
import { examCategories } from '../constants/examCategories'
import { safeParseNumber, getExamCountForDateNew, parseSpecificDates } from '../utils/examUtils'

export const useChartsExport = (filteredData, globalFilters) => {
  // Helper function to check if a company has examination on a specific date
  const hasExaminationOnDate = (item, date) => {
    const startDateStr = item['ngay bat dau kham']
    const endDateStr = item['ngay ket thuc kham'] || item['ngay bat dau kham']
    const specificDatesStr = item['cac ngay kham thuc te']
    
    if (!startDateStr) return false
    
    // Create dates using local time to avoid timezone shifts
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Skip if current date is Sunday (hospital doesn't work on Sundays)
    if (checkDate.getDay() === 0) return false
    
    // Check if there are specific examination dates
    if (specificDatesStr && specificDatesStr.trim()) {
      // Use the improved parseSpecificDates function that handles parentheses
      const parsedResult = parseSpecificDates(specificDatesStr, date.getFullYear())
      const specificDates = parsedResult.map(entry => entry.date).filter(d => d !== null)
      
      // Filter out Sundays from specific dates
      const workingSpecificDates = specificDates.filter(d => d.getDay() !== 0)
      
      // Check if current date matches any specific date (and it's not Sunday)
      return workingSpecificDates.some(specificDate => 
        checkDate.getTime() === specificDate.getTime()
      )
    } else {
      // Use original logic with start and end dates
      const startDate = new Date(startDateStr + 'T00:00:00')
      const endDate = new Date(endDateStr + 'T00:00:00')
      
      // Check if the date is within examination period
      return checkDate >= startDate && checkDate <= endDate
    }
  }

  // Tính số người khám cho mỗi ngày và mục khám từ dữ liệu thực
  const getExamCount = (date, categoryIndex, period) => {
    const category = examCategories[categoryIndex]
    const columnName = period === 'morning' ? category.morning : category.afternoon
    
    // Sử dụng cache thay vì filter lại
    const dateKey = date.toDateString()
    const dayData = dataByDate.get(dateKey) || []
    
    // Tính tổng số lượng từ cột tương ứng cho ngày đó
    let totalCount = 0
    
    dayData.forEach(item => {
      // Get actual people count for this company on this date
      const examResult = getExamCountForDateNew(item, date)
      const actualPeopleCount = period === 'morning' ? examResult.morning : examResult.afternoon
      
      // Use new safeParseNumber with dynamic parsing
      const count = safeParseNumber(item[columnName], actualPeopleCount)
      totalCount += count || 0 // Ensure we never add NaN
    })
    
    return totalCount
  }

    // Lấy chi tiết các công ty cho một ngày và hạng mục cụ thể
  const getExamDetailData = (date, categoryIndex, period) => {
    const category = examCategories[categoryIndex]
    const columnName = period === 'morning' ? category.morning : category.afternoon
    
    // Sử dụng cache thay vì filter lại
    const dateKey = date.toDateString()
    const dayData = dataByDate.get(dateKey) || []
    
    // Tạo danh sách các công ty với số lượng và nhân viên phụ trách
    const companies = []
    dayData.forEach(item => {
      // Get actual people count for this company on this date
      const examResult = getExamCountForDateNew(item, date)
      const actualPeopleCount = period === 'morning' ? examResult.morning : examResult.afternoon
      
      // Use new safeParseNumber with dynamic parsing
      const count = safeParseNumber(item[columnName], actualPeopleCount)
      if (count > 0) {
        companies.push({
          name: item['ten cong ty'] || 'Không xác định',
          count: count,
          examiner: item['nhan vien phu trach'] || 'Không xác định'
        })
      }
    })
    
    return companies
  }

  // Tính số max cho mỗi ngày từ dữ liệu thực (trừ chủ nhật) - lấy giá trị lớn nhất
  const getMaxForDay = (date) => {
    const currentDate = new Date(date)
    
    // Không tính chủ nhật
    if (currentDate.getDay() === 0) {
      return 0
    }
    
    // Sử dụng cache thay vì filter lại
    const dateKey = date.toDateString()
    const dayData = dataByDate.get(dateKey) || []
    
    // Tìm giá trị lớn nhất trong tất cả các hạng mục cận lâm sàng của ngày đó
    let maxCount = 0
    
    // Tính tổng từng hạng mục (sáng và chiều) cho ngày này
    examCategories.forEach(category => {
      // Tính tổng sáng cho hạng mục này
      let morningTotal = 0
      dayData.forEach(item => {
        // Get actual people count for this company on this date
        const examResult = getExamCountForDateNew(item, date)
        const actualMorningCount = examResult.morning
        
        const morningCount = safeParseNumber(item[category.morning], actualMorningCount)
        morningTotal += morningCount
      })
      
      // Tính tổng chiều cho hạng mục này
      let afternoonTotal = 0
      dayData.forEach(item => {
        // Get actual people count for this company on this date
        const examResult = getExamCountForDateNew(item, date)
        const actualAfternoonCount = examResult.afternoon
        
        const afternoonCount = safeParseNumber(item[category.afternoon], actualAfternoonCount)
        afternoonTotal += afternoonCount
      })
      
      // So sánh để tìm max
      maxCount = Math.max(maxCount, morningTotal, afternoonTotal)
    })
    
    return maxCount
  }

  // Tạo danh sách ngày dựa trên bộ lọc
  const getDaysToShow = () => {
    // Nếu có dateFilter với startDate và endDate, hiển thị theo khoảng ngày đó
    if (globalFilters.dateFilter && globalFilters.dateFilter.startDate && globalFilters.dateFilter.endDate) {
      const startDate = new Date(globalFilters.dateFilter.startDate)
      const endDate = new Date(globalFilters.dateFilter.endDate)
      const daysList = []
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Bỏ qua chủ nhật (0 = chủ nhật)
        if (d.getDay() !== 0) {
          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
          daysList.push({
            date: new Date(d),
            day: d.getDate(),
            dayOfWeek: dayNames[d.getDay()]
          })
        }
      }
      
      return daysList
    }
    
    // Nếu không có dateFilter, hiển thị theo tháng từ monthFilter
    const month = globalFilters.monthFilter?.month || new Date().getMonth() + 1
    const year = globalFilters.monthFilter?.year || new Date().getFullYear()
    
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysList = []
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      // Bỏ qua chủ nhật (0 = chủ nhật)
      if (d.getDay() !== 0) {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        daysList.push({
          date: new Date(d),
          day: d.getDate(),
          dayOfWeek: dayNames[d.getDay()]
        })
      }
    }
    
    return daysList
  }

  // Cache data by date để tránh filter lặp lại
  const dataByDate = useMemo(() => {
    const cache = new Map()
    const days = getDaysToShow()
    
    days.forEach(({ date }) => {
      const dateKey = date.toDateString()
      const dayData = filteredData.filter(item => hasExaminationOnDate(item, date))
      cache.set(dateKey, dayData)
    })
    
    return cache
  }, [filteredData, globalFilters])

  // Hàm xuất Excel cho bảng cận lâm sàng
  const exportToExcel = () => {
    const days = getDaysToShow()
    
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

  return {
    exportToExcel,
    getExamCount,
    getMaxForDay,
    getDaysToShow,
    getExamDetailData
  }
}
