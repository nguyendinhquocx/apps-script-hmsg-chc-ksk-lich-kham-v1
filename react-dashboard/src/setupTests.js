// Jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.REACT_APP_DEBUG_LOGS = 'false';
process.env.REACT_APP_API_TIMEOUT = '10000';
process.env.REACT_APP_MAX_RECORDS_PER_PAGE = '1000';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn()
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn()
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods in test environment
if (process.env.NODE_ENV === 'test') {
  // Suppress console.log in tests unless explicitly needed
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Mock Recharts ResponsiveContainer
jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }) => children,
  PieChart: () => 'PieChart',
  Cell: () => 'Cell',
  BarChart: () => 'BarChart',
  Bar: () => 'Bar',
  XAxis: () => 'XAxis',
  YAxis: () => 'YAxis',
  CartesianGrid: () => 'CartesianGrid',
  Tooltip: () => 'Tooltip',
  LineChart: () => 'LineChart',
  Line: () => 'Line'
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: () => 'Search',
  Download: () => 'Download',
  RefreshCw: () => 'RefreshCw',
  ChevronLeft: () => 'ChevronLeft',
  ChevronRight: () => 'ChevronRight',
  AlertCircle: () => 'AlertCircle',
  CheckCircle: () => 'CheckCircle',
  XCircle: () => 'XCircle',
  Info: () => 'Info',
  X: () => 'X',
  Loader2: () => 'Loader2',
  Calendar: () => 'Calendar',
  User: () => 'User',
  Building: () => 'Building',
  TrendingUp: () => 'TrendingUp',
  Users: () => 'Users',
  FileText: () => 'FileText',
  BarChart3: () => 'BarChart3',
  PieChart: () => 'PieChart',
  Activity: () => 'Activity'
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
          }))
        }))
      }))
    }))
  }))
}));

// Global test utilities
global.testUtils = {
  // Helper to create mock data
  createMockAppointment: (overrides = {}) => ({
    id: 1,
    patient_name: 'Test Patient',
    appointment_date: '2024-01-15',
    appointment_time: '10:00',
    status: 'confirmed',
    employee_name: 'Dr. Test',
    company_name: 'Test Company',
    gold_member: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Helper to create mock statistics
  createMockStatistics: (overrides = {}) => ({
    statusCounts: {
      confirmed: 10,
      pending: 5,
      cancelled: 2
    },
    topCompanies: [
      { company_name: 'Company A', count: 15 },
      { company_name: 'Company B', count: 10 }
    ],
    monthlyStats: [
      { month: '2024-01', count: 25 },
      { month: '2024-02', count: 30 }
    ],
    rateLimitInfo: {
      remaining: 100,
      reset: Date.now() + 3600000
    },
    ...overrides
  }),
  
  // Helper to wait for async operations
  waitFor: (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = callback();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 10);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 10);
          }
        }
      };
      check();
    });
  }
};

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});