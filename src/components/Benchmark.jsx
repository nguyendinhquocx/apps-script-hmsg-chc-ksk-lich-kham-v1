import React, { useMemo } from 'react'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import { useChartsData } from '../hooks/useChartsData'
import { useChartsExport } from '../hooks/useChartsExport'
import { matchesSearch, isDateInMonth } from '../utils/vietnamese'
import BenchmarkExceedTable from './BenchmarkExceedTable'
import BenchmarkTable from './BenchmarkTable'
import BenchmarkUltrasoundChart from './BenchmarkUltrasoundChart'
import BenchmarkECGChart from './BenchmarkECGChart'
import BenchmarkGynecologyChart from './BenchmarkGynecologyChart'
import BenchmarkInternalMedicineChart from './BenchmarkInternalMedicineChart'

const Benchmark = ({ filters }) => {
  const { data: benchmarkData, loading: benchmarkLoading, error: benchmarkError } = useBenchmarkData()
  const { data: allData, loading: chartsLoading, error: chartsError } = useChartsData()
  
  // Get charts export functionality
  const { getDaysToShow, getExamCount } = useChartsExport(allData || [], filters)

  // Apply all filters to chart data
  const filteredData = useMemo(() => {
    if (!allData || !filters) return allData || []
    
    const { 
      searchTerm = '', 
      statusFilter = '', 
      employeeFilter = '', 
      showGold = false 
    } = filters

    return allData.filter(item => {
      // Search filter - search in company name
      if (searchTerm && !matchesSearch(item['ten cong ty'], searchTerm)) {
        return false
      }

      // Status filter  
      if (statusFilter && item['trang thai kham'] !== statusFilter) {
        return false
      }

      // Employee filter - search in employee name
      if (employeeFilter && !matchesSearch(item['ten nhan vien'], employeeFilter)) {
        return false
      }

      // Gold filter
      if (showGold && !(item['gold'] === 'x' || item['gold'] === 'X')) {
        return false
      }

      return true
    })
  }, [allData, filters])

  if (benchmarkLoading || chartsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">. _ .</div>
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
          data={filteredData || []}
          benchmarkData={benchmarkData || []}
          monthFilter={filters?.monthFilter}
          dateFilter={filters?.dateFilter}
        />
        
        <BenchmarkInternalMedicineChart
          data={filteredData || []}
          benchmarkData={benchmarkData || []}
          monthFilter={filters?.monthFilter}
          dateFilter={filters?.dateFilter}
        />
        
        <BenchmarkECGChart
          data={filteredData || []}
          benchmarkData={benchmarkData || []}
          monthFilter={filters?.monthFilter}
          dateFilter={filters?.dateFilter}
        />
        
        <BenchmarkGynecologyChart
          data={filteredData || []}
          benchmarkData={benchmarkData || []}
          monthFilter={filters?.monthFilter}
          dateFilter={filters?.dateFilter}
        />
      </div>

      {/* Benchmark Exceed Table */}
      <BenchmarkExceedTable 
        data={filteredData || []}
        getDaysToShow={getDaysToShow}
        benchmarkData={benchmarkData || []}
      />

      {/* Benchmark Reference Table */}
      <BenchmarkTable benchmarkData={benchmarkData || []} />
    </div>
  )
}

export default Benchmark
