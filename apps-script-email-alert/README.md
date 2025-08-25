# Apps Script Email Alert System

Hệ thống cảnh báo email tự động khi số lượng người khám trong ngày vượt quá ngưỡng cho phép.

## Cấu trúc thư mục

```
apps-script-email-alert/
├── README.md                 # Hướng dẫn này
├── Code.gs                   # Code chính Apps Script  
├── ExamUtils.gs              # Logic tính toán từ React
├── EmailAlert.gs             # Logic gửi email cảnh báo
├── SheetManager.gs           # Quản lý Google Sheets
└── Config.gs                 # Cấu hình hệ thống
```

## Cách hoạt động

### Luồng xử lý tự động:
```
[Google Sheets] → [Apps Script tính toán] → [Check > 200] → [Gửi email cảnh báo]
       ↓                                                          ↓
[Push to Supabase]                                      [Lưu log vào Daily_Check]
       ↓
[React Dashboard hiển thị]
```

### Logic tính toán:
- **Port chính xác từ React dashboard** để đảm bảo consistency
- **Xử lý complex specific dates** như "08/15(63,72),08/16(8),08/18(8)"
- **Chia đều theo ngày** cho format đơn giản như "08/16, 08/23" 
- **Tính working days** (bỏ qua Chủ nhật)

### Cơ chế chống spam:
- **Lần đầu** gửi ngày nào: Gửi ngay
- **Lần sau**: Chỉ gửi khi tăng ≥50 người so với lần trước
- **Log tracking**: Nhớ số lượng đã gửi cho mỗi ngày

## Tính năng

- ✅ Tính toán chính xác số người khám theo ngày
- ✅ Cảnh báo email khi vượt ngưỡng (mặc định 200 người)  
- ✅ Email chi tiết với danh sách công ty và gợi ý điều chỉnh
- ✅ Tránh spam email (logic anti-duplicate)
- ✅ Sheet "Daily_Check" để theo dõi thủ công
- ✅ Kiểm tra consistency với React dashboard

---

# Hướng dẫn cài đặt

## Bước 1: Chuẩn bị Google Apps Script

1. Mở Google Sheets chứa dữ liệu lịch khám
2. Vào **Extensions > Apps Script**
3. Tạo project mới hoặc sử dụng project hiện có

## Bước 2: Copy Code

Copy từng file .gs vào Apps Script theo thứ tự:

1. `Config.gs` - Cấu hình hệ thống
2. `ExamUtils.gs` - Logic tính toán  
3. `SheetManager.gs` - Quản lý sheets
4. `EmailAlert.gs` - Gửi email
5. `Code.gs` - Function chính

## Bước 3: Cấu hình Email & Threshold

### Cách 1: Sửa trong code (Config.gs)
```javascript
const EMAIL_CONFIG = {
  recipients: [
    'admin@hmsg.vn',
    'manager@hmsg.vn'
  ]
}

const ALERT_CONFIG = {
  threshold: 200  // Ngưỡng cảnh báo
}
```

### Cách 2: Sử dụng cells trong Google Sheets (Khuyến nghị)
- **Cell Z1**: Nhập threshold (VD: 200)
- **Cell Z2**: Nhập emails cách nhau bằng dấu phẩy (VD: admin@hmsg.vn,manager@hmsg.vn)

## Bước 4: Chỉnh tên Sheet

Trong `Config.gs`, sửa tên sheet chứa dữ liệu:
```javascript
const SHEET_CONFIG = {
  dataSheetName: 'chc'  // Tên sheet thực tế của bạn
}
```

## Bước 5: Setup Permissions

1. Chạy function `quickSetup()` lần đầu tiên
2. Cấp quyền khi được yêu cầu:
   - ✅ Google Sheets access
   - ✅ Gmail send permission
   - ✅ Trigger permission

## Bước 6: Test Hệ thống

### Test cơ bản:
```javascript
quickSetup()              // Setup tự động tất cả
viewConfiguration()       // Xem cấu hình
testAlertHighVolume()     // Test logic alert
```

### Test email:
```javascript
testEmailAlert()          // Gửi email test với data mẫu
```

### Test consistency:
```javascript
debugCalculationConsistency()  // So sánh với React dashboard
```

