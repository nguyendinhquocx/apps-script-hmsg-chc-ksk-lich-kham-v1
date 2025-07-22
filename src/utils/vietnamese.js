// Utility functions for Vietnamese text processing

/**
 * Remove Vietnamese diacritics from text
 * @param {string} text - Input text with Vietnamese diacritics
 * @returns {string} - Text without diacritics
 */
export const removeDiacritics = (text) => {
  if (!text) return ''
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Check if search term matches text (with diacritics support)
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Search term
 * @returns {boolean} - Whether the search term matches
 */
export const matchesSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return true
  
  const normalizedText = removeDiacritics(text)
  const normalizedSearch = removeDiacritics(searchTerm)
  
  return normalizedText.includes(normalizedSearch)
}

/**
 * Get current month and year
 * @returns {object} - Object with month and year
 */
export const getCurrentMonth = () => {
  const now = new Date()
  return {
    month: now.getMonth() + 1, // JavaScript months are 0-indexed
    year: now.getFullYear()
  }
}

/**
 * Get month name in Vietnamese
 * @param {number} month - Month number (1-12)
 * @returns {string} - Month name in Vietnamese
 */
export const getMonthName = (month) => {
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ]
  return months[month - 1] || 'Tháng không xác định'
}

/**
 * Check if a date is in a specific month and year
 * @param {string|Date} date - Date to check
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {boolean} - Whether the date is in the specified month/year
 */
export const isDateInMonth = (date, month, year) => {
  if (!date) return false
  
  const dateObj = new Date(date)
  return dateObj.getMonth() + 1 === month && dateObj.getFullYear() === year
}