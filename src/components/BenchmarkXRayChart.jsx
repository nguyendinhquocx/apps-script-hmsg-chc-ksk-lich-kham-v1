import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { parseIntSafe } from '../utils/parseUtils'
import { getExamCountForDateNew } from '../utils/examUtils'

const BenchmarkXRayChart = ({ 
  data = [], 
  benchmarkData = [],
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {

  // Get benchmark limit for X-Ray
  const getBenchmarkLimit = () => {
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === 'X-Quang')
    if (!benchmark) return 100
    return Math.round((benchmark.so_ca_ngay_bs_min + benchmark.so_ca_ngay_bs_max) / 2)
  }
  
  const getSecondBenchmarkLimit = () => {
    return getBenchmarkLimit() * 2
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
      dateMap.set(dateKey, {
        date: dateKey,
        day: date.getDate(),
        xray: 0,
        isToday: isSameDay(date, today)
      })
    })

    // Process actual data
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

      // Add X-Ray counts to each examination date
      examDates.forEach(examDate => {
        const dateKey = format(examDate, 'yyyy-MM-dd')
        const dayData = dateMap.get(dateKey)
        
        if (dayData) {
          // Get actual people count for this date using getExamCountForDateNew
          const examResult = getExamCountForDateNew(item, examDate)

          const morningCount = parseIntSafe(item['x quang sang'], examResult.morning)
          const afternoonCount = parseIntSafe(item['x quang chieu'], examResult.afternoon)
          dayData.xray += morningCount + afternoonCount
        }
      })
    })

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [data, monthFilter, dateFilter])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.day === parseInt(label))
      const displayDate = dataPoint ? new Date(dataPoint.date).toLocaleDateString('vi-VN') : ''
      const value = payload[0]?.value || 0
      const benchmarkLimit = getBenchmarkLimit()
      const secondBenchmarkLimit = getSecondBenchmarkLimit()
      
      // Determine room count and color
      let roomText = ''
      let roomColor = '#000000'
      if (value < benchmarkLimit) {
        roomText = 'Cần 1 phòng X-Quang'
        roomColor = '#000000'
      } else if (value < secondBenchmarkLimit) {
        roomText = 'Cần 2 phòng X-Quang'
        roomColor = '#2962ff'
      } else {
        roomText = 'Cần 3 phòng X-Quang'
        roomColor = '#f23645'
      }
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${displayDate}`}</p>
          <p className="text-sm font-normal" style={{ color: '#000000' }}>
            {`X-Quang: ${value} ca`}
          </p>
          <p className="text-xs font-normal" style={{ color: roomColor }}>{roomText}</p>
        </div>
      )
    }
    return null
  }

  const benchmarkLimit = getBenchmarkLimit()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">X-Quang</h3>
      
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
            {/* Định mức 100 - xanh nước biển, nét đứt */}
            {benchmarkLimit > 0 && (
              <ReferenceLine 
                y={benchmarkLimit} 
                stroke="#2962ff" 
                strokeWidth={0.5}
                strokeDasharray="3 3"
                label={{
                  value: benchmarkLimit,
                  position: "right",
                  offset: 5,
                  style: { 
                    fill: "#2962ff", 
                    fontSize: "11px", 
                    fontWeight: "500",
                    textAnchor: "start"
                  }
                }}
              />
            )}
            
            {/* Định mức 200 - đỏ, nét đứt */}
            {getSecondBenchmarkLimit() > 0 && (
              <ReferenceLine 
                y={getSecondBenchmarkLimit()} 
                stroke="#f23645" 
                strokeWidth={0.5}
                strokeDasharray="3 3"
                label={{
                  value: getSecondBenchmarkLimit(),
                  position: "right",
                  offset: 5,
                  style: { 
                    fill: "#f23645", 
                    fontSize: "11px", 
                    fontWeight: "500",
                    textAnchor: "start"
                  }
                }}
              />
            )}

            {/* X-Ray data line */}
            <Line
              type="monotone"
              dataKey="xray"
              stroke="#000000"
              strokeWidth={1.5}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isToday = payload?.isToday
                
                // Find max value and determine which day should be highlighted
                const maxValue = Math.max(...chartData.map(d => d.xray))
                const maxDays = chartData.filter(d => d.xray === maxValue && maxValue > 0)
                
                let shouldHighlight = false
                if (maxDays.length > 0) {
                  if (maxDays.length === 1) {
                    // Only one max day, highlight it
                    shouldHighlight = payload?.xray === maxValue
                  } else {
                    // Multiple max days, choose the one closest to today (future preferred)
                    const today = new Date()
                    const currentDateStr = format(today, 'yyyy-MM-dd')
                    
                    // Separate future and past max days
                    const futureDays = maxDays.filter(d => d.date >= currentDateStr)
                    const pastDays = maxDays.filter(d => d.date < currentDateStr)
                    
                    let targetDay = null
                    if (futureDays.length > 0) {
                      // Choose closest future day
                      targetDay = futureDays.sort((a, b) => a.date.localeCompare(b.date))[0]
                    } else if (pastDays.length > 0) {
                      // Choose closest past day
                      targetDay = pastDays.sort((a, b) => b.date.localeCompare(a.date))[0]
                    }
                    
                    shouldHighlight = targetDay && payload?.date === targetDay.date
                  }
                }
                
                // Priority: Max value > Today > Normal
                if (shouldHighlight) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  )
                } else if (isToday) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#FFFFFF"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  )
                } else {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#000000"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  )
                }
              }}
              activeDot={(props) => {
                const { cx, cy, payload } = props
                const benchmarkLimit = getBenchmarkLimit()
                const isExceeding = payload?.xray > benchmarkLimit && benchmarkLimit > 0
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="transparent"
                    stroke={isExceeding ? "#ef4444" : "#000000"}
                    strokeWidth={2}
                  />
                )
              }}
              name="X-Quang"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkXRayChart