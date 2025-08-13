import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { parseIntSafe } from '../utils/parseUtils'
import { getExamCountForDateNew } from '../utils/examUtils'

const BenchmarkGynecologyChart = ({ 
  data = [], 
  benchmarkData = [],
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {

  // Get benchmark limit for Gynecology
  const getBenchmarkLimit = () => {
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === 'Sản phụ khoa')
    if (!benchmark) return 40
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
        gynecology: 0,
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

      // Add Gynecology counts to each examination date
      examDates.forEach(examDate => {
        const dateKey = format(examDate, 'yyyy-MM-dd')
        const dayData = dateMap.get(dateKey)
        
        if (dayData) {
          // Get actual people count for this date using getExamCountForDateNew
          const examResult = getExamCountForDateNew(item, examDate)

          const morningCount = parseIntSafe(item['kham phu khoa sang'], examResult.morning)
          const afternoonCount = parseIntSafe(item['kham phu khoa chieu'], examResult.afternoon)
          dayData.gynecology += morningCount + afternoonCount
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
        roomText = 'Cần 1 phòng phụ khoa'
        roomColor = '#000000'
      } else if (value < secondBenchmarkLimit) {
        roomText = 'Cần 2 phòng phụ khoa'
        roomColor = '#2962ff'
      } else {
        roomText = 'Cần 3 phòng phụ khoa'
        roomColor = '#f23645'
      }
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${displayDate}`}</p>
          <p className="text-sm font-normal" style={{ color: '#000000' }}>
            {`Khám phụ khoa: ${value} ca`}
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
      <h3 className="text-lg font-semibold text-gray-900">Khám phụ khoa</h3>
      
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
            {/* Định mức 40 - xanh nước biển, nét đứt */}
            {benchmarkLimit > 0 && (
              <ReferenceLine 
                y={benchmarkLimit} 
                stroke="#2962ff" 
                strokeDasharray="5 5"
                label={{
                  value: benchmarkLimit,
                  position: "right",
                  offset: 10,
                  style: { 
                    fill: "#2962ff", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    textAnchor: "start"
                  }
                }}
              />
            )}
            
            {/* Định mức 80 - đỏ, nét đứt */}
            {getSecondBenchmarkLimit() > 0 && (
              <ReferenceLine 
                y={getSecondBenchmarkLimit()} 
                stroke="#f23645" 
                strokeDasharray="5 5"
                label={{
                  value: getSecondBenchmarkLimit(),
                  position: "right",
                  offset: 10,
                  style: { 
                    fill: "#f23645", 
                    fontSize: "12px", 
                    fontWeight: "500",
                    textAnchor: "start"
                  }
                }}
              />
            )}

            {/* Gynecology data line */}
            <Line
              type="monotone"
              dataKey="gynecology"
              stroke="#000000"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isToday = payload?.isToday
                
                // Find max value in the dataset
                const maxValue = Math.max(...chartData.map(d => d.gynecology))
                const isMaxValue = payload?.gynecology === maxValue && maxValue > 0
                
                // Priority: Max value > Today > Normal
                if (isMaxValue) {
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
                const isExceeding = payload?.gynecology > benchmarkLimit && benchmarkLimit > 0
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
              name="Khám phụ khoa"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkGynecologyChart
