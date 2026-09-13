"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder = "Select...", label, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white hover:border-slate-600 transition-colors"
      >
        <span className={selected ? "text-white" : "text-slate-500"}>{selected?.label || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/30 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  disabled={option.disabled}
                  onClick={() => { onChange(option.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    option.disabled
                      ? "text-slate-600 cursor-not-allowed"
                      : value === option.value
                      ? "bg-blue-600/10 text-blue-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex-1 text-left">{option.label}</span>
                  {value === option.value && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  label?: string;
  className?: string;
}

export function MultiSelect({ value, onChange, options, label, className = "" }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white hover:border-slate-600 transition-colors"
      >
        <span className={value.length ? "text-white" : "text-slate-500"}>
          {value.length ? `${value.length} selected` : "Select..."}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/30 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggle(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    value.includes(option.value) ? "bg-blue-600/10 text-blue-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.includes(option.value) ? "bg-blue-600 border-blue-600" : "border-slate-600"}`}>
                    {value.includes(option.value) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="flex-1 text-left">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "pro";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-slate-800 text-slate-300",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pro: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mb-6 max-w-sm text-slate-400">{description}</p>
      {action}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, value, color = "bg-blue-500", trend }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
      <div className={`mb-4 h-1 w-10 rounded-full ${color}`} />
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className="truncate text-2xl font-bold text-white">{value}</p>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
