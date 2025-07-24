import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import { vi } from 'date-fns/locale'

const MaxExamChart = ({ 
  data = [], 
  examCategories = [], 
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {
  // Process data to create chart data grouped by date
  const chartData = useMemo(() => {
    let chartStart, chartEnd
    
    // Use date filter if both dates are provided, otherwise use month filter
    if (dateFilter.startDate && dateFilter.endDate) {
      chartStart = parseISO(dateFilter.startDate)
      chartEnd = parseISO(dateFilter.endDate)
    } else {
      const { month, year } = monthFilter
      const selectedDate = new Date(year, month - 1, 1)
      chartStart = startOfMonth(selectedDate)
      chartEnd = endOfMonth(selectedDate)
    }
    
    const today = new Date()
    
    // Create all days in the range, excluding Sundays (getDay() === 0)
    const allDaysInRange = eachDayOfInterval({ start: chartStart, end: chartEnd })
      .filter(date => getDay(date) !== 0) // Exclude Sundays
    const dateMap = new Map()
    
    // Initialize all days with 0 values
    allDaysInRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      dateMap.set(dateKey, {
        date: dateKey,
        maxCount: 0,
        isToday: isSameDay(date, today)
      })
    })
    
    // Process actual data to calculate max exam count per day
    data.forEach(item => {
      const startDate = item['ngay bat dau kham']
      const endDate = item['ngay ket thuc kham']
      
      if (startDate && endDate) {
        try {
          const startDateObj = parseISO(startDate)
          const endDateObj = parseISO(endDate)
          
          // Calculate the exam days (excluding Sundays) in the examination period
          const examDays = eachDayOfInterval({ start: startDateObj, end: endDateObj })
            .filter(date => getDay(date) !== 0) // Exclude Sundays
          
          examDays.forEach(examDate => {
            // Only include data from the selected range
            if (examDate >= chartStart && examDate <= chartEnd) {
              const dateKey = format(examDate, 'yyyy-MM-dd')
              const existing = dateMap.get(dateKey)
              
              if (existing) {
                // Find max count for this item across all exam categories (same logic as getMaxForDay)
                examCategories.forEach(category => {
                  const morningCount = parseInt(item[category.morning]) || 0
                  const afternoonCount = parseInt(item[category.afternoon]) || 0
                  existing.maxCount = Math.max(existing.maxCount, morningCount, afternoonCount)
                })
              }
            }
          })
        } catch (error) {
          console.warn('Invalid date format:', startDate, endDate)
        }
      }
    })
    
    // Convert to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        displayDate: format(new Date(item.date), 'dd/MM', { locale: vi })
      }))
  }, [data, examCategories, monthFilter, dateFilter])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">
            {format(new Date(data.date), 'dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="text-blue-600">
            Max cận lâm sàng: <span className="font-semibold">{data.maxCount}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Không có dữ liệu để hiển thị biểu đồ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 mb-8">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.getDate().toString();
              }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="maxCount" 
              stroke="#000000" 
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isToday = payload?.isToday
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isToday ? 7 : 4}
                    fill={isToday ? '#ffffff' : '#000000'}
                    stroke={isToday ? '#000000' : '#000000'}
                    strokeWidth={isToday ? 2 : 2}
                  />
                )
              }}
              activeDot={{ r: 8, stroke: '#000000', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MaxExamChart
