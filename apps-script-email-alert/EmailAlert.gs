/**
 * Hệ thống gửi email cảnh báo khi số lượng khám vượt ngưỡng
 */

/**
 * Function chính để kiểm tra và gửi cảnh báo email
 * Được gọi từ trigger sau khi sync data
 */
function checkAndSendAlert() {
  try {
    console.log('=== Bắt đầu kiểm tra cảnh báo email ===')
    
    // Kiểm tra thời gian có hợp lệ không
    if (!isInAlertTimeWindow()) {
      console.log('Ngoài khung giờ cảnh báo, bỏ qua')
      return
    }
    
    // Lấy dữ liệu từ sheet
    const data = getDataFromSheet()
    if (!data || data.length === 0) {
      console.log('Không có dữ liệu, bỏ qua')
      return
    }
    
    // Tính toán cho tháng hiện tại
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    const dates = getDateRange(currentYear, currentMonth)
    const dailyTotals = calculateDailyTotals(data, dates)
    
    // Kiểm tra các ngày vượt ngưỡng
    const threshold = getThresholdFromSheet()
    const alertDays = []
    
    dates.forEach((date, index) => {
      const total = dailyTotals[index]
      if (total > threshold) {
        const companies = getCompaniesForDate(data, date)
        const breakdown = getDayBreakdown(data, date)
        
        alertDays.push({
          date: date,
          total: total,
          morning: breakdown.morning,
          afternoon: breakdown.afternoon,
          companies: companies,
          threshold: threshold
        })
      }
    })
    
    if (alertDays.length === 0) {
      console.log('Không có ngày nào vượt ngưỡng')
      updateDailyCheckSheet(dates, dailyTotals, [])
      return
    }
    
    console.log(`Tìm thấy ${alertDays.length} ngày vượt ngưỡng`)
    
    // Kiểm tra xem có cần gửi email không (tránh spam)
    const shouldSend = alertDays.filter(day => shouldSendAlertForDay(day))
    
    if (shouldSend.length > 0) {
      sendAlertEmail(shouldSend)
      recordSentAlerts(shouldSend)
    }
    
    // Cập nhật sheet theo dõi
    updateDailyCheckSheet(dates, dailyTotals, alertDays)
    
    console.log('=== Hoàn thành kiểm tra cảnh báo ===')
    
  } catch (error) {
    console.error('Lỗi trong checkAndSendAlert:', error)
    
    // Gửi email báo lỗi cho admin
    try {
      MailApp.sendEmail({
        to: EMAIL_CONFIG.recipients[0],
        subject: '🚨 Lỗi hệ thống cảnh báo Apps Script',
        htmlBody: `
          <h3>Có lỗi xảy ra trong hệ thống cảnh báo:</h3>
          <pre>${error.toString()}</pre>
          <br>
          <small>Thời gian: ${new Date().toLocaleString('vi-VN')}</small>
        `
      })
    } catch (mailError) {
      console.error('Không thể gửi email báo lỗi:', mailError)
    }
  }
}

/**
 * Kiểm tra xem có nên gửi cảnh báo cho ngày này không
 */
function shouldSendAlertForDay(dayData) {
  const sheet = getOrCreateLogSheet()
  const lastRow = sheet.getLastRow()
  
  if (lastRow <= 1) return true // Chưa có log nào
  
  // Tìm log gần nhất cho ngày này
  const dateStr = formatDate(dayData.date)
  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues()
  
  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i]
    if (row[0] === dateStr && row[6]) { // Có gửi email
      const lastSentTotal = row[1]
      const increase = dayData.total - lastSentTotal
      
      // Chỉ gửi lại nếu tăng đáng kể
      return increase >= ALERT_CONFIG.minimumIncreaseForResend
    }
  }
  
  return true // Chưa từng gửi cho ngày này
}

/**
 * Gửi email cảnh báo
 */
function sendAlertEmail(alertDays) {
  const emails = getEmailsFromSheet()
  
  alertDays.forEach(dayData => {
    const emailContent = buildEmailContent(dayData)
    const subject = EMAIL_CONFIG.subjectTemplate
      .replace('{date}', formatDate(dayData.date))
      .replace('{threshold}', dayData.threshold)
      .replace('{total}', dayData.total)
    
    const finalSubject = DEBUG_CONFIG.enabled ? 
      DEBUG_CONFIG.testPrefix + subject : subject
      
    const recipients = DEBUG_CONFIG.enabled ? 
      [DEBUG_CONFIG.testEmail] : emails
    
    recipients.forEach(email => {
      try {
        MailApp.sendEmail({
          to: email,
          subject: finalSubject,
          htmlBody: emailContent
        })
        
        console.log(`Đã gửi email cảnh báo đến ${email} cho ngày ${formatDate(dayData.date)}`)
        
      } catch (error) {
        console.error(`Lỗi gửi email đến ${email}:`, error)
      }
    })
    
    // Delay nhỏ giữa các email để tránh rate limit
    Utilities.sleep(1000)
  })
}

/**
 * Tạo nội dung email HTML
 */
