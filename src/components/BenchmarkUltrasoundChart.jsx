import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { parseIntSafe } from '../utils/parseUtils'
import { getExamCountForDateNew } from '../utils/examUtils'

const BenchmarkUltrasoundChart = ({ 
  data = [], 
  benchmarkData = [],
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {

  // Define ultrasound categories with correct field names and new colors
  const ultrasoundCategories = [
    { key: 'sieuAm_bung', name: 'Siêu âm bụng', color: '#073b4c', fields: ['sieu am bung sang', 'sieu am bung chieu'], benchmark: 'Siêu âm - Bụng' },
    { key: 'sieuAm_giap', name: 'Siêu âm giáp', color: '#118ab2', fields: ['sieu am giap sang', 'sieu am giap chieu'], benchmark: 'Siêu âm - Giáp' },
    { key: 'sieuAm_vu', name: 'Siêu âm vú', color: '#06d6a0', fields: ['sieu am vu sang', 'sieu am vu chieu'], benchmark: 'Siêu âm - Vú' },
    { key: 'sieuAm_tim', name: 'Siêu âm tim', color: '#ffd166', fields: ['sieu am tim sang', 'sieu am tim chieu'], benchmark: 'Siêu âm - Tim' },
    { key: 'sieuAm_canh', name: 'SA động mạch cảnh', color: '#ef476f', fields: ['sieu am dong mach canh sang', 'sieu am dong mach canh chieu'], benchmark: 'Siêu âm - Động mạch cảnh' },
  ]

  // Get benchmark limits
  const getBenchmarkLimit = (benchmarkName) => {
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === benchmarkName)
    if (!benchmark) return 0
    return Math.round((benchmark.so_ca_ngay_bs_min + benchmark.so_ca_ngay_bs_max) / 2)
  }

  // Calculate chart data
  const chartData = useMemo(() => {
    let chartStart, chartEnd
    
    // Use date filter if both dates are provided, otherwise use month filter
    if (dateFilter.startDate && dateFilter.endDate) {
      chartStart = new Date(dateFilter.startDate + 'T00:00:00')
      chartEnd = new Date(dateFilter.endDate + 'T00:00:00')
    } else {
      const { month, year } = monthFilter
      const selectedDate = new Date(year, month - 1, 1)
      chartStart = startOfMonth(selectedDate)
      chartEnd = endOfMonth(selectedDate)
    }
    
    const today = new Date()
    
    // Create all days in the range, excluding Sundays
    const allDaysInRange = eachDayOfInterval({ start: chartStart, end: chartEnd })
      .filter(date => getDay(date) !== 0)
    
    const dateMap = new Map()
    
    // Initialize all days with 0 values
    allDaysInRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const dayData = {
        date: dateKey,
        day: date.getDate(),
        isToday: isSameDay(date, today)
      }
      
      // Initialize all ultrasound categories to 0
      ultrasoundCategories.forEach(category => {
        dayData[category.key] = 0
      })
      
      dateMap.set(dateKey, dayData)
    })

    // Process actual data (use same logic as ECG chart)
    data.forEach(item => {
      const startDateStr = item['ngay bat dau kham']
      const endDateStr = item['ngay ket thuc kham'] || startDateStr
      const specificDatesStr = item['cac ngay kham thuc te']
      
      if (!startDateStr) return

      // Get examination dates
      let examDates = []
      
      if (specificDatesStr && specificDatesStr.trim()) {
        // Parse specific dates (format: MM/dd, MM/dd, ...)
        const specificDates = specificDatesStr.split(',').map(dateStr => {
          const trimmed = dateStr.trim()
          if (trimmed.includes('/')) {
            const [month, day] = trimmed.split('/')
            const year = chartStart.getFullYear()
            return new Date(year, parseInt(month) - 1, parseInt(day))
          }
          return null
        }).filter(d => d !== null)
        
        // Filter out Sundays and dates outside range
        examDates = specificDates.filter(d => 
          getDay(d) !== 0 && 
          d >= chartStart && 
          d <= chartEnd
        )
      } else {
        // Use start and end dates
        const startDate = new Date(startDateStr + 'T00:00:00')
        const endDate = new Date(endDateStr + 'T00:00:00')
        
        examDates = eachDayOfInterval({ start: startDate, end: endDate })
          .filter(d => 
            getDay(d) !== 0 && 
            d >= chartStart && 
            d <= chartEnd
          )
      }

      // Add ultrasound counts to each examination date
      examDates.forEach(examDate => {
        const dateKey = format(examDate, 'yyyy-MM-dd')
        const dayData = dateMap.get(dateKey)
        
        if (dayData) {
          // Get actual people count for this date using getExamCountForDateNew
          const examResult = getExamCountForDateNew(item, examDate)

          ultrasoundCategories.forEach(category => {
            const morningValue = parseIntSafe(item[category.fields[0]], examResult.morning)
            const afternoonValue = parseIntSafe(item[category.fields[1]], examResult.afternoon)
            const totalValue = morningValue + afternoonValue
            
            dayData[category.key] += totalValue
          })
        }
      })
    })

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [data, monthFilter, dateFilter, benchmarkData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.day === parseInt(label))
      const displayDate = dataPoint ? new Date(dataPoint.date).toLocaleDateString('vi-VN') : ''
      
      // Calculate total ultrasound cases for room optimization
      const totalUltrasoundCases = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
      
      // Room optimization with flexible capacity (90-110 cases per room)
      const getOptimalRooms = (totalCases) => {
        if (totalCases === 0) return 1
        if (totalCases <= 90) return 1
        if (totalCases <= 200) return 2  // Flexible capacity for 2 rooms
        return 3  // Always max 3 rooms regardless of cases
      }
      
      const optimalRooms = getOptimalRooms(totalUltrasoundCases)
      const roomOptions = [
        { rooms: 1, range: "≤ 90 ca" },
        { rooms: 2, range: "91-200 ca" },
        { rooms: 3, range: "> 200 ca" }
      ]
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${displayDate}`}</p>
          {payload.map((entry, index) => {
            const category = ultrasoundCategories.find(cat => cat.key === entry.dataKey)
            const benchmarkLimit = getBenchmarkLimit(category?.benchmark)
            const isExceeding = entry.value > benchmarkLimit && benchmarkLimit > 0
            
                         return (
               <div key={index} className="mt-1">
                 <p style={{ color: category.color }} className="text-sm font-normal">
                   {`${category?.name}: ${entry.value} ca`}
                 </p>
                {benchmarkLimit > 0 && (
                  <p className="text-xs text-gray-600">
                    {`Định mức: ${benchmarkLimit} ca`}
                  </p>
                )}
                {isExceeding && (
                  <p className="text-xs text-red-600 font-medium">
                    {`Vượt +${entry.value - benchmarkLimit} ca`}
                  </p>
                )}
              </div>
            )
          })}
          
          {/* Room optimization section */}
          {totalUltrasoundCases > 0 && (
            <>
              <hr className="my-2 border-gray-200" />
              <div className="text-xs text-gray-700">
                <p className="font-medium">Kế hoạch phòng siêu âm:</p>
                <p>{`Tổng ca: ${totalUltrasoundCases} ca`}</p>
                <p className="text-blue-600 font-medium">
                  {`Cần: ${optimalRooms} phòng siêu âm`}
                </p>
                <div className="mt-1 space-y-0.5">
                  {roomOptions.map(room => (
                    <p key={room.rooms} className={
                      room.rooms === optimalRooms 
                        ? "text-green-600 font-medium" 
                        : "text-gray-500"
                    }>
                      {`${room.rooms} phòng (${room.range})`}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Siêu âm</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#000000', strokeWidth: 1 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Benchmark reference lines */}
            {ultrasoundCategories.map(category => {
              const benchmarkLimit = getBenchmarkLimit(category.benchmark)
              if (benchmarkLimit > 0) {
                return (
                  <ReferenceLine 
                    key={`benchmark-${category.key}`}
                    y={benchmarkLimit} 
                    stroke="#DC2626" 
                    strokeWidth={0.5}
                    strokeDasharray="3 3"
                    label={{
                      value: benchmarkLimit,
                      position: "right",
                      offset: 5,
                      style: { 
                        fill: "#ef4444", 
                        fontSize: "11px", 
                        fontWeight: "500",
                        textAnchor: "start"
                      }
                    }}
                  />
                )
              }
              return null
            })}

            {/* Data lines */}
            {ultrasoundCategories.map(category => (
              <Line
                key={category.key}
                type="monotone"
                dataKey={category.key}
                stroke={category.color}
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props
                  const isToday = payload?.isToday
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isToday ? 6 : 3}
                      fill={isToday ? "#FFFFFF" : category.color}
                      stroke={category.color}
                      strokeWidth={2}
                    />
                  )
                }}
                activeDot={(props) => {
                  const { cx, cy } = props
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="transparent"
                      stroke={category.color}
                      strokeWidth={2}
                    />
                  )
                }}
                name={category.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkUltrasoundChart
