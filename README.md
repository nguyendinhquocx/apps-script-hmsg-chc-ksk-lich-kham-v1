# Apps Script HMSG CHC KSK Lịch Khám v1

Hệ thống quản lý và đồng bộ dữ liệu lịch khám bệnh sử dụng Google Apps Script.

## Tính năng chính

### Đồng bộ dữ liệu (Update.js)
- **Đồng bộ thông thường**: Cập nhật dữ liệu giữa các sheet theo cấu hình
- **Đồng bộ với ID**: Tự động thêm cột ID duy nhất cho mỗi bản ghi
- **Lọc dữ liệu thông minh**: Hỗ trợ nhiều điều kiện lọc (ngày, số, null, wildcard)
- **Tự động hóa**: Thiết lập trigger để đồng bộ theo lịch

### Dashboard (dashboard.html)
- Giao diện quản lý trực quan
- Theo dõi trạng thái hệ thống
- Báo cáo và thống kê

## Cấu trúc file

```
├── Code.js              # Logic chính của ứng dụng
├── Update.js            # Chức năng đồng bộ dữ liệu
├── dashboard.html       # Giao diện dashboard
├── dashboard_scripts.html # JavaScript cho dashboard
├── dashboard_styles.html  # CSS cho dashboard
├── appsscript.json      # Cấu hình Apps Script
└── .clasp.json          # Cấu hình CLASP
```

## Cách sử dụng

### 1. Thiết lập ban đầu
1. Mở Google Apps Script
2. Tạo project mới và import các file
3. Cấu hình quyền truy cập Google Sheets

### 2. Cấu hình đồng bộ
1. Tạo sheet "Cấu hình" với các thông tin:
   - Sheet nguồn và đích
   - Điều kiện lọc
   - Cột cần đồng bộ
2. Chạy function `syncData()` hoặc `syncDataWithId()`

### 3. Sử dụng menu
- **Cập nhật**: Đồng bộ dữ liệu thông thường
- **Cập nhật + ID**: Đồng bộ và thêm cột ID duy nhất

## Tính năng lọc dữ liệu

### Điều kiện hỗ trợ
- **Ngày**: Lọc theo khoảng thời gian
- **Số**: So sánh số học (>, <, =, >=, <=)
- **Text**: Tìm kiếm chính xác hoặc wildcard (*)
- **Null**: Kiểm tra ô trống/không trống
- **Logic**: Hỗ trợ NOT, OR

### Ví dụ cấu hình
```
Ngày: 01/01/2024-31/12/2024
Trạng thái: NOT null
Loại: Khám* OR Tái*
```

## ID duy nhất

Khi sử dụng `syncDataWithId()`, hệ thống tự động tạo ID ngắn gọn (8-10 ký tự) sử dụng:
- Timestamp (giây)
- Số ngẫu nhiên
- Mã hóa base36

Ví dụ ID: `k7x9m2p8`, `n5q8r3w1`

## Yêu cầu hệ thống

- Google Apps Script
- Quyền truy cập Google Sheets
- Google Drive API (tùy chọn)

## Phát triển

### Cài đặt CLASP
```bash
npm install -g @google/clasp
clasp login
clasp push
```

### Debugging
- Sử dụng `console.log()` trong Apps Script Editor
- Kiểm tra Execution Transcript
- Test từng function riêng lẻ

## Bảo mật

- Không lưu trữ thông tin nhạy cảm trong code
- Sử dụng Properties Service cho cấu hình
- Kiểm tra quyền truy cập sheet

## Hỗ trợ

Để báo lỗi hoặc đề xuất tính năng, vui lòng tạo issue hoặc liên hệ team phát triển.

---

*Phiên bản: 1.0*  
*Cập nhật: 2024*