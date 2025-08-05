// Debug script to check clinical exam data format after converting from int8 to text
import LichKhamService from './src/services/supabase.js'
import { examCategories } from './src/constants/examCategories.js'

const debugClinicalData = async () => {
  console.log('🔍 Starting clinical data format analysis...')
  
  try {
    // Test connection
    const testResult = await LichKhamService.testConnection()
    if (!testResult.success) {
      console.error('❌ Connection failed:', testResult.error)
      return
    }
    console.log('✅ Connection successful')
    
    // Fetch sample data
    const result = await LichKhamService.getLichKhamData({
      page: 1,
      limit: 5 // Just a few records for analysis
    })
    
    if (result.error) {
      console.error('❌ Error fetching data:', result.error)
      return
    }
    
    const data = result.data || []
    if (data.length === 0) {
      console.log('⚠️ No data found')
      return
    }
    
    console.log(`\n📊 Analyzing ${data.length} records...`)
    
    // Check all clinical exam columns
    const clinicalColumns = examCategories.flatMap(cat => [cat.morning, cat.afternoon])
    
    data.forEach((record, index) => {
      console.log(`\n--- Record ${index + 1}: ${record['ten cong ty']} ---`)
      
      clinicalColumns.forEach(columnName => {
        const value = record[columnName]
        const type = typeof value
        const parsedValue = parseInt(value)
        const isValid = !isNaN(parsedValue)
        
        console.log(`${columnName}: "${value}" (${type}) → parseInt: ${parsedValue} (${isValid ? 'valid' : 'invalid'})`)
      })
    })
    
    // Summary analysis
    console.log('\n📈 Summary Analysis:')
    
    const columnAnalysis = {}
    clinicalColumns.forEach(columnName => {
      const values = data.map(record => record[columnName])
      const types = [...new Set(values.map(v => typeof v))]
      const validCounts = values.filter(v => !isNaN(parseInt(v))).length
      const invalidCounts = values.length - validCounts
      
      columnAnalysis[columnName] = {
        totalRecords: values.length,
        validNumbers: validCounts,
        invalidValues: invalidCounts,
        types: types,
        sampleValues: values.slice(0, 3)
      }
    })
    
    console.table(columnAnalysis)
    
    // Check for potential issues
    console.log('\n⚠️  Potential Issues:')
    Object.entries(columnAnalysis).forEach(([column, analysis]) => {
      if (analysis.invalidValues > 0) {
        console.log(`- Column "${column}": ${analysis.invalidValues} invalid values out of ${analysis.totalRecords}`)
      }
    })
    
  } catch (error) {
    console.error('💥 Debug error:', error)
  }
}

// Run the debug
debugClinicalData()
