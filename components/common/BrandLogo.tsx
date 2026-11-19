'use client';

import React from 'react';

interface BrandLogoProps {
  subtitle?: string;
  compact?: boolean;
}

export function BrandLogo({ subtitle, compact = false }: BrandLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#348CB2] to-[#123A54] text-white shadow-xs">
        <span className="text-sm font-bold tracking-tighter">
          S<span className="text-[#ADD8E6]">X</span>
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base md:text-lg font-bold tracking-tight text-[#123A54] dark:text-[#F8FAFC] whitespace-nowrap">
          SalesX<span className="text-[#348CB2] dark:text-[#87CEEB]">-Ai</span>
        </span>
        {!compact && subtitle && (
          <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-[#348CB2] dark:text-[#87CEEB] uppercase whitespace-nowrap">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
