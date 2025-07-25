import React from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getDisplayCompanyName } from '../utils/companyName'

// Get short name from full name (last word)
const getShortName = (fullName) => {
  if (!fullName) return ''
  const words = fullName.trim().split(' ')
  return words[words.length - 1]
}

const DailySummaryModal = ({ isOpen, onClose, date, companies, summary }) => {
  if (!isOpen || !date || !companies || !summary) return null

  // Sort companies by examiner first, then by people count (descending)
  const sortedCompanies = [...companies].sort((a, b) => {
    // First sort by examiner name
    const examinerA = a.examiner || ''
    const examinerB = b.examiner || ''
    const examinerCompare = examinerA.localeCompare(examinerB, 'vi')
    
    if (examinerCompare !== 0) {
      return examinerCompare
    }
    
    // If same examiner, sort by people count (descending)
    return b.peopleCount - a.peopleCount
  })

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-4 max-w-lg w-full mx-4 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Chi tiết ngày {format(date, 'dd/MM/yyyy', { locale: vi })} ({format(date, 'EEEE', { locale: vi }).charAt(0).toUpperCase() + format(date, 'EEEE', { locale: vi }).slice(1)})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Statistics */}
        <div className="space-y-1 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Số công ty có lịch khám:</span>
            <span className="text-black">{summary.companyCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng số người khám:</span>
            <span className="text-black">{summary.totalPeople}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Số lượng khám sáng:</span>
            <span className="text-black">{summary.morningCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Số lượng khám chiều:</span>
            <span className="text-black">{summary.afternoonCount}</span>
          </div>
        </div>

        {/* Company List */}
        <div>
          <h3 className="text-sm text-gray-900 mb-2 font-semibold">Danh sách công ty có lịch khám:</h3>
          <div className="space-y-1">
            {sortedCompanies.map((company, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                <div className="flex-1">
                  <div className="text-sm text-gray-900">
                    {getDisplayCompanyName(company.name)}
                  </div>
                  {company.examiner && (
                    <div className="text-xs text-gray-600">
                      NV: {company.examiner}
                    </div>
                  )}
                </div>
                <div className="text-sm text-black">
                  {company.peopleCount} người {company.examiner && getShortName(company.examiner)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailySummaryModal
