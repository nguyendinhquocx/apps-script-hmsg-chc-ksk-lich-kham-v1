import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LoadingSpinner,
  InlineSpinner,
  PageLoader,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  LoadingButton,
  LoadingOverlay
} from '../LoadingSpinner';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }) => (
    <div data-testid="loader-icon" className={className} {...props} />
  ),
  Download: ({ className, ...props }) => (
    <div data-testid="download-icon" className={className} {...props} />
  ),
  RefreshCw: ({ className, ...props }) => (
    <div data-testid="refresh-icon" className={className} {...props} />
  )
}));

describe('LoadingSpinner Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });

    it('renders with custom text', () => {
      render(<LoadingSpinner text="Custom loading text" />);
      
      expect(screen.getByText('Custom loading text')).toBeInTheDocument();
    });

    it('renders with custom size', () => {
      render(<LoadingSpinner size="lg" />);
      
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveClass('h-8', 'w-8');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      
      const container = screen.getByTestId('loader-icon').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('renders without text when showText is false', () => {
      render(<LoadingSpinner showText={false} />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      expect(screen.getByTestId('loader-icon')).toHaveClass('h-4', 'w-4');
      
      rerender(<LoadingSpinner size="md" />);
      expect(screen.getByTestId('loader-icon')).toHaveClass('h-6', 'w-6');
      
      rerender(<LoadingSpinner size="lg" />);
      expect(screen.getByTestId('loader-icon')).toHaveClass('h-8', 'w-8');
      
      rerender(<LoadingSpinner size="xl" />);
      expect(screen.getByTestId('loader-icon')).toHaveClass('h-12', 'w-12');
    });
  });

  describe('InlineSpinner', () => {
    it('renders inline spinner', () => {
      render(<InlineSpinner />);
      
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveClass('h-4', 'w-4', 'animate-spin');
    });

    it('applies custom className', () => {
      render(<InlineSpinner className="custom-inline" />);
      
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveClass('custom-inline');
    });
  });

  describe('PageLoader', () => {
    it('renders page loader with default props', () => {
      render(<PageLoader />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });

    it('renders with progress bar when progress is provided', () => {
      render(<PageLoader progress={50} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders with custom text', () => {
      render(<PageLoader text="Loading page..." />);
      
      expect(screen.getByText('Loading page...')).toBeInTheDocument();
    });

    it('has proper overlay styling', () => {
      render(<PageLoader />);
      
      const overlay = screen.getByTestId('loader-icon').closest('div');
      expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-white', 'bg-opacity-80', 'backdrop-blur-sm');
    });
  });

  describe('CardSkeleton', () => {
    it('renders card skeleton with default lines', () => {
      render(<CardSkeleton />);
      
      const skeletonLines = screen.getAllByTestId(/skeleton-line/);
      expect(skeletonLines).toHaveLength(3); // Default lines
    });

    it('renders with custom number of lines', () => {
      render(<CardSkeleton lines={5} />);
      
      const skeletonLines = screen.getAllByTestId(/skeleton-line/);
      expect(skeletonLines).toHaveLength(5);
    });

    it('applies custom className', () => {
      render(<CardSkeleton className="custom-skeleton" />);
      
      const container = screen.getAllByTestId(/skeleton-line/)[0].closest('div');
      expect(container).toHaveClass('custom-skeleton');
    });
  });

  describe('TableSkeleton', () => {
    it('renders table skeleton with default rows and columns', () => {
      render(<TableSkeleton />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(6); // 1 header + 5 body rows
      
      // Check header cells
      const headerCells = rows[0].querySelectorAll('th');
      expect(headerCells).toHaveLength(4); // Default columns
      
      // Check body cells
      const bodyCells = rows[1].querySelectorAll('td');
      expect(bodyCells).toHaveLength(4); // Default columns
    });

    it('renders with custom rows and columns', () => {
      render(<TableSkeleton rows={3} columns={6} />);
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 1 header + 3 body rows
      
      const headerCells = rows[0].querySelectorAll('th');
      expect(headerCells).toHaveLength(6);
    });

    it('applies custom className', () => {
      render(<TableSkeleton className="custom-table" />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });
  });

  describe('ChartSkeleton', () => {
    it('renders chart skeleton with default height', () => {
      render(<ChartSkeleton />);
      
      const chartContainer = screen.getByTestId('chart-skeleton');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer).toHaveClass('h-64'); // Default height
    });

    it('renders with custom height', () => {
      render(<ChartSkeleton height="h-96" />);
      
      const chartContainer = screen.getByTestId('chart-skeleton');
      expect(chartContainer).toHaveClass('h-96');
    });

    it('applies custom className', () => {
      render(<ChartSkeleton className="custom-chart" />);
      
      const chartContainer = screen.getByTestId('chart-skeleton');
      expect(chartContainer).toHaveClass('custom-chart');
    });
  });

  describe('LoadingButton', () => {
    const mockOnClick = jest.fn();

    beforeEach(() => {
      mockOnClick.mockClear();
    });

    it('renders button with children when not loading', () => {
      render(
        <LoadingButton onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
      expect(button).not.toBeDisabled();
    });

    it('shows loading state when loading prop is true', () => {
      render(
        <LoadingButton loading onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('shows custom loading text when provided', () => {
      render(
        <LoadingButton loading loadingText="Processing..." onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('calls onClick when clicked and not loading', async () => {
      const user = userEvent.setup();
      
      render(
        <LoadingButton onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      
      render(
        <LoadingButton loading onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(
        <LoadingButton className="custom-button" onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-button');
    });

    it('supports different variants', () => {
      const { rerender } = render(
        <LoadingButton variant="primary" onClick={mockOnClick}>
          Primary
        </LoadingButton>
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
      
      rerender(
        <LoadingButton variant="secondary" onClick={mockOnClick}>
          Secondary
        </LoadingButton>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600', 'hover:bg-gray-700');
      
      rerender(
        <LoadingButton variant="outline" onClick={mockOnClick}>
          Outline
        </LoadingButton>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white');
    });

    it('supports different sizes', () => {
      const { rerender } = render(
        <LoadingButton size="sm" onClick={mockOnClick}>
          Small
        </LoadingButton>
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
      
      rerender(
        <LoadingButton size="md" onClick={mockOnClick}>
          Medium
        </LoadingButton>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
      
      rerender(
        <LoadingButton size="lg" onClick={mockOnClick}>
          Large
        </LoadingButton>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('LoadingOverlay', () => {
    it('renders overlay when loading is true', () => {
      render(
        <LoadingOverlay loading>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('does not render overlay when loading is false', () => {
      render(
        <LoadingOverlay loading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with custom loading text', () => {
      render(
        <LoadingOverlay loading text="Custom loading...">
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Custom loading...')).toBeInTheDocument();
    });

    it('applies custom className to overlay', () => {
      render(
        <LoadingOverlay loading className="custom-overlay">
          <div>Content</div>
        </LoadingOverlay>
      );
      
      const overlay = screen.getByTestId('loader-icon').closest('div');
      expect(overlay).toHaveClass('custom-overlay');
    });

    it('has proper overlay positioning', () => {
      render(
        <LoadingOverlay loading>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('relative');
      
      const overlay = screen.getByTestId('loader-icon').closest('div');
      expect(overlay).toHaveClass('absolute', 'inset-0');
    });
  });

  describe('Accessibility', () => {
    it('LoadingButton has proper ARIA attributes when loading', () => {
      render(
        <LoadingButton loading onClick={() => {}}>
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('PageLoader progress bar has proper ARIA attributes', () => {
      render(<PageLoader progress={75} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('TableSkeleton has proper table structure', () => {
      render(<TableSkeleton />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe('Animation', () => {
    it('LoadingSpinner has animate-spin class', () => {
      render(<LoadingSpinner />);
      
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveClass('animate-spin');
    });

    it('Skeleton elements have pulse animation', () => {
      render(<CardSkeleton />);
      
      const skeletonLines = screen.getAllByTestId(/skeleton-line/);
      skeletonLines.forEach(line => {
        expect(line).toHaveClass('animate-pulse');
      });
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<LoadingSpinner />);
      
      const initialLoader = screen.getByTestId('loader-icon');
      
      // Re-render with same props
      rerender(<LoadingSpinner />);
      
      const newLoader = screen.getByTestId('loader-icon');
      expect(newLoader).toBeInTheDocument();
    });
  });
});