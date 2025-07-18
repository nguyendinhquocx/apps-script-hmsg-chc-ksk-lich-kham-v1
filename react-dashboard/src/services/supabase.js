import { createClient } from '@supabase/supabase-js'

// Cấu hình Supabase
const supabaseUrl = 'https://glppizdubinvwuncteah.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHBpemR1Ymludnd1bmN0ZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTM2MjYsImV4cCI6MjA2ODQyOTYyNn0.DEvmpyv3ABM1NQH7ag_0s_uNxdM7X1rwP9FnB4AzEMU'

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
   * Lấy tất cả dữ liệu lịch khám với pagination và filtering
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

      // Bắt đầu query
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })

      // Áp dụng filters
      if (search.trim()) {
        query = query.ilike('ten cong ty', `%${search.trim()}%`)
      }

      if (status.trim()) {
        query = query.eq('trang thai kham', status.trim())
      }

      if (employee.trim()) {
        query = query.ilike('ten nhan vien', `%${employee.trim()}%`)
      }

      // Gold filter logic
      if (showGold) {
        query = query.or('gold.eq.x,gold.eq.X')
      } else {
        query = query.or('gold.is.null,gold.neq.x,gold.neq.X')
      }

      // Sắp xếp - sử dụng tên cột đúng
      const columnMapping = {
        'ngay_bat_dau': 'ngay bat dau kham',
        'ngay_ket_thuc': 'ngay ket thuc kham',
        'ten_cong_ty': 'ten cong ty',
        'so_nguoi_kham': 'so nguoi kham',
        'trang_thai_kham': 'trang thai kham',
        'ten_nhan_vien': 'ten nhan vien'
      }
      const actualSortBy = columnMapping[sortBy] || sortBy
      query = query.order(actualSortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Supabase error:', error)
        return { data: [], count: 0, error: error.message }
      }

      return { data: data || [], count: count || 0, error: null }
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
        .select('*')

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
}

export default LichKhamService