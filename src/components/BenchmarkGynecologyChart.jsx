import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'

const BenchmarkGynecologyChart = ({ 
  data = [], 
  benchmarkData = [],
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {

  // Get benchmark limit for Gynecology
  const getBenchmarkLimit = () => {
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === 'Sản phụ khoa')
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
          const morningCount = parseInt(item['kham phu khoa sang'] || 0)
          const afternoonCount = parseInt(item['kham phu khoa chieu'] || 0)
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
      const benchmarkLimit = getBenchmarkLimit()
      const value = payload[0]?.value || 0
      const isExceeding = value > benchmarkLimit && benchmarkLimit > 0
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${displayDate}`}</p>
          <p className="text-sm text-pink-600">
            {`Khám phụ khoa: ${value} ca`}
          </p>
          {benchmarkLimit > 0 && (
            <p className="text-xs text-gray-600">
              {`Định mức: ${benchmarkLimit} ca`}
            </p>
          )}
          {isExceeding && (
            <p className="text-xs text-red-600 font-medium">
              {`Vượt +${value - benchmarkLimit} ca`}
            </p>
          )}
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
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Benchmark reference line */}
            {benchmarkLimit > 0 && (
              <ReferenceLine 
                y={benchmarkLimit} 
                stroke="#DC2626" 
                strokeDasharray="5 5"
              />
            )}

            {/* Gynecology data line */}
            <Line
              type="monotone"
              dataKey="gynecology"
              stroke="#DB2777"
              strokeWidth={2}
              dot={{ fill: '#DB2777', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              name="Khám phụ khoa"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkGynecologyChart
