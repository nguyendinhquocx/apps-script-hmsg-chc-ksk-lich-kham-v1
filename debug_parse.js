// Test parsing specific dates
const testData = [
  '07/28(20),07/29(20), 07/30(20),07/31(20), 08/01(20),08/02(80), 08/04(18),08/05(15),08/06(15),08/07(15),08/08(15), 08/09(80)',
  '08/16, 08/23',
  '8/18(10,20),8/19(10,20),8/20(10,20),8/21(10,20),8/22(10,20),8/23(10,20)'
]

// Smart split function that respects parentheses
const smartSplitDateEntries = (str) => {
  const entries = []
  let current = ''
  let inParentheses = false
  let i = 0
  
  while (i < str.length) {
    const char = str[i]
    
    if (char === '(') {
      inParentheses = true
      current += char
    } else if (char === ')') {
      inParentheses = false
      current += char
    } else if (char === ',' && !inParentheses) {
      // Split here - we're not inside parentheses
      if (current.trim()) {
        entries.push(current.trim())
      }
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  // Add the last entry
  if (current.trim()) {
    entries.push(current.trim())
  }
  
  return entries
}

// Copy the parseSpecificDates function here for testing
const parseSpecificDates = (specificDatesStr, referenceYear = new Date().getFullYear()) => {
  console.log(`\n=== Parsing: "${specificDatesStr}" ===`)
  
  if (!specificDatesStr || !specificDatesStr.trim()) {
    return []
  }

  const results = []
  
  // Smart split that respects parentheses
  const dateEntries = smartSplitDateEntries(specificDatesStr)
  
  console.log('Date entries after split:', dateEntries)

  for (const entry of dateEntries) {
    console.log(`\nProcessing entry: "${entry}"`)
    
    try {
      // Check if entry has parentheses (new format)
      const hasParentheses = entry.includes('(') && entry.includes(')')
      console.log('Has parentheses:', hasParentheses)

      if (hasParentheses) {
        // New format: "MM/dd(morning,afternoon)" or "MM/dd(total)"
        const match = entry.match(/^(\d{1,2})\/(\d{1,2})\s*\(([^)]*)\)$/)
        console.log('Regex match result:', match)
        
        if (match) {
          const [, month, day, countsStr] = match
          console.log(`Parsed: month=${month}, day=${day}, countsStr="${countsStr}"`)
          
          const date = new Date(referenceYear, parseInt(month) - 1, parseInt(day))
          console.log('Created date:', date)

          // Skip Sundays
          if (date.getDay() === 0) {
            console.log('Skipping Sunday')
            continue
          }

          const counts = countsStr.split(',').map(c => c.trim())
          console.log('Counts array:', counts)

          if (counts.length === 1) {
            // Format: "MM/dd(total)" - split evenly
            const total = parseInt(counts[0]) || 0
            const morning = Math.floor(total / 2)
            const afternoon = total - morning

            console.log(`Single count format: total=${total}, morning=${morning}, afternoon=${afternoon}`)

            results.push({
              date,
              morning,
              afternoon,
              total,
              useSpecific: true,
              originalEntry: entry
            })
          } else if (counts.length === 2) {
            // Format: "MM/dd(morning,afternoon)"
            const morning = counts[0] === '' ? 0 : (parseInt(counts[0]) || 0)
            const afternoon = counts[1] === '' ? 0 : (parseInt(counts[1]) || 0)
            const total = morning + afternoon

            console.log(`Two count format: morning=${morning}, afternoon=${afternoon}, total=${total}`)

            results.push({
              date,
              morning,
              afternoon,
              total,
              useSpecific: true,
              originalEntry: entry
            })
          }
        } else {
          console.log('❌ Regex did not match!')
        }
      } else {
        // Old format: "MM/dd" - no specific counts
        console.log('Processing old format (no parentheses)')
        const match = entry.match(/^(\d{1,2})\/(\d{1,2})$/)
        if (match) {
          const [, month, day] = match
          const date = new Date(referenceYear, parseInt(month) - 1, parseInt(day))

          // Skip Sundays
          if (date.getDay() === 0) continue

          results.push({
            date,
            morning: null,
            afternoon: null,
            total: null,
            useSpecific: false,
            originalEntry: entry
          })
        }
      }
    } catch (error) {
      console.warn(`Failed to parse date entry: ${entry}`, error)
      // Continue processing other entries
    }
  }

  console.log('\nFinal results:', results.map(r => ({
    date: r.date.toISOString().split('T')[0],
    morning: r.morning,
    afternoon: r.afternoon,
    total: r.total,
    useSpecific: r.useSpecific,
    originalEntry: r.originalEntry
  })))

  return results
}

// Test all cases
testData.forEach((testString, index) => {
  console.log(`\n🧪 TEST CASE ${index + 1}: "${testString}"`)
  parseSpecificDates(testString, 2025)
})
