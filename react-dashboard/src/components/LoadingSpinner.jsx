import React from 'react';
import { Loader2 } from 'lucide-react';

// Main loading spinner component
const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Đang tải...', 
  className = '',
  showText = true,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'text-blue-600',
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 
          className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`} 
        />
        {showText && text && (
          <p className={`text-sm ${variantClasses[variant]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

// Inline spinner for buttons
export const InlineSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
};

// Full page loading overlay
export const PageLoader = ({ 
  text = 'Đang tải dữ liệu...', 
  subText = '',
  showProgress = false,
  progress = 0
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" text={text} variant="primary" />
        
        {subText && (
          <p className="text-sm text-gray-500 mt-2">
            {subText}
          </p>
        )}
        
        {showProgress && (
          <div className="mt-4 w-64">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Card loading skeleton
export const CardSkeleton = ({ rows = 3, showAvatar = false }) => {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        {showAvatar && (
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Table loading skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      {/* Table header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-300 rounded"></div>
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4 mb-3" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Chart loading skeleton
export const ChartSkeleton = ({ height = 300 }) => {
  return (
    <div className="animate-pulse">
      <div className="flex items-end justify-center space-x-2" style={{ height }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={index}
            className="bg-gray-300 rounded-t"
            style={{ 
              width: '20px',
              height: `${Math.random() * 80 + 20}%`
            }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 rounded w-1/4 mx-auto"></div>
        <div className="h-2 bg-gray-200 rounded w-1/6 mx-auto"></div>
      </div>
    </div>
  );
};

// Loading button state
export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Đang xử lý...', 
  className = '',
  disabled = false,
  ...props 
}) => {
  return (
    <button 
      className={`btn ${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <InlineSpinner className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Loading overlay for specific components
export const LoadingOverlay = ({ 
  loading = false, 
  children, 
  text = 'Đang tải...', 
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
          <LoadingSpinner text={text} size="md" />
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;