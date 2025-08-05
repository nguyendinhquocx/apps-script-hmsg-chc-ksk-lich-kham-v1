// Run this in browser console to inspect sample clinical data
console.log('🔍 Inspecting clinical exam data...')

// Check if we can access React DevTools or data
const inspectClinicalData = () => {
  // Try to find data in the app state
  const reactElements = document.querySelectorAll('[data-reactroot], #root')
  
  if (reactElements.length > 0) {
    console.log('React app found. Checking for data...')
    
    // Try to access window variables if any
    if (window.React) {
      console.log('React detected in window')
    }
    
    // Instructions for manual inspection
    console.log('📋 Manual inspection steps:')
    console.log('1. Open Network tab in DevTools')
    console.log('2. Look for API calls to Supabase')
    console.log('3. Check the Response for a few records')
    console.log('4. Look at columns like "sieu am bung sang", "dien tam do sang", etc.')
    console.log('5. See if values are numbers, "X", "x/2", or empty strings')
    
    // Try to inspect from localStorage or sessionStorage
    const keys = Object.keys(localStorage)
    console.log('LocalStorage keys:', keys)
    
    // Sample data format we expect
    console.log('\n🎯 Expected clinical data format:')
    console.log('✅ Numbers: "15", "20", "0"')
    console.log('✅ Dynamic: "X", "x", "X/2", "x/2"') 
    console.log('❌ Invalid: null, undefined, "", "N/A"')
  } else {
    console.log('No React app found')
  }
}

// Alternative: Create a test function to check safeParseNumber
window.testSafeParseNumber = (value, actualCount) => {
  // Simulate the function
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    
    if (trimmed === 'x') {
      return actualCount || 0
    }
    
    if (trimmed === 'x/2') {
      return Math.round((actualCount || 0) / 2)
    }
    
    const numericValue = Number(value)
    if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
      return Math.floor(numericValue)
    }
    
    return 0
  }
  
  const numericValue = Number(value)
  if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
    return Math.floor(numericValue)
  }
  
  return 0
}

console.log('\n🧪 Test the parsing function:')
console.log('Usage: testSafeParseNumber("X", 25) // Should return 25')
console.log('Usage: testSafeParseNumber("x/2", 20) // Should return 10')
console.log('Usage: testSafeParseNumber("15", 10) // Should return 15')

inspectClinicalData()
