// Test để kiểm tra logic mới - sử dụng morning/afternoon thay vì total
import { parseIntSafe } from './src/utils/parseUtils.js'

console.log('🧪 Testing corrected logic: using morning/afternoon instead of total')
console.log('=' + '='.repeat(80))

// Mock examResult với morning và afternoon riêng biệt
const mockExamResult = {
  total: 100,    // Tổng cả ngày
  morning: 40,   // Buổi sáng
  afternoon: 60  // Buổi chiều
}

console.log('\n📋 Test Case: Mock data')
console.log('examResult.total =', mockExamResult.total)
console.log('examResult.morning =', mockExamResult.morning)
console.log('examResult.afternoon =', mockExamResult.afternoon)

console.log('\n📋 Test Case: "x" values với logic cũ (sai)')
console.log('parseIntSafe("x", examResult.total) =', parseIntSafe("x", mockExamResult.total))
console.log('Tổng sáng + chiều (logic cũ) =', parseIntSafe("x", mockExamResult.total) + parseIntSafe("x", mockExamResult.total))

console.log('\n📋 Test Case: "x" values với logic mới (đúng)')
console.log('parseIntSafe("x", examResult.morning) =', parseIntSafe("x", mockExamResult.morning))
console.log('parseIntSafe("x", examResult.afternoon) =', parseIntSafe("x", mockExamResult.afternoon))
console.log('Tổng sáng + chiều (logic mới) =', parseIntSafe("x", mockExamResult.morning) + parseIntSafe("x", mockExamResult.afternoon))

console.log('\n📋 Test Case: "x/2" values với logic mới')
console.log('parseIntSafe("x/2", examResult.morning) =', parseIntSafe("x/2", mockExamResult.morning))
console.log('parseIntSafe("x/2", examResult.afternoon) =', parseIntSafe("x/2", mockExamResult.afternoon))
console.log('Tổng sáng + chiều (x/2) =', parseIntSafe("x/2", mockExamResult.morning) + parseIntSafe("x/2", mockExamResult.afternoon))

console.log('\n📋 Test Case: Số thông thường (không đổi)')
console.log('parseIntSafe("50", examResult.morning) =', parseIntSafe("50", mockExamResult.morning))
console.log('parseIntSafe("60", examResult.afternoon) =', parseIntSafe("60", mockExamResult.afternoon))
console.log('Tổng sáng + chiều (số thông thường) =', parseIntSafe("50", mockExamResult.morning) + parseIntSafe("60", mockExamResult.afternoon))

console.log('\n✅ Kết luận:')
console.log('📌 Logic cũ: "x" sáng + "x" chiều = 100 + 100 = 200 ca (SAI)')
console.log('📌 Logic mới: "x" sáng + "x" chiều = 40 + 60 = 100 ca (ĐÚNG)')
console.log('📌 Điều này khớp với bảng "Cận lâm sàng" hiển thị 117 + 134 = 251 ca')
console.log('📌 Thay vì 454 ca như trước đây (có thể do cộng dồn nhiều lần hoặc dùng total)')
