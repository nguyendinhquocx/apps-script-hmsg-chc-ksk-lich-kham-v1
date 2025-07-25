import React from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const ExamDetailModal = ({ isOpen, onClose, date, examType, companies, totalCount, period }) => {
  if (!isOpen) return null

  // Group companies by examiner
  const groupedByExaminer = companies.reduce((acc, company) => {
    const examiner = company.examiner || 'Không xác định'
    if (!acc[examiner]) {
      acc[examiner] = []
    }
    acc[examiner].push(company)
    return acc
  }, {})

  // Sort examiners and sort companies within each examiner by count (descending)
  // Filter out 'Không xác định' group
  const examiners = Object.keys(groupedByExaminer)
    .filter(examiner => examiner !== 'Không xác định')
    .sort()
  
  examiners.forEach(examiner => {
    groupedByExaminer[examiner].sort((a, b) => b.count - a.count)
  })

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-medium text-gray-900">
              Chi tiết {examType} - {period === 'morning' ? 'Sáng' : 'Chiều'}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {format(new Date(date), 'dd/MM/yyyy', { locale: vi })} - Tổng cộng: {totalCount} người
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {companies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Không có dữ liệu cho ngày này
            </div>
          ) : (
            <div className="space-y-4">
              {examiners.map((examiner, examinerIndex) => (
                <div key={examiner}>
                  {/* Examiner header */}
                  <div className="bg-gray-50 px-3 py-2 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900">{examiner}</h3>
                  </div>

                  {/* Companies list */}
                  <div className="mt-2 space-y-1">
                    {groupedByExaminer[examiner].map((company, index) => (
                      <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50 rounded">
                        <span className="text-xs text-gray-700 flex-1 truncate font-normal" title={company.name}>
                          {company.name}
                        </span>
                        <span className="text-xs font-normal text-gray-900 ml-2">
                          {company.count} người
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Separator between examiners */}
                  {examinerIndex < examiners.length - 1 && (
                    <div className="border-t border-gray-100 my-3"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamDetailModal
