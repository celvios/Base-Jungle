import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div className={`animate-pulse bg-gray-800/50 rounded ${className}`} style={style} />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <Skeleton className="h-6 w-1/4 mb-6" />
      <div className="flex items-end gap-2 h-64">
        {[...Array(12)].map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart />
    </div>
  );
};

export default Skeleton;
