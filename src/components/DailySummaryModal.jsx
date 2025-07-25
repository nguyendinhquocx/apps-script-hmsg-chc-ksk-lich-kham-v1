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

  // Group companies by examiner
  const groupedByExaminer = companies.reduce((groups, company) => {
    const examiner = company.examiner || 'Chưa phân công'
    if (!groups[examiner]) {
      groups[examiner] = []
    }
    groups[examiner].push(company)
    return groups
  }, {})

  // Sort companies within each group by people count (descending)
  Object.keys(groupedByExaminer).forEach(examiner => {
    groupedByExaminer[examiner].sort((a, b) => b.peopleCount - a.peopleCount)
  })

  // Sort examiners alphabetically
  const sortedExaminers = Object.keys(groupedByExaminer).sort((a, b) => a.localeCompare(b, 'vi'))

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
          <div className="space-y-3">
            {sortedExaminers.map((examiner, examinerIndex) => (
              <div key={examiner}>
                {/* Examiner header */}
                <div className="text-xs text-gray-700 font-medium mb-1">
                  NV: {examiner}
                </div>
                
                {/* Companies under this examiner */}
                <div className="space-y-1 ml-2">
                  {groupedByExaminer[examiner].map((company, companyIndex) => (
                    <div key={companyIndex} className="flex justify-between items-center py-1">
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          {getDisplayCompanyName(company.name)}
                        </div>
                      </div>
                      <div className="text-sm text-black">
                        {company.peopleCount} người
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Separator line between examiners (except for the last one) */}
                {examinerIndex < sortedExaminers.length - 1 && (
                  <hr className="border-gray-200 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailySummaryModal
