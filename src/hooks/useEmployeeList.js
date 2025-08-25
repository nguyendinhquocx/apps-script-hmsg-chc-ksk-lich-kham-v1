import { useState, useEffect } from 'react'
import LichKhamService, { supabase } from '../services/supabase'

export const useEmployeeList = () => {
  const [employeeList, setEmployeeList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        
        // Fetch from both lich_kham and ksk_benchmark tables
        const [lichKhamResult, benchmarkResult] = await Promise.allSettled([
          // Get employees from lich_kham table
          LichKhamService.getLichKhamData({
            page: 1,
            limit: 10000,
            search: '',
            status: '',
            employee: '',
            showGold: false
          }),
          // Get employees from ksk_benchmark table
          supabase.from('ksk_benchmark').select('*').limit(10000)
        ])

        const employees = new Set()

        // Process lich_kham data
        if (lichKhamResult.status === 'fulfilled' && lichKhamResult.value.data) {
          lichKhamResult.value.data.forEach(record => {
            const employee = record['ten nhan vien']
            if (employee && employee.trim()) {
              employees.add(employee.trim())
            }
          })
        }

        // Process benchmark data 
        if (benchmarkResult.status === 'fulfilled' && benchmarkResult.value.data) {
          benchmarkResult.value.data.forEach(record => {
            const employee = record['ten nhan vien'] || record['ten_nhan_vien'] || record['employee_name']
            if (employee && employee.trim()) {
              employees.add(employee.trim())
            }
          })
        }
        
        // Convert to sorted array
        const sortedEmployees = Array.from(employees).sort()
        setEmployeeList(sortedEmployees)
        
      } catch (error) {
        console.error('Error fetching employee list:', error)
        setEmployeeList([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  return { employeeList, loading }
}

export default useEmployeeList