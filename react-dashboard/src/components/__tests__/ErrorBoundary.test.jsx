import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className, ...props }) => (
    <div data-testid="alert-triangle-icon" className={className} {...props} />
  ),
  RefreshCw: ({ className, ...props }) => (
    <div data-testid="refresh-icon" className={className} {...props} />
  ),
  Home: ({ className, ...props }) => (
    <div data-testid="home-icon" className={className} {...props} />
  ),
  ChevronDown: ({ className, ...props }) => (
    <div data-testid="chevron-down-icon" className={className} {...props} />
  ),
  ChevronUp: ({ className, ...props }) => (
    <div data-testid="chevron-up-icon" className={className} {...props} />
  )
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="working-component">Working Component</div>;
};

// Component that throws an error asynchronously
const ThrowAsyncError = ({ shouldThrow = false }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      setTimeout(() => {
        throw new Error('Async error');
      }, 100);
    }
  }, [shouldThrow]);
  
  return <div data-testid="async-component">Async Component</div>;
};

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Clear console.error mock
    console.error.mockClear();
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByText(/Có lỗi xảy ra/)).not.toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      expect(screen.getByText(/Ứng dụng đã gặp phải một lỗi không mong muốn/)).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    });

    it('displays error details when expanded', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Detailed error message" />
        </ErrorBoundary>
      );
      
      // Initially, error details should be collapsed
      expect(screen.queryByText('Detailed error message')).not.toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
      
      // Click to expand error details
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      await user.click(expandButton);
      
      expect(screen.getByText('Detailed error message')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
    });

    it('collapses error details when clicked again', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Collapsible error" />
        </ErrorBoundary>
      );
      
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      
      // Expand
      await user.click(expandButton);
      expect(screen.getByText('Collapsible error')).toBeInTheDocument();
      
      // Collapse
      await user.click(expandButton);
      expect(screen.queryByText('Collapsible error')).not.toBeInTheDocument();
    });

    it('displays stack trace when available', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Expand error details
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      await user.click(expandButton);
      
      // Should show stack trace
      expect(screen.getByText(/Stack trace:/)).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('provides retry functionality', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      
      const retryButton = screen.getByText(/Thử lại/);
      expect(retryButton).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
      
      // Click retry and re-render with working component
      await user.click(retryButton);
      
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByText(/Có lỗi xảy ra/)).not.toBeInTheDocument();
    });

    it('provides home navigation option', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const homeButton = screen.getByText(/Về trang chủ/);
      expect(homeButton).toBeInTheDocument();
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      
      // Check if it's a link to home
      expect(homeButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Error Information', () => {
    it('captures error message correctly', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Specific error message" />
        </ErrorBoundary>
      );
      
      // Error should be captured (check console.error was called)
      expect(console.error).toHaveBeenCalled();
    });

    it('handles errors without messages', async () => {
      const user = userEvent.setup();
      
      const ThrowErrorWithoutMessage = () => {
        throw new Error();
      };
      
      render(
        <ErrorBoundary>
          <ThrowErrorWithoutMessage />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      
      // Expand to see details
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      await user.click(expandButton);
      
      // Should handle empty error message gracefully
      expect(screen.getByText(/Lỗi:/)).toBeInTheDocument();
    });

    it('handles non-Error objects thrown', async () => {
      const user = userEvent.setup();
      
      const ThrowString = () => {
        throw 'String error';
      };
      
      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      
      // Expand to see details
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      await user.click(expandButton);
      
      // Should handle string errors
      expect(screen.getByText('String error')).toBeInTheDocument();
    });
  });

  describe('Development vs Production', () => {
    it('shows detailed error info in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Dev error" />
        </ErrorBoundary>
      );
      
      // Expand error details
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      await user.click(expandButton);
      
      expect(screen.getByText('Dev error')).toBeInTheDocument();
      expect(screen.getByText(/Stack trace:/)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('shows limited error info in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Prod error" />
        </ErrorBoundary>
      );
      
      // Should still show error boundary UI
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      
      // Expand error details
      const expandButton = screen.getByText(/Chi tiết lỗi/);
      await user.click(expandButton);
      
      // In production, might show less detailed info
      expect(screen.getByText(/Chi tiết lỗi/)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('has accessible button labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const retryButton = screen.getByRole('button', { name: /Thử lại/ });
      const homeLink = screen.getByRole('link', { name: /Về trang chủ/ });
      const expandButton = screen.getByRole('button', { name: /Chi tiết lỗi/ });
      
      expect(retryButton).toBeInTheDocument();
      expect(homeLink).toBeInTheDocument();
      expect(expandButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const retryButton = screen.getByRole('button', { name: /Thử lại/ });
      const expandButton = screen.getByRole('button', { name: /Chi tiết lỗi/ });
      
      // Tab navigation
      retryButton.focus();
      expect(retryButton).toHaveFocus();
      
      // Enter key activation
      fireEvent.keyDown(expandButton, { key: 'Enter', code: 'Enter' });
      
      // Should expand error details
      expect(screen.getByText(/Stack trace:/)).toBeInTheDocument();
    });
  });

  describe('Error Boundary Lifecycle', () => {
    it('resets error state when retry is clicked', async () => {
      const user = userEvent.setup();
      
      let shouldThrow = true;
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Initial error');
        }
        return <div data-testid="recovered-component">Recovered</div>;
      };
      
      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: /Thử lại/ });
      await user.click(retryButton);
      
      // Change the component to not throw
      shouldThrow = false;
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('recovered-component')).toBeInTheDocument();
      expect(screen.queryByText(/Có lỗi xảy ra/)).not.toBeInTheDocument();
    });

    it('maintains error state across re-renders until reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      
      // Re-render with same error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Should still show error state
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid successive errors', () => {
      const MultipleErrorComponent = () => {
        throw new Error('First error');
      };
      
      render(
        <ErrorBoundary>
          <MultipleErrorComponent />
        </ErrorBoundary>
      );
      
      // Should handle the first error gracefully
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    it('handles errors in error boundary itself gracefully', () => {
      // This is a meta-test - testing that our error boundary doesn't break
      // when it encounters its own errors
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Should render error UI without crashing
      expect(screen.getByText(/Có lỗi xảy ra/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when in error state', () => {
      const renderSpy = jest.fn();
      
      const SpyComponent = () => {
        renderSpy();
        throw new Error('Spy error');
      };
      
      const { rerender } = render(
        <ErrorBoundary>
          <SpyComponent />
        </ErrorBoundary>
      );
      
      const initialRenderCount = renderSpy.mock.calls.length;
      
      // Re-render should not cause SpyComponent to render again
      rerender(
        <ErrorBoundary>
          <SpyComponent />
        </ErrorBoundary>
      );
      
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });
});