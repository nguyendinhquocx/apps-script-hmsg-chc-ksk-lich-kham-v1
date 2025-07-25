import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const CompanyModal = ({ 
  isOpen, 
  onClose, 
  company,
  getCompanyDetails 
}) => {
  if (!isOpen || !company) return null

  const details = getCompanyDetails(company)
  const isCompleted = company['trang thai kham'] === 'Đã khám xong'

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 break-words uppercase">
            {company['ten cong ty']}
          </h3>
        </div>

        {/* Company Details */}
        <div className="space-y-2">
          {/* Blood test date - only show if exists */}
          {details.bloodTestDate && (
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-sm text-gray-600">Ngày lấy máu:</span>
              <span className="text-sm text-gray-900">{details.bloodTestDate}</span>
            </div>
          )}
          
          {/* Examination period */}
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-sm text-gray-600">Khoảng thời gian khám:</span>
            <span className="text-sm text-gray-900">{details.examPeriod}</span>
          </div>
          
          {/* Specific examination dates - only show if exists */}
          {details.specificExamDates && (
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-sm text-gray-600">Các ngày khám thực tế:</span>
              <span className="text-sm text-gray-900">{details.specificExamDates}</span>
            </div>
          )}
          
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-sm text-gray-600">Tổng số người khám:</span>
            <span className="text-sm text-gray-900">{details.totalPeople.toLocaleString('vi-VN')} người</span>
          </div>
          
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-sm text-gray-600">Tổng số ngày khám:</span>
            <span className="text-sm text-gray-900">{details.totalDays} ngày</span>
          </div>
          
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-sm text-gray-600">Nhân viên phụ trách:</span>
            <span className="text-sm text-gray-900">{details.employee}</span>
          </div>
          
          <div className="flex justify-between py-1.5">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <span className={`text-sm ${isCompleted ? 'text-blue-600' : 'text-gray-900'}`}>
              {company['trang thai kham']}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyModal
