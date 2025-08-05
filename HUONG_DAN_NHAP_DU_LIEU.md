# Hướng Dẫn Nhập Dữ Liệu - Dashboard Lịch Khám

## 📅 Cột "Các ngày khám thực tế"

### Định dạng nhập liệu:
```
MM/dd (số_người_sáng, số_người_chiều)
```

### Các trường hợp cụ thể:

#### ✅ **Trường hợp 1: Khám cả 2 buổi**
```
8/14 (4,14)
```
- **Ý nghĩa:** Ngày 14/8, buổi sáng 4 người, buổi chiều 14 người
- **Tổng:** 18 người trong ngày

#### ✅ **Trường hợp 2: Khám 1 buổi**
```
07/28(20)
```
- **Ý nghĩa:** Ngày 28/7, chỉ khám 1 buổi với 20 người
- **Lưu ý:** Hệ thống sẽ tự động phân bổ vào buổi sáng

#### ✅ **Trường hợp 3: Nhiều ngày**
```
8/14 (4,14), 8/15 (10,8), 8/16 (5)
```
- **Ý nghĩa:** 
  - 14/8: sáng 4, chiều 14
  - 15/8: sáng 10, chiều 8  
  - 16/8: chỉ 1 buổi với 5 người

#### ✅ **Trường hợp 4: Chỉ buổi chiều**
```
8/14 (0,12)
```
- **Ý nghĩa:** Ngày 14/8, sáng 0 người, chiều 12 người

### 🔧 **Quy tắc định dạng:**
- **Tháng/ngày:** `MM/dd` hoặc `M/d` (8/14 hoặc 08/14)
- **Dấu ngoặc:** Bắt buộc có `()`
- **Phân cách:** Dùng dấu `,` để phân cách sáng/chiều
- **Nhiều ngày:** Dùng dấu `,` và khoảng trắng để phân cách

---

## 🏥 Mục Cận Lâm Sàng

### Các cách nhập hợp lệ:

#### ✅ **1. Nhập số nguyên**
```
5     → 5 người khám
10    → 10 người khám
25    → 25 người khám
```

#### ✅ **2. Ký tự 'x' hoặc 'X'**
```
x     → Có khám, số lượng = số người thực tế trong buổi đó
X     → Tương tự như 'x'
```
**Ví dụ:** Nếu buổi sáng có 8 người khám, nhập `x` = 8 người siêu âm

#### ✅ **3. Ký tự với phân số**
```
x/2   → Một nửa số người thực tế
X/2   → Tương tự như 'x/2'
```
**Ví dụ:** Nếu buổi sáng có 8 người khám, nhập `x/2` = 4 người siêu âm

#### ✅ **4. Trường hợp đặc biệt**
```
0     → Không có ai khám
      → (Để trống) = 0 người khám
```

### 💡 **Logic xử lý:**

| Nhập vào | Buổi có 8 người | Kết quả hiển thị |
|----------|-----------------|------------------|
| `5`      | 8 người         | 5 người          |
| `x`      | 8 người         | 8 người          |
| `X`      | 8 người         | 8 người          |
| `x/2`    | 8 người         | 4 người          |
| `X/2`    | 8 người         | 4 người          |
| `0`      | 8 người         | 0 người          |

---

## 📊 Ví Dụ Thực Tế

### **Công ty ABC - Ngày 14/8:**
```
Các ngày khám thực tế: 8/14 (6,12)
Siêu âm bụng sáng: x        → 6 người
Siêu âm bụng chiều: 8       → 8 người  
Điện tâm đồ sáng: x/2       → 3 người
Điện tâm đồ chiều: x        → 12 người
```

### **Kết quả hiển thị:**
- Buổi sáng 14/8: 6 người (SA bụng: 6, ĐTĐ: 3)
- Buổi chiều 14/8: 12 người (SA bụng: 8, ĐTĐ: 12)

---

## ⚠️ **Lưu Ý Quan Trọng**

### **❌ Các lỗi thường gặp:**
1. **Thiếu dấu ngoặc:** `8/14 4,14` ❌ → `8/14 (4,14)` ✅
2. **Sai định dạng ngày:** `14/8 (4,14)` ❌ → `8/14 (4,14)` ✅
3. **Thiếu dấu phẩy:** `8/14 (4 14)` ❌ → `8/14 (4,14)` ✅
4. **Ký tự không hợp lệ:** `xx`, `x/3`, `y` ❌

### **✅ Mẹo nhập liệu:**
1. **Kiểm tra định dạng** trước khi lưu
2. **Sử dụng 'x'** khi tất cả đều khám
3. **Sử dụng 'x/2'** khi khoảng 50% khám
4. **Nhập số cụ thể** khi biết chính xác

---

## 🔄 **Quy Trình Kiểm Tra**

1. **Import dữ liệu** vào hệ thống
2. **Kiểm tra view "Lịch khám"** - xem số liệu có đúng không
3. **Kiểm tra view "Cận lâm sàng"** - xem biểu đồ có hợp lý không
4. **Sửa lỗi** nếu có giá trị NaN hoặc không đúng

---

## 📞 **Hỗ Trợ**

Nếu gặp vấn đề với việc nhập liệu:
1. Kiểm tra lại định dạng theo hướng dẫn
2. Xem console browser để tìm lỗi chi tiết
3. Liên hệ team phát triển để được hỗ trợ

---

*Cập nhật lần cuối: August 2025*
