'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from './utils';

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipArrow = TooltipPrimitive.Arrow;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Dark background, white text, max-width per panduan (150–300px)
        'z-50 max-w-[300px] rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white shadow-md',
        // Animasi masuk/keluar
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    >
      {children}
      {/* Arrow penunjuk arah */}
      <TooltipArrow className="fill-neutral-900" width={10} height={5} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Self-contained Tooltip — tidak butuh TooltipProvider di parent
interface TooltipProps {
  /** Judul / teks utama tooltip */
  content: React.ReactNode;
  /** Deskripsi tambahan (opsional) — baris kedua yang lebih tipis */
  description?: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

function Tooltip({ content, description, children, side = 'top', delayDuration = 200 }: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        {/* Bungkus dalam span agar asChild selalu dapat satu elemen valid,
            terlepas dari apakah children adalah <Link><Button/></Link> atau elemen lain */}
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="font-medium leading-snug">{content}</p>
          {description && (
            <p className="mt-0.5 text-xs text-white/70 leading-snug">{description}</p>
          )}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider };
