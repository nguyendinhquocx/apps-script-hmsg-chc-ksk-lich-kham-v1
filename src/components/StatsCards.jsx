import React from 'react'
import { Building2, CheckCircle, Clock, Users } from 'lucide-react'

const StatsCards = ({ data = [] }) => {
  // Calculate statistics from data
  const totalCompanies = data.length
  const completedCompanies = data.filter(item => {
    const status = (item['trang thai kham'] || '').toLowerCase().trim()
    return status.includes('đã khám xong') || status.includes('da kham xong')
  }).length
  
  const inProgressCompanies = data.filter(item => {
    const status = (item['trang thai kham'] || '').toLowerCase().trim()
    // Đếm số công ty có trạng thái 'Chưa khám xong'
    return status.includes('chưa khám xong') || status.includes('chua kham xong')
  }).length
  
  // Calculate average people per day
  const totalPeople = data.reduce((sum, item) => sum + (parseInt(item['so nguoi kham']) || 0), 0)
  const avgPeoplePerDay = totalCompanies > 0 ? Math.round(totalPeople / totalCompanies) : 0

  const stats = [
    {
      title: 'Tổng số công ty',
      value: totalCompanies,
      icon: Building2,
      color: 'blue'
    },
    {
      title: 'Công ty đã khám',
      value: completedCompanies,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Công ty đang khám',
      value: inProgressCompanies,
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Trung bình Người/Ngày',
      value: avgPeoplePerDay,
      icon: Users,
      color: 'purple'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        return (
          <div key={index} className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</p>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards