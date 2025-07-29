import React, { useMemo } from 'react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import { useChartsData } from '../hooks/useChartsData'
import { useChartsExport } from '../hooks/useChartsExport'
import BenchmarkExceedTable from './BenchmarkExceedTable'
import BenchmarkLineChart from './BenchmarkLineChart'

const Benchmark = ({ filters }) => {
  const { data: benchmarkData, loading: benchmarkLoading, error: benchmarkError } = useBenchmarkData()
  const { data: allData, loading: chartsLoading, error: chartsError } = useChartsData()
  
  // Get charts export functionality
  const { getDaysToShow, getExamCount } = useChartsExport(allData || [], filters)

  if (benchmarkLoading || chartsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (benchmarkError || chartsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-center">{benchmarkError || chartsError}</p>
      </div>
    )
  }
  // Mapping for specialty name display
  const specialtyDisplayNames = {
    'Ngoại khoa': 'Ngoại tổng quát',
    'RHM': 'Răng hàm mặt', 
    'TMH': 'Tai mũi họng',
    'Siêu âm - Bụng': 'Siêu âm bụng',
    'Siêu âm - Vú': 'Siêu âm vú',
    'Siêu âm - Giáp': 'Siêu âm giáp',
    'Siêu âm - Tim': 'Siêu âm tim',
    'Siêu âm - Động mạch cảnh': 'SA động mạch cảnh',
    'Siêu âm - Combo (Vú, Giáp...)': 'Siêu âm vú + giáp',
    'Siêu âm - Mạch máu chi': 'SA mạch máu chi',
    'Điện tim (ECG)': 'Điện tâm đồ',
    'Sản phụ khoa': 'Khám phụ khoa'
  }

  // Sort benchmark data: Nội tổng quát -> Điện tâm đồ -> Khám phụ khoa -> others
  const sortedBenchmarkData = benchmarkData?.slice().sort((a, b) => {
    const specialtyOrder = [
      'Nội tổng quát',
      'Điện tim (ECG)', // Will be displayed as 'Điện tâm đồ' 
      'Sản phụ khoa'   // Will be displayed as 'Khám phụ khoa'
    ]
    
    const aIndex = specialtyOrder.indexOf(a.chuyen_khoa)
    const bIndex = specialtyOrder.indexOf(b.chuyen_khoa)
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    } else if (aIndex !== -1) {
      return -1
    } else if (bIndex !== -1) {
      return 1
    } else {
      return a.chuyen_khoa.localeCompare(b.chuyen_khoa)
    }
  })

  return (
    <div className="space-y-6">
      {/* Benchmark Reference Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bảng định mức chuẩn</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
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
            <tbody>
              {sortedBenchmarkData?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {specialtyDisplayNames[item.chuyen_khoa] || item.chuyen_khoa}
                    </div>
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

      {/* Benchmark Line Charts */}
      <div className="space-y-4">
        <BenchmarkLineChart
          data={allData || []}
          getDaysToShow={getDaysToShow}
          benchmarkData={benchmarkData || []}
          chartType="ultrasound"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BenchmarkLineChart
            data={allData || []}
            getDaysToShow={getDaysToShow}
            benchmarkData={benchmarkData || []}
            chartType="ecg"
          />
          
          <BenchmarkLineChart
            data={allData || []}
            getDaysToShow={getDaysToShow}
            benchmarkData={benchmarkData || []}
            chartType="gynecology"
          />
        </div>
      </div>

      {/* Benchmark Exceed Table */}
      <BenchmarkExceedTable 
        data={allData || []}
        getDaysToShow={getDaysToShow}
        benchmarkData={benchmarkData || []}
      />
    </div>
  )
}

export default Benchmark
