import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse" aria-label="Loading Dashboard Data">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-surface-container-high rounded-lg" />
          <div className="h-5 w-96 bg-surface-container-high rounded-md" />
        </div>
        <div className="h-11 w-44 bg-surface-container-high rounded-xl" />
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="tabler-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-surface-container-high rounded" />
              <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
            </div>
            <div className="h-10 w-24 bg-surface-container-high rounded-lg" />
            <div className="h-2 w-full bg-surface-container-high rounded-full" />
            <div className="h-4 w-36 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>

      {/* Main Visualizations Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 tabler-card p-6 space-y-4">
          <div className="h-6 w-56 bg-surface-container-high rounded" />
          <div className="h-72 w-full bg-surface-container-high rounded-xl" />
        </div>
        <div className="tabler-card p-6 space-y-4 flex flex-col items-center justify-center">
          <div className="h-6 w-40 bg-surface-container-high rounded self-start" />
          <div className="w-40 h-40 rounded-full bg-surface-container-high my-4" />
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="h-12 bg-surface-container-high rounded-lg" />
            <div className="h-12 bg-surface-container-high rounded-lg" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="tabler-card p-6 space-y-4">
        <div className="h-6 w-48 bg-surface-container-high rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-14 w-full bg-surface-container-high rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};
