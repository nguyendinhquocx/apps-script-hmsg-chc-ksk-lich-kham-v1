import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Cấu hình Supabase từ environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging để kiểm tra environment variables
console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
})

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Không cần authentication cho dashboard này
  }
})

// Service class để quản lý API calls
export class LichKhamService {
  static tableName = 'lich_kham'  // Tên bảng chính xác từ Supabase

  /**
   * Test connection và kiểm tra dữ liệu
   */
  static async testConnection() {
    try {
      console.log('Testing Supabase connection...')
      console.log('Table name:', this.tableName)
      console.log('Supabase URL:', supabaseUrl)
      console.log('Has Anon Key:', !!supabaseAnonKey)
      
      // Test 1: Simple select without count
      console.log('Test 1: Basic select...')
      const { data: testData, error: testError } = await supabase
        .from(this.tableName)
        .select('*')
        .limit(5)
      
      console.log('Test 1 result:', {
        success: !testError,
        error: testError?.message,
        errorDetails: testError,
        dataCount: testData?.length,
        sampleData: testData?.[0]
      })
      
      if (testError) {
        console.error('Basic select failed:', testError)
        return { 
          success: false, 
          error: testError.message, 
          data: null,
          rls_issue: testError.message.includes('permission denied') || testError.message.includes('RLS')
        }
      }
      
      // Test 2: Count query (skip if RLS issues)
      console.log('Test 2: Count query...')
      const { count, error: countError } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
      
      console.log('Test 2 result:', {
        success: !countError,
        error: countError?.message,
        totalCount: count
      })
      
      return { 
        success: true, 
        error: countError?.message || null, 
        data: testData, 
        count: count || testData?.length || 0,
        rls_issue: countError?.message?.includes('permission denied') || countError?.message?.includes('RLS')
      }
    } catch (err) {
      console.error('Connection test failed:', err)
      return { 
        success: false, 
        error: err.message, 
        data: null,
        rls_issue: err.message.includes('permission denied') || err.message.includes('RLS')
      }
    }
  }
  


  /**
   * Lấy dữ liệu lịch khám với phân trang và filter
   * @param {Object} options - Tùy chọn query
   * @param {number} options.page - Trang hiện tại (bắt đầu từ 1)
   * @param {number} options.limit - Số record mỗi trang
   * @param {string} options.search - Tìm kiếm theo tên công ty
   * @param {string} options.status - Lọc theo trạng thái khám
   * @param {string} options.employee - Lọc theo tên nhân viên
   * @param {boolean} options.showGold - Hiển thị công ty gold
   * @param {string} options.sortBy - Cột để sắp xếp
   * @param {string} options.sortOrder - Thứ tự sắp xếp (asc/desc)
   * @returns {Promise<{data: Array, count: number, error: string|null}>}
   */
  static async getLichKhamData(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        status = '',
        employee = '',
        showGold = false,
        sortBy = 'ngay bat dau kham',
        sortOrder = 'desc'
      } = options

      // Tính toán offset cho pagination
      const offset = (page - 1) * limit

      // Bắt đầu query - không dùng count nếu có RLS issues
      let query = supabase
        .from(this.tableName)
        .select('*')

      // Áp dụng filters
      if (search.trim()) {
        query = query.ilike('"ten cong ty"', `%${search.trim()}%`)
      }

      if (status.trim()) {
        query = query.eq('"trang thai kham"', status.trim())
      }

      if (employee.trim()) {
        query = query.ilike('"ten nhan vien"', `%${employee.trim()}%`)
      }

      // Gold filter logic - simplified
      if (showGold) {
        query = query.or('gold.eq.x,gold.eq.X')
      }
      // When showGold is false, we don't filter by gold (show all records)

