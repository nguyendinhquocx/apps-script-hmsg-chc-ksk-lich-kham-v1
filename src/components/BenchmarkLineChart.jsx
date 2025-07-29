import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const BenchmarkLineChart = ({ 
  data = [], 
  getDaysToShow,
  benchmarkData = [],
  chartType = 'ultrasound', // 'ultrasound', 'ecg', 'gynecology'
  title = 'Biểu đồ vượt định mức'
}) => {

  // Define chart configurations for different types
  const chartConfigs = {
    ultrasound: {
      title: 'Biểu đồ vượt định mức - Các hạng mục siêu âm',
      categories: [
        { key: 'sieuAm_bung', name: 'Siêu âm bụng', color: '#3B82F6', fields: ['sieuam_bung_sang', 'sieuam_bung_chieu'], benchmark: 'Siêu âm - Bụng' },
        { key: 'sieuAm_vu', name: 'Siêu âm vú', color: '#EF4444', fields: ['sieuam_vu_sang', 'sieuam_vu_chieu'], benchmark: 'Siêu âm - Vú' },
        { key: 'sieuAm_giap', name: 'Siêu âm giáp', color: '#10B981', fields: ['sieuam_giap_sang', 'sieuam_giap_chieu'], benchmark: 'Siêu âm - Giáp' },
        { key: 'sieuAm_tim', name: 'Siêu âm tim', color: '#F59E0B', fields: ['sieuam_tim_sang', 'sieuam_tim_chieu'], benchmark: 'Siêu âm - Tim' },
        { key: 'sieuAm_canh', name: 'SA động mạch cảnh', color: '#8B5CF6', fields: ['sieuam_dong_mach_canh_sang', 'sieuam_dong_mach_canh_chieu'], benchmark: 'Siêu âm - Động mạch cảnh' },
        { key: 'sieuAm_combo', name: 'Siêu âm vú + giáp', color: '#06B6D4', fields: ['sieuam_combo_sang', 'sieuam_combo_chieu'], benchmark: 'Siêu âm - Combo (Vú, Giáp...)' },
      ]
    },
    ecg: {
      title: 'Biểu đồ vượt định mức - Điện tâm đồ',
      categories: [
        { key: 'dien_tam_do', name: 'Điện tâm đồ', color: '#DC2626', fields: ['dien_tam_do_sang', 'dien_tam_do_chieu'], benchmark: 'Điện tim (ECG)' }
      ]
    },
    gynecology: {
      title: 'Biểu đồ vượt định mức - Khám phụ khoa', 
      categories: [
        { key: 'phu_khoa', name: 'Khám phụ khoa', color: '#DB2777', fields: ['kham_phu_khoa_sang', 'kham_phu_khoa_chieu'], benchmark: 'Sản phụ khoa' }
      ]
    }
  }

  const config = chartConfigs[chartType]

  // Get benchmark limits
  const benchmarkLimits = useMemo(() => {
    const limits = {}
    config.categories.forEach(category => {
      const benchmark = benchmarkData.find(b => b.chuyen_khoa === category.benchmark)
      if (benchmark) {
        limits[category.key] = Math.round((benchmark.so_ca_ngay_bs_min + benchmark.so_ca_ngay_bs_max) / 2)
      } else {
        limits[category.key] = 0
      }
    })
    return limits
  }, [benchmarkData, config.categories])

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!getDaysToShow) return []

    const days = getDaysToShow()
    
    return days.map(dayInfo => {
      const dayData = {
        date: new Date(dayInfo.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        fullDate: dayInfo.date
      }

      // Calculate data for each category
      config.categories.forEach(category => {
        const dayRecords = data.filter(record => {
          const recordDate = new Date(record.start_date).toDateString()
          const dayDate = new Date(dayInfo.date).toDateString()
          return recordDate === dayDate
        })

        let totalCases = 0

        dayRecords.forEach(record => {
          // Sum both morning and afternoon sessions for each category
          if (category.fields && category.fields.length >= 2) {
            const morningCases = parseInt(record[category.fields[0]] || 0)
            const afternoonCases = parseInt(record[category.fields[1]] || 0)
            totalCases += morningCases + afternoonCases
          }
        })

        dayData[category.key] = totalCases
      })

      return dayData
    })
  }, [data, getDaysToShow, config.categories])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Ngày: ${label}`}</p>
          {payload.map((entry, index) => {
            const category = config.categories.find(cat => cat.key === entry.dataKey)
            const benchmarkLimit = benchmarkLimits[entry.dataKey]
            const isExceeding = entry.value > benchmarkLimit && benchmarkLimit > 0
            
            return (
              <div key={index} className="mt-1">
                <p style={{ color: entry.color }} className="text-sm">
                  {`${category?.name}: ${entry.value} ca`}
                </p>
                <p className="text-xs text-gray-600">
                  {`Định mức: ${benchmarkLimit} ca`}
                </p>
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

  // Calculate average benchmark limit for reference line (for multi-category charts)
  const avgBenchmarkLimit = useMemo(() => {
    const limits = Object.values(benchmarkLimits).filter(limit => limit > 0)
    return limits.length > 0 ? Math.round(limits.reduce((sum, limit) => sum + limit, 0) / limits.length) : 0
  }, [benchmarkLimits])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Benchmark reference line */}
            {chartType === 'ultrasound' && avgBenchmarkLimit > 0 && (
              <ReferenceLine 
                y={avgBenchmarkLimit} 
                stroke="#DC2626" 
                strokeDasharray="5 5" 
                label={{ value: `Định mức TB: ${avgBenchmarkLimit}`, position: "topRight" }}
              />
            )}
            
            {/* Individual benchmark lines for single category charts */}
            {(chartType === 'ecg' || chartType === 'gynecology') && (
              <ReferenceLine 
                y={benchmarkLimits[config.categories[0].key]} 
                stroke="#DC2626" 
                strokeDasharray="5 5" 
                label={{ value: `Định mức: ${benchmarkLimits[config.categories[0].key]}`, position: "topRight" }}
              />
            )}

            {/* Data lines */}
            {config.categories.map(category => (
              <Line
                key={category.key}
                type="monotone"
                dataKey={category.key}
                stroke={category.color}
                strokeWidth={2}
                dot={{ fill: category.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name={category.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BenchmarkLineChart
