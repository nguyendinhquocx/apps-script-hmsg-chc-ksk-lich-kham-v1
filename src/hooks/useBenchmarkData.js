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
      
      // Test với select đơn giản chỉ lấy 1 record
      const { data: testData, error: testError } = await supabase
        .from('ksk_benchmark')
        .select('*')
        .limit(5)

      if (testError) {
        console.error('❌ Connection test failed:', testError)
        return { success: false, error: testError.message }
      }

      console.log('✅ Connection test successful!')
      console.log('📊 Test data received:', testData)
      
      if (!testData || testData.length === 0) {
        return { 
          success: true, 
          message: `Kết nối thành công nhưng bảng ksk_benchmark trống. Cần thêm dữ liệu mẫu.` 
        }
      }
      
      return { 
        success: true, 
        message: `Kết nối thành công với bảng ksk_benchmark. Tìm thấy ${testData?.length || 0} record(s).` 
      }
    } catch (err) {
      console.error('💥 Connection test error:', err)
      return { success: false, error: err.message }
    }
  }

  // Function to insert sample data
  const insertSampleData = async () => {
    try {
      console.log('📝 Inserting sample benchmark data...')
      
      const sampleData = [
        {
          chuyen_khoa: "Nội tổng quát",
          phut_tb_1_ca_min: 5,
          phut_tb_1_ca_max: 8,
          so_ca_gio_bs_min: 8,
          so_ca_gio_bs_max: 12,
          so_ca_ngay_bs_min: 64,
          so_ca_ngay_bs_max: 90,
          nhan_su: "BS",
          ghi_chu: "Khám + tư vấn CLS. Định mức 15 phút/ca, 4 KH/giờ, 15 KH/ngày cho khách hàng công ty và thẩm định bảo hiểm"
        },
        {
          chuyen_khoa: "Ngoại khoa",
          phut_tb_1_ca_min: 5,
          phut_tb_1_ca_max: 5,
          so_ca_gio_bs_min: 12,
          so_ca_gio_bs_max: 12,
          so_ca_ngay_bs_min: 90,
          so_ca_ngay_bs_max: 90,
          nhan_su: "BS",
          ghi_chu: "Khám + tư vấn CLS"
        },
        {
          chuyen_khoa: "RHM",
          phut_tb_1_ca_min: 5,
          phut_tb_1_ca_max: 5,
          so_ca_gio_bs_min: 12,
          so_ca_gio_bs_max: 12,
          so_ca_ngay_bs_min: 90,
          so_ca_ngay_bs_max: 90,
          nhan_su: "BS",
          ghi_chu: "Khám + tư vấn CLS"
        },
        {
          chuyen_khoa: "TMH",
          phut_tb_1_ca_min: 5,
          phut_tb_1_ca_max: 5,
          so_ca_gio_bs_min: 12,
          so_ca_gio_bs_max: 12,
          so_ca_ngay_bs_min: 90,
          so_ca_ngay_bs_max: 90,
          nhan_su: "BS",
          ghi_chu: "Khám + tư vấn CLS"
        },
        {
          chuyen_khoa: "Mắt",
          phut_tb_1_ca_min: 5,
          phut_tb_1_ca_max: 5,
          so_ca_gio_bs_min: 12,
          so_ca_gio_bs_max: 12,
          so_ca_ngay_bs_min: 90,
          so_ca_ngay_bs_max: 90,
          nhan_su: "BS",
          ghi_chu: "Khám + tư vấn CLS"
        },
        {
          chuyen_khoa: "Da liễu",
          phut_tb_1_ca_min: 5,
          phut_tb_1_ca_max: 5,
          so_ca_gio_bs_min: 12,
          so_ca_gio_bs_max: 12,
          so_ca_ngay_bs_min: 90,
          so_ca_ngay_bs_max: 90,
          nhan_su: "BS",
          ghi_chu: "Khám + tư vấn CLS"
        },
        {
          chuyen_khoa: "Sản phụ khoa",
          phut_tb_1_ca_min: 7,
          phut_tb_1_ca_max: 15,
          so_ca_gio_bs_min: 4,
          so_ca_gio_bs_max: 8,
          so_ca_ngay_bs_min: 32,
          so_ca_ngay_bs_max: 64,
          nhan_su: "BS + ĐD/TKYK",
          ghi_chu: "Vấn + PAP + soi tươi (tối thiểu 15 phút/ca)"
        }
      ]

      const { data: insertedData, error: insertError } = await supabase
        .from('ksk_benchmark')
        .insert(sampleData)
        .select()

      if (insertError) {
        console.error('❌ Insert sample data failed:', insertError)
        return { success: false, error: insertError.message }
      }

      console.log('✅ Sample data inserted successfully:', insertedData)
      
      // Refresh data after insert
      await fetchBenchmarkData()
      
      return { 
        success: true, 
        message: `Đã thêm ${sampleData.length} record mẫu thành công!` 
      }
    } catch (err) {
      console.error('💥 Error inserting sample data:', err)
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
    insertSampleData,
    getStatistics,
    getBenchmarkBySpecialty
  }
}
