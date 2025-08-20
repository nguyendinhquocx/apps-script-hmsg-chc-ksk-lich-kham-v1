import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { getExamCountForDateNew } from '../utils/examUtils'

const BenchmarkInternalMedicineChart = ({ 
  data = [], 
  benchmarkData = [],
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {

  // Get benchmark limit for Internal Medicine
  const getBenchmarkLimit = () => 90
  const getSecondBenchmarkLimit = () => 180

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
        internalMedicine: 0,
        isToday: isSameDay(date, today)
      })
    })

    // Process actual data using new unified logic
    data.forEach(item => {
      // Use the new unified logic for all date calculations
      allDaysInRange.forEach(date => {
        const examResult = getExamCountForDateNew(item, date)
        if (examResult.total > 0) {
          const dateKey = format(date, 'yyyy-MM-dd')
          const dayData = dateMap.get(dateKey)
          
          if (dayData) {
            dayData.internalMedicine += examResult.total
          }
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
      // Determine doctor count and color
      let doctorText = ''
      let doctorColor = '#000000'
      if (value < 90) {
        doctorText = 'Cần 1 bác sĩ nội'
        doctorColor = '#000000'
      } else if (value < 180) {
        doctorText = 'Cần 2 bác sĩ nội'
        doctorColor = '#2962ff'
      } else {
        doctorText = 'Cần 3 bác sĩ nội'
        doctorColor = '#f23645'
      }
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${displayDate}`}</p>
          <p className="text-sm font-normal" style={{ color: '#000000' }}>{`Nội tổng quát: ${value} người`}</p>
          <p className="text-xs font-normal" style={{ color: doctorColor }}>{doctorText}</p>
        </div>
      )
    }
    return null
  }

  const benchmarkLimit = getBenchmarkLimit()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Nội tổng quát</h3>
      
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
            {/* Định mức 90 - xanh nước biển, nét đứt */}
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
            {/* Định mức 180 - đỏ, nét đứt */}
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

            {/* Internal Medicine data line */}
            <Line
              type="monotone"
              dataKey="internalMedicine"
              stroke="#000000"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isToday = payload?.isToday
                
                // Find max value and determine which day should be highlighted
                const maxValue = Math.max(...chartData.map(d => d.internalMedicine))
                const maxDays = chartData.filter(d => d.internalMedicine === maxValue && maxValue > 0)
                
                let shouldHighlight = false
                if (maxDays.length > 0) {
                  if (maxDays.length === 1) {
                    // Only one max day, highlight it
                    shouldHighlight = payload?.internalMedicine === maxValue
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
                const isExceeding = payload?.internalMedicine > benchmarkLimit && benchmarkLimit > 0
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
              name="Nội tổng quát"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkInternalMedicineChart
