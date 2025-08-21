/**
 * Cấu hình hệ thống cảnh báo email
 * Chỉnh sửa các giá trị này theo nhu cầu
 */

// Cấu hình email
const EMAIL_CONFIG = {
  // Danh sách email nhận cảnh báo (có thể thêm nhiều email)
  recipients: [
    'quoc.nguyen3@hoanmy.com',
    // 'manager@hmsg.vn'
    // Thêm email khác nếu cần
  ],
  
  // Email gửi từ (thường là email của Google account chạy script)
  sender: Session.getActiveUser().getEmail(),
  
  // Tiêu đề email
  subjectTemplate: '⚠️ Cảnh báo: Lịch khám ngày {date} vượt quá {threshold} người ({total} người)',
  
  // Chữ ký email
  signature: `
<br><hr>
<small>
📧 Email tự động từ hệ thống Apps Script<br>
🕒 Thời gian: {timestamp}<br>
⚙️ Để thay đổi cài đặt, liên hệ IT
</small>
  `
}

// Cấu hình cảnh báo
const ALERT_CONFIG = {
  // Ngưỡng cảnh báo (số người)
  threshold: 200,
  
  // Chỉ gửi cảnh báo trong khung giờ này (24h format)
  alertHours: {
    start: 7,  // 7h sáng
    end: 18    // 6h chiều
  },
  
  // Ngăn spam: chỉ gửi lại nếu tăng ít nhất X người so với lần cảnh báo trước
  minimumIncreaseForResend: 20,
  
  // Số ngày tối đa lưu log (tự động xóa log cũ)
  logRetentionDays: 30
}

// Cấu hình Google Sheets
const SHEET_CONFIG = {
  // Tên sheet chứa dữ liệu gốc 
  dataSheetName: 'chc', // Tên sheet thực tế từ debug
  
  // Tên sheet để lưu log theo dõi (sẽ được tạo tự động)
  logSheetName: 'Daily_Check',
  
  // Cột chứa dữ liệu trong sheet gốc
  columns: {
    companyName: 'A',      // Tên công ty
    startDate: 'B',        // Ngày bắt đầu khám  
    endDate: 'C',          // Ngày kết thúc khám
    totalPeople: 'D',      // Số người khám
    status: 'E',           // Trạng thái khám
    employee: 'F',         // Tên nhân viên
    specificDates: 'G',    // Các ngày khám thực tế
    morningAvg: 'H',       // Trung bình ngày sáng
    afternoonAvg: 'I',     // Trung bình ngày chiều
    bloodTestDate: 'J'     // Ngày lấy máu
  }
}

// Cấu hình debug & testing
const DEBUG_CONFIG = {
  // Bật debug mode để xem log chi tiết
  enabled: false,
  
  // Email test (chỉ gửi đến email này khi test)
  testEmail: 'quoc.nguyen3@hoanmy.com',
  
  // Prefix cho subject khi test
  testPrefix: '[TEST] '
}

/**
 * Lấy ngưỡng cảnh báo từ cell trong sheet (nếu có)
 * Cell này có thể để admin thay đổi threshold mà không cần sửa code
 */
function getThresholdFromSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.dataSheetName)
    const thresholdCell = sheet.getRange('Z1').getValue() // Cell Z1 chứa threshold
    
    if (thresholdCell && typeof thresholdCell === 'number' && thresholdCell > 0) {
      return thresholdCell
    }
  } catch (e) {
    console.log('Không thể đọc threshold từ sheet, dùng giá trị mặc định')
  }
  
  return ALERT_CONFIG.threshold
}

/**
 * Lấy danh sách email từ cell trong sheet (nếu có)
 */
function getEmailsFromSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG.dataSheetName)
    const emailsCell = sheet.getRange('Z2').getValue() // Cell Z2 chứa emails
    
    if (emailsCell && typeof emailsCell === 'string') {
      return emailsCell.split(',').map(email => email.trim()).filter(email => email)
    }
  } catch (e) {
    console.log('Không thể đọc emails từ sheet, dùng giá trị mặc định')
  }
  
  return EMAIL_CONFIG.recipients
}