// Debug script to test the new clinical exam logic
// Run this in browser console to debug the issue

console.log('🐛 Debugging clinical exam charts...')

// Test the safeParseNumber function
const testSafeParseNumber = () => {
  console.log('\n=== Testing safeParseNumber ===')
  
  // Simulate the function since we can't import in browser
  const safeParseNumber = (value, actualPeopleCount = null) => {
    if (value === null || value === undefined || value === '') {
      return 0
    }
    
    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase()
      
      // Handle special dynamic values
      if (trimmed === 'x') {
        return actualPeopleCount || 0
      }
      
      if (trimmed === 'x/2') {
        return Math.round((actualPeopleCount || 0) / 2)
      }
      
      // Handle regular numeric strings
      const numericValue = Number(value)
      if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
        return Math.floor(numericValue)
      }
      
      return 0
    }
    
    // Handle numeric values directly
    const numericValue = Number(value)
    if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
      return Math.floor(numericValue)
    }
    
    return 0
  }
  
  // Test cases
  const testCases = [
    { value: '15', actualCount: 10, expected: 15 },
    { value: 'X', actualCount: 25, expected: 25 },
    { value: 'x', actualCount: 30, expected: 30 },
    { value: 'X/2', actualCount: 20, expected: 10 },
    { value: 'x/2', actualCount: 15, expected: 8 },
    { value: '', actualCount: 10, expected: 0 },
    { value: null, actualCount: 10, expected: 0 }
  ]
  
  testCases.forEach(test => {
    const result = safeParseNumber(test.value, test.actualCount)
    const status = result === test.expected ? '✅' : '❌'
    console.log(`${status} Value: "${test.value}", Actual: ${test.actualCount}, Expected: ${test.expected}, Got: ${result}`)
  })
}

// Test chart data processing
const debugChartData = () => {
  console.log('\n=== Debugging Chart Data ===')
  
  // Check if we can access the app's data
  const reactRoot = document.querySelector('#root')
  if (reactRoot) {
    console.log('React app found, but need to inspect actual data...')
    console.log('Please check the Network tab for API calls to see raw data')
  }
  
  // Check console for our debug warnings
  console.log('Looking for debug warnings in console...')
  console.log('If you see "NaN detected" warnings, that will help identify the issue')
}

// Run tests
testSafeParseNumber()
debugChartData()

console.log('\n📋 Next steps:')
console.log('1. Check browser Network tab for API responses')
console.log('2. Look for "NaN detected" warnings in console')
console.log('3. Inspect actual data values from database')
console.log('4. Verify if X/x values are being used in the data')
