import React from 'react';

export function DashboardSkeletonLoader() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
      {/* Top Banner Skeleton */}
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 bg-zinc-200 dark:bg-[#202023] rounded-full animate-pulse" />
            <div className="h-4 w-36 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
          </div>
          <div className="h-8 w-2/3 max-w-md bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 max-w-sm bg-zinc-200 dark:bg-[#202023] rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-32 bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#18181b] p-5 rounded-2xl border border-zinc-200 dark:border-[#27272a] shadow-2xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-[#202023] animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
              <div className="h-6 w-28 bg-zinc-200 dark:bg-[#202023] rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left (2 Cols Chart/Grid) & Right (1 Col Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card (e.g. Chart area) */}
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] shadow-2xs rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272a]">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-zinc-200 dark:bg-[#202023] rounded-lg animate-pulse" />
                <div className="h-3 w-64 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
            </div>
            
            {/* Chart Graphic Skeleton */}
            <div className="h-56 w-full flex items-end justify-between gap-3 pt-6">
              {[40, 65, 50, 80, 60, 90, 75, 85, 95, 70, 85, 90].map((h, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full bg-zinc-200 dark:bg-[#202023] rounded-t-md animate-pulse"
                    style={{ height: `${h}%` }}
                  />
                  <div className="h-3 w-6 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Cards Subgrid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] shadow-2xs rounded-2xl p-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                  <div className="h-4 w-12 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-zinc-200 dark:bg-[#202023] rounded-lg animate-pulse" />
                <div className="h-3 w-1/2 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                <div className="pt-3 border-t border-zinc-200 dark:border-[#27272a]">
                  <div className="h-8 w-full bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] shadow-2xs rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272a]">
              <div className="h-5 w-40 bg-zinc-200 dark:bg-[#202023] rounded-lg animate-pulse" />
              <div className="h-6 w-8 bg-zinc-200 dark:bg-[#202023] rounded-full animate-pulse" />
            </div>

            {/* Skeleton List Items */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3 bg-zinc-50 dark:bg-[#09090b] rounded-xl border border-zinc-200 dark:border-[#27272a] space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-full bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-[#27272a]">
            <div className="h-10 w-full bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Table Section Skeleton */}
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between gap-4">
          <div className="h-9 w-64 bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-zinc-200 dark:bg-[#202023] rounded-xl animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-[#202023] last:border-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-[#202023] animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-[#202023] rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-zinc-200 dark:bg-[#202023] rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
