import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NotificationProvider,
  useNotifications,
  withNotifications,
  useAsyncOperation
} from '../NotificationSystem';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className, ...props }) => (
    <div data-testid="check-circle-icon" className={className} {...props} />
  ),
  XCircle: ({ className, ...props }) => (
    <div data-testid="x-circle-icon" className={className} {...props} />
  ),
  AlertTriangle: ({ className, ...props }) => (
    <div data-testid="alert-triangle-icon" className={className} {...props} />
  ),
  Info: ({ className, ...props }) => (
    <div data-testid="info-icon" className={className} {...props} />
  ),
  X: ({ className, ...props }) => (
    <div data-testid="x-icon" className={className} {...props} />
  )
}));

// Test component that uses notifications
const TestComponent = () => {
  const { addNotification, removeNotification, clearNotifications } = useNotifications();
  
  return (
    <div>
      <button 
        onClick={() => addNotification('success', 'Success message')}
        data-testid="add-success"
      >
        Add Success
      </button>
      <button 
        onClick={() => addNotification('error', 'Error message')}
        data-testid="add-error"
      >
        Add Error
      </button>
      <button 
        onClick={() => addNotification('warning', 'Warning message')}
        data-testid="add-warning"
      >
        Add Warning
      </button>
      <button 
        onClick={() => addNotification('info', 'Info message')}
        data-testid="add-info"
      >
        Add Info
      </button>
      <button 
        onClick={() => addNotification('success', 'Persistent message', { duration: null })}
        data-testid="add-persistent"
      >
        Add Persistent
      </button>
      <button 
        onClick={clearNotifications}
        data-testid="clear-all"
      >
        Clear All
      </button>
    </div>
  );
};

// Test component with HOC
const TestComponentWithHOC = withNotifications(({ notifications }) => (
  <div>
    <span data-testid="hoc-component">HOC Component</span>
    <button 
      onClick={() => notifications.addNotification('success', 'HOC Success')}
      data-testid="hoc-add-success"
    >
      Add Success via HOC
    </button>
  </div>
));

// Test component for async operations
const AsyncTestComponent = () => {
  const executeAsync = useAsyncOperation();
  
  const handleSuccess = () => {
    executeAsync(
      () => Promise.resolve('Success result'),
      'Operation completed successfully',
      'Operation failed'
    );
  };
  
  const handleError = () => {
    executeAsync(
      () => Promise.reject(new Error('Test error')),
      'This should not show',
      'Operation failed with error'
    );
  };
  
  return (
    <div>
      <button onClick={handleSuccess} data-testid="async-success">
        Async Success
      </button>
      <button onClick={handleError} data-testid="async-error">
        Async Error
      </button>
    </div>
  );
};

// Test wrapper
const TestWrapper = ({ children }) => (
  <NotificationProvider>
    {children}
  </NotificationProvider>
);

describe('NotificationSystem', () => {
  beforeEach(() => {
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('NotificationProvider', () => {
    it('renders children without notifications', () => {
      render(
        <TestWrapper>
          <div data-testid="test-child">Test Child</div>
        </TestWrapper>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders notification container when notifications exist', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  describe('Notification Types', () => {
    it('displays success notification with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveClass('bg-green-50', 'border-green-200');
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('displays error notification with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-error'));
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveClass('bg-red-50', 'border-red-200');
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('displays warning notification with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-warning'));
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveClass('bg-yellow-50', 'border-yellow-200');
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('displays info notification with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-info'));
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveClass('bg-blue-50', 'border-blue-200');
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  describe('Notification Behavior', () => {
    it('auto-removes notifications after default duration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      // Fast-forward time by 5 seconds (default duration)
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });

    it('does not auto-remove persistent notifications', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-persistent'));
      
      expect(screen.getByText('Persistent message')).toBeInTheDocument();
      
      // Fast-forward time by 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should still be there
      expect(screen.getByText('Persistent message')).toBeInTheDocument();
    });

    it('removes notification when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });

    it('clears all notifications when clearNotifications is called', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Add multiple notifications
      await user.click(screen.getByTestId('add-success'));
      await user.click(screen.getByTestId('add-error'));
      await user.click(screen.getByTestId('add-warning'));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('clear-all'));
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
        expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Notifications', () => {
    it('displays multiple notifications in stack', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      await user.click(screen.getByTestId('add-error'));
      await user.click(screen.getByTestId('add-warning'));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      
      const notifications = screen.getAllByRole('alert');
      expect(notifications).toHaveLength(3);
    });

    it('limits the number of notifications displayed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Add more than the limit (assuming limit is 5)
      for (let i = 0; i < 7; i++) {
        await user.click(screen.getByTestId('add-success'));
      }
      
      const notifications = screen.getAllByRole('alert');
      expect(notifications.length).toBeLessThanOrEqual(5);
    });
  });

  describe('withNotifications HOC', () => {
    it('provides notifications prop to wrapped component', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponentWithHOC />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('hoc-component')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('hoc-add-success'));
      
      expect(screen.getByText('HOC Success')).toBeInTheDocument();
    });
  });

  describe('useAsyncOperation Hook', () => {
    it('shows success notification on successful async operation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <AsyncTestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('async-success'));
      
      await waitFor(() => {
        expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
      });
    });

    it('shows error notification on failed async operation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <AsyncTestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('async-error'));
      
      await waitFor(() => {
        expect(screen.getByText('Operation failed with error')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('notifications have proper ARIA attributes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveAttribute('role', 'alert');
      expect(notification).toHaveAttribute('aria-live', 'polite');
    });

    it('close button has proper accessibility attributes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toHaveAttribute('aria-label', 'Đóng thông báo');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      const closeButton = screen.getByTestId('x-icon').closest('button');
      
      // Tab to close button
      closeButton.focus();
      expect(closeButton).toHaveFocus();
      
      // Press Enter to close
      fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Animation and Transitions', () => {
    it('applies enter animation classes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await user.click(screen.getByTestId('add-success'));
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveClass('transform', 'transition-all', 'duration-300');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid notification types gracefully', async () => {
      const TestComponentWithInvalidType = () => {
        const { addNotification } = useNotifications();
        
        return (
          <button 
            onClick={() => addNotification('invalid', 'Invalid type message')}
            data-testid="add-invalid"
          >
            Add Invalid
          </button>
        );
      };
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponentWithInvalidType />
        </TestWrapper>
      );
      
      // Should not crash when invalid type is used
      await user.click(screen.getByTestId('add-invalid'));
      
      // Should still display the notification (probably with default styling)
      expect(screen.getByText('Invalid type message')).toBeInTheDocument();
    });

    it('handles missing notification context gracefully', () => {
      // Component without NotificationProvider
      const ComponentWithoutProvider = () => {
        try {
          const { addNotification } = useNotifications();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error-caught">Error caught</div>;
        }
      };
      
      render(<ComponentWithoutProvider />);
      
      expect(screen.getByTestId('error-caught')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', async () => {
      const renderCount = jest.fn();
      
      const TestComponentWithRenderCount = () => {
        renderCount();
        const { addNotification } = useNotifications();
        
        return (
          <button 
            onClick={() => addNotification('success', 'Test')}
            data-testid="add-test"
          >
            Add Test
          </button>
        );
      };
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponentWithRenderCount />
        </TestWrapper>
      );
      
      const initialRenderCount = renderCount.mock.calls.length;
      
      await user.click(screen.getByTestId('add-test'));
      
      // Should not cause unnecessary re-renders of the component
      expect(renderCount.mock.calls.length).toBe(initialRenderCount);
    });
  });
});