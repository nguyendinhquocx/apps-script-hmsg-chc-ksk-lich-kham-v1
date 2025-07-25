// Utility functions for company name abbreviation

export const abbreviateCompanyName = (companyName) => {
  if (!companyName || typeof companyName !== 'string') {
    return companyName
  }

  let abbreviated = companyName
    // Rút gọn các từ phổ biến
    .replace(/\bCông ty\b/gi, 'Cty')
    .replace(/\bCổ phần\b/gi, 'CP')
    .replace(/\bVăn phòng đại diện\b/gi, 'VPDD')
    .replace(/\bTrách nhiệm hữu hạn\b/gi, 'TNHH')
    .replace(/\bLiên doanh\b/gi, 'LĐ')
    .replace(/\bHợp tác xã\b/gi, 'HTX')
    .replace(/\bDoanh nghiệp\b/gi, 'DN')
    .replace(/\bTập đoàn\b/gi, 'TĐ')
    .replace(/\bTổng công ty\b/gi, 'TCty')
    .replace(/\bChi nhánh\b/gi, 'CN')
    .replace(/\bPhòng giao dịch\b/gi, 'PGD')
    .replace(/\bNgân hàng\b/gi, 'NH')
    .replace(/\bBảo hiểm\b/gi, 'BH')
    .replace(/\bChứng khoán\b/gi, 'CK')
    .replace(/\bĐầu tư\b/gi, 'ĐT')
    .replace(/\bXây dựng\b/gi, 'XD')
    .replace(/\bSản xuất\b/gi, 'SX')
    .replace(/\bThương mại\b/gi, 'TM')
    .replace(/\bDịch vụ\b/gi, 'DV')
    .replace(/\bKinh doanh\b/gi, 'KD')
    .replace(/\bPhát triển\b/gi, 'PT')
    .replace(/\bQuản lý\b/gi, 'QL')
    .replace(/\bTư vấn\b/gi, 'TV')
    .replace(/\bTechnology\b/gi, 'Tech')
    .replace(/\bCompany\b/gi, 'Co')
    .replace(/\bCorporation\b/gi, 'Corp')
    .replace(/\bLimited\b/gi, 'Ltd')
    .replace(/\bIncorporated\b/gi, 'Inc')
    .replace(/\bEnterprise\b/gi, 'Ent')
    .replace(/\bInternational\b/gi, 'Intl')
    .replace(/\bManagement\b/gi, 'Mgmt')
    .replace(/\bDevelopment\b/gi, 'Dev')
    .replace(/\bInvestment\b/gi, 'Inv')
    .replace(/\bConsulting\b/gi, 'Cons')
    .replace(/\bSolutions\b/gi, 'Sol')
    .replace(/\bServices\b/gi, 'Svc')
    .replace(/\bSystems\b/gi, 'Sys')
    // Loại bỏ khoảng trắng thừa
    .replace(/\s+/g, ' ')
    .trim()

  return abbreviated
}

// Function to get display name with optional max length
export const getDisplayCompanyName = (companyName, maxLength = 50) => {
  const abbreviated = abbreviateCompanyName(companyName)
  
  // Viết hoa toàn bộ tên công ty để đồng nhất
  const upperCased = abbreviated.toUpperCase()
  
  if (upperCased.length <= maxLength) {
    return upperCased
  }
  
  // Nếu vẫn quá dài, cắt ngắn và thêm "..."
  return upperCased.substring(0, maxLength - 3) + '...'
}

// Function to get tooltip text (full original name)
export const getTooltipCompanyName = (companyName) => {
  return companyName || ''
}