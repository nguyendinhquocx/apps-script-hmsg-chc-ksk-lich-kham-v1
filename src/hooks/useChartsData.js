import { useState, useEffect } from 'react'
import LichKhamService from '../services/supabase'
import { examCategories } from '../constants/examCategories'

export const useChartsData = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Lấy dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Test connection first
        console.log('Charts - Testing connection...')
        const testResult = await LichKhamService.testConnection()
        console.log('Charts - Connection test result:', testResult)
        
        if (!testResult.success) {
          setError(`Connection failed: ${testResult.error}`)
          setData([])
          setLoading(false)
          return
        }
        
        const result = await LichKhamService.getLichKhamData({
          page: 1,
          limit: 10000
        })
        
        if (result.error) {
          console.error('Charts - Error fetching data:', result.error)
          setError(result.error)
          setData([])
        } else {
          const fetchedData = result.data || []
          console.log('Charts - Fetched data:', {
            totalRecords: fetchedData.length,
            sampleRecord: fetchedData[0],
            allKeys: fetchedData[0] ? Object.keys(fetchedData[0]).sort() : []
          })
          
          // Kiểm tra các cột cận lâm sàng có tồn tại không
          if (fetchedData[0]) {
            const keys = Object.keys(fetchedData[0])
            const examColumns = examCategories.flatMap(cat => [cat.morning, cat.afternoon])
            const missingColumns = examColumns.filter(col => !keys.includes(col))
            const availableExamColumns = examColumns.filter(col => keys.includes(col))
            
            console.log('Charts - Column analysis:', {
              expectedExamColumns: examColumns,
              availableExamColumns,
              missingColumns,
              allAvailableKeys: keys.sort()
            })
          }
          
          setData(fetchedData)
        }
      } catch (error) {
        console.error('Charts - Fetch error:', error)
        setError(error.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    data,
    loading,
    error
  }
}
