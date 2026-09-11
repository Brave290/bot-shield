"use client";

import { ChevronDown } from "lucide-react";
import { Children, ReactElement, ReactNode, isValidElement } from "react";

type Props = { id?: string; value?: string; defaultValue?: string; onChange?: (event: { target: { value: string } }) => void; children: ReactNode; className?: string };

export function CustomSelect({ id, value, defaultValue, onChange, children, className = "" }: Props) {
  const options = Children.toArray(children).filter(isValidElement).map((child) => {
    const props = (child as ReactElement<{ value?: string; children?: ReactNode }>).props;
    return { value: String(props.value ?? ""), label: String(props.children ?? props.value ?? "") };
  });
  return <div className="relative">
    <select id={id} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>} aria-label={id || "Select option"} className={`w-full appearance-none rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 pr-10 text-left text-sm text-white shadow-sm outline-none transition hover:border-slate-700 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 ${className}`}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
  </div>;
}
