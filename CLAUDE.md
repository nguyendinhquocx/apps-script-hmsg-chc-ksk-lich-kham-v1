# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React dashboard application for managing and visualizing healthcare examination schedules ("Lịch Khám") for HMSG CHC. The application connects to a Supabase database that is synchronized from Google Sheets via Apps Script.

## Common Development Commands

```bash
# Development
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code with ESLint
```

## Key Architecture Components

### Frontend Stack
- **React 18** with functional components and hooks
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling with custom theme configuration
- **Recharts** for data visualization and charts
- **Lucide React** for icons

### Data Layer
- **Supabase** as the backend database (`lich_kham` table)
- **LichKhamService** class in `src/services/supabase.js` handles all API interactions
- Environment variables required: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Component Architecture
- **Dashboard.jsx** - Main component with tab navigation (table, charts, benchmark)
- **DataTable.jsx** - Paginated data table with filtering and export
- **Charts.jsx** - Statistics visualization with multiple chart types
- **Benchmark.jsx** - Clinical data analysis and benchmarking
- **GlobalFilters.jsx** - Shared filtering controls across views

### Data Processing
- Custom hooks in `src/hooks/` for data management:
  - `useAppData.js` - Main data fetching and state management
  - `useTableData.js` - Table-specific data handling with pagination
  - `useChartsData.js` - Chart data processing and aggregation
  - `useBenchmarkData.js` - Benchmark calculations for clinical data

### Utilities
- `src/utils/parseUtils.js` - Parsing logic for exam schedule formats
- `src/utils/examUtils.js` - Exam data processing and calculations
- `src/utils/vietnamese.js` - Vietnamese language and date utilities
- `src/utils/companyName.js` - Company name standardization

## Database Schema

The application works with the `lich_kham` table containing Vietnamese column names:
- `"ten cong ty"` - Company name
- `"ngay bat dau kham"` - Exam start date
- `"ngay ket thuc kham"` - Exam end date  
- `"so nguoi kham"` - Number of people examined
- `"trang thai kham"` - Exam status
- `"ten nhan vien"` - Employee name
- `"cac ngay kham thuc te"` - Actual exam dates (special format)
- Clinical fields like `sieuam_bung_sang`, `kham_phu_khoa_chieu` etc.

## Data Input Format

The system uses a special format for exam dates in the `"cac ngay kham thuc te"` field:
- Format: `MM/dd (morning_count, afternoon_count)`
- Example: `8/14 (4,14), 8/15 (10,8)` means Aug 14 had 4 morning + 14 afternoon, Aug 15 had 10 morning + 8 afternoon
- See `HUONG_DAN_NHAP_DU_LIEU.md` for complete input guidelines

## Key Features

1. **Data Table View**: Paginated table with search, filtering, and CSV/Excel export
2. **Charts View**: Statistical visualizations including pie charts, bar charts, and trend lines
3. **Benchmark View**: Clinical data analysis with specialized charts for different medical procedures
4. **Export Functionality**: CSV and Excel export capabilities for all data views
5. **Real-time Filtering**: Global filters that work across all views

## Development Notes

- The app runs on port 3000 (configured in vite.config.js)
- Build output goes to `dist/` directory
- Public assets are served from `image/` directory
- Vietnamese column names in database require quoted identifiers in queries
- RLS (Row Level Security) may be enabled on Supabase, affecting count queries
- Debug files in root (test_*.js) are for data processing logic testing

## Environment Setup

Required environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Integration with Apps Script

The dashboard reads data synchronized from Google Sheets by Apps Script:
- Data flows: Google Sheets → Apps Script → Supabase → React Dashboard
- Sync frequency: Every 15 minutes via Apps Script triggers
- Data processing includes parsing special date formats and clinical data normalization