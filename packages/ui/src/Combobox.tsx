'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { cn } from './utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Cari...',
  emptyText = 'Tidak ada hasil.',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Sync value from props to inputValue
  React.useEffect(() => {
    if (value) {
      const selected = options.find((opt) => opt.value === value);
      if (selected) {
        setInputValue(selected.label);
      } else {
        setInputValue(value);
      }
    } else {
      setInputValue('');
    }
  }, [value, options]);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        // Reset input value to selected if they didn't select a new one
        if (value) {
          const selected = options.find((opt) => opt.value === value);
          if (selected) setInputValue(selected.label);
        } else {
          setInputValue('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Command 
        filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}
        className="relative w-full overflow-visible bg-transparent"
      >
        <div className="relative">
          <CommandInput
            value={inputValue}
            onValueChange={(search) => {
              setInputValue(search);
              if (!open) setOpen(true);
              if (search === '') {
                onChange?.('');
              }
            }}
            onFocus={() => {
              setOpen(true);
            }}
            placeholder={placeholder}
            className="flex h-10 w-full items-center rounded-lg border border-neutral-200 bg-surface px-3 py-2 pr-10 text-sm text-neutral-900 transition-colors hover:border-neutral-300 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </div>
        </div>

        <div 
          className={cn(
            "absolute top-full z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95",
            (!open || inputValue.length < 3) && "hidden"
          )}
        >
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
              <CommandEmpty className="py-6 text-center text-sm text-neutral-500">
                {emptyText}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      setInputValue(option.label);
                      onChange?.(option.value);
                      setOpen(false);
                    }}
                    onMouseDown={(e) => {
                      // Prevent input from losing focus
                      e.preventDefault();
                      e.stopPropagation();
                      setInputValue(option.label);
                      onChange?.(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-neutral-100 aria-selected:text-neutral-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                      value === option.value ? 'bg-tenant-primary/10 text-tenant-primary font-medium' : ''
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
        </div>
      </Command>
    </div>
  );
}
