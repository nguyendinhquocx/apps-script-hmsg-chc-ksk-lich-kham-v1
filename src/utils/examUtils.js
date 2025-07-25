import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Helper function to count working days (excluding Sundays) between dates
export const countWorkingDays = (startDate, endDate) => {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    // Skip Sunday (getDay() === 0)
    if (current.getDay() !== 0) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

// Generate date range for table columns
export const getDateRange = (dateFilter, monthFilter) => {
  if (dateFilter.startDate && dateFilter.endDate) {
    // Parse dates carefully to avoid timezone issues
    const start = new Date(dateFilter.startDate + 'T00:00:00')
    const end = new Date(dateFilter.endDate + 'T00:00:00')
    const dates = []
    const current = new Date(start)
    
    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  } else {
    // Default to current month - create dates in local timezone
    const year = monthFilter.year
    const month = monthFilter.month
    const daysInMonth = new Date(year, month, 0).getDate()
    const dates = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month - 1, day))
    }
    return dates
  }
}

// Get day of week in Vietnamese
export const getDayOfWeek = (date) => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return days[date.getDay()]
}

// Check if a company has examination on a specific date
export const getExamCountForDate = (record, date) => {
  // Parse dates carefully to avoid timezone issues
  const startDateStr = record['ngay bat dau kham']
  const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
  const specificDatesStr = record['cac ngay kham thuc te']
  const isCompleted = record['trang thai kham'] === 'Đã khám xong'
  const totalPeople = parseInt(record['so nguoi kham']) || 0
  
  if (!startDateStr) return 0
  
  // Create dates using local time to avoid timezone shifts
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  // Skip if current date is Sunday (hospital doesn't work on Sundays)
  if (checkDate.getDay() === 0) return 0
  
  // Check if there are specific examination dates
  if (specificDatesStr && specificDatesStr.trim()) {
    // Parse specific dates (format: MM/dd, MM/dd, ...)
    const specificDates = specificDatesStr.split(',').map(dateStr => {
      const trimmed = dateStr.trim()
      if (trimmed.includes('/')) {
        const [month, day] = trimmed.split('/')
        const year = date.getFullYear() // Use current year from the date range
        return new Date(year, parseInt(month) - 1, parseInt(day))
      }
      return null
    }).filter(d => d !== null)
    
    // Filter out Sundays from specific dates
    const workingSpecificDates = specificDates.filter(d => d.getDay() !== 0)
    
    // Check if current date matches any specific date (and it's not Sunday)
    const isSpecificDate = workingSpecificDates.some(specificDate => 
      checkDate.getTime() === specificDate.getTime()
    )
    
    if (isSpecificDate) {
      if (isCompleted) {
        // For completed exams with specific dates: total people ÷ number of working specific dates
        const dailyCount = totalPeople / workingSpecificDates.length
        return Math.round(dailyCount)
      } else {
        // For ongoing exams: use calculated averages
        const morningAvg = parseFloat(record['trung binh ngay sang']) || 0
        const afternoonAvg = parseFloat(record['trung binh ngay chieu']) || 0
        const dailyCount = Math.round(morningAvg + afternoonAvg)
        return dailyCount
      }
    }
    
    return 0
  } else {
    // Use original logic with start and end dates
    const startDate = new Date(startDateStr + 'T00:00:00')
    const endDate = new Date(endDateStr + 'T00:00:00')
    
    // Check if the date is within examination period
    if (checkDate >= startDate && checkDate <= endDate) {
      if (isCompleted) {
        // For completed exams: total people ÷ number of working days (excluding Sundays)
        const workingDays = countWorkingDays(startDate, endDate)
        const dailyCount = workingDays > 0 ? totalPeople / workingDays : 0
        return Math.round(dailyCount)
      } else {
        // For ongoing exams: use calculated averages
        const morningAvg = parseFloat(record['trung binh ngay sang']) || 0
        const afternoonAvg = parseFloat(record['trung binh ngay chieu']) || 0
        const dailyCount = Math.round(morningAvg + afternoonAvg)
        return dailyCount
      }
    }
    return 0
  }
}

