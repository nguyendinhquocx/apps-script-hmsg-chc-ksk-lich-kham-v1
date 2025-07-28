import React, { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'

const BenchmarkTest = () => {
  const { testConnection } = useBenchmarkData()
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await testConnection()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: error.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Kết Nối Supabase</h3>
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Đang test...' : 'Test Connection'}</span>
        </button>
      </div>

      {testResult && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg ${
          testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">
            {testResult.success ? 'Kết nối thành công!' : 'Kết nối thất bại:'}
          </span>
          <span>{testResult.message || testResult.error}</span>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>Test này sẽ kiểm tra:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Kết nối đến Supabase database</li>
          <li>Quyền truy cập bảng 'ksk_benchmark'</li>
          <li>Khả năng đọc dữ liệu từ bảng</li>
        </ul>
      </div>
    </div>
  )
}

export default BenchmarkTest
