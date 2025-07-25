import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const MaxExamChart = ({ 
  getMaxForDay,
  getDaysToShow,
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {
  // Process data to create chart data using the same logic as the table
  const chartData = useMemo(() => {
    const days = getDaysToShow()
    const today = new Date()
    
    const processedData = days.map(dayInfo => {
      const maxCount = getMaxForDay(dayInfo.date)
      const isToday = today.toDateString() === dayInfo.date.toDateString()
      
      return {
        date: dayInfo.date.toISOString().split('T')[0],
        displayDate: `${dayInfo.day}`,
        maxCount: maxCount,
        isToday: isToday
      }
    })
    
    return processedData.filter(item => item.maxCount > 0) // Only show days with data
  }, [getMaxForDay, getDaysToShow])

  // Calculate average
  const average = useMemo(() => {
    if (chartData.length === 0) return 0
    const total = chartData.reduce((sum, item) => sum + item.maxCount, 0)
    return Math.round(total / chartData.length)
  }, [chartData])

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
          <p className="text-red-500 text-sm">
            Trung bình: <span className="font-semibold">{average}</span>
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Biểu đồ Max Cận Lâm Sàng</h2>
        <div className="text-sm text-red-600 font-medium">
          Trung bình: {average}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <Tooltip content={<CustomTooltip />} />
            {/* Đường trung bình màu đỏ, nét đứt */}
            <ReferenceLine 
              y={average} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              strokeWidth={1}
            />
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
