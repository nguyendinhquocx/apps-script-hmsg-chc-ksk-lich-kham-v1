import React, { useMemo } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const BenchmarkExceedTable = ({ 
  data = [], 
  examCategories = [],
  getExamCount,
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

  // Calculate exceed data
  const exceedTableData = useMemo(() => {
    if (!getDaysToShow) return []

    const days = getDaysToShow()
    
    return days.map(dayInfo => {
      const dayData = {
        date: dayInfo.date,
        day: dayInfo.day,
        maxCount: dayInfo.maxCount || 0,
        categories: {}
      }

      // Check each category for exceeding benchmark
      Object.keys(examCategoryMapping).forEach(categoryName => {
        const [morningField, afternoonField] = examCategoryMapping[categoryName]
        const benchmarkLimit = getBenchmarkLimit(categoryName)
        
        // Get actual counts from data
        const dayRecords = data.filter(record => {
          const recordDate = new Date(record.start_date).toDateString()
          const dayDate = new Date(dayInfo.date).toDateString()
          return recordDate === dayDate
        })

        let morningTotal = 0
        let afternoonTotal = 0

        dayRecords.forEach(record => {
          morningTotal += parseInt(record[morningField] || 0)
          afternoonTotal += parseInt(record[afternoonField] || 0)
        })

        const dailyTotal = Math.max(morningTotal, afternoonTotal)
        const isExceeding = dailyTotal > benchmarkLimit && benchmarkLimit > 0

        if (isExceeding) {
          dayData.categories[categoryName] = {
            morning: morningTotal,
            afternoon: afternoonTotal,
            dailyTotal,
            benchmarkLimit,
            exceedAmount: dailyTotal - benchmarkLimit,
            exceedPercentage: Math.round(((dailyTotal - benchmarkLimit) / benchmarkLimit) * 100)
          }
        }
      })

      return dayData
    })
  }, [data, getDaysToShow, benchmarkData])

  // Export to Excel function
  const exportToExcel = () => {
    const exportData = exceedTableData.map(day => {
      const row = {
        'Ngày': new Date(day.date).toLocaleDateString('vi-VN'),
        'Thứ': day.day,
        'Max': day.maxCount
      }

      Object.keys(examCategoryMapping).forEach(categoryName => {
        const exceedInfo = day.categories[categoryName]
        if (exceedInfo) {
          row[categoryName] = `VƯỢT ${exceedInfo.exceedAmount} ca (${exceedInfo.exceedPercentage}%)`
        } else {
          row[categoryName] = ''
        }
      })

      return row
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vượt định mức')
    XLSX.writeFile(wb, `vuot-dinh-muc-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-4">
      {/* Header with export button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Bảng vượt định mức</h2>
        <button
          onClick={exportToExcel}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider border-r">
                Ngày
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-900 uppercase tracking-wider border-r">
                Max
              </th>
              {Object.keys(examCategoryMapping).map(category => (
                <th key={category} className="px-3 py-2 text-center text-xs font-medium text-gray-900 uppercase tracking-wider border-r">
                  <div>{category}</div>
                  <div className="flex justify-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">Sáng</span>
                    <span className="text-xs text-gray-500">Chiều</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {exceedTableData.map((day, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap border-r">
                  <div className="text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="text-xs text-gray-500">{day.day}</div>
                </td>
                <td className="px-3 py-2 text-center border-r">
                  <div className="text-sm font-bold text-gray-900">{day.maxCount}</div>
                </td>
                {Object.keys(examCategoryMapping).map(category => {
                  const exceedInfo = day.categories[category]
                  const benchmarkLimit = getBenchmarkLimit(category)
                  
                  return (
                    <td key={category} className="px-3 py-2 text-center border-r">
                      {exceedInfo ? (
                        <div className="relative">
                          <div className="flex justify-center space-x-4">
                            <span className="text-sm text-gray-900">{exceedInfo.morning}</span>
                            <span className="text-sm text-gray-900">{exceedInfo.afternoon}</span>
                          </div>
                          {/* Warning circle and details */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-100 border-2 border-red-500 rounded-full p-1 cursor-pointer group">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              
                              {/* Tooltip */}
                              <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-xs bg-red-50 border border-red-200 rounded-lg shadow-lg left-1/2 transform -translate-x-1/2">
                                <div className="font-semibold text-red-800">Vượt định mức!</div>
                                <div className="text-red-700 mt-1">
                                  <div>Định mức: {benchmarkLimit} ca/ngày</div>
                                  <div>Thực tế: {exceedInfo.dailyTotal} ca</div>
                                  <div>Vượt: +{exceedInfo.exceedAmount} ca ({exceedInfo.exceedPercentage}%)</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center space-x-4">
                          <span className="text-sm text-gray-400">-</span>
                          <span className="text-sm text-gray-400">-</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BenchmarkExceedTable
