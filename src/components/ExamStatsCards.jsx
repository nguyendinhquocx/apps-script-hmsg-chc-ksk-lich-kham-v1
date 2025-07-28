import React, { useMemo } from 'react'
import { Activity, Heart, Stethoscope, UserCheck } from 'lucide-react'

const ExamStatsCards = ({ 
  data = [], 
  examCategories = [],
  getExamCount,
  getDaysToShow,
  monthFilter,
  dateFilter
}) => {
  // Calculate cumulative exam counts from start to today (or current filter)
  const cumulativeStats = useMemo(() => {
    if (!getExamCount || !getDaysToShow) {
      // Fallback to old logic if functions not available
      return { sieuAm: 0, xQuang: 0, ectg: 0, phuKhoa: 0 }
    }

    try {
      const days = getDaysToShow()
      const today = new Date()
      
      // Only include days up to today (or filter end date)
      const validDays = days.filter(dayInfo => {
        const dayDate = dayInfo.date instanceof Date ? dayInfo.date : new Date(dayInfo.date)
        return dayDate <= today
      })

      // Find category indices based on exam names
      const sieuAmIndices = examCategories
        .map((cat, index) => ({ index, name: cat.name.toLowerCase() }))
        .filter(cat => 
          cat.name.includes('siêu âm') || 
          cat.name.includes('sa ')
        )
        .map(cat => cat.index)

      const xQuangIndices = examCategories
        .map((cat, index) => ({ index, name: cat.name.toLowerCase() }))
        .filter(cat => cat.name.includes('x-quang'))
        .map(cat => cat.index)

      const ectgIndices = examCategories
        .map((cat, index) => ({ index, name: cat.name.toLowerCase() }))
        .filter(cat => cat.name.includes('điện tâm đồ'))
        .map(cat => cat.index)

      const phuKhoaIndices = examCategories
        .map((cat, index) => ({ index, name: cat.name.toLowerCase() }))
        .filter(cat => cat.name.includes('khám phụ khoa'))
        .map(cat => cat.index)

      // Calculate cumulative totals
      const calculateCumulativeForIndices = (categoryIndices) => {
        let total = 0
        
        validDays.forEach(dayInfo => {
          // For each day, get the max count among all categories, then sum across days
          let dayTotal = 0
          categoryIndices.forEach(categoryIndex => {
            const morningCount = getExamCount(dayInfo.date, categoryIndex, 'morning')
            const afternoonCount = getExamCount(dayInfo.date, categoryIndex, 'afternoon')
            // Take max between morning and afternoon for this specific category
            const categoryMax = Math.max(morningCount, afternoonCount)
            dayTotal += categoryMax
          })
          total += dayTotal
        })
        
        return total
      }

      return {
        sieuAm: calculateCumulativeForIndices(sieuAmIndices),
        xQuang: calculateCumulativeForIndices(xQuangIndices),
        ectg: calculateCumulativeForIndices(ectgIndices),
        phuKhoa: calculateCumulativeForIndices(phuKhoaIndices)
      }
    } catch (error) {
      console.error('Error in ExamStatsCards calculation:', error)
      return { sieuAm: 0, xQuang: 0, ectg: 0, phuKhoa: 0 }
    }
  }, [data, examCategories, getExamCount, getDaysToShow, monthFilter, dateFilter])

  const stats = [
    {
      title: 'Số ca siêu âm',
      value: cumulativeStats.sieuAm,
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Số ca X-Quang',
      value: cumulativeStats.xQuang,
      icon: Heart,
      color: 'green'
    },
    {
      title: 'Số ca Điện tâm đồ',
      value: cumulativeStats.ectg,
      icon: Activity,
      color: 'orange'
    },
    {
      title: 'Số ca khám phụ khoa',
      value: cumulativeStats.phuKhoa,
      icon: UserCheck,
      color: 'purple'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const hasData = stat.value > 0
        
        return (
          <div key={index} className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold mb-1 ${hasData ? 'text-gray-900' : 'text-gray-400'}`}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">Tổng số ca</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ExamStatsCards
