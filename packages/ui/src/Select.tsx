import * as React from 'react';
import { cn } from './utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors hover:border-neutral-300 focus:border-tenant-primary focus:outline-none focus:ring-[3px] focus:ring-tenant-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
