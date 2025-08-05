import React from 'react'
import { Building2, CheckCircle, Clock, Users } from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, isBefore, isAfter } from 'date-fns'
import { getExamCountForDateNew, parseSpecificDates } from '../utils/examUtils'

const StatsCards = ({ data = [], monthFilter = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }, dateFilter = { startDate: '', endDate: '' } }) => {
  // Determine the date range to calculate examined people
  let filterStart, filterEnd
  if (dateFilter.startDate && dateFilter.endDate) {
    filterStart = new Date(dateFilter.startDate + 'T00:00:00')
    filterEnd = new Date(dateFilter.endDate + 'T00:00:00')
  } else {
    const { month, year } = monthFilter
    const selectedDate = new Date(year, month - 1, 1)
    filterStart = startOfMonth(selectedDate)
    filterEnd = endOfMonth(selectedDate)
  }

  // Use today if filter end is in the future
  const today = new Date()
  const calculationEnd = isBefore(filterEnd, today) ? filterEnd : today
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
  
  // Calculate people examined vs in progress
  // New logic: Calculate actual people examined based on date range and current date
  const completedPeople = data.reduce((sum, item) => {
    const startDate = item['ngay bat dau kham']
    const endDate = item['ngay ket thuc kham'] || item['ngay bat dau kham']
    const specificDatesStr = item['cac ngay kham thuc te']
    const totalPeople = parseInt(item['so nguoi kham']) || 0
    const isCompleted = item['trang thai kham'] === 'Đã khám xong'

    if (!startDate || totalPeople === 0) return sum

    try {
      let examinedPeople = 0

      if (specificDatesStr && specificDatesStr.trim()) {
        // Handle specific examination dates using new parsing logic
        const parsedDates = parseSpecificDates(specificDatesStr, filterStart.getFullYear())
        
        // Calculate examined people for dates within filter range and before calculation end
        examinedPeople = parsedDates.reduce((total, parsedDate) => {
          const date = parsedDate.date
          if (date >= filterStart && date <= calculationEnd) {
            if (isCompleted) {
              // For completed exams with specific dates: use the parsed specific counts or calculated averages
              if (parsedDate.useSpecific) {
                return total + parsedDate.total
              } else {
                // For old format dates without specific counts: 
                // Calculate how many people for THIS specific date (proportional allocation)
                const totalDaysInExam = parsedDates.length // All exam days
                const daysInFilter = parsedDates.filter(d => 
                  d.date >= filterStart && d.date <= calculationEnd
                ).length
                
                if (totalDaysInExam > 0) {
                  // Allocate total people proportionally: only count the portion for dates in filter
                  const peoplePerDay = totalPeople / totalDaysInExam
                  return total + Math.round(peoplePerDay) // Add people for this one day only
                }
                return total
              }
            } else {
              // For ongoing exams: use parsed data directly, don't call getExamCountForDateNew again!
              if (parsedDate.useSpecific) {
                return total + parsedDate.total
              } else {
                // For old format ongoing exams: use calculated averages from record
                const morningAvg = parseFloat(item['trung binh ngay sang']) || 0
                const afternoonAvg = parseFloat(item['trung binh ngay chieu']) || 0
                return total + Math.round(morningAvg + afternoonAvg)
              }
            }
          }
          return total
        }, 0)
      } else {
        // Handle date range examination
        const examStartDate = new Date(startDate + 'T00:00:00')
        const examEndDate = new Date(endDate + 'T00:00:00')
        
        // Calculate working days in examination period that fall within filter range
        const examDays = eachDayOfInterval({ start: examStartDate, end: examEndDate })
          .filter(date => getDay(date) !== 0) // Exclude Sundays
          .filter(date => date >= filterStart && date <= calculationEnd) // Only count days within filter and up to today

        if (isCompleted) {
          // For completed exams: total people for the entire examination period (not per day)
          examinedPeople = totalPeople
        } else {
          // For ongoing exams: calculate based on actual days examined
          examinedPeople = examDays.reduce((total, date) => {
            const examResult = getExamCountForDateNew(item, date)
            return total + examResult.total
          }, 0)
        }
      }

      return sum + Math.round(examinedPeople)
    } catch (error) {
      console.warn('Error calculating examined people for item:', item, error)
      return sum
    }
  }, 0)

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
      title: 'Số người đã khám',
      value: completedPeople,
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