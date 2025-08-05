// Debug StatsCards calculation
import { parseSpecificDates, getExamCountForDateNew } from './src/utils/examUtils.js'

// Mock filter range: August 1-3, 2025
const filterStart = new Date(2025, 7, 1) // August 1
const calculationEnd = new Date(2025, 7, 3) // August 3

console.log('🔍 Debug StatsCards calculation')
console.log(`Filter range: ${filterStart.toISOString().split('T')[0]} to ${calculationEnd.toISOString().split('T')[0]}`)
console.log('Expected total: 290 people')
console.log('Actual display: 371 people')
console.log('Difference: +81 people (potential over-counting)\n')

// Test cases that might cause the issue
const mockTestCases = [
  {
    name: 'Case 1: Completed with specific dates in range',
    item: {
      'ngay bat dau kham': '2025-08-01',
      'ngay ket thuc kham': '2025-08-05',
      'cac ngay kham thuc te': '8/1(30),8/2(50),8/3(40),8/4(20),8/5(20)',
      'so nguoi kham': 160,
      'trang thai kham': 'Đã khám xong'
    }
  },
  {
    name: 'Case 2: Completed with date range overlapping filter',
    item: {
      'ngay bat dau kham': '2025-08-01',
      'ngay ket thuc kham': '2025-08-10',
      'cac ngay kham thuc te': '',
      'so nguoi kham': 100,
      'trang thai kham': 'Đã khám xong'
    }
  },
  {
    name: 'Case 3: Ongoing with specific dates',
    item: {
      'ngay bat dau kham': '2025-08-01', 
      'ngay ket thuc kham': '2025-08-10',
      'cac ngay kham thuc te': '8/1(10,20),8/2(15,25),8/3(20,30)',
      'so nguoi kham': 150,
      'trang thai kham': 'Chưa khám xong'
    }
  }
]

// Simulate the current logic
function simulateCurrentLogic(item) {
  const startDate = item['ngay bat dau kham']
  const endDate = item['ngay ket thuc kham'] || item['ngay bat dau kham']
  const specificDatesStr = item['cac ngay kham thuc te']
  const totalPeople = parseInt(item['so nguoi kham']) || 0
  const isCompleted = item['trang thai kham'] === 'Đã khám xong'

  if (!startDate || totalPeople === 0) return 0

  console.log(`\n--- Processing: ${item.name || 'Unknown'} ---`)
  console.log(`Start: ${startDate}, End: ${endDate}`)
  console.log(`Specific dates: "${specificDatesStr}"`)
  console.log(`Total people: ${totalPeople}, Completed: ${isCompleted}`)

  let examinedPeople = 0

  if (specificDatesStr && specificDatesStr.trim()) {
    console.log('📅 Using specific dates logic')
    
    // Current logic in StatsCards
    const parsedDates = parseSpecificDates(specificDatesStr, filterStart.getFullYear())
    console.log('Parsed dates:', parsedDates.map(d => ({
      date: d.date.toISOString().split('T')[0],
      total: d.total,
      useSpecific: d.useSpecific
    })))
    
    examinedPeople = parsedDates.reduce((total, parsedDate) => {
      const date = parsedDate.date
      console.log(`Checking date: ${date.toISOString().split('T')[0]}`)
      console.log(`In range? ${date >= filterStart && date <= calculationEnd}`)
      
      if (date >= filterStart && date <= calculationEnd) {
        if (isCompleted) {
          if (parsedDate.useSpecific) {
            console.log(`✅ Completed + specific: Adding ${parsedDate.total}`)
            return total + parsedDate.total
          } else {
            const totalSpecificDays = parsedDates.filter(d => 
              d.date >= filterStart && d.date <= calculationEnd
            ).length
            const dailyAvg = totalSpecificDays > 0 ? Math.round(totalPeople / totalSpecificDays) : 0
            console.log(`✅ Completed + old format: Adding ${dailyAvg} (${totalPeople}/${totalSpecificDays})`)
            return total + dailyAvg
          }
        } else {
          // For ongoing exams: this might be the problem!
          const examResult = getExamCountForDateNew(item, date)
          console.log(`⚠️ Ongoing: getExamCountForDateNew returned ${examResult.total}`)
          return total + examResult.total
        }
      }
      return total
    }, 0)
  } else {
    console.log('📅 Using date range logic')
    const examStartDate = new Date(startDate + 'T00:00:00')
    const examEndDate = new Date(endDate + 'T00:00:00')
    
    if (isCompleted) {
      console.log(`✅ Completed range: Adding full ${totalPeople}`)
      examinedPeople = totalPeople
    } else {
      console.log('⚠️ Ongoing range: This might double-count!')
      // This logic might be problematic
    }
  }

  console.log(`Final result for this item: ${examinedPeople}`)
  return examinedPeople
}

// Test each case
let totalCalculated = 0
mockTestCases.forEach((testCase) => {
  const result = simulateCurrentLogic(testCase.item)
  totalCalculated += result
})

console.log(`\n🎯 SUMMARY:`)
console.log(`Total calculated: ${totalCalculated}`)
console.log(`Expected: 290`)
console.log(`Actual display: 371`)
console.log(`\n🔍 POTENTIAL ISSUES:`)
console.log(`1. getExamCountForDateNew() might be returning wrong values for ongoing exams`)
console.log(`2. Logic for ongoing exams with specific dates might be double-counting`)
console.log(`3. Date filtering might not be working correctly`)
console.log(`4. Multiple records might be contributing to the same dates`)

export { simulateCurrentLogic }
