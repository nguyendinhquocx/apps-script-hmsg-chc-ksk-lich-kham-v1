import { createClient } from '@supabase/supabase-js'
import { 
  API_CONFIG, 
  DB_CONFIG, 
  ERROR_MESSAGES, 
  EXPORT_CONFIG,
  FEATURES 
} from '../constants'
import { 
  sanitizeInput, 
  validatePaginationParams, 
  validateSortParams,
  getErrorMessage 
} from '../utils'

// Cấu hình Supabase từ environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(ERROR_MESSAGES.MISSING_ENV_VARS)
}

// Debug logging chỉ khi được bật
if (FEATURES.DEBUG_LOGS) {
  console.log('Supabase Config:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length
  })
}

// Luôn in ra thông tin kết nối để debug
console.log('DEBUG - Supabase Connection Info:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
})

// Không sử dụng fetch trực tiếp vì có thể gặp vấn đề CORS
// Thay vào đó, chúng ta sẽ sử dụng thư viện Supabase

// Kiểm tra URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Supabase URL must start with https://')
}

// Kiểm tra ANON_KEY format
if (supabaseAnonKey && supabaseAnonKey.length < 20) {
  console.error('Supabase ANON_KEY seems too short')
}

// Tạo Supabase client với cấu hình bảo mật
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Không cần authentication cho dashboard này
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'lich-kham-dashboard@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Kiểm tra chi tiết kết nối Supabase sử dụng thư viện Supabase
async function checkSupabaseConnection() {
  try {
    console.log('Starting detailed Supabase connection tests using Supabase client...');
    
    // Kiểm tra kết nối cơ bản bằng cách ping Supabase REST API
    console.log('Supabase basic connection test - skipping _realtime table check...');
    
    // Kiểm tra bảng lich_kham
    console.log('Testing lich_kham table access using Supabase client...');
    const { data: tableData, error: tableError } = await supabase
      .from('lich_kham')
      .select('*')
      .limit(1);
    
    console.log('Lich_kham table test:', {
      success: !tableError,
      error: tableError?.message,
      dataCount: tableData?.length,
      sampleData: tableData?.[0]
    });
    
    if (tableError) {
      console.error('Lich_kham table access failed:', tableError);
    } else if (tableData && tableData.length > 0) {
      console.log('Lich_kham sample data structure:', Object.keys(tableData[0]));
    }
    
    return {
      success: !tableError,
      error: tableError?.message,
      data: tableData
    };
  } catch (error) {
    console.error('Detailed Supabase connection test failed:', error?.message);
    return {
      success: false,
      error: error?.message || 'Unknown connection error',
      data: null
    };
  }
}

// Thực hiện kiểm tra kết nối
checkSupabaseConnection();

// Rate limiting helper
class RateLimiter {
  constructor(maxRequests = API_CONFIG.RATE_LIMIT.MAX_REQUESTS, windowMs = API_CONFIG.RATE_LIMIT.WINDOW_MS) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  canMakeRequest() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      return false
    }
    
    this.requests.push(now)
    return true
  }

  getRemainingRequests() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  getResetTime() {
    if (this.requests.length === 0) return 0
    const oldestRequest = Math.min(...this.requests)
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest))
  }
}

const rateLimiter = new RateLimiter()

// Service class để quản lý API calls
export class LichKhamService {
  static tableName = DB_CONFIG.TABLE_NAME

  /**
   * Test connection và kiểm tra dữ liệu
   */
  static async testConnection() {
    try {
      // Rate limiting check
      if (!rateLimiter.canMakeRequest()) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED)
      }

      console.log('Testing Supabase connection...')
      console.log('Table name:', this.tableName)
      console.log('Supabase URL:', supabaseUrl)
      console.log('Has Anon Key:', !!supabaseAnonKey)
      console.log('Key Length:', supabaseAnonKey?.length || 0)
      
      // Kiểm tra URL và Key
      if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
        throw new Error('Invalid Supabase URL format. Must start with https://')
      }
      
      if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
        throw new Error('Invalid Supabase Anon Key format or length')
      }
      
      // Test 1: Basic connection test using auth endpoint
      console.log('Test 1: Basic Supabase connection...')
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession()
        console.log('Auth test result:', {
          success: !authError,
          error: authError?.message
        })
      } catch (authErr) {
        console.log('Auth test failed (expected for anon key):', authErr.message)
      }
      
      // Test 2: Try to access the table
      console.log('Test 2: Testing table access...')
      const { data: testData, error: testError } = await supabase
        .from(this.tableName)
        .select('*')
        .limit(1)
      
      console.log('Table test result:', {
        success: !testError,
        error: testError?.message,
        errorDetails: testError,
        dataCount: testData?.length,
        sampleData: testData?.[0]
      })
      
      if (testError) {
        console.error('Table access failed:', testError)
        const errorMessage = testError?.message || 'Unknown error'
        
        // Kiểm tra lỗi cụ thể
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          console.warn(`Table '${this.tableName}' does not exist. You may need to create it in Supabase.`)
          return {
            success: false,
            error: `Table '${this.tableName}' does not exist in the database. Please create the table in your Supabase project.`,
            data: [],
            tableExists: false
          }
        }
        
        if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
          console.warn('RLS (Row Level Security) may be blocking access')
          return {
            success: false,
            error: 'Permission denied. Please check RLS policies in Supabase.',
            data: [],
            rls_issue: true
          }
        }
        
        return { 
          success: false, 
          error: errorMessage, 
          data: [],
          tableExists: true
        }
      }
      
      // Success case
      console.log('Connection test successful!')
      return { 
        success: true, 
        error: null, 
        data: testData || [], 
        count: testData?.length || 0,
        tableExists: true
      }
    } catch (err) {
      console.error('Connection test failed:', err)
      const errorMessage = err?.message || 'Unknown error'
      return { 
        success: false, 
        error: errorMessage, 
        data: [],
        tableExists: false
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
      // Rate limiting check
      if (!rateLimiter.canMakeRequest()) {
        throw new Error('Too many requests. Please wait before trying again.')
      }

      // Input validation and sanitization
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

      // Validate and sanitize inputs
      const { page: validPage, limit: validLimit } = validatePaginationParams(page, limit)
      const sanitizedSearch = sanitizeInput(search)
      const sanitizedStatus = sanitizeInput(status)
      const sanitizedEmployee = sanitizeInput(employee)

      
      // Validate sort parameters - Kiểm tra DB_CONFIG.ALLOWED_SORT_FIELDS tồn tại
      const allowedSortFields = DB_CONFIG && DB_CONFIG.ALLOWED_SORT_FIELDS ? DB_CONFIG.ALLOWED_SORT_FIELDS : []
      const defaultSort = DB_CONFIG && DB_CONFIG.DEFAULT_SORT ? DB_CONFIG.DEFAULT_SORT : { sortBy: 'ngay bat dau kham', sortOrder: 'desc' }
      
      const { sortBy: validSortBy, sortOrder: validSortOrder } = validateSortParams(
        sortBy, 
        sortOrder, 
        allowedSortFields,
        defaultSort
      )

      // Tính toán offset cho pagination
      const offset = (validPage - 1) * validLimit

      // Bắt đầu query - không dùng count nếu có RLS issues
      let query = supabase
        .from(this.tableName)
        .select('*')

      // Áp dụng filters với input đã được sanitized
      if (sanitizedSearch) {
        query = query.ilike('"ten cong ty"', `%${sanitizedSearch}%`)
      }

      if (sanitizedStatus) {
        query = query.eq('"trang thai kham"', sanitizedStatus)
      }

      if (sanitizedEmployee) {
        query = query.ilike('"ten nhan vien"', `%${sanitizedEmployee}%`)
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
      const actualSortBy = columnMapping[validSortBy] || `"${validSortBy}"`
      query = query.order(actualSortBy, { ascending: validSortOrder === 'asc' })

      // Pagination
      query = query.range(offset, offset + validLimit - 1)

      const { data, error } = await query

      // Debug logging chỉ khi được bật
      if (FEATURES.DEBUG_LOGS) {
        console.log('Supabase query result:', { 
          data: data?.slice(0, 2), // Show first 2 records for debugging
          error, 
          dataLength: data?.length, 
          tableName: this.tableName,
          totalRecords: data?.length
        })
        console.log('Query filters applied:', { 
          search: sanitizedSearch, 
          status: sanitizedStatus, 
          employee: sanitizedEmployee, 
          showGold, 
          sortBy: validSortBy, 
          sortOrder: validSortOrder 
        })
        console.log('Sample record structure:', data?.[0] ? Object.keys(data[0]) : 'No data')
      }

      if (error) {
        console.error('Supabase error:', error)
        const errorMessage = error?.message || 'Unknown database error'
        return { data: [], count: 0, error: errorMessage }
      }

      // Estimate count based on data length (since we can't use count with RLS)
      const estimatedCount = data?.length || 0
      
      return { data: data || [], count: estimatedCount, error: null }
    } catch (err) {
      console.error('Service error:', err)
      const errorMessage = err?.message || 'Unknown service error'
      return { data: [], count: 0, error: errorMessage }
    }
  }

  /**
   * Lấy thống kê tổng quan
   * @returns {Promise<{stats: Object, error: string|null}>}
   */
  static async getStatistics() {
    try {
      // Rate limiting check
      if (!rateLimiter.canMakeRequest()) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED)
      }

      // Lấy tất cả dữ liệu để tính thống kê
      const { data, error } = await supabase
        .from(this.tableName)
        .select('"so nguoi kham", "ten cong ty", "trang thai kham", "ngay bat dau kham"')

      if (error) {
        if (FEATURES.DEBUG_LOGS) {
          console.error('Statistics error:', error)
        }
        
        // Nếu table không tồn tại, trả về mock data
        if (error.message && error.message.includes('does not exist')) {
          console.warn(`Table '${this.tableName}' does not exist. Using mock data for demonstration.`)
          return { stats: this.getMockStatistics(), error: null }
        }
        
        return { stats: this.getMockStatistics(), error: getErrorMessage(error) }
      }

      const records = data || []
      
      // Nếu không có dữ liệu, sử dụng mock data
      if (records.length === 0) {
        console.info('No data found in database. Using mock data for demonstration.')
        return { stats: this.getMockStatistics(), error: null }
      }

      // Tính toán thống kê từ dữ liệu thực
      const stats = {
        totalExaminations: records.reduce((sum, record) => {
          const soNguoi = parseInt(record['so nguoi kham']) || 0
          return sum + soNguoi
        }, 0),
        totalCompanies: new Set(records.map(r => r['ten cong ty'])).size,
        totalRecords: records.length,
        statusCounts: this.calculateStatusCounts(records),
        topCompanies: this.calculateTopCompanies(records),
        monthlyStats: this.calculateMonthlyStats(records),
        rateLimitInfo: {
          remaining: rateLimiter.getRemainingRequests(),
          resetTime: rateLimiter.getResetTime()
        }
      }

      if (FEATURES.DEBUG_LOGS) {
        console.log('Statistics calculated:', {
          totalExaminations: stats.totalExaminations,
          totalCompanies: stats.totalCompanies,
          totalRecords: stats.totalRecords
        })
      }

      return { stats, error: null }
    } catch (err) {
      if (FEATURES.DEBUG_LOGS) {
        console.error('Statistics service error:', err)
      }
      // Fallback to mock data on any error
      return { stats: this.getMockStatistics(), error: getErrorMessage(err) }
    }
  }

  /**
   * Tạo dữ liệu mẫu cho demo khi table chưa tồn tại
   * @returns {Object} Mock statistics data
   */
  static getMockStatistics() {
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`
    
    return {
      totalExaminations: 1250,
      totalCompanies: 15,
      totalRecords: 45,
      statusCounts: {
        'Đã khám xong': 25,
        'Đang khám': 8,
        'Chưa khám xong': 7,
        'Hủy khám': 5
      },
      topCompanies: [
        { name: 'Công ty TNHH ABC', totalExams: 150, records: 3 },
        { name: 'Công ty Cổ phần XYZ', totalExams: 120, records: 2 },
        { name: 'Công ty TNHH DEF', totalExams: 100, records: 2 },
        { name: 'Công ty Cổ phần GHI', totalExams: 85, records: 1 },
        { name: 'Công ty TNHH JKL', totalExams: 75, records: 1 }
      ],
      monthlyStats: [
        { month: lastMonth, examinations: 580, companies: 8 },
        { month: currentMonth, examinations: 670, companies: 12 }
      ],
      rateLimitInfo: {
        remaining: rateLimiter.getRemainingRequests(),
        resetTime: rateLimiter.getResetTime()
      },
      isMockData: true
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
}

export default LichKhamService