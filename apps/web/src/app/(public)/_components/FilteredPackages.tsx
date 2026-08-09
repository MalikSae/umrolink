"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { MonthFilter } from './MonthFilter';
import { PackageGrid } from './PackageGrid';

export function FilteredPackages({ initialPackages, months }: { initialPackages: any[], months: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [packages, setPackages] = useState(initialPackages);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPackages.length === 10);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const fetchPackages = async () => {
      setLoading(true);
      try {
        const monthQuery = selectedMonth ? `&month=${selectedMonth}` : '';
        const res = await fetch(`/api/public/packages?page=1&limit=10${monthQuery}`);
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
          setPage(1);
          setHasMore(data.length === 10);
        }
      } catch (err) {
        console.error('Failed to fetch filtered packages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [selectedMonth]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const monthQuery = selectedMonth ? `&month=${selectedMonth}` : '';
      const nextPage = page + 1;
      const res = await fetch(`/api/public/packages?page=${nextPage}&limit=10${monthQuery}`);
      if (res.ok) {
        const data = await res.json();
        setPackages(prev => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(data.length === 10);
      }
    } catch (err) {
      console.error('Failed to load more packages', err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, selectedMonth]);

  return (
    <div className="w-full">
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold mb-3">Semua Paket</h2>
        
        <div className="-mx-4 mb-4">
          <MonthFilter months={months} selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
        </div>
        
        {packages.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-lg">Belum ada paket umrah yang tersedia saat ini.</p>
          </div>
        ) : (
          <PackageGrid packages={packages} onLoadMore={loadMore} hasMore={hasMore} />
        )}
        
        {loading && (
          <div className="py-6 flex justify-center text-neutral-500">
            <i className="ti ti-loader animate-spin text-2xl"></i>
          </div>
        )}
      </div>
    </div>
  );
}
