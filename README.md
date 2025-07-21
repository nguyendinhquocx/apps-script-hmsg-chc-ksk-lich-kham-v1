# Dashboard Lịch Khám - HMSG CHC

Dashboard frontend React + Vite để quản lý và hiển thị dữ liệu lịch khám sức khỏe từ Supabase.

## Tính năng

### 📊 Hiển thị dữ liệu
- **Bảng dữ liệu**: Hiển thị danh sách lịch khám với phân trang
- **Tìm kiếm**: Tìm kiếm theo tên công ty, nhân viên
- **Lọc**: Lọc theo trạng thái khám, nhân viên, trạng thái Gold
- **Sắp xếp**: Sắp xếp theo các cột khác nhau

### 📈 Biểu đồ thống kê
- **Tổng quan**: Tổng lượt khám, số công ty, số bản ghi
- **Biểu đồ tròn**: Phân bố theo trạng thái khám
- **Biểu đồ cột**: Top 10 công ty theo lượt khám
- **Biểu đồ đường**: Xu hướng theo tháng

### 🔧 Tính năng khác
- **Xuất CSV**: Xuất dữ liệu hiện tại ra file CSV
- **Responsive**: Giao diện thích ứng với mọi thiết bị
- **Performance**: Tối ưu cho dữ liệu lớn với phân trang
- **Real-time**: Làm mới dữ liệu theo thời gian thực

## Công nghệ sử dụng

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase
- **Date handling**: date-fns

## Cài đặt

### Yêu cầu hệ thống
- Node.js >= 16
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository**
   ```bash
   cd "d:\pcloud\code\apps scripts\apps script hmsg chc ksk lich kham v1\react-dashboard"
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**
   ```bash
   cp .env.example .env
   ```
   
   Chỉnh sửa file `.env` với thông tin Supabase của bạn:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Chạy development server**
   ```bash
   npm run dev
   ```

5. **Mở trình duyệt**
   Truy cập: http://localhost:3000

## Scripts

```bash
# Development
npm run dev          # Chạy dev server
npm run build        # Build production
npm run preview      # Preview build
npm run lint         # Kiểm tra code style
```

## Cấu trúc dự án

```
src/
├── components/          # React components
│   ├── Dashboard.jsx    # Component chính
│   ├── DataTable.jsx    # Bảng dữ liệu
│   └── Charts.jsx       # Biểu đồ thống kê
├── services/           # API services
│   └── supabase.js     # Supabase client
├── App.jsx             # Root component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Schema dữ liệu

Dự án sử dụng bảng `lich_kham` trong Supabase với các trường chính:

```sql
-- Thông tin cơ bản
id, company, employee, status, gold

-- Thông tin lịch khám
start_date, end_date, actual_exam_dates
total_people_morning, total_people_afternoon, total_people
total_days_morning, total_days_afternoon, total_days

-- Thông tin khám sức khỏe (sáng/chiều)
sieuam_bung_sang, sieuam_bung_chieu
kham_phu_khoa_sang, kham_phu_khoa_chieu
-- ... các trường khám khác

-- Metadata
created_at, updated_at
```

## Tích hợp với Apps Script

Dashboard này đọc dữ liệu từ bảng `lich_kham` được đồng bộ bởi Google Apps Script:

- **Nguồn dữ liệu**: Google Sheets
- **Đồng bộ**: Apps Script tự động sync mỗi 15 phút
- **Xử lý**: Dữ liệu được xử lý và chuẩn hóa trước khi lưu vào Supabase

## Performance

### Tối ưu hóa
- **Phân trang**: Giới hạn 50 bản ghi mỗi trang
- **Lazy loading**: Tải dữ liệu theo yêu cầu
- **Caching**: Cache kết quả API trong component
- **Debouncing**: Tìm kiếm với độ trễ 300ms

### Xử lý dữ liệu lớn
- Sử dụng `useMemo` cho các tính toán phức tạp
- Pagination server-side qua Supabase
- Filtering và sorting trên server

## API Reference

### Supabase Endpoints

```javascript
// Lấy dữ liệu với phân trang
GET /rest/v1/lich_kham?limit=50&offset=0

// Tìm kiếm
GET /rest/v1/lich_kham?company=ilike.*search*

// Lọc theo trạng thái
GET /rest/v1/lich_kham?status=eq.completed

// Sắp xếp
GET /rest/v1/lich_kham?order=created_at.desc
```

## Troubleshooting

### Lỗi thường gặp

1. **Không kết nối được Supabase**
   - Kiểm tra URL và API key trong `.env`
   - Đảm bảo RLS policies cho phép truy cập

2. **Dữ liệu không hiển thị**
   - Kiểm tra bảng `lich_kham` có dữ liệu
   - Xem console để kiểm tra lỗi API

3. **Performance chậm**
   - Kiểm tra số lượng bản ghi
   - Tăng giới hạn phân trang nếu cần

### Debug

```bash
# Kiểm tra logs
npm run dev -- --debug

# Kiểm tra build
npm run build -- --debug
```

## Deployment

### Build production
```bash
npm run build
```

### Deploy options
- **Vercel**: Kết nối GitHub repo
- **Netlify**: Drag & drop thư mục `dist`
- **Static hosting**: Upload thư mục `dist`

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - xem file LICENSE để biết thêm chi tiết.

## Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ team phát triển.