import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

const CustomLineChart = ({ data = [] }) => {
  // Process data to create chart data grouped by date
  const chartData = useMemo(() => {
    const dateMap = new Map()
    
    data.forEach(item => {
      const startDate = item['ngay bat dau kham']
      const endDate = item['ngay ket thuc kham']
      const peopleCount = parseInt(item['so nguoi kham']) || 0
      
      if (startDate) {
        try {
          const date = format(parseISO(startDate), 'yyyy-MM-dd')
          const existing = dateMap.get(date) || { date, people: 0, companies: 0 }
          dateMap.set(date, {
            ...existing,
            people: existing.people + peopleCount,
            companies: existing.companies + 1
          })
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
        displayDate: format(new Date(item.date), 'dd/MM', { locale: vi })
      }))
  }, [data])

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
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CustomLineChart