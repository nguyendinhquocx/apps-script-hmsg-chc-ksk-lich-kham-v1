import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { STATUS_CONFIG, ERROR_MESSAGES } from '../constants'

/**
 * Input validation and sanitization utilities
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.trim().replace(/[<>"'&]/g, '')
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePaginationParams = (page, limit, maxLimit = 100) => {
  const validPage = Math.max(1, parseInt(page) || 1)
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20))
  return { page: validPage, limit: validLimit }
}

export const validateSortParams = (sortBy, sortOrder, allowedColumns, defaultSort = { sortBy: 'created_at', sortOrder: 'desc' }) => {
  // Kiểm tra sortOrder có hợp lệ không
  const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder.toLowerCase()) 
    ? sortOrder.toLowerCase() 
    : (defaultSort?.sortOrder || 'desc')
  
  // Kiểm tra allowedColumns có tồn tại và là mảng không
  if (!allowedColumns || !Array.isArray(allowedColumns) || allowedColumns.length === 0) {
    return { 
      sortBy: defaultSort?.sortBy || 'created_at', 
      sortOrder: validSortOrder 
    }
  }
  
  // Kiểm tra sortBy có nằm trong danh sách cho phép không
  const validSortBy = sortBy && allowedColumns.includes(sortBy) 
    ? sortBy 
    : (allowedColumns[0] || defaultSort?.sortBy || 'created_at')
  
  return { sortBy: validSortBy, sortOrder: validSortOrder }
}

/**
 * Date formatting utilities
 */
export const formatDate = (dateString, formatStr = 'dd/MM/yyyy') => {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), formatStr, { locale: vi })
  } catch {
    return dateString
  }
}

export const formatDateTime = (dateString) => {
  return formatDate(dateString, 'dd/MM/yyyy HH:mm')
}

export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * Number formatting utilities
 */
export const formatNumber = (number, locale = 'vi-VN') => {
  if (typeof number !== 'number' || isNaN(number)) return '0'
  return new Intl.NumberFormat(locale).format(number)
}

export const formatCurrency = (amount, currency = 'VND', locale = 'vi-VN') => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Status utilities
 */
export const getStatusBadgeClass = (status) => {
  const statusLower = (status || '').toLowerCase().trim()
  
  if (statusLower.includes('đã khám xong') || statusLower.includes('da kham xong')) {
    return STATUS_CONFIG.BADGE_CLASSES.COMPLETED
  }
  if (statusLower.includes('đang khám') || statusLower.includes('dang kham')) {
    return STATUS_CONFIG.BADGE_CLASSES.IN_PROGRESS
  }
  if (statusLower.includes('hủy') || statusLower.includes('huy')) {
    return STATUS_CONFIG.BADGE_CLASSES.CANCELLED
  }
  return STATUS_CONFIG.BADGE_CLASSES.PENDING
}

export const normalizeStatus = (status) => {
  const statusMap = {
    'da kham xong': 'Đã khám xong',
    'chua kham xong': 'Chưa khám xong',
    'dang kham': 'Đang khám',
    'huy kham': 'Hủy khám'
  }
  
  const normalized = (status || '').toLowerCase().trim()
  return statusMap[normalized] || status
}

/**
 * Array utilities
 */
export const removeDuplicates = (array, key) => {
  if (!key) return [...new Set(array)]
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export const sortArray = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * String utilities
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const capitalizeFirst = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

/**
 * File utilities
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Error handling utilities
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return ERROR_MESSAGES.FETCH_ERROR
}

export const isNetworkError = (error) => {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('network') || 
         message.includes('fetch') || 
         message.includes('connection')
}

/**
 * Local storage utilities
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}

/**
 * Debounce utility
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle utility
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Performance utilities
 */
export const measurePerformance = (name, fn) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
  return result
}

/**
 * URL utilities
 */
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value)
    }
  })
  
  return searchParams.toString()
}

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString)
  const result = {}
  
  for (const [key, value] of params) {
    result[key] = value
  }
  
  return result
}