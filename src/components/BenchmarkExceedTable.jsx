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
    'Khám phụ khoa': ['kham_phu_khoa_sang', 'kham_phu_khoa_chieu'],
    'Nội tổng quát': ['so_nguoi_kham'] // Special case: uses total people examined
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
      'Khám phụ khoa': 'Sản phụ khoa',
      'Nội tổng quát': 'Nội tổng quát'
    }

    const benchmarkName = benchmarkMapping[categoryName]
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === benchmarkName)
    
    if (!benchmark) return 0
    
    // Return daily limit (average of min and max)
    return Math.round((benchmark.so_ca_ngay_bs_min + benchmark.so_ca_ngay_bs_max) / 2)
  }

  // Calculate room requirements matrix data for table format
  const roomMatrixData = useMemo(() => {
    if (!getDaysToShow) return { days: [], categories: [] }

    const days = getDaysToShow()
    const dateMap = new Map()

    // Create date map for aggregation (same logic as charts)
    days.forEach(dayInfo => {
      const dateKey = format(new Date(dayInfo.date), 'yyyy-MM-dd')
      const dayOfWeek = getDay(new Date(dayInfo.date))
      const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      
      dateMap.set(dateKey, {
        date: dateKey,
        dayOfMonth: new Date(dayInfo.date).getDate(),
        dayLabel: dayLabels[dayOfWeek],
        ultrasound: 0,  // Total ultrasound cases
        ecg: 0,         // ECG cases
        gynecology: 0,  // Gynecology cases
        internalMedicine: 0  // Internal Medicine cases
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
          dayData.ecg += ecgMorning + ecgAfternoon
          
          // Gynecology
          const gynecoMorning = parseInt(item['kham phu khoa sang'] || 0)
          const gynecoAfternoon = parseInt(item['kham phu khoa chieu'] || 0)
          dayData.gynecology += gynecoMorning + gynecoAfternoon
          
                     // Internal Medicine - SPECIAL LOGIC: use the same logic as DataTable
           const isCompleted = item['trang thai kham'] === 'Đã khám xong'
           const totalPeople = parseInt(item['so nguoi kham']) || 0
           
           let dailyCount = 0
           if (examDates.length > 0) {
             if (isCompleted) {
               // For completed exams: distribute total people across examination days
               dailyCount = Math.round(totalPeople / examDates.length)
             } else {
               // For ongoing exams: use calculated averages
               const morningAvg = parseFloat(item['trung binh ngay sang']) || 0
               const afternoonAvg = parseFloat(item['trung binh ngay chieu']) || 0
               dailyCount = Math.round(morningAvg + afternoonAvg)
             }
           }
           
           dayData.internalMedicine += dailyCount
          
          // Ultrasound total (all categories)
          const ultrasoundMappings = [
            ['sieu am bung sang', 'sieu am bung chieu'],
            ['sieu am vu sang', 'sieu am vu chieu'],
            ['sieu am giap sang', 'sieu am giap chieu'],
            ['sieu am tim sang', 'sieu am tim chieu'],
            ['sieu am dong mach canh sang', 'sieu am dong mach canh chieu']
          ]
          
          ultrasoundMappings.forEach(fields => {
            const morning = parseInt(item[fields[0]] || 0)
            const afternoon = parseInt(item[fields[1]] || 0)
            dayData.ultrasound += morning + afternoon
          })
        }
      })
    })

    // Calculate required rooms for each category and day
    const getRequiredRooms = (totalCases, category) => {
      if (totalCases === 0) return 0
      if (category === 'ultrasound') {
        if (totalCases <= 90) return 1
        if (totalCases <= 200) return 2
        return 3
             } else if (category === 'internalMedicine') {
         // Internal Medicine: assume 90 cases per room (fixed benchmark)
         return Math.ceil(totalCases / 90)
      } else {
        // ECG and Gynecology: assume 90 cases per room
        return Math.ceil(totalCases / 90)
      }
    }

    // Prepare sorted days data
    const sortedDays = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )

    // Prepare categories with room requirements for each day
    const categories = [
      {
        name: 'Siêu âm',
        key: 'ultrasound',
        rooms: sortedDays.map(day => getRequiredRooms(day.ultrasound, 'ultrasound'))
      },
      {
        name: 'Nội tổng quát',
        key: 'internalMedicine',
        rooms: sortedDays.map(day => getRequiredRooms(day.internalMedicine, 'internalMedicine'))
      },
      {
        name: 'Điện tim',
        key: 'ecg',
        rooms: sortedDays.map(day => getRequiredRooms(day.ecg, 'ecg'))
      },
      {
        name: 'Phụ khoa',
        key: 'gynecology',
        rooms: sortedDays.map(day => getRequiredRooms(day.gynecology, 'gynecology'))
      }
    ]

    return { days: sortedDays, categories }
  }, [data, getDaysToShow, benchmarkData])

  // Export to Excel function
  const exportToExcel = () => {
    const { days, categories } = roomMatrixData
    
    // Create header row with days
    const header = ['Hạng mục', ...days.map(day => day.dayOfMonth)]
    
    // Create data rows for each category
    const exportData = [header]
    categories.forEach(category => {
      const row = [category.name, ...category.rooms.map(rooms => rooms || '')]
      exportData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Số phòng cần thiết')
    XLSX.writeFile(wb, `so-phong-can-thiet-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Helper function to get cell styling based on room count
  const getRoomCellStyle = (roomCount) => {
    if (roomCount === 0 || !roomCount) return 'text-gray-300'
    if (roomCount === 1) return 'text-gray-800 font-normal'
    if (roomCount === 2) return 'text-blue-600 font-semibold'
    if (roomCount >= 3) return 'text-red-600 font-bold'
    return 'text-gray-800'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Phòng cần thiết</h2>
        
        {roomMatrixData.days.length > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        )}
      </div>

      {roomMatrixData.days.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Không có dữ liệu trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-white">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200 w-32">
                  Hạng mục
                </th>
                {roomMatrixData.days.map((day, index) => {
                  const today = new Date()
                  const isToday = new Date(day.date).toDateString() === today.toDateString()
                  
                  return (
                    <th key={index} className={`px-2 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200 min-w-[40px] ${isToday ? 'bg-gray-100' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500">{day.dayLabel}</span>
                        <span className="font-normal">{day.dayOfMonth}</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {roomMatrixData.categories.map((category, categoryIndex) => (
                <tr key={category.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-white">
                    {category.name}
                  </td>
                  {category.rooms.map((roomCount, dayIndex) => {
                    const day = roomMatrixData.days[dayIndex]
                    const today = new Date()
                    const isToday = new Date(day.date).toDateString() === today.toDateString()
                    
                    return (
                      <td key={dayIndex} className={`px-2 py-3 text-center text-sm ${isToday ? 'bg-gray-100' : ''}`}>
                        <span className={getRoomCellStyle(roomCount)}>
                          {roomCount || ''}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BenchmarkExceedTable
