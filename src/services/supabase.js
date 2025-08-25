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

  /**
   * Download Excel file from array data (for calendar view)
   * @param {Array} arrayData - Dữ liệu dạng mảng 2D đã được format
   * @param {string} filename - Tên file
   */
  static downloadExcelFromArray(arrayData, filename = 'lich_kham_calendar.xlsx') {
    if (!arrayData || arrayData.length === 0) {
      console.error('Không thể tạo file Excel: Dữ liệu trống')
      return
    }
    
    // Tạo worksheet từ array data
    const worksheet = XLSX.utils.aoa_to_sheet(arrayData)
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch Khám')
    
    // Tạo file Excel và download
    XLSX.writeFile(workbook, filename)
  }
}

// Service class cho bảng trả hồ sơ
export class TraHoSoService {
  static tableName = 'tra_ho_so'

  /**
   * Lấy dữ liệu trả hồ sơ với filters và pagination
   * @param {Object} options - Tùy chọn query
   * @param {number} options.page - Trang hiện tại (bắt đầu từ 1)
   * @param {number} options.limit - Số record mỗi trang
   * @param {string} options.search - Tìm kiếm theo tên công ty
   * @param {string} options.status - Lọc theo trạng thái trả hồ sơ
   * @param {string} options.employee - Lọc theo tên nhân viên
   * @param {string} options.priority - Lọc theo mức ưu tiên
   * @param {string} options.sortBy - Cột để sắp xếp
   * @param {string} options.sortOrder - Thứ tự sắp xếp (asc/desc)
   * @returns {Promise<{data: Array, count: number, error: string|null}>}
   */
  static async getTraHoSoData(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        status = '',
        employee = '',
        priority = '',
        sortBy = 'ngay cuoi tra ho so',
        sortOrder = 'desc'
      } = options

      const offset = (page - 1) * limit

      let query = supabase
        .from(this.tableName)
        .select('*')

      // Apply filters
      if (search.trim()) {
        query = query.ilike('"ten cong ty"', `%${search.trim()}%`)
      }

      if (employee.trim()) {
        query = query.ilike('"ten nhan vien"', `%${employee.trim()}%`)
      }

      // Status filter sẽ được áp dụng ở client-side sau khi tính toán trạng thái

