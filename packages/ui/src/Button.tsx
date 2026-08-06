import * as React from 'react';
import { cn } from './utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  // Base — semua state/accessibility/animation dasar
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
    'font-semibold select-none cursor-pointer overflow-hidden',
    'outline-2 outline-transparent outline-offset-2',
    'transition-[color,background-color,border-color,box-shadow,opacity,scale]',
    'duration-150 ease-out',
    'active:scale-[0.97]',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    // Disabled state
    'disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50',
    // aria-busy (loading) state
    'aria-busy:pointer-events-none aria-busy:opacity-70',
  ],
  {
    variants: {
      variant: {
        // Solid dengan gradient + inset highlight — primary CTA
        default: [
          'bg-primary text-white',
          // Gradient subtle: sedikit lebih terang di atas
          'bg-gradient-to-b from-primary/90 to-primary',
          // Inset highlight tipis di atas agar terasa ada dimensi
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]',
          'hover:bg-primary-hover hover:from-primary-hover hover:to-primary-hover',
          'hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_8px_-1px_rgba(5,150,105,0.35),0_2px_4px_-2px_rgba(5,150,105,0.25)]',
          'active:bg-primary-hover active:from-primary-hover active:to-primary-hover',
          'focus-visible:outline-primary',
        ],
        // Soft — warna secondary lebih lembut
        secondary: [
          'bg-neutral-100 text-neutral-800 border border-neutral-200',
          'hover:bg-neutral-200 hover:border-neutral-300',
          'active:bg-neutral-200',
          'focus-visible:outline-neutral-400',
        ],
        // Outline dengan border menonjol
        outline: [
          'bg-transparent text-primary border border-primary',
          'hover:bg-primary/8',
          'active:bg-primary/12',
          'focus-visible:outline-primary',
        ],
        // Ghost — transparan, hover subtle
        ghost: [
          'bg-transparent text-neutral-700 border border-transparent',
          'hover:bg-neutral-100 hover:text-neutral-900',
          'active:bg-neutral-100',
          'focus-visible:outline-neutral-400 focus-visible:bg-neutral-50 focus-visible:border-neutral-200',
        ],
        // Destructive dengan gradient + inset highlight
        destructive: [
          'bg-danger text-white',
          'bg-gradient-to-b from-danger/90 to-danger',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]',
          'hover:bg-danger/90 hover:from-danger/80 hover:to-danger/90',
          'hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_8px_-1px_rgba(239,68,68,0.35),0_2px_4px_-2px_rgba(239,68,68,0.25)]',
          'active:bg-danger/90',
          'focus-visible:outline-danger',
        ],
        // Destructive outline (untuk confirm dialog dsb)
        'destructive-outline': [
          'bg-transparent text-danger border border-danger',
          'hover:bg-danger/8',
          'active:bg-danger/12',
          'focus-visible:outline-danger',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md [&_svg]:size-4',
        default: 'h-10 px-4 text-sm rounded-lg [&_svg]:size-4',
        lg: 'h-11 px-5 text-base rounded-lg [&_svg]:size-5',
        icon: 'h-10 w-10 rounded-lg [&_svg]:size-5',
        'icon-sm': 'h-8 w-8 rounded-md [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? true : undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
