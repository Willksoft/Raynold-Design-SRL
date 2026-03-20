import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// ─── HeroUI-inspired Custom Select ────────────────────────────────
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
  variant?: 'light' | 'dark';
  required?: boolean;
}> = ({ value, onChange, options, className = '', placeholder, variant = 'light', required }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);
  const isDark = variant === 'dark';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors outline-none text-left ${
          isDark
            ? 'bg-black/50 border border-white/10 hover:border-white/20 focus:border-raynold-red text-white'
            : 'bg-white border border-gray-300 hover:border-gray-400 focus:border-raynold-red'
        }`}
      >
        <span className={selected ? (isDark ? 'text-white font-medium' : 'text-gray-900 font-medium') : (isDark ? 'text-gray-500' : 'text-gray-400')}>
          {selected?.label || placeholder || 'Seleccionar...'}
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg py-1 z-[150] overflow-hidden ${
            isDark ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border border-gray-100'
          }`}
          style={{ animation: 'dropdownFadeIn 0.15s ease-out' }}
        >
          <div className="max-h-56 overflow-y-auto p-1">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isDark
                    ? (opt.value === value ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white')
                    : (opt.value === value ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Hidden native select for form required validation */}
      {required && (
        <select required value={value} onChange={() => {}} className="sr-only" tabIndex={-1} aria-hidden="true">
          <option value="">Seleccionar...</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  );
};

export default CustomSelect;
