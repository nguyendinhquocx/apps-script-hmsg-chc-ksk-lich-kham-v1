import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts'
import { Users, Building2, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { LichKhamService } from '../services/supabase'
import { useNotifications } from './NotificationSystem'
import LoadingSpinner, { ChartSkeleton, LoadingButton } from './LoadingSpinner'
import { 
  CHART_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  FEATURES 
} from '../constants'
import { 
  formatNumber, 
  getErrorMessage,
  normalizeStatus 
} from '../utils'

const Charts = () => {
  const [stats, setStats] = useState({
    totalExaminations: 0,
    totalCompanies: 0,
    totalRecords: 0
  })
  const [chartData, setChartData] = useState({
    statusData: [],
    companyData: [],
    monthlyData: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 0, resetTime: 0 })
  const { showSuccess, showError, showWarning } = useNotifications()

  // Memoized chart data preparation
  const prepareStatusData = useMemo(() => {
    return (statusCounts) => {
      return Object.entries(statusCounts || {}).map(([status, count]) => ({
        name: normalizeStatus(status),
        value: count,
        percentage: ((count / stats.totalExaminations) * 100).toFixed(1)
      }))
    }
  }, [stats.totalExaminations])

  const prepareCompanyData = useMemo(() => {
    return (topCompanies) => {
      return (topCompanies || []).slice(0, CHART_CONFIG.MAX_COMPANIES_DISPLAY).map(company => ({
        name: company.name.length > CHART_CONFIG.MAX_LABEL_LENGTH 
          ? company.name.substring(0, CHART_CONFIG.MAX_LABEL_LENGTH) + '...' 
          : company.name,
        value: company.count,
        fullName: company.name
      }))
    }
  }, [])

  const prepareMonthlyData = useMemo(() => {
    return (monthlyStats) => {
      return (monthlyStats || []).slice(-CHART_CONFIG.MAX_MONTHS_DISPLAY).map(stat => ({
        month: stat.month,
        examinations: stat.count,
        formatted: new Date(stat.month + '-01').toLocaleDateString('vi-VN', { 
          year: 'numeric', 
          month: 'short' 
        })
      }))
    }
  }, [])

  // Refresh statistics
  const handleRefresh = () => {
    fetchStatistics()
  }

  // Colors for charts
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6'
  }

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger, COLORS.purple, COLORS.pink]

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await LichKhamService.getStatistics()
      
      const { stats } = result
      setStats(stats)
      setLastUpdated(new Date())
      
      // Update rate limit info
      if (stats.rateLimitInfo) {
        setRateLimitInfo(stats.rateLimitInfo)
      }
      
      // Prepare chart data
      setChartData({
        statusData: prepareStatusData(stats.statusCounts),
        companyData: prepareCompanyData(stats.topCompanies),
        monthlyData: prepareMonthlyData(stats.monthlyStats)
      })
      
      // Show appropriate message based on data type
      if (stats.isMockData) {
        showWarning('Dữ liệu mẫu', 'Đang hiển thị dữ liệu mẫu. Vui lòng tạo bảng trong Supabase để xem dữ liệu thực.')
      } else {
        showSuccess('Cập nhật thống kê', 'Dữ liệu thống kê đã được tải thành công')
      }
      
      // Only show error if there's an actual error and no stats
      if (result.error && !stats.isMockData) {
        const errorMsg = getErrorMessage(result.error)
        setError(errorMsg)
        showError('Lỗi tải thống kê', errorMsg)
      }
    } catch (err) {
      if (FEATURES.DEBUG_LOGS) {
        console.error('Error fetching statistics:', err)
      }
      const errorMsg = getErrorMessage(err, ERROR_MESSAGES.STATS_LOAD_FAILED)
      setError(errorMsg)
      showError('Lỗi hệ thống', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Prepare data for status pie chart
  const statusChartData = Object.entries(stats.statusCounts || {}).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: ((count / stats.totalRecords) * 100).toFixed(1)
  }))

  // Prepare data for top companies bar chart
  const topCompaniesData = (stats.topCompanies || []).slice(0, 10).map(company => ({
    name: company.name.length > 20 ? company.name.substring(0, 20) + '...' : company.name,
    fullName: company.name,
    examinations: company.totalExams,
    records: company.records
  }))

  // Prepare data for monthly trend
  const monthlyTrendData = (stats.monthlyStats || []).map(month => ({
    month: month.month,
    examinations: month.examinations,
    companies: month.companies
  }))

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label, type = 'default' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
              {type === 'percentage' && ` (${entry.payload.percentage}%)`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Lỗi khi tải thống kê:</p>
          <p>{error}</p>
          <button
            onClick={fetchStatistics}
            className="mt-3 btn btn-primary px-4 py-2"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Thống kê và Biểu đồ</h2>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <LoadingButton
            onClick={handleRefresh}
            loading={loading}
            loadingText="Đang tải..."
            className="btn btn-secondary px-4 py-2"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </LoadingButton>
        </div>
      </div>
      
      {/* Mock Data Warning */}
      {stats.isMockData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Dữ liệu mẫu</p>
            <p className="text-sm">Đang hiển thị dữ liệu mẫu vì bảng 'lich_kham' chưa tồn tại trong cơ sở dữ liệu Supabase. Vui lòng tạo bảng này trong dự án Supabase của bạn để xem dữ liệu thực.</p>
          </div>
        </div>
      )}

      {/* Rate Limit Info */}
      {FEATURES.DEBUG_LOGS && rateLimitInfo.remaining < 10 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="text-sm">
            Còn lại {rateLimitInfo.remaining} requests. 
            Reset sau {Math.ceil(rateLimitInfo.resetTime / 1000)}s
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng lượt khám</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <LoadingSpinner size="sm" showText={false} />
                ) : (
                  formatNumber(stats.totalExaminations || 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng công ty</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <LoadingSpinner size="sm" showText={false} />
                ) : (
                  formatNumber(stats.totalCompanies || 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng bản ghi</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <LoadingSpinner size="sm" showText={false} />
                ) : (
                  formatNumber(stats.totalRecords || 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">TB khám/công ty</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <LoadingSpinner size="sm" showText={false} />
                ) : (
                  stats.totalCompanies > 0 
                    ? formatNumber(Math.round(stats.totalExaminations / stats.totalCompanies))
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo trạng thái</h3>
          {loading ? (
            <ChartSkeleton height={300} />
          ) : chartData.statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_CONFIG.COLORS ? CHART_CONFIG.COLORS[index % CHART_CONFIG.COLORS.length] : PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Không có dữ liệu trạng thái</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Companies Bar Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 công ty theo lượt khám</h3>
          {loading ? (
            <ChartSkeleton height={300} />
          ) : chartData.companyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData.companyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    formatNumber(value), 
                    'Số lượt khám',
                    props.payload.fullName
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill={CHART_CONFIG.COLORS ? CHART_CONFIG.COLORS[1] : COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Không có dữ liệu công ty</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng theo tháng</h3>
        {loading ? (
          <ChartSkeleton height={400} />
        ) : chartData.monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData.monthlyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted" 
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatNumber(value), 'Số lượt khám']}
                labelFormatter={(label) => `Tháng: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="examinations" 
                stroke={CHART_CONFIG.COLORS ? CHART_CONFIG.COLORS[2] : COLORS.accent} 
                strokeWidth={2}
                dot={{ fill: CHART_CONFIG.COLORS ? CHART_CONFIG.COLORS[2] : COLORS.accent }}
                name="Số lượt khám"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Không có dữ liệu xu hướng</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Statistics Table */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê chi tiết</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Phân tích trạng thái</h4>
            <div className="space-y-2">
              {Object.entries(stats.statusCounts || {}).map(([status, count]) => {
                const percentage = ((count / stats.totalRecords) * 100).toFixed(1)
                return (
                  <div key={status} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{status}</span>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{count.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Companies List */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Top 5 công ty</h4>
            <div className="space-y-2">
              {(stats.topCompanies || []).slice(0, 5).map((company, index) => (
                <div key={company.name} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate" title={company.name}>
                      {company.name.length > 30 ? company.name.substring(0, 30) + '...' : company.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">{company.totalExams.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-1">lượt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Charts