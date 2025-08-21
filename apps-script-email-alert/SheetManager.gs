/**
 * Quản lý Google Sheets: đọc dữ liệu và tạo sheet theo dõi
 */

/**
 * Lấy dữ liệu từ sheet gốc
 */
function getDataFromSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.dataSheetName)
    if (!sheet) {
      console.error(`Không tìm thấy sheet: ${SHEET_CONFIG.dataSheetName}`)
      console.log('Available sheets:', SpreadsheetApp.getActiveSpreadsheet().getSheets().map(s => s.getName()))
      return []
    }
    
    const lastRow = sheet.getLastRow()
    if (lastRow <= 1) {
      console.log('Sheet không có dữ liệu')
      return []
    }
    
    // Đọc tất cả dữ liệu từ dòng 2 (bỏ header)
    const range = sheet.getRange(2, 1, lastRow - 1, 10) // 10 cột đầu tiên
    const values = range.getValues()
    
    const data = values.map((row, index) => {
      return {
        rowIndex: index + 2, // +2 vì bắt đầu từ dòng 2
        companyName: String(row[4] || ''), // Column 5: ten cong ty
        startDate: row[1] || '', // Column 2: ngay bat dau kham (Date object)  
        endDate: row[2] || '', // Column 3: ngay ket thuc kham (Date object)
        totalPeople: row[0] || 0, // Column 1: so nguoi kham
        status: String(row[5] || ''), // Column 6: trang thai kham
        employee: String(row[3] || ''), // Column 4: ten nhan vien
        specificDates: String(row[8] || ''), // Column 9: cac ngay kham thuc te
        morningAvg: 0, // Không có trong sheet hiện tại
        afternoonAvg: 0, // Không có trong sheet hiện tại  
        bloodTestDate: String(row[7] || '') // Column 8: ngay lay mau
      }
    }).filter(record => record.companyName.trim() !== '') // Lọc bỏ dòng trống
    
    console.log(`Đọc được ${data.length} records từ sheet`)
    return data
    
  } catch (error) {
    console.error('Lỗi đọc dữ liệu từ sheet:', error)
    return []
  }
}

/**
 * Lấy hoặc tạo sheet Daily_Check để theo dõi
 */
function getOrCreateLogSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getSheetByName(SHEET_CONFIG.logSheetName)
  
  if (!sheet) {
    console.log('Tạo sheet Daily_Check mới')
    sheet = spreadsheet.insertSheet(SHEET_CONFIG.logSheetName)
    setupLogSheetHeaders(sheet)
  }
  
  return sheet
}

/**
 * Setup headers cho sheet Daily_Check
 */
function setupLogSheetHeaders(sheet) {
  const headers = [
    'Ngày',
    'Tổng',
    'Sáng', 
    'Chiều',
    'Số CT',
    'Top Công ty',
    'Email Sent'
  ]
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length)
  headerRange.setBackground('#4285f4')
  headerRange.setFontColor('#ffffff')
  headerRange.setFontWeight('bold')
  headerRange.setHorizontalAlignment('center')
  
  // Set column widths
  sheet.setColumnWidth(1, 100) // Ngày
  sheet.setColumnWidth(2, 80)  // Tổng
  sheet.setColumnWidth(3, 60)  // Sáng
  sheet.setColumnWidth(4, 60)  // Chiều
  sheet.setColumnWidth(5, 60)  // Số CT
  sheet.setColumnWidth(6, 300) // Top Công ty
  sheet.setColumnWidth(7, 150) // Email Sent
  
  // Freeze header row
  sheet.setFrozenRows(1)
  
  console.log('Setup headers cho Daily_Check sheet')
}

/**
 * Cập nhật sheet Daily_Check với dữ liệu mới
 */
