// Test file to verify the new parsing logic for "x" values
import { parseIntSafe, parseFloatSafe, isSkipValue } from './src/utils/parseUtils.js'

console.log('🧪 Testing updated parseIntSafe and parseFloatSafe functions with actualPeopleCount')
console.log('=' + '='.repeat(80))

// Test cases with actualPeopleCount = 100
const actualPeopleCount = 100

console.log('\n📋 Test Case 1: Regular numbers (should work same as before)')
console.log('parseIntSafe("50", 100) =', parseIntSafe("50", actualPeopleCount))
console.log('parseIntSafe("25.7", 100) =', parseIntSafe("25.7", actualPeopleCount))
console.log('parseFloatSafe("25.7", 100) =', parseFloatSafe("25.7", actualPeopleCount))

console.log('\n📋 Test Case 2: "x" values (should equal actualPeopleCount)')
console.log('parseIntSafe("x", 100) =', parseIntSafe("x", actualPeopleCount))
console.log('parseIntSafe("X", 100) =', parseIntSafe("X", actualPeopleCount))
console.log('parseFloatSafe("x", 100) =', parseFloatSafe("x", actualPeopleCount))

console.log('\n📋 Test Case 3: "x/2" values (should equal half of actualPeopleCount)')
console.log('parseIntSafe("x/2", 100) =', parseIntSafe("x/2", actualPeopleCount))
console.log('parseIntSafe("X/2", 100) =', parseIntSafe("X/2", actualPeopleCount))
console.log('parseFloatSafe("x/2", 100) =', parseFloatSafe("x/2", actualPeopleCount))

console.log('\n📋 Test Case 4: Edge cases')
console.log('parseIntSafe("", 100) =', parseIntSafe("", actualPeopleCount))
console.log('parseIntSafe(null, 100) =', parseIntSafe(null, actualPeopleCount))
console.log('parseIntSafe(undefined, 100) =', parseIntSafe(undefined, actualPeopleCount))
console.log('parseIntSafe("invalid", 100) =', parseIntSafe("invalid", actualPeopleCount))

console.log('\n📋 Test Case 5: isSkipValue function')
console.log('isSkipValue("x") =', isSkipValue("x"))
console.log('isSkipValue("X") =', isSkipValue("X"))
console.log('isSkipValue("x/2") =', isSkipValue("x/2"))
console.log('isSkipValue("X/2") =', isSkipValue("X/2"))
console.log('isSkipValue("50") =', isSkipValue("50"))
console.log('isSkipValue("") =', isSkipValue(""))

console.log('\n📋 Test Case 6: Different actualPeopleCount values')
console.log('parseIntSafe("x", 50) =', parseIntSafe("x", 50))
console.log('parseIntSafe("x/2", 50) =', parseIntSafe("x/2", 50))
console.log('parseIntSafe("x", 75) =', parseIntSafe("x", 75))
console.log('parseIntSafe("x/2", 75) =', parseIntSafe("x/2", 75))

console.log('\n✅ All tests completed!')
console.log('\nℹ️  Before this change:')
console.log('   - "x" values were converted to 0')
console.log('   - This caused "NaN ca" in tooltips when calculations were performed')
console.log('\nℹ️  After this change:')
console.log('   - "x" values = actualPeopleCount (number of people examined)')
console.log('   - "x/2" values = Math.round(actualPeopleCount / 2)')
console.log('   - Charts now show correct examination counts')
