import React, { useState, useEffect } from 'react'
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
import { TrendingUp, Users, Building2, Calendar } from 'lucide-react'
import LichKhamService from '../services/supabase'

const Charts = () => {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    setLoading(true)
    setError(null)
    
    try {
      const result = await LichKhamService.getStatistics()
      
      if (result.error) {
        setError(result.error)
      } else {
        setStats(result.stats)
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải thống kê')
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
                {(stats.totalExaminations || 0).toLocaleString()}
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
                {(stats.totalCompanies || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng bản ghi</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.totalRecords || 0).toLocaleString()}
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
                {stats.totalCompanies > 0 
                  ? Math.round(stats.totalExaminations / stats.totalCompanies).toLocaleString()
                  : 0
                }
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
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip type="percentage" />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Top Companies Bar Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 công ty theo lượt khám</h3>
          {topCompaniesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topCompaniesData}
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
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900 mb-2">{data.fullName}</p>
                          <p className="text-sm text-blue-600">
                            Lượt khám: {data.examinations.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Số bản ghi: {data.records}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="examinations" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrendData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng theo tháng</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={monthlyTrendData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="examinations" fill={COLORS.primary} name="Lượt khám" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="companies" 
                stroke={COLORS.secondary} 
                strokeWidth={3}
                name="Số công ty"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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