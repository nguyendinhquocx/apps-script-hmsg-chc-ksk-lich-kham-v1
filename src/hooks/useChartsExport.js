import * as XLSX from 'xlsx'
import { examCategories } from '../constants/examCategories'

export const useChartsExport = (filteredData, globalFilters) => {
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
    getDaysToShow
  }
}
