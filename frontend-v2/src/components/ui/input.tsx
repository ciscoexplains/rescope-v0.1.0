import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, fullWidth = false, ...props }, ref) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            block rounded-lg border-gray-300 bg-white border outline-none
            focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
            disabled:bg-gray-100 disabled:cursor-not-allowed
            px-4 py-2 text-[var(--color-text-main)] placeholder-gray-400
            transition-all duration-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
