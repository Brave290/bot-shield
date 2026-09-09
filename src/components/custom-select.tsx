"use client";

import { ChevronDown } from "lucide-react";
import { SelectHTMLAttributes, forwardRef } from "react";

export const CustomSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <span className="relative block">
      <select
        ref={ref}
        {...props}
        className={`w-full appearance-none rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 pr-10 text-sm text-white shadow-sm outline-none transition focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 ${className}`}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </span>
  ),
);
CustomSelect.displayName = "CustomSelect";
