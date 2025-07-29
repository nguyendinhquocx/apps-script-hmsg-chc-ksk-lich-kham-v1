import React, { useState, useEffect } from 'react'
import { AlertTriangle, Zap } from 'lucide-react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import { useChartsData } from '../hooks/useChartsData'
import { useChartsExport } from '../hooks/useChartsExport'

const Benchmark = ({ filters = {} }) => {
  const { data: benchmarkData, loading: benchmarkLoading, error: benchmarkError } = useBenchmarkData()
  const { data: actualData, loading: actualLoading, error: actualError } = useChartsData()
  
  // Get actual exam data for comparison with filters applied
  const { getExamCount, getDaysToShow } = useChartsExport(actualData || [], filters)

  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  if (benchmarkLoading || actualLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">. _ .</div>
      </div>
    )
  }

  if (benchmarkError || actualError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-center">{benchmarkError || actualError}</p>
      </div>
    )
  }

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    if (!benchmarkData || !actualData) return []

    const days = getDaysToShow()
    const recentDays = days.slice(-7) // Last 7 days
    
    return benchmarkData.map(benchmark => {
      // Map specialty names to exam categories
      const specialtyMapping = {
        'Sản phụ khoa': 'Phụ khoa', // benchmark uses "Sản phụ khoa", actual data uses "Phụ khoa"
        'RHM': 'Răng hàm mặt',
        'TMH': 'Tai mũi họng',
        'Da liễu': 'Da liễu',
        'Mắt': 'Mắt',
        'Nội tổng quát': 'Nội khoa',
        'Ngoại khoa': 'Ngoại khoa'
      }

      const actualSpecialtyName = specialtyMapping[benchmark.chuyen_khoa] || benchmark.chuyen_khoa
      
      // Calculate actual cases from recent data
      let totalActualCases = 0
      let daysWithData = 0

      recentDays.forEach(day => {
        // This is a simplified calculation - in real implementation, 
        // we'd need to map specialty names to exam categories more precisely
        const morningCases = 0 // Would need proper mapping
        const afternoonCases = 0 // Would need proper mapping
        const dailyCases = morningCases + afternoonCases
        
        if (dailyCases > 0) {
          totalActualCases += dailyCases
          daysWithData++
        }
      })

      const avgActualCasesPerDay = daysWithData > 0 ? totalActualCases / daysWithData : 0
      const benchmarkCasesPerDay = (benchmark.so_ca_ngay_bs_min + benchmark.so_ca_ngay_bs_max) / 2
      const loadPercentage = benchmarkCasesPerDay > 0 ? (avgActualCasesPerDay / benchmarkCasesPerDay) * 100 : 0

      return {
        ...benchmark,
        avgActualCasesPerDay: Math.round(avgActualCasesPerDay),
        benchmarkCasesPerDay: Math.round(benchmarkCasesPerDay),
        loadPercentage: Math.round(loadPercentage),
        status: loadPercentage > 100 ? 'overload' : loadPercentage < 70 ? 'underload' : 'optimal'
      }
    })
  }

  const performanceData = calculatePerformanceMetrics()

  // Calculate summary stats
  const totalSpecialties = benchmarkData?.length || 0
  const overloadedSpecialties = performanceData.filter(item => item.status === 'overload').length
  const underloadedSpecialties = performanceData.filter(item => item.status === 'underload').length
  const avgLoadPercentage = performanceData.length > 0 
    ? performanceData.reduce((sum, item) => sum + item.loadPercentage, 0) / performanceData.length 
    : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards - Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4">
          <p className="text-sm font-medium text-gray-600">Tổng chuyên khoa</p>
          <p className="text-2xl font-bold text-gray-900">{totalSpecialties}</p>
        </div>

        <div className="bg-white p-4">
          <p className="text-sm font-medium text-gray-600">TB tải trọng</p>
          <p className="text-2xl font-bold text-gray-900">{avgLoadPercentage.toFixed(0)}%</p>
        </div>

        <div className="bg-white p-4">
          <p className="text-sm font-medium text-gray-600">Quá tải</p>
          <p className="text-2xl font-bold text-gray-900">{overloadedSpecialties}</p>
          <p className="text-xs text-gray-500">khoa</p>
        </div>

        <div className="bg-white p-4">
          <p className="text-sm font-medium text-gray-600">Dư nhân sự</p>
          <p className="text-2xl font-bold text-gray-900">{underloadedSpecialties}</p>
          <p className="text-xs text-gray-500">khoa</p>
        </div>
      </div>

      {/* Benchmark Reference Table */}
      <div className="overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Bảng định mức chuẩn</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Chuyên khoa
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Thời gian/ca (phút)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Số ca/giờ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Số ca/ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {benchmarkData?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.chuyen_khoa}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {item.phut_tb_1_ca_min === item.phut_tb_1_ca_max 
                        ? `${item.phut_tb_1_ca_min} phút`
                        : `${item.phut_tb_1_ca_min}-${item.phut_tb_1_ca_max} phút`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {item.so_ca_gio_bs_min === item.so_ca_gio_bs_max 
                        ? `${item.so_ca_gio_bs_min} ca`
                        : `${item.so_ca_gio_bs_min}-${item.so_ca_gio_bs_max} ca`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {item.so_ca_ngay_bs_min === item.so_ca_ngay_bs_max 
                        ? `${item.so_ca_ngay_bs_min} ca`
                        : `${item.so_ca_ngay_bs_min}-${item.so_ca_ngay_bs_max} ca`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={item.ghi_chu}>
                      {item.ghi_chu}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actionable Insights & Recommendations */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Insights & Khuyến nghị</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Alerts */}
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
              Cảnh báo quan trọng
            </h4>
            <div className="space-y-2">
              {performanceData.filter(item => item.status === 'overload').length > 0 ? (
                performanceData
                  .filter(item => item.status === 'overload')
                  .map(item => (
                    <div key={item.id} className="text-sm p-2 bg-red-50 rounded text-red-800">
                      <strong>{item.chuyen_khoa}</strong>: Quá tải {item.loadPercentage}% 
                      → Cần tăng {Math.ceil((item.avgActualCasesPerDay - item.benchmarkCasesPerDay) / item.benchmarkCasesPerDay)} nhân sự
                    </div>
                  ))
              ) : (
                <div className="text-sm text-gray-500 italic">Không có chuyên khoa quá tải</div>
              )}
            </div>
          </div>

          {/* Optimization Opportunities */}
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 text-green-500 mr-2" />
              Cơ hội tối ưu
            </h4>
            <div className="space-y-2">
              {performanceData.filter(item => item.status === 'underload').length > 0 ? (
                performanceData
                  .filter(item => item.status === 'underload')
                  .map(item => (
                    <div key={item.id} className="text-sm p-2 bg-green-50 rounded text-green-800">
                      <strong>{item.chuyen_khoa}</strong>: Dư {(100 - item.loadPercentage).toFixed(0)}% năng lực
                      → Có thể nhận thêm {Math.floor((item.benchmarkCasesPerDay - item.avgActualCasesPerDay))} ca/ngày
                    </div>
                  ))
              ) : (
                <div className="text-sm text-gray-500 italic">Tất cả chuyên khoa đang hoạt động hiệu quả</div>
              )}
            </div>
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="mt-6 p-4">
          <h4 className="font-medium text-gray-900 mb-3">� Khuyến nghị chiến lược</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-medium text-blue-900 mb-1">Tăng hiệu quả</div>
              <div className="text-blue-700">
                Tập trung vào {performanceData.filter(item => item.status === 'optimal').length} chuyên khoa 
                đang hoạt động tối ưu làm mô hình chuẩn
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="font-medium text-yellow-900 mb-1">Cân bằng tải</div>
              <div className="text-yellow-700">
                Chuyển bớt ca khám từ khoa quá tải sang khoa có dư năng lực
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="font-medium text-green-900 mb-1">Mở rộng dịch vụ</div>
              <div className="text-green-700">
                Khoa có dư năng lực có thể phát triển thêm dịch vụ chuyên sâu
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Benchmark
