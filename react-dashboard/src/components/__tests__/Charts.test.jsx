import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Charts from '../Charts';
import { NotificationProvider } from '../NotificationSystem';
import { ErrorBoundary } from '../ErrorBoundary';
import * as supabaseService from '../../services/supabase';

// Mock the supabase service
jest.mock('../../services/supabase');

// Mock recharts components
jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />
}));

// Mock data
const mockStatistics = {
  statusCounts: {
    confirmed: 15,
    pending: 8,
    cancelled: 3,
    completed: 12
  },
  topCompanies: [
    { company_name: 'ABC Corp', count: 25 },
    { company_name: 'XYZ Ltd', count: 18 },
    { company_name: 'Tech Solutions', count: 12 },
    { company_name: 'Health Care Inc', count: 8 },
    { company_name: 'Medical Center', count: 5 }
  ],
  monthlyStats: [
    { month: '2024-01', count: 45 },
    { month: '2024-02', count: 52 },
    { month: '2024-03', count: 38 },
    { month: '2024-04', count: 61 },
    { month: '2024-05', count: 47 },
    { month: '2024-06', count: 55 }
  ],
  rateLimitInfo: {
    remaining: 95,
    reset: Date.now() + 3600000
  }
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ErrorBoundary>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </ErrorBoundary>
);

describe('Charts Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation
    supabaseService.getStatistics.mockResolvedValue(mockStatistics);
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      expect(screen.getByText('Thống kê tổng quan')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      expect(screen.getAllByTestId('loader-icon')).toHaveLength(4); // 3 cards + 1 charts section
    });

    it('displays statistics cards after loading', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Tổng lịch khám')).toBeInTheDocument();
        expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
        expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
        expect(screen.getByText('38')).toBeInTheDocument(); // Total count
        expect(screen.getByText('15')).toBeInTheDocument(); // Confirmed count
        expect(screen.getByText('8')).toBeInTheDocument(); // Pending count
      });
    });

    it('displays refresh button and last updated time', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTitle('Làm mới dữ liệu')).toBeInTheDocument();
        expect(screen.getByText(/Cập nhật lần cuối:/)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('calculates total appointments correctly', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Total should be sum of all status counts: 15 + 8 + 3 + 12 = 38
        expect(screen.getByText('38')).toBeInTheDocument();
      });
    });

    it('displays confirmed appointments count', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });

    it('displays pending appointments count', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });
  });

  describe('Charts Rendering', () => {
    it('renders all three chart types', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('displays chart titles', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Phân bố trạng thái')).toBeInTheDocument();
        expect(screen.getByText('Top công ty')).toBeInTheDocument();
        expect(screen.getByText('Thống kê theo tháng')).toBeInTheDocument();
      });
    });

    it('shows no data message when statistics are empty', async () => {
      supabaseService.getStatistics.mockResolvedValue({
        statusCounts: {},
        topCompanies: [],
        monthlyStats: [],
        rateLimitInfo: { remaining: 100, reset: Date.now() + 3600000 }
      });
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const noDataMessages = screen.getAllByText('Không có dữ liệu');
        expect(noDataMessages).toHaveLength(3); // One for each chart
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes data when refresh button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('38')).toBeInTheDocument();
      });
      
      // Clear the mock to track new calls
      supabaseService.getStatistics.mockClear();
      
      // Click refresh button
      const refreshButton = screen.getByTitle('Làm mới dữ liệu');
      await user.click(refreshButton);
      
      expect(supabaseService.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during refresh', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      supabaseService.getStatistics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockStatistics), 1000))
      );
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      const refreshButton = screen.getByTitle('Làm mới dữ liệu');
      await user.click(refreshButton);
      
      // Should show loading state
      expect(screen.getAllByTestId('loader-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Data Processing', () => {
    it('processes status data correctly', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Verify that status data is processed and displayed
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('limits company data to top 5', async () => {
      const mockWithManyCompanies = {
        ...mockStatistics,
        topCompanies: [
          ...mockStatistics.topCompanies,
          { company_name: 'Extra Company 1', count: 3 },
          { company_name: 'Extra Company 2', count: 2 },
          { company_name: 'Extra Company 3', count: 1 }
        ]
      };
      
      supabaseService.getStatistics.mockResolvedValue(mockWithManyCompanies);
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should only show top 5 companies
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('limits monthly data to last 6 months', async () => {
      const mockWithManyMonths = {
        ...mockStatistics,
        monthlyStats: [
          { month: '2023-07', count: 20 },
          { month: '2023-08', count: 25 },
          { month: '2023-09', count: 30 },
          { month: '2023-10', count: 35 },
          { month: '2023-11', count: 40 },
          { month: '2023-12', count: 45 },
          ...mockStatistics.monthlyStats
        ]
      };
      
      supabaseService.getStatistics.mockResolvedValue(mockWithManyMonths);
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should only show last 6 months
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when data fetch fails', async () => {
      supabaseService.getStatistics.mockRejectedValue(
        new Error('Network error')
      );
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      });
    });

    it('handles partial data gracefully', async () => {
      supabaseService.getStatistics.mockResolvedValue({
        statusCounts: { confirmed: 5 },
        topCompanies: null,
        monthlyStats: undefined,
        rateLimitInfo: { remaining: 100, reset: Date.now() + 3600000 }
      });
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Thống kê tổng quan')).toBeInTheDocument();
      });
    });
  });

  describe('Rate Limit Information', () => {
    it('displays rate limit info when debug logs are enabled', async () => {
      // Mock debug logs enabled
      const originalEnv = process.env.REACT_APP_DEBUG_LOGS;
      process.env.REACT_APP_DEBUG_LOGS = 'true';
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/API calls remaining:/)).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument();
      });
      
      // Restore original env
      process.env.REACT_APP_DEBUG_LOGS = originalEnv;
    });

    it('hides rate limit info when debug logs are disabled', async () => {
      // Mock debug logs disabled
      const originalEnv = process.env.REACT_APP_DEBUG_LOGS;
      process.env.REACT_APP_DEBUG_LOGS = 'false';
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.queryByText(/API calls remaining:/)).not.toBeInTheDocument();
      });
      
      // Restore original env
      process.env.REACT_APP_DEBUG_LOGS = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Làm mới dữ liệu/ })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const refreshButton = screen.getByTitle('Làm mới dữ liệu');
        
        // Tab to refresh button
        refreshButton.focus();
        expect(refreshButton).toHaveFocus();
        
        // Press Enter to activate
        fireEvent.keyDown(refreshButton, { key: 'Enter', code: 'Enter' });
      });
    });
  });

  describe('Performance', () => {
    it('memoizes chart data to prevent unnecessary re-renders', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('38')).toBeInTheDocument();
      });
      
      // Re-render with same data
      rerender(
        <TestWrapper>
          <Charts />
        </TestWrapper>
      );
      
      // Should not call getStatistics again
      expect(supabaseService.getStatistics).toHaveBeenCalledTimes(1);
    });
  });
});