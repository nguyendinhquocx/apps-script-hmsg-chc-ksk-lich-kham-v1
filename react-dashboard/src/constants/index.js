// Application Constants
export const APP_CONFIG = {
  NAME: 'Dashboard Lịch Khám - HMSG CHC',
  VERSION: '1.0.0',
  DESCRIPTION: 'Hệ thống quản lý lịch khám sức khỏe doanh nghiệp'
}

// API Configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  REQUEST_TIMEOUT: 30000,
  RATE_LIMIT: {
    MAX_REQUESTS: 30,
    WINDOW_MS: 60000
  }
}

// Database Configuration
export const DB_CONFIG = {
  TABLE_NAME: 'lich_kham',
  ALLOWED_SORT_COLUMNS: [
    'ngay bat dau kham',
    'ngay ket thuc kham', 
    'ten cong ty',
    'so nguoi kham',
    'trang thai kham',
    'ten nhan vien'
  ],
  COLUMN_MAPPING: {
    'Tên Công Ty': '"ten cong ty"',
    'Ngày Bắt Đầu': '"ngay bat dau kham"',
    'Ngày Kết Thúc': '"ngay ket thuc kham"',
    'Số Người Khám': '"so nguoi kham"',
    'Trạng Thái': '"trang thai kham"',
    'Nhân Viên': '"ten nhan vien"'
  }
}

// Status Configuration
export const STATUS_CONFIG = {
  OPTIONS: [
    'Đã khám xong',
    'Chưa khám xong', 
    'Đang khám',
    'Hủy khám'
  ],
  BADGE_CLASSES: {
    COMPLETED: 'status-badge status-completed',
    IN_PROGRESS: 'status-badge status-in-progress',
    CANCELLED: 'status-badge status-cancelled',
    PENDING: 'status-badge status-pending'
  }
}

// UI Configuration
export const UI_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_VISIBLE_PAGES: 5
  },
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200
}

// Export Configuration
export const EXPORT_CONFIG = {
  CSV_HEADERS: [
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
  ],
  DEFAULT_FILENAME: 'lich_kham_export.csv'
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  RATE_LIMIT_EXCEEDED: 'Quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.',
  INVALID_INPUT: 'Dữ liệu đầu vào không hợp lệ.',
  EXPORT_ERROR: 'Không thể xuất dữ liệu. Vui lòng thử lại.',
  FETCH_ERROR: 'Có lỗi xảy ra khi tải dữ liệu.',
  MISSING_ENV_VARS: 'Thiếu biến môi trường cần thiết: VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Dữ liệu đã được tải thành công',
  EXPORT_SUCCESS: 'Xuất dữ liệu thành công',
  FILTERS_RESET: 'Đã xóa tất cả bộ lọc'
}

// Feature Flags
export const FEATURES = {
  EXPORT: import.meta.env.VITE_ENABLE_EXPORT === 'true',
  REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME === 'true',
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'
}

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#000000',
    SECONDARY: '#666666',
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6'
  },
  DEFAULT_HEIGHT: 300,
  ANIMATION_DURATION: 750
}