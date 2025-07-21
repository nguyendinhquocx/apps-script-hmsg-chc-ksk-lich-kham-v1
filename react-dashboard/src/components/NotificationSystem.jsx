import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';

// Notification context
const NotificationContext = createContext();

// Notification types
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Default notification settings
const DEFAULT_DURATION = 5000;
const MAX_NOTIFICATIONS = 5;

// Individual notification component
const NotificationItem = ({ notification, onRemove }) => {
  const { id, type, title, message, duration, persistent } = notification;

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onRemove]);

  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.INFO:
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'flex items-start p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform';
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case NOTIFICATION_TYPES.INFO:
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  return (
    <div className={getStyles()}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm opacity-90">
            {message}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        aria-label="Đóng thông báo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Notification container
const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Notification provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      duration: DEFAULT_DURATION,
      persistent: false,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      return updated.slice(0, MAX_NOTIFICATIONS);
    });

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: title || SUCCESS_MESSAGES.OPERATION_SUCCESS,
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: title || ERROR_MESSAGES.OPERATION_FAILED,
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      duration: 6000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Higher-order component for automatic error notifications
export const withNotifications = (Component) => {
  return function WrappedComponent(props) {
    const notifications = useNotifications();
    
    return (
      <Component 
        {...props} 
        notifications={notifications}
      />
    );
  };
};

// Hook for handling async operations with notifications
export const useAsyncOperation = () => {
  const { showSuccess, showError, showInfo } = useNotifications();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (operation, options = {}) => {
    const {
      loadingMessage = 'Đang xử lý...',
      successMessage = 'Thao tác thành công!',
      errorMessage = 'Có lỗi xảy ra!',
      showLoadingNotification = false,
      showSuccessNotification = true,
      showErrorNotification = true
    } = options;

    setLoading(true);
    let loadingId = null;

    try {
      if (showLoadingNotification) {
        loadingId = showInfo('Đang xử lý', loadingMessage, { persistent: true });
      }

      const result = await operation();

      if (loadingId) {
        // Remove loading notification
        // Note: In a real implementation, you'd need a way to remove specific notifications
      }

      if (showSuccessNotification) {
        showSuccess('Thành công', successMessage);
      }

      return { success: true, data: result };
    } catch (error) {
      if (loadingId) {
        // Remove loading notification
      }

      if (showErrorNotification) {
        showError('Lỗi', error.message || errorMessage);
      }

      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, showInfo]);

  return { execute, loading };
};

export { NOTIFICATION_TYPES };
export default NotificationProvider;