// Check blood test date display for a specific date
export const getBloodTestDisplay = (record, date) => {
  const startDateStr = record['ngay bat dau kham']
  const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
  const bloodTestDateStr = record['ngay lay mau']
  const specificDatesStr = record['cac ngay kham thuc te']
  
  if (!startDateStr) return null
  
  // Create dates using local time to avoid timezone shifts
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  // Check if the date is within examination period (either specific dates or date range)
  let isInExamPeriod = false
  
  if (specificDatesStr && specificDatesStr.trim()) {
    // Parse specific dates (format: MM/dd, MM/dd, ...)
    const specificDates = specificDatesStr.split(',').map(dateStr => {
      const trimmed = dateStr.trim()
      if (trimmed.includes('/')) {
        const [month, day] = trimmed.split('/')
        const year = date.getFullYear() // Use current year from the date range
        return new Date(year, parseInt(month) - 1, parseInt(day))
      }
      return null
    }).filter(d => d !== null)
    
    // Check if current date matches any specific date
    isInExamPeriod = specificDates.some(specificDate => 
      checkDate.getTime() === specificDate.getTime()
    )
  } else {
    // Use original logic with start and end dates
    const startDate = new Date(startDateStr + 'T00:00:00')
    const endDate = new Date(endDateStr + 'T00:00:00')
    isInExamPeriod = checkDate >= startDate && checkDate <= endDate
  }
  
  if (isInExamPeriod) {
    const examCount = getExamCountForDate(record, date)
    
    // If there's a blood test date
    if (bloodTestDateStr) {
      const bloodTestDate = new Date(bloodTestDateStr + 'T00:00:00')
      
      // If blood test date matches the current exam date
      if (checkDate.getTime() === bloodTestDate.getTime()) {
        return {
          type: 'exam_with_blood',
          value: examCount,
          isBold: true
        }
      }
    }
    
    // Regular exam date
    return {
      type: 'exam_only',
      value: examCount,
      isBold: false
    }
  }
  
  // If not in exam period, check if it's a standalone blood test date
  if (bloodTestDateStr) {
    const bloodTestDate = new Date(bloodTestDateStr + 'T00:00:00')
    if (checkDate.getTime() === bloodTestDate.getTime()) {
      return {
        type: 'blood_only',
        value: '-',
        isBold: true
      }
    }
  }
  
  return null
}

// Calculate total for each date
export const calculateDailyTotals = (data, dates) => {
  return dates.map(date => {
    return data.reduce((total, record) => {
      return total + getExamCountForDate(record, date)
    }, 0)
  })
}

// Calculate company examination details
export const getCompanyDetails = (record) => {
  if (!record) return null

  const startDateStr = record['ngay bat dau kham']
  const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
  const specificDatesStr = record['cac ngay kham thuc te']
  const bloodTestDateStr = record['ngay lay mau']
  const totalPeople = parseInt(record['so nguoi kham']) || 0
  const morningCount = parseFloat(record['trung binh ngay sang']) || 0
  const afternoonCount = parseFloat(record['trung binh ngay chieu']) || 0
  const employee = record['ten nhan vien'] || '-'

  // Calculate total examination days
  let totalDays = 0
  if (specificDatesStr && specificDatesStr.trim()) {
    // Count specific dates (excluding Sundays)
    const specificDates = specificDatesStr.split(',').map(dateStr => {
      const trimmed = dateStr.trim()
      if (trimmed.includes('/')) {
        const [month, day] = trimmed.split('/')
        const year = new Date().getFullYear()
        return new Date(year, parseInt(month) - 1, parseInt(day))
      }
      return null
    }).filter(d => d !== null && d.getDay() !== 0) // Exclude Sundays
    
    totalDays = specificDates.length
  } else if (startDateStr && endDateStr) {
    // Count working days in date range
    const startDate = new Date(startDateStr + 'T00:00:00')
    const endDate = new Date(endDateStr + 'T00:00:00')
    totalDays = countWorkingDays(startDate, endDate)
  }

  // Format examination period
  let examPeriod = '-'
  if (startDateStr) {
    const startFormatted = format(new Date(startDateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
    if (endDateStr && endDateStr !== startDateStr) {
      const endFormatted = format(new Date(endDateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
      examPeriod = `${startFormatted} - ${endFormatted}`
    } else {
      examPeriod = startFormatted
    }
  }

  // Format blood test date
  let bloodTestDate = null
  if (bloodTestDateStr) {
    bloodTestDate = format(new Date(bloodTestDateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
  }

  // Format specific examination dates
  let specificExamDates = null
  if (specificDatesStr && specificDatesStr.trim()) {
    const dates = specificDatesStr.split(',').map(dateStr => {
      const trimmed = dateStr.trim()
      if (trimmed.includes('/')) {
        const [month, day] = trimmed.split('/')
        // Định dạng lại thành dd/MM
        const formattedMonth = month.padStart(2, '0')
        const formattedDay = day.padStart(2, '0')
        return `${formattedDay}/${formattedMonth}`
      }
      return null
    }).filter(d => d !== null)
    
    if (dates.length > 0) {
      specificExamDates = dates.join(' & ')
    }
  }

  return {
    totalPeople,
    morningCount: Math.round(morningCount),
    afternoonCount: Math.round(afternoonCount),
    totalDays,
    employee,
    examPeriod,
    bloodTestDate,
    specificExamDates
  }
}

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
  } catch {
    return dateString
  }
}

// Get status badge class
export const getStatusBadgeClass = (status) => {
  const statusLower = (status || '').toLowerCase().trim()
  if (statusLower.includes('đã khám xong') || statusLower.includes('da kham xong')) {
    return 'status-badge status-completed'
  }
  if (statusLower.includes('đang khám') || statusLower.includes('dang kham')) {
    return 'status-badge status-in-progress'
  }
  if (statusLower.includes('hủy') || statusLower.includes('huy')) {
    return 'status-badge status-cancelled'
  }
  return 'status-badge status-pending'
}
