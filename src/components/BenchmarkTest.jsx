import React, { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'

const BenchmarkTest = () => {
  const { testConnection, insertSampleData } = useBenchmarkData()
  const [testResult, setTestResult] = useState(null)
  const [insertResult, setInsertResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [inserting, setInserting] = useState(false)

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

  const handleInsertSampleData = async () => {
    setInserting(true)
    setInsertResult(null)
    
    try {
      const result = await insertSampleData()
      setInsertResult(result)
    } catch (error) {
      setInsertResult({ success: false, error: error.message })
    } finally {
      setInserting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test & Setup Supabase</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Đang test...' : 'Test Connection'}</span>
          </button>
          <button
            onClick={handleInsertSampleData}
            disabled={inserting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Database className={`w-4 h-4 ${inserting ? 'animate-pulse' : ''}`} />
            <span>{inserting ? 'Đang thêm...' : 'Thêm dữ liệu mẫu'}</span>
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg mb-3 ${
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

      {/* Insert Result */}
      {insertResult && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg mb-3 ${
          insertResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {insertResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">
            {insertResult.success ? 'Thêm dữ liệu thành công!' : 'Thêm dữ liệu thất bại:'}
          </span>
          <span>{insertResult.message || insertResult.error}</span>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">Các bước kiểm tra:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>1. <strong>Test Connection</strong>: Kiểm tra kết nối và số lượng record</li>
          <li>2. <strong>Thêm dữ liệu mẫu</strong>: Nếu bảng trống, thêm 7 record mẫu từ JSON bạn cung cấp</li>
          <li>3. Kiểm tra console log để xem chi tiết</li>
        </ul>
      </div>
    </div>
  )
}

export default BenchmarkTest
