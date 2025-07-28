import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useBenchmarkData = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBenchmarkData()
  }, [])

  const fetchBenchmarkData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching benchmark data from Supabase...')
      
      const { data: benchmarkData, error: fetchError } = await supabase
        .from('ksk_benchmark')
        .select('*')
        .order('id', { ascending: true })

      if (fetchError) {
        console.error('❌ Supabase fetch error:', fetchError)
        throw fetchError
      }

      console.log('✅ Benchmark data fetched successfully:', benchmarkData)
      console.log('📊 Total records:', benchmarkData?.length || 0)
      
      setData(benchmarkData || [])
    } catch (err) {
      console.error('💥 Error in fetchBenchmarkData:', err)
      setError(err.message || 'Không thể tải dữ liệu benchmark')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchBenchmarkData()
  }

  // Test connection function
  const testConnection = async () => {
    try {
      console.log('🧪 Testing Supabase connection for ksk_benchmark table...')
      
      const { data: testData, error: testError } = await supabase
        .from('ksk_benchmark')
        .select('count(*)')
        .limit(1)

      if (testError) {
        console.error('❌ Connection test failed:', testError)
        return { success: false, error: testError.message }
      }

      console.log('✅ Connection test successful!')
      return { success: true, message: 'Kết nối thành công với bảng ksk_benchmark' }
    } catch (err) {
      console.error('💥 Connection test error:', err)
      return { success: false, error: err.message }
    }
  }

  // Statistics calculations
  const getStatistics = () => {
    if (!data || data.length === 0) return null

    const totalSpecialties = data.length
    const avgTimePerCase = data.reduce((sum, item) => sum + (item.phut_tb_1_ca_min + item.phut_tb_1_ca_max) / 2, 0) / totalSpecialties
    const avgCasesPerHour = data.reduce((sum, item) => sum + (item.so_ca_gio_bs_min + item.so_ca_gio_bs_max) / 2, 0) / totalSpecialties
    const avgCasesPerDay = data.reduce((sum, item) => sum + (item.so_ca_ngay_bs_min + item.so_ca_ngay_bs_max) / 2, 0) / totalSpecialties

    return {
      totalSpecialties,
      avgTimePerCase: Math.round(avgTimePerCase * 10) / 10,
      avgCasesPerHour: Math.round(avgCasesPerHour * 10) / 10,
      avgCasesPerDay: Math.round(avgCasesPerDay)
    }
  }

  // Get benchmark by specialty
  const getBenchmarkBySpecialty = (specialty) => {
    return data.find(item => item.chuyen_khoa === specialty)
  }

  return {
    data,
    loading,
    error,
    refreshData,
    testConnection,
    getStatistics,
    getBenchmarkBySpecialty
  }
}
