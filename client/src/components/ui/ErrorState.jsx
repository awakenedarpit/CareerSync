import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable ErrorState Alert & Retry Component
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-6 sm:p-8 rounded-2xl bg-rose-50/50 border border-rose-200 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-rose-900 mb-1">{title}</h3>
      <p className="text-xs text-rose-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={onRetry}
          className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
