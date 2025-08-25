/**
 * File chính để tổ chức các function và trigger
 * Copy tất cả code này vào Google Apps Script
 */

/**
 * ENTRY POINT - Function chính được gọi từ trigger
 * Thêm trigger này vào cuối function sync data hiện tại
 */
function onDataSyncComplete() {
  console.log('Data sync hoàn thành, kiểm tra cảnh báo...')
  checkAndSendAlert()
}

/**
 * Setup trigger tự động (chạy 1 lần khi setup)
 */
function setupTriggers() {
  // Xóa trigger cũ
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onDataSyncComplete') {
      ScriptApp.deleteTrigger(trigger)
    }
  })
  
  // Tạo trigger mới - chạy mỗi 8 tiếng để tối ưu
  ScriptApp.newTrigger('onDataSyncComplete')
    .timeBased()
    .everyHours(8) // Mỗi 8 giờ thay vì 1 giờ
    .create()
  
  console.log('Đã setup trigger tự động')
}

/**
 * Setup weekly cleanup trigger
 */
function setupWeeklyCleanup() {
  ScriptApp.newTrigger('cleanupOldLogs')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(6)
    .create()
    
  console.log('Đã setup weekly cleanup trigger')
}

/**
 * Manual functions để test và quản lý
 */

/**
 * Test toàn bộ hệ thống
 */
function testFullSystem() {
  console.log('=== Test toàn bộ hệ thống ===')
  
  try {
    // Test đọc dữ liệu
    console.log('1. Test đọc dữ liệu...')
    const data = getDataFromSheet()
    console.log(`Đọc được ${data.length} records`)
    
    if (data.length === 0) {
      console.log('Không có dữ liệu để test')
      return
    }
    
    // Test tính toán cho 2 tháng
    console.log('2. Test tính toán (2 tháng)...')
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    // Tháng hiện tại
    const currentMonthDates = getDateRange(currentYear, currentMonth)
    
    // Tháng sau
    let nextMonth = currentMonth + 1
    let nextYear = currentYear
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear = currentYear + 1
    }
    const nextMonthDates = getDateRange(nextYear, nextMonth)
    
    const dates = [...currentMonthDates, ...nextMonthDates]
    const dailyTotals = calculateDailyTotals(data, dates)
    
    console.log(`Tính được totals cho ${dates.length} ngày (${currentMonthDates.length} tháng ${currentMonth} + ${nextMonthDates.length} tháng ${nextMonth})`)
    console.log('Sample totals:', dailyTotals.slice(0, 10))
    
    // Test sheet Daily_Check
    console.log('3. Test Daily_Check sheet...')
    const alertDays = []
    updateDailyCheckSheet(dates, dailyTotals, alertDays)
    console.log('Cập nhật Daily_Check thành công')
    
    // Test email (nếu có ngày vượt ngưỡng)
    const threshold = getThresholdFromSheet()
    const highDays = dailyTotals.filter(total => total > threshold).length
    console.log(`4. Có ${highDays} ngày vượt ngưỡng ${threshold}`)
    
    if (highDays > 0) {
      console.log('Có thể test email với testEmailAlert()')
    }
    
    console.log('=== Test hoàn thành ===')
    
  } catch (error) {
    console.error('Lỗi trong test:', error)
  }
}

/**
 * Test timing logic
 */
function testTimingLogic() {
  console.log('=== Test Timing Logic ===')
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  console.log(`Hiện tại: ${now.toLocaleString('vi-VN')}`)
  console.log(`Hôm qua ${formatDate(yesterday)}: ${shouldAlertForDateTiming(yesterday) ? '✅ Có cảnh báo' : '❌ Không cảnh báo'}`)
  console.log(`Hôm nay ${formatDate(today)}: ${shouldAlertForDateTiming(today) ? '✅ Có cảnh báo' : '❌ Không cảnh báo'}`)
  console.log(`Ngày mai ${formatDate(tomorrow)}: ${shouldAlertForDateTiming(tomorrow) ? '✅ Có cảnh báo' : '❌ Không cảnh báo'}`)
  console.log(`Tuần tới ${formatDate(nextWeek)}: ${shouldAlertForDateTiming(nextWeek) ? '✅ Có cảnh báo' : '❌ Không cảnh báo'}`)
}

/**
 * Test consistency với React dashboard
 */
function testConsistencyWithReact() {
  console.log('=== Test Consistency với React ===')
  
  const data = getDataFromSheet()
  const today = new Date()
  
  // Test với vài ngày gần đây
  const testDates = [
    new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)
  ]
  
  testDates.forEach(date => {
    let totalForDay = 0
    let morningTotal = 0
    let afternoonTotal = 0
    
    data.forEach(record => {
      const examCount = getExamCountForDateNew(record, date)
      totalForDay += examCount.total
      morningTotal += examCount.morning
      afternoonTotal += examCount.afternoon
    })
    
    console.log(`${formatDate(date)}: Total=${totalForDay}, Morning=${morningTotal}, Afternoon=${afternoonTotal}`)
  })
  
  console.log('Kiểm tra với React dashboard xem có trùng khớp không')
}

/**
 * Manual send test email
 */
function sendTestEmail() {
  DEBUG_CONFIG.enabled = true
  testEmailAlert()
  DEBUG_CONFIG.enabled = false
}

/**
 * View current configuration
 */
function viewConfiguration() {
  console.log('=== Cấu hình hiện tại ===')
  console.log('Email recipients:', getEmailsFromSheet())
  console.log('Threshold:', getThresholdFromSheet())
  console.log('Alert hours:', ALERT_CONFIG.alertHours)
  console.log('Debug mode:', DEBUG_CONFIG.enabled)
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.dataSheetName)
  console.log('Data sheet exists:', !!sheet)
  
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.logSheetName)
  console.log('Log sheet exists:', !!logSheet)
}

/**
 * Quick setup - chạy 1 lần đầu tiên
 */
function quickSetup() {
  console.log('=== Quick Setup ===')
  
  try {
    // 1. Tạo Daily_Check sheet
    console.log('1. Tạo Daily_Check sheet...')
    getOrCreateLogSheet()
    
    // 2. Setup triggers  
    console.log('2. Setup triggers...')
    setupTriggers()
    setupWeeklyCleanup()
    
    // 3. Test system
    console.log('3. Test hệ thống...')
    testFullSystem()
    
    console.log('=== Setup hoàn thành ===')
    console.log('Các bước tiếp theo:')
    console.log('- Kiểm tra email trong cell Z2 của sheet dữ liệu')
    console.log('- Kiểm tra threshold trong cell Z1 của sheet dữ liệu') 
    console.log('- Chạy sendTestEmail() để test email')
    console.log('- Kiểm tra sheet Daily_Check đã được tạo')
    
  } catch (error) {
    console.error('Lỗi trong setup:', error)
  }
}

/**
 * Disable all triggers (khi cần tắt hệ thống)
 */
function disableAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(trigger => {
    if (['onDataSyncComplete', 'cleanupOldLogs'].includes(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger)
      console.log(`Đã xóa trigger: ${trigger.getHandlerFunction()}`)
    }
  })
  
  console.log('Đã tắt tất cả trigger của hệ thống cảnh báo')
}