function buildEmailContent(dayData) {
  const topCompanies = dayData.companies
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
  
  const companyList = topCompanies.map((company, index) => 
    `${index + 1}. ${company.name} - ${company.total} người (Sáng: ${company.morning}, Chiều: ${company.afternoon})`
  ).join('\n')
  
  const suggestions = []
  if (dayData.total > dayData.threshold + 50) {
    suggestions.push('Có thể chuyển một phần sang ngày khác')
  }
  if (topCompanies.length > 0 && topCompanies[0].total > 50) {
    suggestions.push('Ưu tiên điều chỉnh các công ty có số lượng lớn')
  }
  suggestions.push('Kiểm tra phân bổ sáng/chiều để cân bằng tải')
  
  const timestamp = new Date().toLocaleString('vi-VN')
  
  return `
    <div style="font-family: Calibri, sans-serif; color: #000000; background: #ffffff; max-width: 600px; padding: 20px;">
      
      <h2 style="color: #000000; font-weight: bold; margin-bottom: 20px;">
        CẢNH BÁO LỊCH KHÁM NGÀY ${formatDate(dayData.date).toUpperCase()}
      </h2>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #000000; font-weight: bold; margin-bottom: 15px;">Tổng quan</h3>
        <div style="line-height: 1.8; color: #000000;">
          Tổng số người: <strong>${dayData.total} người</strong> (vượt ${dayData.total - dayData.threshold} người)<br>
          Buổi sáng: ${dayData.morning} người<br>
          Buổi chiều: ${dayData.afternoon} người<br>
          Số công ty: ${dayData.companies.length} công ty
        </div>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #000000; font-weight: bold; margin-bottom: 15px;">Danh sách công ty</h3>
        <div style="line-height: 1.8; color: #000000; white-space: pre-line;">
${companyList}
        </div>
        ${dayData.companies.length > 6 ? `\n... và ${dayData.companies.length - 6} công ty khác` : ''}
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #000000; font-weight: bold; margin-bottom: 15px;">Gợi ý điều chỉnh</h3>
        <div style="line-height: 1.8; color: #000000;">
          ${suggestions.join('<br>')}
        </div>
      </div>
      
      <div style="border-top: 1px dotted #cccccc; padding-top: 15px; margin-top: 25px;">
        <small style="color: #000000;">
          Thời gian: ${timestamp}<br>
          Email tự động từ hệ thống Apps Script
        </small>
      </div>
      
    </div>
  `
}

/**
 * Lưu log các email đã gửi
 */
function recordSentAlerts(alertDays) {
  const sheet = getOrCreateLogSheet()
  
  alertDays.forEach(dayData => {
    const timestamp = new Date().toLocaleString('vi-VN')
    const topCompanies = dayData.companies
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map(c => `${c.name}(${c.total})`)
      .join(', ')
    
    sheet.appendRow([
      formatDate(dayData.date),
      dayData.total,
      dayData.morning,
      dayData.afternoon,
      dayData.companies.length,
      topCompanies,
      `✅ ${timestamp}`
    ])
  })
}

/**
 * Kiểm tra có trong khung giờ cảnh báo không
 */
function isInAlertTimeWindow() {
  const now = new Date()
  const hour = now.getHours()
  return hour >= ALERT_CONFIG.alertHours.start && hour <= ALERT_CONFIG.alertHours.end
}

/**
 * Format ngày theo định dạng dd/mm/yyyy
 */
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Lấy breakdown sáng/chiều cho một ngày
 */
function getDayBreakdown(data, date) {
  let morning = 0, afternoon = 0
  
  data.forEach(record => {
    const examCount = getExamCountForDateNew(record, date)
    morning += examCount.morning
    afternoon += examCount.afternoon
  })
  
  return { morning, afternoon }
}

/**
 * Lấy danh sách công ty khám trong ngày
 */
function getCompaniesForDate(data, date) {
  const companies = []
  
  data.forEach(record => {
    const examCount = getExamCountForDateNew(record, date)
    if (examCount.total > 0) {
      companies.push({
        name: record.companyName,
        total: examCount.total,
        morning: examCount.morning,
        afternoon: examCount.afternoon
      })
    }
  })
  
  return companies
}

/**
 * Test function để kiểm tra email
 */
function testEmailAlert() {
  DEBUG_CONFIG.enabled = true
  
  // Tạo dữ liệu test
  const testDay = {
    date: new Date(),
    total: 250,
    morning: 120,
    afternoon: 130,
    threshold: 200,
    companies: [
      { name: 'VINGROUP', total: 80, morning: 40, afternoon: 40 },
      { name: 'FPT SOFTWARE', total: 60, morning: 30, afternoon: 30 },
      { name: 'VIETTEL', total: 45, morning: 20, afternoon: 25 },
      { name: 'TECHCOMBANK', total: 35, morning: 15, afternoon: 20 },
      { name: 'SAMSUNG', total: 30, morning: 15, afternoon: 15 }
    ]
  }
  
  console.log('Gửi email test...')
  sendAlertEmail([testDay])
  console.log('Hoàn thành test email')
}