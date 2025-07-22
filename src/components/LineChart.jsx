import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'

const CustomLineChart = ({ data = [], monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, dateFilter = { startDate: '', endDate: '' } }) => {
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
        people: 0,
        companies: 0,
        isToday: isSameDay(date, today)
      })
    })
    
    // Process actual data
    data.forEach(item => {
      const startDate = item['ngay bat dau kham']
      const endDate = item['ngay ket thuc kham']
      const peopleCount = parseInt(item['so nguoi kham']) || 0
      
      if (startDate && endDate) {
        try {
          const startDateObj = parseISO(startDate)
          const endDateObj = parseISO(endDate)
          
          // Calculate the number of working days (excluding Sundays) in the examination period
          const examDays = eachDayOfInterval({ start: startDateObj, end: endDateObj })
            .filter(date => getDay(date) !== 0) // Exclude Sundays
          
          if (examDays.length > 0) {
            // Distribute people evenly across working days
            const peoplePerDay = peopleCount / examDays.length
            
            examDays.forEach(examDate => {
              // Only include data from the selected range
              if (examDate >= chartStart && examDate <= chartEnd) {
                const dateKey = format(examDate, 'yyyy-MM-dd')
                const existing = dateMap.get(dateKey)
                if (existing) {
                  dateMap.set(dateKey, {
                    ...existing,
                    people: existing.people + peoplePerDay,
                    companies: existing.companies + (1 / examDays.length) // Distribute company count as well
                  })
                }
              }
            })
          }
        } catch (error) {
          console.warn('Invalid date format:', startDate, endDate)
        }
      } else if (startDate) {
        // Fallback to old logic if endDate is missing
        try {
          const itemDate = parseISO(startDate)
          // Only include data from the selected range and exclude Sundays
          if (itemDate >= chartStart && itemDate <= chartEnd && getDay(itemDate) !== 0) {
            const dateKey = format(itemDate, 'yyyy-MM-dd')
            const existing = dateMap.get(dateKey)
            if (existing) {
              dateMap.set(dateKey, {
                ...existing,
                people: existing.people + peopleCount,
                companies: existing.companies + 1
              })
            }
          }
        } catch (error) {
          console.warn('Invalid date format:', startDate)
        }
      }
    })
    
    // Convert to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        people: Math.round(item.people * 100) / 100, // Round to 2 decimal places
        companies: Math.round(item.companies * 100) / 100, // Round to 2 decimal places
        displayDate: format(new Date(item.date), 'dd/MM', { locale: vi })
      }))
  }, [data, monthFilter, dateFilter])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">
            {format(new Date(data.date), 'dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="text-blue-600">
            Số người khám: <span className="font-semibold">{data.people}</span>
          </p>
          <p className="text-gray-600">
            Số công ty: <span className="font-semibold">{data.companies}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Biểu đồ số người khám theo ngày</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Không có dữ liệu để hiển thị biểu đồ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Biểu đồ số người khám theo ngày</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayDate" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
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
              dataKey="people" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isToday = payload?.isToday
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isToday ? 6 : 4}
                    fill={isToday ? '#10b981' : '#3b82f6'}
                    stroke={isToday ? '#10b981' : '#3b82f6'}
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CustomLineChart