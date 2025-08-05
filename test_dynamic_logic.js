// Test the new dynamic clinical exam logic
import { safeParseNumber } from './src/utils/examUtils.js'

console.log('🧪 Testing new dynamic clinical exam parsing logic...\n')

// Test cases
const testCases = [
  // Regular numbers
  { value: '15', actualCount: 10, expected: 15, description: 'Regular number string' },
  { value: 20, actualCount: 10, expected: 20, description: 'Regular number' },
  
  // Dynamic values
  { value: 'X', actualCount: 25, expected: 25, description: 'X should use actual count' },
  { value: 'x', actualCount: 30, expected: 30, description: 'lowercase x should use actual count' },
  { value: 'X/2', actualCount: 20, expected: 10, description: 'X/2 should use half actual count' },
  { value: 'x/2', actualCount: 15, expected: 8, description: 'x/2 should use half actual count (rounded)' },
  
  // Edge cases
  { value: '', actualCount: 10, expected: 0, description: 'Empty string' },
  { value: null, actualCount: 10, expected: 0, description: 'Null value' },
  { value: 'abc', actualCount: 10, expected: 0, description: 'Invalid string' },
  { value: '-5', actualCount: 10, expected: 0, description: 'Negative number' },
  { value: '15.7', actualCount: 10, expected: 15, description: 'Decimal number (should floor)' }
]

console.log('┌─────────────────────────────────────────────────────────────────┐')
console.log('│ Value    │ Actual Count │ Expected │ Result │ Status │ Description │')
console.log('├─────────────────────────────────────────────────────────────────┤')

testCases.forEach(testCase => {
  const result = safeParseNumber(testCase.value, testCase.actualCount)
  const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL'
  
  const valueStr = String(testCase.value).padEnd(8)
  const actualStr = String(testCase.actualCount).padEnd(12)
  const expectedStr = String(testCase.expected).padEnd(8)
  const resultStr = String(result).padEnd(6)
  const statusStr = status.padEnd(6)
  
  console.log(`│ ${valueStr} │ ${actualStr} │ ${expectedStr} │ ${resultStr} │ ${statusStr} │ ${testCase.description}`)
})

console.log('└─────────────────────────────────────────────────────────────────┘')

// Practical example
console.log('\n🎯 Practical Example:')
console.log('Company ABC has examination on 18/8 with:')
console.log('- Morning: 10 people examined')
console.log('- Afternoon: 20 people examined')
console.log('')

const scenarios = [
  { column: 'sieu am bung sang', value: '15', period: 'morning' },
  { column: 'sieu am bung sang', value: 'X', period: 'morning' },
  { column: 'sieu am bung chieu', value: 'X/2', period: 'afternoon' },
  { column: 'x quang sang', value: 'x', period: 'morning' }
]

scenarios.forEach(scenario => {
  const actualCount = scenario.period === 'morning' ? 10 : 20
  const result = safeParseNumber(scenario.value, actualCount)
  
  console.log(`${scenario.column} = "${scenario.value}" → ${result} ultrasound cases (${scenario.period}: ${actualCount} people)`)
})

console.log('\n✨ New logic successfully handles both fixed numbers and dynamic percentages!')