## Bước 7: Tích hợp với sync hiện tại

Thêm vào cuối function sync data hiện tại:
```javascript
function yourExistingSyncFunction() {
  // Code sync hiện tại...
  
  // Thêm dòng này ở cuối:
  checkAndSendAlert()
}
```

Hoặc setup trigger riêng chạy sau khi sync xong.

## Bước 8: Kiểm tra kết quả

### Sheet "Daily_Check" được tạo tự động:
- ✅ Hiển thị tổng số người khám mỗi ngày
- ⚠️ Highlight ngày vượt ngưỡng màu đỏ
- 📧 Trạng thái email đã gửi
- 📊 Top công ty trong ngày

### Email cảnh báo sẽ chứa:
- 📊 Tổng quan số liệu (tổng, sáng, chiều)
- 📋 Danh sách công ty chi tiết (top 6)
- 💡 Gợi ý điều chỉnh dựa trên số liệu
- ⏰ Timestamp và source info

---

# Troubleshooting

## Lỗi thường gặp:

### 1. "Sheet not found"
- Kiểm tra `SHEET_CONFIG.dataSheetName` đúng tên sheet
- Đảm bảo sheet có dữ liệu và đúng format

### 2. "Permission denied"  
- Chạy lại `quickSetup()` để cấp quyền
- Kiểm tra Gmail API enabled

### 3. "Email not sent"
- Kiểm tra email trong cell Z2 hoặc `EMAIL_CONFIG.recipients`
- Xem logs trong Apps Script console
- Kiểm tra có trong khung giờ cảnh báo không (8h-20h)

### 4. "Calculation mismatch"
- Chạy `debugCalculationConsistency()` để kiểm tra
- So sánh với React dashboard
- Chênh lệch <10% là chấp nhận được

## Debug commands:

```javascript
// Xem cấu hình hiện tại
viewConfiguration()

// Test với data thực
testAlertHighVolume()

// So sánh calculation với React
debugCalculationConsistency()

// Disable hệ thống
disableAllTriggers()

// Enable debug mode cho email
DEBUG_CONFIG.enabled = true
```

## Bảo trì định kỳ

### Hàng tuần:
- Kiểm tra sheet "Daily_Check" có hoạt động không
- Verify email alerts accuracy

### Hàng tháng:
- Clean old logs (tự động sau 30 ngày)
- Review threshold settings
- Update email recipients nếu cần

---

# Advanced Configuration

## Thay đổi threshold và cấu hình:
```javascript
// Trong Config.gs
ALERT_CONFIG: {
  threshold: 250,              // Ngưỡng cảnh báo
  minimumIncreaseForResend: 30,// Tăng tối thiểu để gửi lại
  alertHours: {
    start: 8,                  // Bắt đầu gửi alert từ 8h
    end: 20                    // Ngừng gửi alert sau 20h
  }
}
```

## Thay đổi email template:
- Sửa trong `EmailAlert.gs > buildEmailContent()`
- Tuân thủ nguyên tắc AGENTS.md: đen/trắng/xám, không icon, font Calibri

## Thay đổi trigger frequency:
- Sửa trong `Code.gs > setupTriggers()`
- Khuyến nghị: chạy mỗi 15-30 phút sau sync

---

# Lưu ý quan trọng

⚠️ **Không ảnh hưởng đến dashboard hiện tại** - Hệ thống chạy song song, độc lập

⚠️ **Test kỹ trước production** - Chạy `testEmailAlert()` nhiều lần với `DEBUG_CONFIG.enabled = true`

⚠️ **Monitor logs thường xuyên** - Kiểm tra Apps Script console và sheet Daily_Check

⚠️ **Backup configuration** - Lưu lại email settings và threshold quan trọng

⚠️ **Update khi thay đổi data structure** - Sync với team dev nếu có thay đổi format dữ liệu

## Support

Nếu gặp vấn đề, check theo thứ tự:
1. Apps Script console logs
2. Sheet "Daily_Check" có data không
3. Email configuration đúng không  
4. Trigger có active không (`viewConfiguration()`)
5. Calculation consistency (`debugCalculationConsistency()`)

Hoặc liên hệ team dev để debug calculation logic.