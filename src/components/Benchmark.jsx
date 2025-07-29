import React, { useMemo } from 'react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import { useChartsData } from '../hooks/useChartsData'
import { useChartsExport } from '../hooks/useChartsExport'
import BenchmarkExceedTable from './BenchmarkExceedTable'
import BenchmarkTable from './BenchmarkTable'
import BenchmarkUltrasoundChart from './BenchmarkUltrasoundChart'
import BenchmarkECGChart from './BenchmarkECGChart'
import BenchmarkGynecologyChart from './BenchmarkGynecologyChart'

const Benchmark = ({ filters }) => {
  const { data: benchmarkData, loading: benchmarkLoading, error: benchmarkError } = useBenchmarkData()
  const { data: allData, loading: chartsLoading, error: chartsError } = useChartsData()
  
  // Get charts export functionality
  const { getDaysToShow, getExamCount } = useChartsExport(allData || [], filters)

  if (benchmarkLoading || chartsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (benchmarkError || chartsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-center">{benchmarkError || chartsError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Benchmark Line Charts */}
      <div className="space-y-4">
        <BenchmarkUltrasoundChart
          data={allData || []}
          benchmarkData={benchmarkData || []}
          monthFilter={filters?.monthFilter}
          dateFilter={filters?.dateFilter}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BenchmarkECGChart
            data={allData || []}
            benchmarkData={benchmarkData || []}
            monthFilter={filters?.monthFilter}
            dateFilter={filters?.dateFilter}
          />
          
          <BenchmarkGynecologyChart
            data={allData || []}
            benchmarkData={benchmarkData || []}
            monthFilter={filters?.monthFilter}
            dateFilter={filters?.dateFilter}
          />
        </div>
      </div>

      {/* Benchmark Exceed Table */}
      <BenchmarkExceedTable 
        data={allData || []}
        getDaysToShow={getDaysToShow}
        benchmarkData={benchmarkData || []}
      />

      {/* Benchmark Reference Table */}
      <BenchmarkTable benchmarkData={benchmarkData || []} />
    </div>
  )
}

export default Benchmark
