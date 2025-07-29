import React from 'react'

const BenchmarkTable = ({ benchmarkData = [] }) => {

  // Display name mappings for better UI
  const specialtyDisplayNames = {
    'Siêu âm - Bụng': 'Siêu âm bụng',
    'Siêu âm - Vú': 'Siêu âm vú',
    'Siêu âm - Giáp': 'Siêu âm giáp',
    'Siêu âm - Tim': 'Siêu âm tim',
    'Siêu âm - Động mạch cảnh': 'SA động mạch cảnh',
    'Siêu âm - Combo (Vú, Giáp...)': 'Siêu âm vú + giáp',
    'Siêu âm - Mạch máu chi': 'SA mạch máu chi',
    'Điện tim (ECG)': 'Điện tâm đồ',
    'Sản phụ khoa': 'Khám phụ khoa'
  }

  // Sort benchmark data according to specified order
  const sortedBenchmarkData = benchmarkData?.slice().sort((a, b) => {
    const specialtyOrder = [
      'Ngoại khoa',        // Ngoại tổng quát
      'Mắt',               // Mắt
      'Da liễu',           // Da liễu
      'TMH',               // Tai mũi họng
      'RHM',               // Răng hàm mặt
      'Nội tổng quát',     // Nội tổng quát
      'Sản phụ khoa',      // Khám phụ khoa
      'Điện tim (ECG)',    // Điện tâm đồ
      'Siêu âm - Bụng',    // Siêu âm bụng
      'Siêu âm - Vú',      // Siêu âm vú
      'Siêu âm - Giáp',    // Siêu âm giáp
      'Siêu âm - Combo (Vú, Giáp...)', // Siêu âm vú + giáp
      'Siêu âm - Tim',     // Siêu âm tim
      'Siêu âm - Động mạch cảnh',      // SA động mạch cảnh
      'Siêu âm - Mạch máu chi'          // SA mạch máu chi
    ]
    
    const aIndex = specialtyOrder.indexOf(a.chuyen_khoa)
    const bIndex = specialtyOrder.indexOf(b.chuyen_khoa)
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    } else if (aIndex !== -1) {
      return -1
    } else if (bIndex !== -1) {
      return 1
    } else {
      return a.chuyen_khoa.localeCompare(b.chuyen_khoa)
    }
  })

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Bảng định mức chuẩn</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                Chuyên khoa
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                Thời gian/ca
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                Số ca/giờ
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                Số ca/ngày
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBenchmarkData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {specialtyDisplayNames[item.chuyen_khoa] || item.chuyen_khoa}
                  </div>
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
  )
}

export default BenchmarkTable