function updateDailyCheckSheet(dates, dailyTotals, alertDays) {
  const sheet = getOrCreateLogSheet()
  
  // Clear old data (keep headers)
  const lastRow = sheet.getLastRow()
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1)
  }
  
  // Prepare new data
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const today = new Date()
  
  const rowsData = []
  
  dates.forEach((date, index) => {
    const total = dailyTotals[index]
    if (total === 0) return // Bỏ qua ngày không có khám
    
    const alertDay = alertDays.find(alert => 
      alert.date.getTime() === date.getTime()
    )
    
    const isToday = date.toDateString() === today.toDateString()
    const isPast = date < today
    
    // Status indicator
    let status = ''
    if (alertDay) {
      status = total > 250 ? '🔴' : '⚠️'
    } else if (total > 150) {
      status = '🟡'
    } else {
      status = '✅'
    }
    
    // Get breakdown
    const data = getDataFromSheet()
    const breakdown = getDayBreakdown(data, date)
    const companies = getCompaniesForDate(data, date)
    
    // Top companies string
    const topCompanies = companies
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map(c => `${c.name}(${c.total})`)
      .join(', ')
    
    // Email sent status
    let emailStatus = '-'
    if (alertDay) {
      emailStatus = '📧 Cần gửi'
    }
    
    rowsData.push([
      `${status} ${formatDate(date)}`,
      total,
      breakdown.morning,
      breakdown.afternoon,
      companies.length,
      topCompanies,
      emailStatus
    ])
  })
  
  if (rowsData.length > 0) {
    sheet.getRange(2, 1, rowsData.length, 7).setValues(rowsData)
    
    // Format conditional colors
    formatDailyCheckSheet(sheet, rowsData.length + 1)
  }
  
  console.log(`Cập nhật ${rowsData.length} dòng vào Daily_Check sheet`)
}

/**
 * Format màu sắc cho sheet Daily_Check
 */
function formatDailyCheckSheet(sheet, totalRows) {
  if (totalRows <= 1) return
  
  const dataRange = sheet.getRange(2, 1, totalRows - 1, 7)
  
  // Clear existing formatting
  dataRange.clearFormat()
  
  // Apply conditional formatting
  const values = dataRange.getValues()
  
  values.forEach((row, index) => {
    const rowRange = sheet.getRange(index + 2, 1, 1, 7)
    const total = row[1]
    
    let backgroundColor = '#ffffff'
    let fontColor = '#000000'
    
    if (total > 200) {
      backgroundColor = '#fce8e6' // Light red
      fontColor = '#d73527'
      rowRange.setFontWeight('bold')
    } else if (total > 150) {
      backgroundColor = '#fff4e6' // Light orange
    }
    
    rowRange.setBackground(backgroundColor)
    rowRange.setFontColor(fontColor)
  })
  
  // Set borders
  dataRange.setBorder(true, true, true, true, true, true)
  
  // Center align numbers
  sheet.getRange(2, 2, totalRows - 1, 4).setHorizontalAlignment('center')
  
  console.log('Áp dụng format cho Daily_Check sheet')
}

/**
 * Clean up old logs (chạy hàng tuần)
 */
function cleanupOldLogs() {
  const sheet = getOrCreateLogSheet()
  const lastRow = sheet.getLastRow()
  
  if (lastRow <= 1) return
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - ALERT_CONFIG.logRetentionDays)
  
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
  let deleteCount = 0
  
  // Đếm số dòng cần xóa
  values.forEach(row => {
    const dateStr = row[0].toString().replace(/[🔴⚠️🟡✅]\s*/, '')
    try {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const date = new Date(parts[2], parts[1] - 1, parts[0])
        if (date < cutoffDate) {
          deleteCount++
        }
      }
    } catch (error) {
      console.warn('Lỗi parse ngày:', dateStr)
    }
  })
  
  if (deleteCount > 0) {
    sheet.deleteRows(2, deleteCount)
    console.log(`Đã xóa ${deleteCount} log cũ`)
  }
}

/**
 * Debug function để so sánh với React dashboard (giữ lại cho troubleshooting)
 */
function debugCalculationConsistency() {
  const data = getDataFromSheet()
  const testDate = new Date(2025, 7, 15) // 15/8/2025
  
  let total = 0
  data.forEach(record => {
    const examCount = getExamCountForDateNew(record, testDate)
    total += examCount.total
  })
  
  console.log(`=== CALCULATION CONSISTENCY CHECK ===`)
  console.log(`Ngày: ${testDate.getDate()}/${testDate.getMonth() + 1}/${testDate.getFullYear()}`)
  console.log(`Apps Script tính: ${total}`)
  console.log(`React Dashboard expected: 283`)
  console.log(`Chênh lệch: ${total - 283} (${((total - 283) / 283 * 100).toFixed(1)}%)`)
  
  if (Math.abs(total - 283) > 30) {
    console.log(`⚠️ Chênh lệch lớn, cần kiểm tra logic`)
  } else {
    console.log(`✅ Chênh lệch chấp nhận được`)
  }
}

/**
 * Test alert cho ngày có số lượng cao
 */
