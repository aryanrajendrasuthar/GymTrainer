"use client";

import { cn } from "@/app/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export function Skeleton({ className, width, height, rounded = "rounded-[8px]" }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", rounded, className)}
      style={{
        width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
      }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 space-y-3">
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="90%" />
      <Skeleton height={14} width="75%" />
    </div>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton height={64} width={64} rounded="rounded-[12px]" />
        <div className="flex-1 space-y-2">
          <Skeleton height={18} width="70%" />
          <Skeleton height={14} width="50%" />
          <div className="flex gap-2">
            <Skeleton height={22} width={60} rounded="rounded-full" />
            <Skeleton height={22} width={80} rounded="rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-5 space-y-4">
      <div className="flex justify-between">
        <Skeleton height={24} width="50%" />
        <Skeleton height={24} width={80} rounded="rounded-full" />
      </div>
      <Skeleton height={16} width="80%" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton height={28} width="60%" />
            <Skeleton height={12} width="80%" />
          </div>
        ))}
      </div>
      <Skeleton height={44} rounded="rounded-[12px]" />
    </div>
  );
}
