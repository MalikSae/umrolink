"use client";

interface MonthOption {
  value: string;
  label: string;
}

interface MonthFilterProps {
  months: MonthOption[];
  selectedMonth: string | null;
  onSelect: (month: string | null) => void;
}

export function MonthFilter({ months, selectedMonth, onSelect }: MonthFilterProps) {
  if (!months || months.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-2 px-4 py-2">
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 snap-center px-4 py-1.5 rounded-full text-sm font-medium border ${
            selectedMonth === null
              ? 'bg-tenant-primary text-white border-tenant-primary'
              : 'bg-white text-neutral-700 border-neutral-300'
          }`}
        >
          Semua
        </button>
        {months.map((month) => (
          <button
            key={month.value}
            onClick={() => onSelect(month.value)}
            className={`shrink-0 snap-center px-4 py-1.5 rounded-full text-sm font-medium border ${
              selectedMonth === month.value
                ? 'bg-tenant-primary text-white border-tenant-primary'
                : 'bg-white text-neutral-700 border-neutral-300'
            }`}
          >
            {month.label}
          </button>
        ))}
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