function testAlertHighVolume() {
  const data = getDataFromSheet()
  
  // Test với ngày 15/8 (expected 283 > threshold 200)
  const testDate = new Date(2025, 7, 15) // 15/8/2025
  const dates = [testDate]
  const dailyTotals = calculateDailyTotals(data, dates)
  
  console.log(`=== TEST ALERT SYSTEM ===`)
  console.log(`Ngày test: ${testDate.getDate()}/${testDate.getMonth() + 1}/${testDate.getFullYear()}`)
  console.log(`Tổng số người: ${dailyTotals[0]}`)
  console.log(`Threshold: 200`)
  console.log(`Should trigger alert: ${dailyTotals[0] > 200 ? 'YES' : 'NO'}`)
  
  if (dailyTotals[0] > 200) {
    console.log(`\n=== PREPARING ALERT DATA ===`)
    const companies = getCompaniesForDate(data, testDate)
    const breakdown = getDayBreakdown(data, testDate)
    
    console.log(`Companies count: ${companies.length}`)
    console.log(`Morning: ${breakdown.morning}, Afternoon: ${breakdown.afternoon}`)
    
    // Top 5 companies
    const topCompanies = companies
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
    
    console.log(`\nTop 5 companies:`)
    topCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}: ${company.total} người`)
    })
    
    console.log(`\nEmail alert system ready to send!`)
  }
}

/**
 * Export dữ liệu Daily_Check thành JSON (để test consistency)
 */
function exportDailyCheckData() {
  const sheet = getOrCreateLogSheet()
  const lastRow = sheet.getLastRow()
  
  if (lastRow <= 1) return {}
  
  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues()
  
  const result = {
    exportTime: new Date().toISOString(),
    totalDays: data.length,
    data: data.map(row => ({
      date: row[0],
      total: row[1],
      morning: row[2],
      afternoon: row[3],
      companies: row[4],
      topCompanies: row[5],
      emailSent: row[6]
    }))
  }
  
  console.log('Export data:', JSON.stringify(result, null, 2))
  return result
}

/**
 * Debug function để kiểm tra cấu trúc sheet
 */
function debugSheetStructure() {
  console.log('=== Debug Sheet Structure ===')
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    console.log('Spreadsheet name:', spreadsheet.getName())
    console.log('Available sheets:', spreadsheet.getSheets().map(s => s.getName()))
    
    const sheet = spreadsheet.getSheetByName(SHEET_CONFIG.dataSheetName)
    if (!sheet) {
      console.error(`Sheet "${SHEET_CONFIG.dataSheetName}" không tồn tại!`)
      console.log('Thử với sheet đầu tiên...')
      const firstSheet = spreadsheet.getSheets()[0]
      if (firstSheet) {
        console.log('First sheet name:', firstSheet.getName())
        inspectSheet(firstSheet)
      }
      return
    }
    
    inspectSheet(sheet)
    
  } catch (error) {
    console.error('Lỗi debug sheet:', error)
  }
}

/**
 * Inspect chi tiết một sheet
 */
function inspectSheet(sheet) {
  console.log('=== Sheet Info ===')
  console.log('Sheet name:', sheet.getName())
  console.log('Last row:', sheet.getLastRow())
  console.log('Last column:', sheet.getLastColumn())
  
  if (sheet.getLastRow() > 0) {
    console.log('=== Headers (Row 1) ===')
    const headers = sheet.getRange(1, 1, 1, Math.min(10, sheet.getLastColumn())).getValues()[0]
    headers.forEach((header, index) => {
      console.log(`Column ${index + 1}: "${header}" (${typeof header})`)
    })
    
    if (sheet.getLastRow() > 1) {
      console.log('=== Sample Data (Row 2) ===')
      const sampleData = sheet.getRange(2, 1, 1, Math.min(10, sheet.getLastColumn())).getValues()[0]
      sampleData.forEach((data, index) => {
        console.log(`Column ${index + 1}: "${data}" (${typeof data})`)
      })
    }
  }
}

/**
 * Debug function để kiểm tra raw data
 */
function debugRawData() {
  const data = getDataFromSheet()
  console.log('=== Raw Data Sample ===')
  
  data.slice(0, 5).forEach((record, index) => {
    console.log(`Record ${index + 1}:`)
    console.log(`  Company: ${record.companyName}`)
    console.log(`  Start: ${record.startDate} (${typeof record.startDate})`)
    console.log(`  End: ${record.endDate} (${typeof record.endDate})`)
    console.log(`  Total People: ${record.totalPeople}`)
    console.log(`  Status: ${record.status}`)
    console.log(`  Specific Dates: ${record.specificDates}`)
    console.log('---')
  })
  
  console.log(`Total records: ${data.length}`)
}

/**
 * Debug function test tính toán cho 1 ngày cụ thể
 */
function debugSpecificDate() {
  const data = getDataFromSheet()
  const testDate = new Date(2025, 7, 2) // 2/8/2025 (month is 0-indexed)
  
  console.log(`=== Debug cho ngày ${testDate.toLocaleDateString('vi-VN')} ===`)
  console.log(`Test date object: ${testDate}`)
  
  let totalForDay = 0
  let matchingRecords = 0
  
  data.forEach((record, index) => {
    // Debug thêm thông tin về date range
    const startDate = record.startDate
    const endDate = record.endDate
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const inRange = testDate >= start && testDate <= end
      
      if (inRange || record.specificDates) {
        console.log(`\n--- Record ${index + 1}: ${record.companyName} ---`)
        console.log(`Start: ${start.toLocaleDateString('vi-VN')} (${typeof startDate}) End: ${end.toLocaleDateString('vi-VN')} (${typeof endDate})`)
        console.log(`In range: ${inRange}`)
        console.log(`Specific dates: "${record.specificDates}"`)
        console.log(`Status: ${record.status}, People: ${record.totalPeople}`)
        
        const examCount = getExamCountForDateNew(record, testDate)
        console.log(`Result: ${examCount.total} (S:${examCount.morning}, C:${examCount.afternoon})`)
        
        // Debug working days calculation
        if (inRange && examCount.total === 0 && !record.specificDates) {
          const workingDays = countWorkingDays(start, end)
          console.log(`  DEBUG: Working days = ${workingDays}`)
        }
        
        if (examCount.total > 0) {
          totalForDay += examCount.total
          matchingRecords++
        }
      }
    }
  })
  
  console.log(`\n=== SUMMARY ===`)
  console.log(`Matching records: ${matchingRecords}`)
  console.log(`TỔNG CỘNG: ${totalForDay}`)
  console.log(`So sánh với React: ${totalForDay} vs 233`)
}

/**
 * Debug function cho nhiều ngày để tìm sai lệch
 */
function debugMultipleDates() {
  const data = getDataFromSheet()
  const testDates = [
    { date: new Date(2025, 7, 15), expected: 283 }, // 15/8 - biggest diff
    { date: new Date(2025, 7, 16), expected: 168 }  // 16/8
  ]
  
  testDates.forEach(testItem => {
    let totalForDay = 0
    let matchingRecords = 0
    
    console.log(`\n=== Debug cho ngày ${testItem.date.toLocaleDateString('vi-VN')} ===`)
    console.log(`Expected: ${testItem.expected}`)
    
    data.forEach((record, index) => {
      // Debug specific dates parsing
      if (record.specificDates && record.specificDates.includes('8/15') || record.specificDates.includes('8/16')) {
        console.log(`\n--- SPECIFIC DATES DEBUG ---`)
        console.log(`Company: ${record.companyName}`)
        console.log(`Specific dates raw: "${record.specificDates}"`)
        
        const parsedDates = parseSpecificDates(record.specificDates, testItem.date.getFullYear())
        console.log(`Parsed dates:`, parsedDates.length)
        parsedDates.forEach(pd => {
          if (pd.date.getDate() === testItem.date.getDate() && pd.date.getMonth() === testItem.date.getMonth()) {
            console.log(`  Match: ${pd.date.toLocaleDateString()}: ${pd.total} (S:${pd.morning}, C:${pd.afternoon})`)
          }
        })
      }
      
      const examCount = getExamCountForDateNew(record, testItem.date)
      if (examCount.total > 0) {
        console.log(`${record.companyName}: ${examCount.total} (Status: ${record.status})${record.specificDates ? ' [HAS SPECIFIC]' : ''}`)
        totalForDay += examCount.total
        matchingRecords++
      }
    })
    
    console.log(`ACTUAL: ${totalForDay}, EXPECTED: ${testItem.expected}, DIFF: ${totalForDay - testItem.expected}`)
    console.log(`Records: ${matchingRecords}`)
  })
}

/**
 * Debug function kiểm tra phân bổ ngày tháng năm
 */
function debugDateDistribution() {
  const data = getDataFromSheet()
  console.log('=== Date Distribution ===')
  
  const yearMonthCounts = {}
  const statusCounts = {}
  
  data.forEach(record => {
    // Count by status
    const status = record.status || 'Unknown'
    statusCounts[status] = (statusCounts[status] || 0) + 1
    
    // Count by year/month
    if (record.startDate) {
      const date = new Date(record.startDate)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}/${month}`
      
      yearMonthCounts[key] = (yearMonthCounts[key] || 0) + 1
    }
  })
  
  console.log('By Status:')
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })
  
  console.log('\nBy Year/Month:')
  Object.entries(yearMonthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([yearMonth, count]) => {
      console.log(`  ${yearMonth}: ${count} records`)
    })
}