import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { examCategories } from '../constants/examCategories'

const MaxExamChart = ({ 
  getMaxForDay,
  getDaysToShow,
  getExamCount,
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
      
      // Tính toán chi tiết cho từng hạng mục
      const examDetails = {}
      
      // Nhóm siêu âm
      const ultraSoundCategories = examCategories.filter(cat => cat.name.includes('Siêu âm') || cat.name.includes('SA'))
      let maxUltraSound = 0
      ultraSoundCategories.forEach((category, index) => {
        const categoryIndex = examCategories.findIndex(c => c.name === category.name)
        const morningCount = getExamCount(dayInfo.date, categoryIndex, 'morning')
        const afternoonCount = getExamCount(dayInfo.date, categoryIndex, 'afternoon')
        maxUltraSound = Math.max(maxUltraSound, morningCount, afternoonCount)
      })
      if (maxUltraSound > 0) examDetails['Siêu âm'] = maxUltraSound
      
      // X-quang
      const xrayIndex = examCategories.findIndex(cat => cat.name === 'X-quang')
      if (xrayIndex !== -1) {
        const xrayMorning = getExamCount(dayInfo.date, xrayIndex, 'morning')
        const xrayAfternoon = getExamCount(dayInfo.date, xrayIndex, 'afternoon')
        const maxXray = Math.max(xrayMorning, xrayAfternoon)
        if (maxXray > 0) examDetails['X-quang'] = maxXray
      }
      
      // Điện tâm đồ
      const ecgIndex = examCategories.findIndex(cat => cat.name === 'Điện tâm đồ')
      if (ecgIndex !== -1) {
        const ecgMorning = getExamCount(dayInfo.date, ecgIndex, 'morning')
        const ecgAfternoon = getExamCount(dayInfo.date, ecgIndex, 'afternoon')
        const maxEcg = Math.max(ecgMorning, ecgAfternoon)
        if (maxEcg > 0) examDetails['Điện tâm đồ'] = maxEcg
      }
      
      // Khám phụ khoa
      const gyneIndex = examCategories.findIndex(cat => cat.name === 'Khám phụ khoa')
      if (gyneIndex !== -1) {
        const gyneMorning = getExamCount(dayInfo.date, gyneIndex, 'morning')
        const gyneAfternoon = getExamCount(dayInfo.date, gyneIndex, 'afternoon')
        const maxGyne = Math.max(gyneMorning, gyneAfternoon)
        if (maxGyne > 0) examDetails['Khám phụ khoa'] = maxGyne
      }
      
      // Đo loãng xương
      const boneIndex = examCategories.findIndex(cat => cat.name === 'Đo loãng xương')
      if (boneIndex !== -1) {
        const boneMorning = getExamCount(dayInfo.date, boneIndex, 'morning')
        const boneAfternoon = getExamCount(dayInfo.date, boneIndex, 'afternoon')
        const maxBone = Math.max(boneMorning, boneAfternoon)
        if (maxBone > 0) examDetails['Đo loãng xương'] = maxBone
      }
      
      return {
        date: format(dayInfo.date, 'yyyy-MM-dd'),
        displayDate: `${dayInfo.day}`,
        maxCount: maxCount,
        isToday: isToday,
        examDetails: examDetails
      }
    })
    
    return processedData.filter(item => item.maxCount > 0) // Only show days with data
  }, [getMaxForDay, getDaysToShow, getExamCount])

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
          <p className="font-medium text-gray-900 mb-2">
            {format(new Date(data.date), 'dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="text-blue-600 mb-2">
            Max cận lâm sàng: <span className="font-semibold">{data.maxCount}</span>
          </p>
          {Object.entries(data.examDetails).map(([key, value]) => (
            <p key={key} className="text-gray-600 text-sm">
              {key}: <span className="font-semibold">{value}</span>
            </p>
          ))}
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
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              axisLine={true}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Đường trung bình màu đỏ, nét đứt */}
            <ReferenceLine 
              y={average} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              strokeWidth={1}
              label={{ 
                value: average, 
                position: "insideTopRight", 
                offset: 10,
                style: { 
                  textAnchor: 'end', 
                  fontSize: '12px', 
                  fill: '#ef4444',
                  fontWeight: 'bold'
                }
              }}
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