      // Column mapping for sorting
      const columnMapping = {
        'Tên Công Ty': '"ten cong ty"',
        'Ngày Bắt Đầu': '"ngay bat dau kham"',
        'Ngày Kết Thúc': '"ngay ket thuc kham"',
        'Số Người Khám': '"so nguoi kham"',
        'Trạng Thái': '"trang thai kham"',
        'Nhân Viên': '"ten nhan vien"'
      }
      const actualSortBy = columnMapping[sortBy] || `"${sortBy}"`
      query = query.order(actualSortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      // Debug logging
      console.log('Supabase query result:', { 
        data: data?.slice(0, 2), // Show first 2 records for debugging
        error, 
        dataLength: data?.length, 
        tableName: this.tableName,
        totalRecords: data?.length
      })
      console.log('Query filters applied:', { search, status, employee, showGold, sortBy, sortOrder })
      console.log('Sample record structure:', data?.[0] ? Object.keys(data[0]) : 'No data')

      if (error) {
        console.error('Supabase error:', error)
        return { data: [], count: 0, error: error.message }
      }

      // Estimate count based on data length (since we can't use count with RLS)
      const estimatedCount = data?.length || 0
      
      return { data: data || [], count: estimatedCount, error: null }
    } catch (err) {
      console.error('Service error:', err)
      return { data: [], count: 0, error: err.message }
    }
  }

  /**
   * Lấy thống kê tổng quan
   * @returns {Promise<{stats: Object, error: string|null}>}
   */
  static async getStatistics() {
    try {
      // Lấy tất cả dữ liệu để tính thống kê
      const { data, error } = await supabase
        .from(this.tableName)
        .select('"so nguoi kham", "ten cong ty", "trang thai kham", "ngay bat dau kham"')

      if (error) {
        console.error('Statistics error:', error)
        return { stats: {}, error: error.message }
      }

      const records = data || []

      // Tính toán thống kê
      const stats = {
        totalExaminations: records.reduce((sum, record) => {
          const soNguoi = parseInt(record['so nguoi kham']) || 0
          return sum + soNguoi
        }, 0),
        totalCompanies: new Set(records.map(r => r['ten cong ty'])).size,
        totalRecords: records.length,
        statusCounts: this.calculateStatusCounts(records),
        topCompanies: this.calculateTopCompanies(records),
        monthlyStats: this.calculateMonthlyStats(records)
      }

      return { stats, error: null }
    } catch (err) {
      console.error('Statistics service error:', err)
      return { stats: {}, error: err.message }
    }
  }

  /**
   * Tính toán số lượng theo trạng thái
   */
  static calculateStatusCounts(records) {
    const statusCounts = {}
    records.forEach(record => {
      const status = record['trang thai kham'] || 'Không xác định'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    return statusCounts
  }

  /**
   * Tính toán top công ty theo số lượt khám
   */
  static calculateTopCompanies(records, limit = 10) {
    const companyStats = {}
    
    records.forEach(record => {
      const company = record['ten cong ty']
      const examCount = parseInt(record['so nguoi kham']) || 0
      
      if (!companyStats[company]) {
        companyStats[company] = {
          name: company,
          totalExams: 0,
          records: 0
        }
      }
      
      companyStats[company].totalExams += examCount
      companyStats[company].records += 1
    })

    return Object.values(companyStats)
      .sort((a, b) => b.totalExams - a.totalExams)
      .slice(0, limit)
  }

  /**
   * Tính toán thống kê theo tháng
   */
  static calculateMonthlyStats(records) {
    const monthlyStats = {}
    
    records.forEach(record => {
      const startDate = record['ngay bat dau kham']
      if (!startDate) return
      
      const date = new Date(startDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          examinations: 0,
          companies: new Set()
        }
      }
      
      monthlyStats[monthKey].examinations += parseInt(record['so nguoi kham']) || 0
      monthlyStats[monthKey].companies.add(record['ten cong ty'])
    })

    // Chuyển Set thành số lượng
    Object.values(monthlyStats).forEach(stat => {
      stat.companies = stat.companies.size
    })

    return Object.values(monthlyStats)
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * Export dữ liệu ra CSV
   * @param {Array} data - Dữ liệu cần export
   * @returns {string} - CSV content
   */
  static exportToCSV(data) {
    if (!data || data.length === 0) {
      return ''
    }

    // Định nghĩa headers theo schema từ Apps Script
    const headers = [
      'ID',
      'Tên Công Ty',
      'Ngày Bắt Đầu',
      'Ngày Kết Thúc',
      'Số Người Khám',
      'Trạng Thái Khám',
      'Tên Nhân Viên',
      'Sáng',
      'Chiều',
      'Tổng Số Ngày Khám',
      'Trung Bình Ngày',
      'Các Ngày Khám Thực Tế',
      'Ngày Lấy Máu',
      'Gold'
    ]

    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(record => {
      const row = [
        record['ID'] || record.id || '',
        `"${(record['ten cong ty'] || '').replace(/"/g, '""')}"`,
        record['ngay bat dau kham'] || '',
        record['ngay ket thuc kham'] || '',
        record['so nguoi kham'] || '',
        `"${(record['trang thai kham'] || '').replace(/"/g, '""')}"`,
        `"${(record['ten nhan vien'] || '').replace(/"/g, '""')}"`,
        record['trung binh ngay sang'] || '',
        record['trung binh ngay chieu'] || '',
        record['tong so ngay kham thuc te'] || '',
        record['trung binh ngay'] || '',
        `"${(record['cac ngay kham thuc te'] || '').replace(/"/g, '""')}"`,
        record['ngay lay mau'] || '',
        record['gold'] || ''
      ]
      return row.join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  /**
   * Download CSV file
   * @param {Array} data - Dữ liệu cần export
   * @param {string} filename - Tên file
   */
  static downloadCSV(data, filename = 'lich_kham_export.csv') {
    const csvContent = this.exportToCSV(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  /**
   * Export dữ liệu ra Excel
   * @param {Array} data - Dữ liệu cần export
   * @returns {Object} - Excel workbook
   */
  static exportToExcel(data) {
    if (!data || data.length === 0) {
      return null
    }

    // Định nghĩa headers theo schema từ Apps Script
    const headers = [
      'ID',
      'Tên Công Ty',
      'Ngày Bắt Đầu',
      'Ngày Kết Thúc',
      'Số Người Khám',
      'Trạng Thái Khám',
      'Tên Nhân Viên',
      'Sáng',
      'Chiều',
      'Tổng Số Ngày Khám',
      'Trung Bình Ngày',
      'Các Ngày Khám Thực Tế',
      'Ngày Lấy Máu',
      'Gold'
    ]

    // Chuyển đổi dữ liệu thành format cho Excel
    const excelData = data.map(record => ({
      'ID': record['ID'] || record.id || '',
      'Tên Công Ty': record['ten cong ty'] || '',
      'Ngày Bắt Đầu': record['ngay bat dau kham'] || '',
      'Ngày Kết Thúc': record['ngay ket thuc kham'] || '',
      'Số Người Khám': record['so nguoi kham'] || '',
      'Trạng Thái Khám': record['trang thai kham'] || '',
      'Tên Nhân Viên': record['ten nhan vien'] || '',
      'Sáng': record['trung binh ngay sang'] || '',
      'Chiều': record['trung binh ngay chieu'] || '',
      'Tổng Số Ngày Khám': record['tong so ngay kham thuc te'] || '',
      'Trung Bình Ngày': record['trung binh ngay'] || '',
      'Các Ngày Khám Thực Tế': record['cac ngay kham thuc te'] || '',
      'Ngày Lấy Máu': record['ngay lay mau'] || '',
      'Gold': record['gold'] || ''
    }))

    // Tạo worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch Khám')
    
    return workbook
  }

  /**
   * Download Excel file
   * @param {Array} data - Dữ liệu cần export
   * @param {string} filename - Tên file
   */
  static downloadExcel(data, filename = 'lich_kham_export.xlsx') {
    const workbook = this.exportToExcel(data)
    if (!workbook) {
      console.error('Không thể tạo file Excel: Dữ liệu trống')
      return
    }
    
    // Tạo file Excel và download
    XLSX.writeFile(workbook, filename)
  }
}

export default LichKhamService