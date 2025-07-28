import React, { useState, useEffect } from 'react'
import { Clock, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import BenchmarkTest from './BenchmarkTest'

const Benchmark = () => {
  const { data, loading, error } = useBenchmarkData()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Đang tải dữ liệu benchmark...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-center">{error}</p>
      </div>
    )
  }

  // Tính toán thống kê tổng quan
  const totalSpecialties = data?.length || 0
  const avgTimePerCase = data?.reduce((sum, item) => sum + (item.phut_tb_1_ca_min + item.phut_tb_1_ca_max) / 2, 0) / totalSpecialties || 0
  const avgCasesPerHour = data?.reduce((sum, item) => sum + (item.so_ca_gio_bs_min + item.so_ca_gio_bs_max) / 2, 0) / totalSpecialties || 0
  const avgCasesPerDay = data?.reduce((sum, item) => sum + (item.so_ca_ngay_bs_min + item.so_ca_ngay_bs_max) / 2, 0) / totalSpecialties || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Benchmark KSK</h1>
        <div className="text-sm text-gray-500">
          Cập nhật: {new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>

      {/* Test Connection Component */}
      <BenchmarkTest />

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng chuyên khoa</p>
              <p className="text-2xl font-bold text-gray-900">{totalSpecialties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">TB thời gian/ca</p>
              <p className="text-2xl font-bold text-gray-900">{avgTimePerCase.toFixed(1)} phút</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">TB ca/giờ</p>
              <p className="text-2xl font-bold text-gray-900">{avgCasesPerHour.toFixed(1)} ca</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">TB ca/ngày</p>
              <p className="text-2xl font-bold text-gray-900">{avgCasesPerDay.toFixed(0)} ca</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết benchmark */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết định mức theo chuyên khoa</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chuyên khoa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân sự
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian/ca (phút)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số ca/giờ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số ca/ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.chuyen_khoa}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.nhan_su}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {item.phut_tb_1_ca_min === item.phut_tb_1_ca_max 
                        ? `${item.phut_tb_1_ca_min} phút`
                        : `${item.phut_tb_1_ca_min}-${item.phut_tb_1_ca_max} phút`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {item.so_ca_gio_bs_min === item.so_ca_gio_bs_max 
                        ? `${item.so_ca_gio_bs_min} ca`
                        : `${item.so_ca_gio_bs_min}-${item.so_ca_gio_bs_max} ca`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {item.so_ca_ngay_bs_min === item.so_ca_ngay_bs_max 
                        ? `${item.so_ca_ngay_bs_min} ca`
                        : `${item.so_ca_ngay_bs_min}-${item.so_ca_ngay_bs_max} ca`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={item.ghi_chu}>
                      {item.ghi_chu}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gợi ý dashboard hiệu quả */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Gợi ý Dashboard hiệu quả</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">📊 So sánh hiệu suất thực tế</h4>
            <p className="text-sm text-gray-600">Kết hợp data từ bảng lịch khám để so sánh số ca thực tế vs định mức</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">⚡ Phân tích năng suất</h4>
            <p className="text-sm text-gray-600">Dashboard hiển thị % đạt định mức theo từng chuyên khoa và bác sĩ</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">🎯 Dự báo công suất</h4>
            <p className="text-sm text-gray-600">Tính toán công suất tối đa có thể đạt được dựa trên benchmark</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">📈 Trend Analysis</h4>
            <p className="text-sm text-gray-600">Phân tích xu hướng hiệu suất theo thời gian và đề xuất cải thiện</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">🚨 Cảnh báo quá tải</h4>
            <p className="text-sm text-gray-600">Cảnh báo khi số ca vượt định mức an toàn của từng chuyên khoa</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">📋 Báo cáo quản lý</h4>
            <p className="text-sm text-gray-600">Tạo báo cáo tự động về hiệu suất và tuân thủ định mức</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Benchmark
