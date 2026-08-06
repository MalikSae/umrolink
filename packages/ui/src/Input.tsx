import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <label className="text-sm font-semibold text-neutral-900">{label}</label>}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-neutral-400">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm text-neutral-900 transition-[color,box-shadow,border-color] hover:border-neutral-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400',
              'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              error && 'border-danger text-danger focus-visible:border-danger focus-visible:ring-danger/20',
              !!leftIcon && 'pl-9',
              !!rightIcon && 'pr-9',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {hint && !error && <span className="text-xs text-neutral-500">{hint}</span>}
        {error && <span className="text-xs font-medium text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
