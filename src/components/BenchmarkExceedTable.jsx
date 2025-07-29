import React, { useMemo } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const BenchmarkExceedTable = ({ 
  data = [], 
  getDaysToShow,
  benchmarkData = []
}) => {

  // Define exam categories mapping  
  const examCategoryMapping = {
    'Siêu âm bụng': ['sieuam_bung_sang', 'sieuam_bung_chieu'],
    'Siêu âm vú': ['sieuam_vu_sang', 'sieuam_vu_chieu'],  
    'Siêu âm giáp': ['sieuam_giap_sang', 'sieuam_giap_chieu'],
    'Siêu âm tim': ['sieuam_tim_sang', 'sieuam_tim_chieu'],
    'SA động mạch cảnh': ['sieuam_dong_mach_canh_sang', 'sieuam_dong_mach_canh_chieu'],
    'Siêu âm vú + giáp': ['sieuam_combo_sang', 'sieuam_combo_chieu'],
    'Điện tâm đồ': ['dien_tam_do_sang', 'dien_tam_do_chieu'],
    'Khám phụ khoa': ['kham_phu_khoa_sang', 'kham_phu_khoa_chieu']
  }

  // Get benchmark limits for each category
  const getBenchmarkLimit = (categoryName) => {
    const benchmarkMapping = {
      'Siêu âm bụng': 'Siêu âm - Bụng',
      'Siêu âm vú': 'Siêu âm - Vú',
      'Siêu âm giáp': 'Siêu âm - Giáp', 
      'Siêu âm tim': 'Siêu âm - Tim',
      'SA động mạch cảnh': 'Siêu âm - Động mạch cảnh',
      'Siêu âm vú + giáp': 'Siêu âm - Combo (Vú, Giáp...)',
      'Điện tâm đồ': 'Điện tim (ECG)',
      'Khám phụ khoa': 'Sản phụ khoa'
    }

    const benchmarkName = benchmarkMapping[categoryName]
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === benchmarkName)
    
    if (!benchmark) return 0
    
    // Return daily limit (average of min and max)
    return Math.round((benchmark.so_ca_ngay_bs_min + benchmark.so_ca_ngay_bs_max) / 2)
  }

  // Calculate exceed data using single data source
  const exceedTableData = useMemo(() => {
    if (!getDaysToShow) return []

    const days = getDaysToShow()
    const exceedData = []

    days.forEach(dayInfo => {
      // Filter records for this day
      const dayRecords = data.filter(record => {
        const recordDate = record.start_date 
          ? new Date(record.start_date).toDateString()
          : new Date(record.date).toDateString()
        const dayDate = new Date(dayInfo.date).toDateString()
        return recordDate === dayDate
      })

      Object.keys(examCategoryMapping).forEach(categoryName => {
        const fields = examCategoryMapping[categoryName]
        const benchmarkLimit = getBenchmarkLimit(categoryName)
        
        if (benchmarkLimit === 0) return

        let morningTotal = 0
        let afternoonTotal = 0

        dayRecords.forEach(record => {
          morningTotal += parseInt(record[fields[0]] || 0)
          afternoonTotal += parseInt(record[fields[1]] || 0)
        })

        const total = morningTotal + afternoonTotal
        const exceed = total - benchmarkLimit

        if (exceed > 0) {
          exceedData.push({
            date: new Date(dayInfo.date).toLocaleDateString('vi-VN'),
            category: categoryName,
            morning: morningTotal,
            afternoon: afternoonTotal,
            total: total,
            benchmark: benchmarkLimit,
            exceed: exceed
          })
        }
      })
    })

    return exceedData.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [data, getDaysToShow, benchmarkData])

  // Export to Excel function
  const exportToExcel = () => {
    const exportData = exceedTableData.map(item => ({
      'Ngày': item.date,
      'Hạng mục': item.category,
      'Sáng': item.morning,
      'Chiều': item.afternoon,
      'Tổng': item.total,
      'Định mức': item.benchmark,
      'Vượt': item.exceed
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vượt định mức')
    XLSX.writeFile(wb, `vuot-dinh-muc-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Bảng vượt định mức</h2>
        
        <button
          onClick={exportToExcel}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Excel</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Hạng mục
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                Sáng
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                Chiều
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                Tổng
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                Định mức
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                Vượt
              </th>
            </tr>
          </thead>
          <tbody>
            {exceedTableData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {item.morning}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {item.afternoon}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                  {item.total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  {item.benchmark}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {item.exceed > 0 ? (
                    <div className="flex items-center justify-center space-x-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">+{item.exceed}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exceedTableData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có dữ liệu vượt định mức
        </div>
      )}
    </div>
  )
}

export default BenchmarkExceedTable
