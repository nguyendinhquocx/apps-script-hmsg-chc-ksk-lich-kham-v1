import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getExamCountForDateNew } from '../utils/examUtils'

const CustomLineChart = ({ data = [], monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, dateFilter = { startDate: '', endDate: '' } }) => {
  // Process data to create chart data grouped by date
  const chartData = useMemo(() => {
    let chartStart, chartEnd
    
    // Use date filter if both dates are provided, otherwise use month filter
    if (dateFilter.startDate && dateFilter.endDate) {
      // Parse dates carefully to avoid timezone issues
      chartStart = new Date(dateFilter.startDate + 'T00:00:00')
      chartEnd = new Date(dateFilter.endDate + 'T00:00:00')
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
        bloodTestCompanies: 0,
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
          const existing = dateMap.get(dateKey)
          if (existing) {
            // Only count companies if they have people being examined that day
            const companyIncrement = examResult.total > 0 ? 1 : 0
            dateMap.set(dateKey, {
              ...existing,
              people: existing.people + examResult.total,
              companies: existing.companies + companyIncrement
            })
          }
        }
      })
      
      // Check for blood test date
      const bloodTestDateStr = item['ngay lay mau']
      if (bloodTestDateStr) {
        try {
          const bloodTestDate = new Date(bloodTestDateStr + 'T00:00:00')
          // Only include data from the selected range and exclude Sundays
          if (bloodTestDate >= chartStart && bloodTestDate <= chartEnd && getDay(bloodTestDate) !== 0) {
            const dateKey = format(bloodTestDate, 'yyyy-MM-dd')
            const existing = dateMap.get(dateKey)
            if (existing) {
              dateMap.set(dateKey, {
                ...existing,
                bloodTestCompanies: existing.bloodTestCompanies + 1
              })
            }
          }
        } catch (error) {
          console.warn('Invalid blood test date format:', bloodTestDateStr)
        }
      }
    })
    
    // Convert to array and sort by date
    const chartArray = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        people: Math.round(item.people * 100) / 100, // Round to 2 decimal places
        companies: Math.round(item.companies * 100) / 100, // Round to 2 decimal places
        bloodTestCompanies: Math.round(item.bloodTestCompanies * 100) / 100, // Round to 2 decimal places
        displayDate: format(new Date(item.date), 'dd/MM', { locale: vi })
      }))
    
    // Calculate average of people count (excluding days with 0 people)
    const daysWithPeople = chartArray.filter(item => item.people > 0)
    const averagePeople = daysWithPeople.length > 0 
      ? Math.round((daysWithPeople.reduce((sum, item) => sum + item.people, 0) / daysWithPeople.length) * 100) / 100
      : 0
    
    // Add average to each data point
    return chartArray.map(item => ({
      ...item,
      averagePeople
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
            Số người khám: <span className="font-semibold">{Math.round(data.people)}</span>
          </p>
          <p className="text-gray-600">
            Số công ty: <span className="font-semibold">{Math.round(data.companies)}</span>
          </p>
          {data.bloodTestCompanies > 0 && (
            <p className="text-red-600">
              Lấy mẫu: <span className="font-semibold">{Math.round(data.bloodTestCompanies)}</span>
            </p>
          )}
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
      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
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
              dataKey="people" 
              stroke="#000000" 
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                const isToday = payload?.isToday
                
                // Find max value in the dataset
                const maxValue = Math.max(...chartData.map(d => d.people))
                const isMaxValue = payload?.people === maxValue && maxValue > 0
                
                // Priority: Max value > Today > Normal
                if (isMaxValue) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth={3}
                    />
                  )
                } else if (isToday) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  )
                } else {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#000000"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  )
                }
              }}
              activeDot={{ r: 8, stroke: '#000000', strokeWidth: 2, fill: '#ffffff' }}
            />
            <Line 
              type="monotone" 
              dataKey="averagePeople" 
              stroke="#f23645" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={(props) => {
                const { cx, cy, payload, index } = props
                // Show label only on the last point of the chart (rightmost)
                const isLastPoint = index === chartData.length - 1
                if (isLastPoint) {
                  return (
                    <g>
                      <text
                        x={cx}
                        y={cy + 20}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#f23645"
                      >
                        {Math.round(payload.averagePeople)}
                      </text>
                    </g>
                  )
                }
                return null
              }}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CustomLineChart