"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-[#2e2928] rounded-lg ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#1f1b19] rounded-2xl p-5 border border-[#58413b]/10">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-6 rounded mb-2" />
      <Skeleton className="w-full h-4 rounded mb-4" />
      <Skeleton className="w-full h-4 rounded mb-2" />
      <div className="flex justify-between items-center pt-4 border-t border-[#58413b]/10">
        <Skeleton className="w-20 h-8 rounded" />
        <Skeleton className="w-24 h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#1f1b19] rounded-2xl p-5 border border-[#58413b]/10">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-[#58413b]/20">
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4 border-b border-[#58413b]/10 last:border-0">
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#1f1b19] rounded-2xl p-5 border border-[#58413b]/10">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <Skeleton className="w-16 h-8 rounded mb-2" />
          <Skeleton className="w-24 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-[#1f1b19] rounded-xl p-4 border border-[#58413b]/10 flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="w-3/4 h-4 rounded mb-2" />
            <Skeleton className="w-1/2 h-3 rounded" />
          </div>
          <Skeleton className="w-20 h-8 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="w-24 h-24 rounded-full mb-4" />
      <Skeleton className="w-32 h-6 rounded mb-2" />
      <Skeleton className="w-48 h-4 rounded mb-6" />
      <div className="w-full space-y-4">
        <div className="bg-[#1f1b19] rounded-xl p-4">
          <Skeleton className="w-16 h-3 rounded mb-3" />
          <Skeleton className="w-full h-10 rounded" />
        </div>
        <div className="bg-[#1f1b19] rounded-xl p-4">
          <Skeleton className="w-16 h-3 rounded mb-3" />
          <Skeleton className="w-full h-10 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonWallet() {
  return (
    <div className="bg-gradient-to-br from-[#1f1b19] to-[#2e2928] rounded-2xl p-6 border border-[#ff734b]/20">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <Skeleton className="w-32 h-10 rounded mb-2" />
      <Skeleton className="w-48 h-3 rounded" />
    </div>
  );
}

export function SkeletonGameCard() {
  return (
    <div className="bg-[#1f1b19] rounded-2xl p-5 border border-[#58413b]/10 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-20 h-5 rounded" />
        </div>
        <Skeleton className="w-3/4 h-6 rounded mb-2" />
        <Skeleton className="w-full h-4 rounded mb-2" />
        <Skeleton className="w-2/3 h-4 rounded mb-4" />
        <div className="flex justify-between items-center pt-3 border-t border-white/10">
          <div>
            <Skeleton className="w-16 h-8 rounded mb-1" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
          <Skeleton className="w-24 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonGameCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonButton() {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="w-24 h-10 rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonTabs() {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full h-12 rounded-xl" />
      <Skeleton className="w-full h-64 rounded-xl" />
    </div>
  );
}
