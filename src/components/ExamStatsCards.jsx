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
      return { 
        sieuAm: { completed: 0, total: 0 }, 
        xQuang: { completed: 0, total: 0 }, 
        ectg: { completed: 0, total: 0 }, 
        phuKhoa: { completed: 0, total: 0 } 
      }
    }

    try {
      const days = getDaysToShow()
      const today = new Date()
      
      // All days in the filter period for total calculation
      const allDays = days
      
      // Only include days up to today for completed calculation
      const completedDays = days.filter(dayInfo => {
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

      // Calculate cumulative totals for both completed and total
      const calculateCumulativeForIndices = (categoryIndices, daysToUse) => {
        let total = 0
        
        daysToUse.forEach(dayInfo => {
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

      // Calculate both completed (up to today) and total (all days in filter)
      const completedStats = {
        sieuAm: calculateCumulativeForIndices(sieuAmIndices, completedDays),
        xQuang: calculateCumulativeForIndices(xQuangIndices, completedDays),
        ectg: calculateCumulativeForIndices(ectgIndices, completedDays),
        phuKhoa: calculateCumulativeForIndices(phuKhoaIndices, completedDays)
      }

      const totalStats = {
        sieuAm: calculateCumulativeForIndices(sieuAmIndices, allDays),
        xQuang: calculateCumulativeForIndices(xQuangIndices, allDays),
        ectg: calculateCumulativeForIndices(ectgIndices, allDays),
        phuKhoa: calculateCumulativeForIndices(phuKhoaIndices, allDays)
      }

      return {
        sieuAm: {
          completed: completedStats.sieuAm,
          total: Math.max(completedStats.sieuAm, totalStats.sieuAm) // Total không được nhỏ hơn completed
        },
        xQuang: {
          completed: completedStats.xQuang,
          total: Math.max(completedStats.xQuang, totalStats.xQuang)
        },
        ectg: {
          completed: completedStats.ectg,
          total: Math.max(completedStats.ectg, totalStats.ectg)
        },
        phuKhoa: {
          completed: completedStats.phuKhoa,
          total: Math.max(completedStats.phuKhoa, totalStats.phuKhoa)
        }
      }
    } catch (error) {
      console.error('Error in ExamStatsCards calculation:', error)
      return { 
        sieuAm: { completed: 0, total: 0 }, 
        xQuang: { completed: 0, total: 0 }, 
        ectg: { completed: 0, total: 0 }, 
        phuKhoa: { completed: 0, total: 0 } 
      }
    }
  }, [data, examCategories, getExamCount, getDaysToShow, monthFilter, dateFilter])

  const stats = [
    {
      title: 'Số ca siêu âm',
      completed: cumulativeStats.sieuAm.completed,
      total: cumulativeStats.sieuAm.total,
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Số ca X-Quang',
      completed: cumulativeStats.xQuang.completed,
      total: cumulativeStats.xQuang.total,
      icon: Heart,
      color: 'green'
    },
    {
      title: 'Số ca Điện tâm đồ',
      completed: cumulativeStats.ectg.completed,
      total: cumulativeStats.ectg.total,
      icon: Activity,
      color: 'orange'
    },
    {
      title: 'Số ca khám phụ khoa',
      completed: cumulativeStats.phuKhoa.completed,
      total: cumulativeStats.phuKhoa.total,
      icon: UserCheck,
      color: 'purple'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const hasData = stat.completed > 0 || stat.total > 0
        // Format numbers with thousand separators using Vietnamese locale
        const formattedCompleted = stat.completed.toLocaleString('vi-VN')
        const formattedTotal = stat.total.toLocaleString('vi-VN')
        
        return (
          <div key={index} className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1 mb-1">
                  <p className={`text-3xl font-bold ${hasData ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formattedCompleted}
                  </p>
                  <span className="text-lg text-gray-500 font-medium">
                    /{formattedTotal}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ExamStatsCards