      // Column mapping for sorting
      const columnMapping = {
        'Tên Công Ty': '"ten cong ty"',
        'Ngày Cuối Trả': '"ngay cuoi tra ho so"',
        'Số Người Khám': '"so nguoi kham"',
        'Trạng Thái Khám': '"trang thai kham"',
        'Nhân Viên': '"ten nhan vien"',
        'Ngày Kết Thúc Khám': '"ngay ket thuc kham"'
      }
      const actualSortBy = columnMapping[sortBy] || `"${sortBy}"`
      query = query.order(actualSortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      // Debug logging
      console.log('TraHoSo query result:', { 
        data: data?.slice(0, 2), 
        error, 
        dataLength: data?.length, 
        tableName: this.tableName,
        totalRecords: data?.length
      })

      if (error) {
        console.error('TraHoSo query error:', error)
        return { data: [], count: 0, error: error.message }
      }

      // TEMPORARY: Mock data for demo purposes khi chưa có dữ liệu thực
      let mockData = data || [];
      if (mockData.length === 0) {
        console.log('No real data found, using mock data for demo...')
        mockData = [
          {
            "ID": "demo1",
            "ten nhan vien": "Lê Thị Thúy Hồng",
            "ten cong ty": "CÔNG TY TRÁCH NHIỆM HỮU HẠN AIMNEXT VIỆT NAM",
            "so nguoi kham": 7,
            "ngay ket thuc kham": "2024-12-28",
            "ngay cuoi tra ho so": "2025-01-07", 
            "trang thai kham": "Đã khám xong",
            "gold": "",
            "ngay ket thuc kham thuc te": null,
            "ghi chu": "Cần gấp",
            "tra ho so": "",
            "ngay tra ho so": null,
            "ngay gui bang ke": null
          },
          {
            "ID": "demo2", 
            "ten nhan vien": "Trần Thị Khanh",
            "ten cong ty": "CÔNG TY TNHH XÂY DỰNG TÀI VIỆT TÍN",
            "so nguoi kham": 31,
            "ngay ket thuc kham": "2024-12-20",
            "ngay cuoi tra ho so": "2024-12-30",
            "trang thai kham": "Đã khám xong", 
            "gold": "",
            "ngay ket thuc kham thuc te": null,
            "ghi chu": "",
            "tra ho so": "",
            "ngay tra ho so": null,
            "ngay gui bang ke": null
          },
          {
            "ID": "demo3",
            "ten nhan vien": "Phạm Thị Thanh Thúy", 
            "ten cong ty": "CÔNG TY TNHH MI LOGIX",
            "so nguoi kham": 7,
            "ngay ket thuc kham": "2025-01-15",
            "ngay cuoi tra ho so": "2025-01-25",
            "trang thai kham": "Đã khám xong",
            "gold": "X",
            "ngay ket thuc kham thuc te": null,
            "ghi chu": "Khách VIP",
            "tra ho so": "",
            "ngay tra ho so": null,
            "ngay gui bang ke": null
          },
          {
            "ID": "demo4",
            "ten nhan vien": "Bùi Thị Như Quỳnh",
            "ten cong ty": "CÔNG TY TNHH EUREKA BLUE SKY VIETNAM", 
            "so nguoi kham": 15,
            "ngay ket thuc kham": "2024-11-20",
            "ngay cuoi tra ho so": "2024-11-30",
            "trang thai kham": "Đã khám xong",
            "gold": "",
            "ngay ket thuc kham thuc te": null,
            "ghi chu": "",
            "tra ho so": "Đã trả",
            "ngay tra ho so": "2024-11-28",
            "ngay gui bang ke": null
          }
        ]
      }

      // Process data to add calculated fields
      const processedData = this.processTraHoSoData(mockData || [])

      // Apply client-side filters after calculations
      let filteredData = processedData
      if (status) {
        filteredData = processedData.filter(item => item.traHoSoStatus === status)
      }
      if (priority) {
        filteredData = processedData.filter(item => item.uuTien === priority)
      }

      // Sắp xếp theo ưu tiên và số ngày trễ như AppSheet
      filteredData = this.sortByPriorityAndDays(filteredData)

      return { 
        data: filteredData, 
        count: filteredData.length, 
        error: null 
      }
    } catch (err) {
      console.error('TraHoSo service error:', err)
      return { data: [], count: 0, error: err.message }
    }
  }

  /**
   * Process raw data để tính toán các trường derived
   * @param {Array} rawData - Dữ liệu thô từ Supabase
   * @returns {Array} - Dữ liệu đã được xử lý
   */
  static processTraHoSoData(rawData) {
    const today = new Date()
    
    return rawData.map(record => {
      // Tính số ngày trễ (logic từ AppSheet)
      const soNgayTre = this.calculateSoNgayTre(record, today)
      
      // Tính ưu tiên
      const uuTien = this.calculateUuTien(record, soNgayTre)
      
      // Tính trạng thái trả hồ sơ
      const traHoSoStatus = this.calculateTraHoSoStatus(record)
      
      return {
        ...record,
        soNgayTre,
        uuTien,
        traHoSoStatus
      }
    })
  }

  /**
   * Tính số ngày trễ theo logic AppSheet
   */
  static calculateSoNgayTre(record, today) {
    // IF(AND([trang thai kham] = "Đã khám xong", [tra ho so] = "Đã trả"), "OK", ...)
    if (record['trang thai kham'] === 'Đã khám xong' && record['tra ho so'] === 'Đã trả') {
      return 'OK'
    }

    // Tính deadline: nếu có [ngay ket thuc kham thuc te] thì +10 ngày, không thì dùng [ngay cuoi tra ho so]
    let deadline
    if (record['ngay ket thuc kham thuc te']) {
      const actualEndDate = new Date(record['ngay ket thuc kham thuc te'])
      deadline = new Date(actualEndDate)
      deadline.setDate(deadline.getDate() + 10)
    } else if (record['ngay cuoi tra ho so']) {
      deadline = new Date(record['ngay cuoi tra ho so'])
    } else {
      return '' // Không có deadline
    }

    // Nếu chưa đến hạn
    if (deadline > today) {
      return ''
    }

    // Tính số ngày trễ
    const diffTime = today - deadline
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays.toString()
  }

  /**
   * Tính mức ưu tiên theo logic AppSheet
   */
  static calculateUuTien(record, soNgayTre) {
    // IF(ISNOTBLANK([gold]), "X", ...)
    if (record.gold && record.gold.trim()) {
      return 'X'
    }

    // IF([so ngay tre] = "OK", "X", ...)
    if (soNgayTre === 'OK') {
      return 'X'
    }

    // IF(ISBLANK([so ngay tre]), "Ưu tiên 3", ...)
    if (!soNgayTre) {
      return 'Ưu tiên 3'
    }

    // Check if it's a number and >= 5 for Ưu tiên 1, else Ưu tiên 2
    const daysLate = parseInt(soNgayTre)
    if (!isNaN(daysLate)) {
      return daysLate >= 5 ? 'Ưu tiên 1' : 'Ưu tiên 2'
    }

    return 'Ưu tiên 3'
  }

  /**
   * Tính trạng thái trả hồ sơ theo logic AppSheet
   */
  static calculateTraHoSoStatus(record) {
    // IF(ISNOTBLANK([gold]), "Đã trả", ...)
    if (record.gold && record.gold.trim()) {
      return 'Đã trả'
    }

    // IF(ISBLANK([tra ho so]), "Chưa trả", [tra ho so])
    if (!record['tra ho so'] || !record['tra ho so'].trim()) {
      return 'Chưa trả'
    }

    return record['tra ho so']
  }

  /**
   * Lấy thống kê tổng quan cho trả hồ sơ
   */
  static async getTraHoSoStatistics() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')

      if (error) {
        console.error('TraHoSo statistics error:', error)
        return { stats: {}, error: error.message }
      }

      const processedData = this.processTraHoSoData(data || [])

      // Tính thống kê
      const stats = {
        totalRecords: processedData.length,
        priorityStats: this.calculatePriorityStats(processedData),
        statusStats: this.calculateStatusStats(processedData),
        overdueStats: this.calculateOverdueStats(processedData)
      }

      return { stats, error: null }
    } catch (err) {
      console.error('TraHoSo statistics service error:', err)
      return { stats: {}, error: err.message }
    }
  }

  /**
   * Tính thống kê theo mức ưu tiên
   */
  static calculatePriorityStats(processedData) {
    const priorityStats = {
      'Ưu tiên 1': 0,
      'Ưu tiên 2': 0,
      'Ưu tiên 3': 0,
      'X': 0
    }

    processedData.forEach(record => {
      const priority = record.uuTien
      if (priorityStats.hasOwnProperty(priority)) {
        priorityStats[priority]++
      }
    })

    return priorityStats
  }

  /**
   * Tính thống kê theo trạng thái
   */
  static calculateStatusStats(processedData) {
    const statusStats = {}

    processedData.forEach(record => {
      const status = record.traHoSoStatus
      statusStats[status] = (statusStats[status] || 0) + 1
    })

    return statusStats
  }

  /**
   * Tính thống kê trễ hạn
   */
  static calculateOverdueStats(processedData) {
    let totalOverdue = 0
    let maxDaysOverdue = 0

    processedData.forEach(record => {
      if (record.soNgayTre && record.soNgayTre !== 'OK' && record.soNgayTre !== '') {
        const days = parseInt(record.soNgayTre)
        if (!isNaN(days) && days > 0) {
          totalOverdue++
          maxDaysOverdue = Math.max(maxDaysOverdue, days)
        }
      }
    })

    return {
      totalOverdue,
      maxDaysOverdue,
      overdueRate: processedData.length > 0 ? (totalOverdue / processedData.length * 100).toFixed(1) : 0
    }
  }

  /**
   * Sắp xếp data theo ưu tiên và số ngày trễ như AppSheet
   * @param {Array} data - Processed data
   * @returns {Array} - Sorted data
   */
  static sortByPriorityAndDays(data) {
    // Define priority order
    const priorityOrder = {
      'Ưu tiên 1': 1,
      'Ưu tiên 2': 2, 
      'Ưu tiên 3': 3,
      'X': 4 // Hoàn thành cuối cùng
    }

    return data.sort((a, b) => {
      // Sort by priority first
      const priorityA = priorityOrder[a.uuTien] || 999
      const priorityB = priorityOrder[b.uuTien] || 999
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Within same priority, sort by days late (descending - nhiều nhất lên trên)
      const daysA = parseInt(a.soNgayTre) || 0
      const daysB = parseInt(b.soNgayTre) || 0
      
      // Special handling for "OK" status
      if (a.soNgayTre === 'OK' && b.soNgayTre !== 'OK') return 1
      if (b.soNgayTre === 'OK' && a.soNgayTre !== 'OK') return -1
      if (a.soNgayTre === 'OK' && b.soNgayTre === 'OK') return 0
      
      return daysB - daysA // Descending order
    })
  }

  /**
   * Export trả hồ sơ data to Excel
   * @param {Array} data - Processed data với calculated fields
   * @param {string} filename - Tên file
   */
  static downloadTraHoSoExcel(data, filename = 'tra_ho_so_export.xlsx') {
    if (!data || data.length === 0) {
      console.error('Không thể tạo file Excel: Dữ liệu trống')
      return
    }

    // Định nghĩa headers cho Excel
    const excelData = data.map(record => ({
      'ID': record.ID || '',
      'Tên Nhân Viên': record['ten nhan vien'] || '',
      'Tên Công Ty': record['ten cong ty'] || '',
      'Số Người Khám': record['so nguoi kham'] || '',
      'Ngày Kết Thúc Khám': record['ngay ket thuc kham'] || '',
      'Ngày Cuối Trả Hồ Sơ': record['ngay cuoi tra ho so'] || '',
      'Ngày Kết Thúc Khám Thực Tế': record['ngay ket thuc kham thuc te'] || '',
      'Trạng Thái Khám': record['trang thai kham'] || '',
      'Gold': record.gold || '',
      'Trạng Thái Trả Hồ Sơ': record.traHoSoStatus || '',
      'Ngày Trả Hồ Sơ': record['ngay tra ho so'] || '',
      'Ngày Gửi Bảng Kê': record['ngay gui bang ke'] || '',
      'Ghi Chú': record['ghi chu'] || '',
      'Số Ngày Trễ': record.soNgayTre || '',
      'Ưu Tiên': record.uuTien || ''
    }))

    // Tạo worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trả Hồ Sơ')
    
    // Download file
    XLSX.writeFile(workbook, filename)
  }
}

export default LichKhamService