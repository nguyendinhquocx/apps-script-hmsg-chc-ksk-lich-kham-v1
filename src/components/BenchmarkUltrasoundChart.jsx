import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'

const BenchmarkUltrasoundChart = ({ 
  data = [], 
  benchmarkData = [],
  monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, 
  dateFilter = { startDate: '', endDate: '' } 
}) => {

  // Define ultrasound categories with correct field names (remove combo)
  const ultrasoundCategories = [
    { key: 'sieuAm_bung', name: 'Siêu âm bụng', color: '#3B82F6', fields: ['sieu am bung sang', 'sieu am bung chieu'], benchmark: 'Siêu âm - Bụng' },
    { key: 'sieuAm_vu', name: 'Siêu âm vú', color: '#EF4444', fields: ['sieu am vu sang', 'sieu am vu chieu'], benchmark: 'Siêu âm - Vú' },
    { key: 'sieuAm_giap', name: 'Siêu âm giáp', color: '#10B981', fields: ['sieu am giap sang', 'sieu am giap chieu'], benchmark: 'Siêu âm - Giáp' },
    { key: 'sieuAm_tim', name: 'Siêu âm tim', color: '#F59E0B', fields: ['sieu am tim sang', 'sieu am tim chieu'], benchmark: 'Siêu âm - Tim' },
    { key: 'sieuAm_canh', name: 'SA động mạch cảnh', color: '#8B5CF6', fields: ['sieu am dong mach canh sang', 'sieu am dong mach canh chieu'], benchmark: 'Siêu âm - Động mạch cảnh' },
  ]

  // Get benchmark limits
  const getBenchmarkLimit = (benchmarkName) => {
    const benchmark = benchmarkData.find(b => b.chuyen_khoa === benchmarkName)
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
      const dayData = {
        date: dateKey,
        day: date.getDate(),
        isToday: isSameDay(date, today)
      }
      
      // Initialize all ultrasound categories to 0
      ultrasoundCategories.forEach(category => {
        dayData[category.key] = 0
      })
      
      dateMap.set(dateKey, dayData)
    })

    // Process actual data from database records
    data.forEach(item => {
      // Use the date field directly from the data
      const itemDate = item.date || item.start_date
      if (!itemDate) return

      // Parse date
      let examDate
      try {
        examDate = new Date(itemDate)
        if (isNaN(examDate.getTime())) return
      } catch {
        return
      }

      // Check if date is in range and not Sunday
      if (examDate < chartStart || examDate > chartEnd || getDay(examDate) === 0) {
        return
      }

      const dateKey = format(examDate, 'yyyy-MM-dd')
      const existingData = dateMap.get(dateKey)
      
      if (existingData) {
        // Add values for each ultrasound category using correct field names
        ultrasoundCategories.forEach(category => {
          const morningValue = parseInt(item[category.fields[0]] || 0)
          const afternoonValue = parseInt(item[category.fields[1]] || 0)
          const totalValue = morningValue + afternoonValue
          
          existingData[category.key] += totalValue
        })
      }
    })

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [data, monthFilter, dateFilter, benchmarkData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label)
      const displayDate = dataPoint ? new Date(dataPoint.date).toLocaleDateString('vi-VN') : ''
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${displayDate}`}</p>
          {payload.map((entry, index) => {
            const category = ultrasoundCategories.find(cat => cat.key === entry.dataKey)
            const benchmarkLimit = getBenchmarkLimit(category?.benchmark)
            const isExceeding = entry.value > benchmarkLimit && benchmarkLimit > 0
            
            return (
              <div key={index} className="mt-1">
                <p style={{ color: entry.color }} className="text-sm">
                  {`${category?.name}: ${entry.value} ca`}
                </p>
                {benchmarkLimit > 0 && (
                  <p className="text-xs text-gray-600">
                    {`Định mức: ${benchmarkLimit} ca`}
                  </p>
                )}
                {isExceeding && (
                  <p className="text-xs text-red-600 font-medium">
                    {`Vượt +${entry.value - benchmarkLimit} ca`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Siêu âm</h3>
      
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
            {ultrasoundCategories.map(category => {
              const benchmarkLimit = getBenchmarkLimit(category.benchmark)
              if (benchmarkLimit > 0) {
                return (
                  <ReferenceLine 
                    key={`benchmark-${category.key}`}
                    y={benchmarkLimit} 
                    stroke="#DC2626" 
                    strokeDasharray="5 5"
                  />
                )
              }
              return null
            })}

            {/* Data lines */}
            {ultrasoundCategories.map(category => (
              <Line
                key={category.key}
                type="monotone"
                dataKey={category.key}
                stroke={category.color}
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props
                  const isToday = payload?.isToday
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isToday ? 6 : 3}
                      fill={category.color}
                      stroke={category.color}
                      strokeWidth={2}
                    />
                  )
                }}
                activeDot={{ r: 5, fill: category.color }}
                name={category.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkUltrasoundChart
