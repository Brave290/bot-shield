"use client";

import { ChevronDown, Check } from "lucide-react";
import { Children, ReactElement, ReactNode, cloneElement, isValidElement, useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };
type Props = { id?: string; value?: string; defaultValue?: string; onChange?: (event: { target: { value: string } }) => void; children: ReactNode; className?: string };

export function CustomSelect({ id, value, defaultValue, onChange, children, className = "" }: Props) {
  const options = Children.toArray(children).filter(isValidElement).map((child) => {
    const props = (child as ReactElement<{ value?: string; children?: ReactNode }>).props;
    return { value: String(props.value ?? ""), label: String(props.children ?? props.value ?? "") } satisfies Option;
  });
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(value ?? defaultValue ?? options[0]?.value ?? "");
  const current = value ?? internal;
  const selected = options.find((option) => option.value === current) || options[0];
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const choose = (next: string) => { if (value === undefined) setInternal(next); onChange?.({ target: { value: next } }); setOpen(false); };
  return <div ref={root} className="relative">
    <input id={id} tabIndex={-1} aria-hidden="true" value={current} readOnly className="pointer-events-none absolute h-px w-px opacity-0" />
    <button type="button" onClick={() => setOpen((state) => !state)} aria-haspopup="listbox" aria-expanded={open} className={`flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-left text-sm text-white shadow-sm outline-none transition hover:border-slate-700 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 ${className}`}><span>{selected?.label || "Select option"}</span><ChevronDown className={`h-4 w-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} /></button>
    {open && <div role="listbox" className="absolute z-[150] mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1220]/[.98] p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl animate-scale-in">{options.map((option) => <button type="button" role="option" aria-selected={option.value === current} key={option.value} onClick={() => choose(option.value)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm transition ${option.value === current ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>{option.label}{option.value === current && <Check className="h-4 w-4 text-blue-400" />}</button>)}</div>}
  </div>;
}
