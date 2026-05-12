import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={`w-full h-10 px-3 bg-white border rounded-md text-sm placeholder:text-neutral-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-neutral-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-neutral-200 hover:border-neutral-300'}
            ${className}`}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
