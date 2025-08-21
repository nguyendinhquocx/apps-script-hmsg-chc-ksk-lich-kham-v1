/**
 * Logic tính toán số người khám được port từ React dashboard
 * Đảm bảo consistency với frontend
 */

/**
 * Parse số nguyên an toàn, xử lý giá trị đặc biệt như "x", "x/2"
 * Port từ examUtils.js:safeParseNumber()
 */
function safeParseNumber(value, actualPeopleCount = null) {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  // Xử lý string values
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    
    // Xử lý giá trị động đặc biệt
    if (trimmed === 'x') {
      return actualPeopleCount || 0
    }
    
    if (trimmed === 'x/2') {
      return Math.round((actualPeopleCount || 0) / 2)
    }
    
    // Xử lý số thông thường
    const numericValue = Number(value)
    if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
      return Math.floor(numericValue)
    }
    
    return 0
  }
  
  // Xử lý numeric values trực tiếp
  const numericValue = Number(value)
  if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
    return Math.floor(numericValue)
  }
  
  return 0
}

/**
 * Parse ngày khám cụ thể với format mới
 * Port từ parseUtils.js:parseSpecificDates()
 */
function parseSpecificDates(specificDatesStr, referenceYear = new Date().getFullYear()) {
  if (!specificDatesStr || !specificDatesStr.trim()) {
    return []
  }

  const results = []
  const dateEntries = smartSplitDateEntries(specificDatesStr)

  for (const entry of dateEntries) {
    try {
      const hasParentheses = entry.includes('(') && entry.includes(')')

      if (hasParentheses) {
        // Format mới: "MM/dd(morning,afternoon)" or "MM/dd(total)"
        const match = entry.match(/^(\d{1,2})\/(\d{1,2})\s*\(([^)]*)\)$/)
        if (match) {
          const [, month, day, countsStr] = match
          const date = new Date(referenceYear, parseInt(month) - 1, parseInt(day))

          // Bỏ qua Chủ nhật
          if (date.getDay() === 0) continue

          const counts = countsStr.split(',').map(c => c.trim())

          if (counts.length === 1) {
            // Format: "MM/dd(total)" - chia đều
            const total = safeParseNumber(counts[0])
            const morning = Math.floor(total / 2)
            const afternoon = total - morning

            results.push({
              date: date,
              morning: morning,
              afternoon: afternoon,
              total: total,
              useSpecific: true,
              originalEntry: entry
            })
          } else if (counts.length === 2) {
            // Format: "MM/dd(morning,afternoon)"
            const morning = counts[0] === '' ? 0 : safeParseNumber(counts[0])
            const afternoon = counts[1] === '' ? 0 : safeParseNumber(counts[1])
            const total = morning + afternoon

            results.push({
              date: date,
              morning: morning,
              afternoon: afternoon,
              total: total,
              useSpecific: true,
              originalEntry: entry
            })
          }
        }
      } else {
        // Format cũ: "MM/dd"
        const match = entry.match(/^(\d{1,2})\/(\d{1,2})$/)
        if (match) {
          const [, month, day] = match
          const date = new Date(referenceYear, parseInt(month) - 1, parseInt(day))

          // Bỏ qua Chủ nhật
          if (date.getDay() === 0) continue

          results.push({
            date: date,
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
    }
  }

  return results
}

/**
 * Tách entries ngày khám thông minh, tôn trọng dấu ngoặc
 */
function smartSplitDateEntries(str) {
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
      if (current.trim()) {
        entries.push(current.trim())
      }
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  if (current.trim()) {
    entries.push(current.trim())
  }
  
  return entries
}

/**
 * Đếm số ngày làm việc (trừ Chủ nhật) giữa 2 ngày
 */
function countWorkingDays(startDate, endDate) {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    if (current.getDay() !== 0) { // Bỏ qua Chủ nhật
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

/**
 * Tính số người khám cho một ngày cụ thể
 * Port từ examUtils.js:getExamCountForDateNew()
 */
function getExamCountForDateNew(record, date) {
  const startDateStr = record.startDate
  const endDateStr = record.endDate || record.startDate
  const specificDatesStr = record.specificDates
  const isCompleted = record.status === 'Đã khám xong'
  const totalPeople = safeParseNumber(record.totalPeople)

  if (!startDateStr) return { total: 0, morning: 0, afternoon: 0 }

  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // Bỏ qua Chủ nhật
  if (checkDate.getDay() === 0) return { total: 0, morning: 0, afternoon: 0 }
  
  // Debug logging - disabled for production
  const DEBUG_ENABLED = false
  const isProblematic = DEBUG_ENABLED && record.companyName && (
    record.companyName.includes('GSASTUDIO') || 
    record.companyName.includes('KỸ NGHỆ VIỆT NHẬT')
  )
  
  if (isProblematic) {
    console.log(`[DEBUG] ${record.companyName}`)
    console.log(`  Check date: ${checkDate.getMonth() + 1}/${checkDate.getDate()}/${checkDate.getFullYear()}`)
    console.log(`  Specific dates: "${specificDatesStr}"`)
    console.log(`  Start date: ${startDateStr}`)
    console.log(`  End date: ${endDateStr}`)
    console.log(`  Total people: ${totalPeople}`)
  }

  // Kiểm tra ngày khám cụ thể
  if (specificDatesStr && specificDatesStr.trim()) {
    if (isProblematic) console.log(`  Path: SPECIFIC DATES`)
    
    const parsedDates = parseSpecificDates(specificDatesStr, date.getFullYear())
    
    if (isProblematic) {
      console.log(`  Parsed dates: ${parsedDates.length}`)
      parsedDates.forEach((pd, i) => {
        console.log(`    Date ${i+1}: ${pd.date.getMonth() + 1}/${pd.date.getDate()} useSpecific=${pd.useSpecific}`)
      })
    }

    const matchingDate = parsedDates.find(parsedDate =>
      checkDate.getTime() === parsedDate.date.getTime()
    )
    
    if (isProblematic) {
      console.log(`  Matching date found: ${!!matchingDate}`)
      if (matchingDate) {
        console.log(`  useSpecific: ${matchingDate.useSpecific}`)
      }
    }

    if (matchingDate) {
      if (matchingDate.useSpecific) {
        return {
          total: matchingDate.total,
          morning: matchingDate.morning,
          afternoon: matchingDate.afternoon
        }
      } else {
        if (isCompleted) {
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
              morning: morning,
              afternoon: afternoon
            }
          } else {
            return { total: 0, morning: 0, afternoon: 0 }
          }
        } else {
          if (isProblematic) console.log(`  Path: NOT COMPLETED, calculating...`)
          
          // Không có morningAvg/afternoonAvg, chia đều theo logic mặc định
          const specificDatesOnly = parsedDates.filter(d => !d.useSpecific)
          const remainingDays = specificDatesOnly.length
          
          if (isProblematic) {
            console.log(`  specificDatesOnly: ${specificDatesOnly.length}`)
            console.log(`  remainingDays: ${remainingDays}`)
          }
          
          if (remainingDays > 0) {
            const estimatedDaily = Math.round(totalPeople / remainingDays)
            const morning = Math.floor(estimatedDaily / 2)
            const afternoon = estimatedDaily - morning

            if (isProblematic) {
              console.log(`  estimatedDaily: ${estimatedDaily}`)
              console.log(`  RETURN: ${estimatedDaily}`)
            }

            return {
              total: estimatedDaily,
              morning: morning,
              afternoon: afternoon
            }
          } else {
            if (isProblematic) console.log(`  RETURN: 0 (no remaining days)`)
            return { total: 0, morning: 0, afternoon: 0 }
          }
        }
      }
    }

    if (isProblematic) console.log(`  RETURN: 0 (no matching date)`)
    return { total: 0, morning: 0, afternoon: 0 }
  } else {
    if (isProblematic) console.log(`  Path: START/END DATES`)
    // Logic ngày bắt đầu/kết thúc
    let startDate, endDate
    
    // Handle Date objects vs strings
    if (startDateStr instanceof Date) {
      startDate = new Date(startDateStr.getTime())
    } else {
      startDate = new Date(startDateStr + 'T00:00:00')
    }
    
    if (endDateStr instanceof Date) {
      endDate = new Date(endDateStr.getTime())
    } else {
      endDate = new Date(endDateStr + 'T00:00:00')
    }

    if (isProblematic) {
      console.log(`  startDate: ${startDate}`)
      console.log(`  endDate: ${endDate}`)
      console.log(`  checkDate in range: ${checkDate >= startDate && checkDate <= endDate}`)
    }

    if (checkDate >= startDate && checkDate <= endDate) {
      if (isCompleted) {
        const workingDays = countWorkingDays(startDate, endDate)
        const dailyCount = workingDays > 0 ? Math.round(totalPeople / workingDays) : 0
        const morning = Math.floor(dailyCount / 2)
        const afternoon = dailyCount - morning

        if (isProblematic) {
          console.log(`  workingDays: ${workingDays}`)
          console.log(`  dailyCount (completed): ${dailyCount}`)
          console.log(`  RETURN: ${dailyCount}`)
        }

        return {
          total: dailyCount,
          morning: morning,
          afternoon: afternoon
        }
      } else {
        // Không có morningAvg/afternoonAvg, ước tính theo tổng số người
        const workingDays = countWorkingDays(startDate, endDate)
        const estimatedDaily = workingDays > 0 ? Math.round(totalPeople / workingDays) : 0
        const morning = Math.floor(estimatedDaily / 2)
        const afternoon = estimatedDaily - morning

        if (isProblematic) {
          console.log(`  workingDays: ${workingDays}`)
          console.log(`  estimatedDaily (not completed): ${estimatedDaily}`)
          console.log(`  RETURN: ${estimatedDaily}`)
        }

        return {
          total: estimatedDaily,
          morning: morning,
          afternoon: afternoon
        }
      }
    }
    if (isProblematic) console.log(`  RETURN: 0 (out of range)`)
    return { total: 0, morning: 0, afternoon: 0 }
  }
}

/**
 * Tính tổng số người khám cho tất cả các ngày trong tháng
 * Port từ examUtils.js:calculateDailyTotals()
 */
function calculateDailyTotals(data, dates) {
  return dates.map(date => {
    return data.reduce((total, record) => {
      const examCount = getExamCountForDateNew(record, date)
      return total + examCount.total
    }, 0)
  })
}

/**
 * Tạo danh sách ngày trong tháng
 * Port từ examUtils.js:getDateRange()
 */
function getDateRange(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const dates = []

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month - 1, day))
  }
  
  return dates
}