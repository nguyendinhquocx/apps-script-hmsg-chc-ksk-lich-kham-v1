import React, { useMemo } from 'react'
import { Activity, Heart, Stethoscope, UserCheck } from 'lucide-react'

const ExamStatsCards = ({ data = [], examCategories = [] }) => {
  // Calculate max exam counts for today
  const todayStats = useMemo(() => {
    const today = new Date()
    const todayDateString = today.toISOString().split('T')[0]
    
    // Filter data for companies that have exams today
    const todayData = data.filter(item => {
      const startDate = new Date(item['ngay bat dau kham'])
      const endDate = new Date(item['ngay ket thuc kham'])
      const todayDate = new Date(todayDateString)
      
      // Check if today is within the exam period
      return todayDate >= startDate && todayDate <= endDate
    })
    
    // Group exam categories by main types
    const sieuAmCategories = [
      'sieu am bung sang', 'sieu am bung chieu',
      'sieu am vu sang', 'sieu am vu chieu', 
      'sieu am giap sang', 'sieu am giap chieu',
      'sieu am tim sang', 'sieu am tim chieu',
      'sieu am dong mach canh sang', 'sieu am dong mach canh chieu',
      'sieu am dan hoi mo gan sang', 'sieu am dan hoi mo gan chieu',
      'sieu am dau do am dao sang', 'sieu am dau do am dao chieu'
    ]
    
    const xquangCategories = ['x quang sang', 'x quang chieu']
    const ectgCategories = ['dien tam do sang', 'dien tam do chieu']
    const phuKhoaCategories = ['kham phu khoa sang', 'kham phu khoa chieu']
    
    // Calculate max values for each category group
    const calculateMaxForCategories = (categories) => {
      let maxMorning = 0
      let maxAfternoon = 0
      
      todayData.forEach(item => {
        // Find morning categories (sang)
        categories.filter(cat => cat.includes('sang')).forEach(category => {
          const count = parseInt(item[category]) || 0
          maxMorning = Math.max(maxMorning, count)
        })
        
        // Find afternoon categories (chieu)
        categories.filter(cat => cat.includes('chieu')).forEach(category => {
          const count = parseInt(item[category]) || 0
          maxAfternoon = Math.max(maxAfternoon, count)
        })
      })
      
      return { morning: maxMorning, afternoon: maxAfternoon }
    }
    
    return {
      sieuAm: calculateMaxForCategories(sieuAmCategories),
      xQuang: calculateMaxForCategories(xquangCategories),
      ectg: calculateMaxForCategories(ectgCategories),
      phuKhoa: calculateMaxForCategories(phuKhoaCategories)
    }
  }, [data, examCategories])

  const stats = [
    {
      title: 'Siêu âm',
      morning: todayStats.sieuAm.morning,
      afternoon: todayStats.sieuAm.afternoon,
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'X-Quang',
      morning: todayStats.xQuang.morning,
      afternoon: todayStats.xQuang.afternoon,
      icon: Heart,
      color: 'green'
    },
    {
      title: 'Điện tâm đồ',
      morning: todayStats.ectg.morning,
      afternoon: todayStats.ectg.afternoon,
      icon: Activity,
      color: 'orange'
    },
    {
      title: 'Khám phụ khoa',
      morning: todayStats.phuKhoa.morning,
      afternoon: todayStats.phuKhoa.afternoon,
      icon: UserCheck,
      color: 'purple'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const displayValue = `${stat.morning} / ${stat.afternoon}`
        const hasData = stat.morning > 0 || stat.afternoon > 0
        
        return (
          <div key={index} className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold mb-1 ${hasData ? 'text-gray-900' : 'text-gray-400'}`}>
                  {displayValue}
                </p>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">Sáng / Chiều</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ExamStatsCards
