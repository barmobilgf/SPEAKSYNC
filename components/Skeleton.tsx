
import React from 'react';

// Added key to props type to resolve TypeScript errors when rendering in lists
export const SkeletonPulse = ({ className }: { className?: string; key?: React.Key }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />
);

export const LessonSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 h-[75vh] md:h-[850px] overflow-hidden flex flex-col w-full">
    <div className="p-8 border-b border-slate-100 dark:border-slate-800 space-y-4">
      <div className="flex gap-2">
        <SkeletonPulse className="h-8 w-24 rounded-full" />
        <SkeletonPulse className="h-8 w-24 rounded-full" />
        <SkeletonPulse className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <SkeletonPulse className="h-10 w-32 rounded-xl" />
        <div className="flex gap-2">
          <SkeletonPulse className="h-10 w-10 rounded-xl" />
          <SkeletonPulse className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="flex-1 p-8 md:p-12 space-y-10">
      <div className="space-y-4">
        <SkeletonPulse className="h-6 w-1/3 mb-6" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
      </div>
      <div className="space-y-4 pt-10 border-t border-slate-50 dark:border-slate-800">
        <SkeletonPulse className="h-6 w-1/4 mb-6" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-2/3" />
      </div>
    </div>
  </div>
);

export const NewsCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 h-[450px] flex flex-col">
    <div className="flex justify-between mb-6">
      <SkeletonPulse className="h-6 w-20 rounded-full" />
      <SkeletonPulse className="h-10 w-10 rounded-xl" />
    </div>
    <div className="space-y-4 flex-grow">
      <SkeletonPulse className="h-8 w-full" />
      <SkeletonPulse className="h-8 w-2/3" />
      <div className="pt-4 space-y-2">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-3/4" />
      </div>
    </div>
    <SkeletonPulse className="h-14 w-full rounded-2xl mt-8" />
  </div>
);

export const RoadmapSkeleton = () => (
  <div className="space-y-8">
    <SkeletonPulse className="h-64 md:h-80 w-full rounded-[32px]" />
    <div className="flex gap-2 overflow-hidden">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <SkeletonPulse key={i} className="h-16 w-24 shrink-0 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <SkeletonPulse key={i} className="h-32 w-full rounded-[2.5rem]" />
      ))}
    </div>
  </div>
);
