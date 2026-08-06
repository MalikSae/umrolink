"use client";

import { useState, useEffect } from 'react';
import { MonthFilter } from './MonthFilter';
import { PackageGrid } from './PackageGrid';

export function FilteredPackages({ initialPackages, months }: { initialPackages: any[], months: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [packages, setPackages] = useState(initialPackages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedMonth === null) {
      setPackages(initialPackages);
      return;
    }

    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/packages?month=${selectedMonth}`);
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch (err) {
        console.error('Failed to fetch filtered packages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [selectedMonth, initialPackages]);

  return (
    <div className="w-full">
      <MonthFilter months={months} selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold mb-4">Semua Paket</h2>
        {loading ? (
          <div className="py-12 flex justify-center text-neutral-500"><i className="ti ti-loader animate-spin text-2xl"></i></div>
        ) : (
          <PackageGrid packages={packages} />
        )}
      </div>
    </div>
  );
}
