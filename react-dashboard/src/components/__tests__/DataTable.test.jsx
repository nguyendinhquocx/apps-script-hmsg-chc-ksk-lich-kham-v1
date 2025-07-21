import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from '../DataTable';
import { NotificationProvider } from '../NotificationSystem';
import { ErrorBoundary } from '../ErrorBoundary';
import * as supabaseService from '../../services/supabase';

// Mock the supabase service
jest.mock('../../services/supabase');

// Mock data
const mockAppointments = [
  {
    id: 1,
    patient_name: 'John Doe',
    appointment_date: '2024-01-15',
    appointment_time: '10:00',
    status: 'confirmed',
    employee_name: 'Dr. Smith',
    company_name: 'ABC Corp',
    gold_member: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    patient_name: 'Jane Smith',
    appointment_date: '2024-01-16',
    appointment_time: '14:30',
    status: 'pending',
    employee_name: 'Dr. Johnson',
    company_name: 'XYZ Ltd',
    gold_member: false,
    created_at: '2024-01-02T00:00:00Z'
  }
];

const mockStatistics = {
  data: mockAppointments,
  count: 2,
  rateLimitInfo: {
    remaining: 100,
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

describe('DataTable Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation
    supabaseService.getAppointments.mockResolvedValue(mockStatistics);
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      expect(screen.getByText('Quản lý lịch khám')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('displays data after loading', async () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('displays correct table headers', async () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Tên bệnh nhân')).toBeInTheDocument();
        expect(screen.getByText('Ngày khám')).toBeInTheDocument();
        expect(screen.getByText('Giờ khám')).toBeInTheDocument();
        expect(screen.getByText('Trạng thái')).toBeInTheDocument();
        expect(screen.getByText('Bác sĩ')).toBeInTheDocument();
        expect(screen.getByText('Công ty')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters data based on search input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find and interact with search input
      const searchInput = screen.getByPlaceholderText('Tìm kiếm bệnh nhân...');
      await user.type(searchInput, 'John');
      
      // Verify search was called with debounced input
      await waitFor(() => {
        expect(supabaseService.getAppointments).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'John'
          })
        );
      }, { timeout: 1000 });
    });

    it('clears search when input is empty', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Tìm kiếm bệnh nhân...');
      
      // Type and then clear
      await user.type(searchInput, 'John');
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(supabaseService.getAppointments).toHaveBeenCalledWith(
          expect.objectContaining({
            search: ''
          })
        );
      });
    });
  });

  describe('Filtering', () => {
    it('filters by status', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find status filter dropdown
      const statusFilter = screen.getByDisplayValue('Tất cả trạng thái');
      await user.selectOptions(statusFilter, 'confirmed');
      
      expect(supabaseService.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed'
        })
      );
    });

    it('filters by employee', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const employeeFilter = screen.getByDisplayValue('Tất cả bác sĩ');
      await user.selectOptions(employeeFilter, 'Dr. Smith');
      
      expect(supabaseService.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          employee: 'Dr. Smith'
        })
      );
    });

    it('filters by gold member status', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const goldFilter = screen.getByDisplayValue('Tất cả');
      await user.selectOptions(goldFilter, 'true');
      
      expect(supabaseService.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          goldFilter: 'true'
        })
      );
    });
  });

  describe('Pagination', () => {
    it('changes page when pagination buttons are clicked', async () => {
      const user = userEvent.setup();
      
      // Mock data with more items to enable pagination
      const mockLargeDataset = {
        ...mockStatistics,
        count: 50
      };
      supabaseService.getAppointments.mockResolvedValue(mockLargeDataset);
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find and click next page button
      const nextButton = screen.getByTitle('Trang tiếp theo');
      await user.click(nextButton);
      
      expect(supabaseService.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });

    it('changes items per page', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const pageSizeSelect = screen.getByDisplayValue('10');
      await user.selectOptions(pageSizeSelect, '25');
      
      expect(supabaseService.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
          page: 1 // Should reset to first page
        })
      );
    });
  });

  describe('Export Functionality', () => {
    it('exports data when export button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock successful export
      supabaseService.exportAppointments.mockResolvedValue({
        data: mockAppointments,
        filename: 'appointments_export.csv'
      });
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByText('Xuất dữ liệu');
      await user.click(exportButton);
      
      expect(supabaseService.exportAppointments).toHaveBeenCalled();
    });

    it('shows loading state during export', async () => {
      const user = userEvent.setup();
      
      // Mock delayed export
      supabaseService.exportAppointments.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByText('Xuất dữ liệu');
      await user.click(exportButton);
      
      expect(screen.getByText('Đang xuất...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when data fetch fails', async () => {
      supabaseService.getAppointments.mockRejectedValue(
        new Error('Network error')
      );
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      });
    });

    it('displays error message when export fails', async () => {
      const user = userEvent.setup();
      
      supabaseService.exportAppointments.mockRejectedValue(
        new Error('Export failed')
      );
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByText('Xuất dữ liệu');
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Xuất dữ liệu thất bại/)).toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('displays correct status badges', async () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Check for confirmed status badge
        const confirmedBadge = screen.getByText('Đã xác nhận');
        expect(confirmedBadge).toBeInTheDocument();
        expect(confirmedBadge).toHaveClass('bg-green-100', 'text-green-800');
        
        // Check for pending status badge
        const pendingBadge = screen.getByText('Chờ xác nhận');
        expect(pendingBadge).toBeInTheDocument();
        expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });
  });

  describe('Gold Member Indicator', () => {
    it('displays gold member indicator for gold members', async () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const goldIndicators = screen.getAllByText('⭐');
        expect(goldIndicators).toHaveLength(1); // Only John Doe is gold member
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(3); // Status, Employee, Gold filters
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DataTable />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Tìm kiếm bệnh nhân...');
      
      // Tab to search input and type
      await user.tab();
      expect(searchInput).toHaveFocus();
      
      await user.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');
    });
  });
});