import React, { useMemo } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { format, getDay, eachDayOfInterval } from 'date-fns'
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

  // Calculate exceed data based on the 3 chart categories
  const exceedTableData = useMemo(() => {
    if (!getDaysToShow) return []

    const days = getDaysToShow()
    const exceedByDate = new Map()

    // Categories matching the 3 charts
    const chartCategories = [
      'Điện tâm đồ',
      'Khám phụ khoa',
      'Siêu âm bụng',
      'Siêu âm vú',
      'Siêu âm giáp',
      'Siêu âm tim',
      'SA động mạch cảnh'
    ]

    // Create date map for aggregation (same logic as charts)
    const dateMap = new Map()
    days.forEach(dayInfo => {
      const dateKey = format(new Date(dayInfo.date), 'yyyy-MM-dd')
      dateMap.set(dateKey, {
        date: dateKey,
        categories: {}
      })
      
      // Initialize all categories to 0
      chartCategories.forEach(categoryName => {
        dateMap.get(dateKey).categories[categoryName] = 0
      })
    })

    // Process actual data (same logic as charts)
    data.forEach(item => {
      const startDateStr = item['ngay bat dau kham']
      const endDateStr = item['ngay ket thuc kham'] || startDateStr
      const specificDatesStr = item['cac ngay kham thuc te']
      
      if (!startDateStr) return

      // Get examination dates (same logic as charts)
      let examDates = []
      
      if (specificDatesStr && specificDatesStr.trim()) {
        // Parse specific dates (format: MM/dd, MM/dd, ...)
        const specificDates = specificDatesStr.split(',').map(dateStr => {
          const trimmed = dateStr.trim()
          if (trimmed.includes('/')) {
            const [month, day] = trimmed.split('/')
            const year = new Date().getFullYear()
            return new Date(year, parseInt(month) - 1, parseInt(day))
          }
          return null
        }).filter(d => d !== null)
        
        examDates = specificDates.filter(d => {
          const dateKey = format(d, 'yyyy-MM-dd')
          return dateMap.has(dateKey)
        })
      } else {
        // Use start and end dates
        const startDate = new Date(startDateStr + 'T00:00:00')
        const endDate = new Date(endDateStr + 'T00:00:00')
        
        examDates = eachDayOfInterval({ start: startDate, end: endDate })
          .filter(d => {
            const dateKey = format(d, 'yyyy-MM-dd')
            return getDay(d) !== 0 && dateMap.has(dateKey)
          })
      }

      // Add counts to each examination date
      examDates.forEach(examDate => {
        const dateKey = format(examDate, 'yyyy-MM-dd')
        const dayData = dateMap.get(dateKey)
        
        if (dayData) {
          // ECG
          const ecgMorning = parseInt(item['dien tam do sang'] || 0)
          const ecgAfternoon = parseInt(item['dien tam do chieu'] || 0)
          dayData.categories['Điện tâm đồ'] += ecgMorning + ecgAfternoon
          
          // Gynecology
          const gynecoMorning = parseInt(item['kham phu khoa sang'] || 0)
          const gynecoAfternoon = parseInt(item['kham phu khoa chieu'] || 0)
          dayData.categories['Khám phụ khoa'] += gynecoMorning + gynecoAfternoon
          
          // Ultrasound categories
          const ultrasoundMappings = [
            { category: 'Siêu âm bụng', fields: ['sieu am bung sang', 'sieu am bung chieu'] },
            { category: 'Siêu âm vú', fields: ['sieu am vu sang', 'sieu am vu chieu'] },
            { category: 'Siêu âm giáp', fields: ['sieu am giap sang', 'sieu am giap chieu'] },
            { category: 'Siêu âm tim', fields: ['sieu am tim sang', 'sieu am tim chieu'] },
            { category: 'SA động mạch cảnh', fields: ['sieu am dong mach canh sang', 'sieu am dong mach canh chieu'] }
          ]
          
          ultrasoundMappings.forEach(mapping => {
            const morning = parseInt(item[mapping.fields[0]] || 0)
            const afternoon = parseInt(item[mapping.fields[1]] || 0)
            dayData.categories[mapping.category] += morning + afternoon
          })
        }
      })
    })

    // Check for exceeds and build result
    Array.from(dateMap.values()).forEach(dayData => {
      const dayExceeds = []
      
      chartCategories.forEach(categoryName => {
        const benchmarkLimit = getBenchmarkLimit(categoryName)
        if (benchmarkLimit === 0) return
        
        const total = dayData.categories[categoryName]
        const exceed = total - benchmarkLimit
        
        if (exceed > 0) {
          dayExceeds.push({
            category: categoryName,
            total,
            benchmark: benchmarkLimit,
            exceed
          })
        }
      })

      if (dayExceeds.length > 0) {
        exceedByDate.set(dayData.date, {
          date: new Date(dayData.date).toLocaleDateString('vi-VN'),
          dateSort: new Date(dayData.date),
          exceeds: dayExceeds,
          totalExceedCategories: dayExceeds.length
        })
      }
    })

    return Array.from(exceedByDate.values()).sort((a, b) => a.dateSort - b.dateSort)
  }, [data, getDaysToShow, benchmarkData])

  // Export to Excel function
  const exportToExcel = () => {
    const exportData = []
    exceedTableData.forEach(dayData => {
      dayData.exceeds.forEach(item => {
        exportData.push({
          'Ngày': dayData.date,
          'Hạng mục': item.category,
          'Tổng ca': item.total,
          'Định mức': item.benchmark,
          'Vượt': item.exceed
        })
      })
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vượt định mức')
    XLSX.writeFile(wb, `vuot-dinh-muc-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Bảng vượt định mức</h2>
        
        {exceedTableData.length > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        )}
      </div>

      {exceedTableData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Không có ngày nào vượt định mức trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exceedTableData.map((dayData, index) => (
            <div key={index} className="bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-900">{dayData.date}</span>
                  <span className="font-medium text-red-600">
                    {dayData.totalExceedCategories}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayData.exceeds.map((exceedItem, exceedIndex) => (
                  <div key={exceedIndex} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{exceedItem.category}</p>
                      <p className="text-xs text-gray-600">
                        {exceedItem.total}/{exceedItem.benchmark} ca
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-blue-600">
                        +{exceedItem.exceed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BenchmarkExceedTable
