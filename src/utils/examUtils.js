import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Helper function to safely parse numeric values from database (handles int8 → text conversion)
// Also handles special values like 'X', 'x', 'X/2', 'x/2' for dynamic clinical exam counts
export const safeParseNumber = (value, actualPeopleCount = null) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  // Handle string values
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    
    // Handle special dynamic values
    if (trimmed === 'x') {
      return actualPeopleCount || 0
    }
    
    if (trimmed === 'x/2') {
      return Math.round((actualPeopleCount || 0) / 2)
    }
    
    // Handle regular numeric strings
    const numericValue = Number(value)
    if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
      return Math.floor(numericValue) // Always return integer for counts
    }
    
    return 0
  }
  
  // Handle numeric values directly
  const numericValue = Number(value)
  if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
    return Math.floor(numericValue)
  }
  
  return 0
}

// Smart split function that respects parentheses
const smartSplitDateEntries = (str) => {
  const entries = []
  let current = ''
  let inParentheses = false
  let i = 0
  
  while (i < str.length) {
    const char = str[i]
    
    if (char === '(') {
      inParentheses = true
      current += char
    } else if (char === ')') {
      inParentheses = false
      current += char
    } else if (char === ',' && !inParentheses) {
      // Split here - we're not inside parentheses
      if (current.trim()) {
        entries.push(current.trim())
      }
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  // Add the last entry
  if (current.trim()) {
    entries.push(current.trim())
  }
  
  return entries
}

// Parse specific examination dates with new format support
export const parseSpecificDates = (specificDatesStr, referenceYear = new Date().getFullYear()) => {
  if (!specificDatesStr || !specificDatesStr.trim()) {
    return []
  }

  const results = []
  
  // Smart split that respects parentheses
  const dateEntries = smartSplitDateEntries(specificDatesStr)

  for (const entry of dateEntries) {
    try {
      // Check if entry has parentheses (new format)
      const hasParentheses = entry.includes('(') && entry.includes(')')

      if (hasParentheses) {
        // New format: "MM/dd(morning,afternoon)" or "MM/dd(total)"
        const match = entry.match(/^(\d{1,2})\/(\d{1,2})\s*\(([^)]*)\)$/)
        if (match) {
          const [, month, day, countsStr] = match
          const date = new Date(referenceYear, parseInt(month) - 1, parseInt(day))

          // Skip Sundays
          if (date.getDay() === 0) continue

          const counts = countsStr.split(',').map(c => c.trim())

          if (counts.length === 1) {
            // Format: "MM/dd(total)" - split evenly
            const total = safeParseNumber(counts[0])
            const morning = Math.floor(total / 2)
            const afternoon = total - morning

            results.push({
              date,
              morning,
              afternoon,
              total,
              useSpecific: true,
              originalEntry: entry
            })
          } else if (counts.length === 2) {
            // Format: "MM/dd(morning,afternoon)"
            const morning = counts[0] === '' ? 0 : safeParseNumber(counts[0])
            const afternoon = counts[1] === '' ? 0 : safeParseNumber(counts[1])
            const total = morning + afternoon

            results.push({
              date,
              morning,
              afternoon,
              total,
              useSpecific: true,
              originalEntry: entry
            })
          }
        }
      } else {
        // Old format: "MM/dd" - use existing logic
        const match = entry.match(/^(\d{1,2})\/(\d{1,2})$/)
        if (match) {
          const [, month, day] = match
          const date = new Date(referenceYear, parseInt(month) - 1, parseInt(day))

          // Skip Sundays
          if (date.getDay() === 0) continue

          results.push({
            date,
            morning: null,
            afternoon: null,
            total: null,
            useSpecific: false,
            originalEntry: entry
          })
        }
      }
    } catch (error) {
      console.warn(`Failed to parse date entry: ${entry}`, error)
      // Continue processing other entries
    }
  }

  return results
}

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

// Helper function to get exam count using new parsing logic
export const getExamCountForDateNew = (record, date) => {
  const startDateStr = record['ngay bat dau kham']
  const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
  const specificDatesStr = record['cac ngay kham thuc te']
  const isCompleted = record['trang thai kham'] === 'Đã khám xong'
  const totalPeople = safeParseNumber(record['so nguoi kham'])

  if (!startDateStr) return { total: 0, morning: 0, afternoon: 0 }

  // Create dates using local time to avoid timezone shifts
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // Skip if current date is Sunday (hospital doesn't work on Sundays)
  if (checkDate.getDay() === 0) return { total: 0, morning: 0, afternoon: 0 }

  // Check if there are specific examination dates
  if (specificDatesStr && specificDatesStr.trim()) {
    const parsedDates = parseSpecificDates(specificDatesStr, date.getFullYear())

    // Find matching date
    const matchingDate = parsedDates.find(parsedDate =>
      checkDate.getTime() === parsedDate.date.getTime()
    )

    if (matchingDate) {
      if (matchingDate.useSpecific) {
        // Use specific counts from new format
        return {
          total: matchingDate.total,
          morning: matchingDate.morning,
          afternoon: matchingDate.afternoon
        }
      } else {
        // Use old logic for entries without parentheses
        if (isCompleted) {
          // For completed exams: calculate average per day
          const specificDatesOnly = parsedDates.filter(d => !d.useSpecific)
          const specificCountsTotal = parsedDates
            .filter(d => d.useSpecific)
            .reduce((sum, d) => sum + d.total, 0)

          const remainingPeople = totalPeople - specificCountsTotal
          const remainingDays = specificDatesOnly.length

          if (remainingDays > 0) {
            const dailyCount = Math.round(remainingPeople / remainingDays)
            const morning = Math.floor(dailyCount / 2)
            const afternoon = dailyCount - morning

            return {
              total: dailyCount,
              morning,
              afternoon
            }
          }
        } else {
          // For ongoing exams: use calculated averages
          const morningAvg = parseFloat(record['trung binh ngay sang']) || 0
          const afternoonAvg = parseFloat(record['trung binh ngay chieu']) || 0
          const dailyCount = Math.round(morningAvg + afternoonAvg)

          return {
            total: dailyCount,
            morning: Math.round(morningAvg),
            afternoon: Math.round(afternoonAvg)
          }
        }
      }
    }

    return { total: 0, morning: 0, afternoon: 0 }
  } else {
    // Use original logic with start and end dates
    const startDate = new Date(startDateStr + 'T00:00:00')
    const endDate = new Date(endDateStr + 'T00:00:00')

    // Check if the date is within examination period
    if (checkDate >= startDate && checkDate <= endDate) {
      if (isCompleted) {
        // For completed exams: total people ÷ number of working days (excluding Sundays)
        const workingDays = countWorkingDays(startDate, endDate)
        const dailyCount = workingDays > 0 ? Math.round(totalPeople / workingDays) : 0
        const morning = Math.floor(dailyCount / 2)
        const afternoon = dailyCount - morning

        return {
          total: dailyCount,
          morning,
          afternoon
        }
      } else {
        // For ongoing exams: use calculated averages
        const morningAvg = parseFloat(record['trung binh ngay sang']) || 0
        const afternoonAvg = parseFloat(record['trung binh ngay chieu']) || 0
        const dailyCount = Math.round(morningAvg + afternoonAvg)

        return {
          total: dailyCount,
          morning: Math.round(morningAvg),
          afternoon: Math.round(afternoonAvg)
        }
      }
    }
    return { total: 0, morning: 0, afternoon: 0 }
  }
}

// Check if a company has examination on a specific date
export const getExamCountForDate = (record, date) => {
  // Use new logic and return only total for backward compatibility
  const result = getExamCountForDateNew(record, date)
  return result.total
}

// LEGACY function - keeping for reference but not used
export const getExamCountForDateLegacy = (record, date) => {
  // Parse dates carefully to avoid timezone issues
  const startDateStr = record['ngay bat dau kham']
  const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
  const specificDatesStr = record['cac ngay kham thuc te']
  const isCompleted = record['trang thai kham'] === 'Đã khám xong'
  const totalPeople = safeParseNumber(record['so nguoi kham'])

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

// Calculate blood test totals for each date
export const calculateBloodTestTotals = (data, dates, dailyTotals) => {
  return dates.map((date, dateIndex) => {
    let externalBloodTest = 0 // Lấy máu ngoại viện
    
    // Create checkDate using local time to avoid timezone shifts
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    data.forEach(record => {
      const bloodTestDateStr = record['ngay lay mau']
      const totalPeople = safeParseNumber(record['so nguoi kham'])
      
      // 1. Kiểm tra lấy máu ngoại viện: chỉ tính vào đúng ngày lấy máu được chỉ định
      if (bloodTestDateStr && bloodTestDateStr.trim()) {
        try {
          const bloodTestDate = new Date(bloodTestDateStr + 'T00:00:00')
          const bloodTestCheck = new Date(bloodTestDate.getFullYear(), bloodTestDate.getMonth(), bloodTestDate.getDate())
          
          // Nếu ngày hiện tại trùng với ngày lấy máu
          if (checkDate.getTime() === bloodTestCheck.getTime()) {
            externalBloodTest += totalPeople // Tính toàn bộ số người của công ty
          }
        } catch (error) {
          console.warn(`Invalid blood test date: ${bloodTestDateStr}`, error)
        }
      }
    })
    
    // 2. Lấy máu nội viện = Tổng số người khám trong ngày - Số người đã lấy máu ngoại viện
    let internalBloodTest = dailyTotals[dateIndex] || 0
    
    // Trừ đi số người của các công ty đã lấy máu ngoại viện và có khám trong ngày này
    data.forEach(record => {
      const hasExternalBloodTest = record['ngay lay mau'] && record['ngay lay mau'].trim()
      if (hasExternalBloodTest) {
        const examCountOnThisDate = getExamCountForDate(record, date)
        if (examCountOnThisDate > 0) {
          internalBloodTest -= examCountOnThisDate
        }
      }
    })
    
    // Đảm bảo không âm
    internalBloodTest = Math.max(0, internalBloodTest)
    
    return {
      external: externalBloodTest,
      internal: internalBloodTest,
      total: externalBloodTest + internalBloodTest
    }
  })
}

// Calculate company examination details
export const getCompanyDetails = (record) => {
  if (!record) return null

  const startDateStr = record['ngay bat dau kham']
  const endDateStr = record['ngay ket thuc kham'] || record['ngay bat dau kham']
  const specificDatesStr = record['cac ngay kham thuc te']
  const bloodTestDateStr = record['ngay lay mau']
  const totalPeople = safeParseNumber(record['so nguoi kham'])
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

  // Format specific examination dates with new format support
  let specificExamDates = null
  if (specificDatesStr && specificDatesStr.trim()) {
    const parsedDates = parseSpecificDates(specificDatesStr, new Date().getFullYear())

    if (parsedDates.length > 0) {
      const formattedDates = parsedDates.map(parsedDate => {
        const day = parsedDate.date.getDate().toString().padStart(2, '0')
        const month = (parsedDate.date.getMonth() + 1).toString().padStart(2, '0')

        if (parsedDate.useSpecific) {
          // Show specific counts: "28/07 (S:10, C:15)"
          return `${day}/${month} (S:${parsedDate.morning}, C:${parsedDate.afternoon})`
        } else {
          // Show old format: "28/07"
          return `${day}/${month}`
        }
      })

      specificExamDates = formattedDates.join(' & ')
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
