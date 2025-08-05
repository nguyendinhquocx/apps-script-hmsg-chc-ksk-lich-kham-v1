// Utility functions for parsing data safely, handling "x" values

/**
 * Safely parse integer value, handling "x" marks and other invalid values
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value to return if parsing fails (default: 0)
 * @returns {number} - Parsed integer or default value
 */
export const parseIntSafe = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  
  // Convert to string and trim
  const strValue = String(value).trim().toLowerCase()
  
  // Handle "x" marks (indicates skip/not applicable)
  if (strValue === 'x' || strValue === 'X') {
    return 0
  }
  
  // Parse as integer
  const parsed = parseInt(strValue)
  
  // Return default if parsing failed (NaN)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely parse float value, handling "x" marks and other invalid values
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value to return if parsing fails (default: 0)
 * @returns {number} - Parsed float or default value
 */
export const parseFloatSafe = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  
  // Convert to string and trim
  const strValue = String(value).trim().toLowerCase()
  
  // Handle "x" marks (indicates skip/not applicable)
  if (strValue === 'x' || strValue === 'X') {
    return 0
  }
  
  // Parse as float
  const parsed = parseFloat(strValue)
  
  // Return default if parsing failed (NaN)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Check if a value represents a skip/not applicable state
 * @param {any} value - The value to check
 * @returns {boolean} - True if value indicates skip/not applicable
 */
export const isSkipValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return false
  }
  
  const strValue = String(value).trim().toLowerCase()
  return strValue === 'x'
}
