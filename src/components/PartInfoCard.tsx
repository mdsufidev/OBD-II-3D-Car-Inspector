import React from 'react';
import { RotateCcw, X, Activity, CheckCircle2 } from 'lucide-react';
import { CarPart } from '../data/partsConfig';

interface PartInfoCardProps {
  part: CarPart | null;
  onClose: () => void;
  onResetView: () => void;
}

export const PartInfoCard: React.FC<PartInfoCardProps> = ({
  part,
  onClose,
  onResetView,
}) => {
  if (!part) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto fixed z-20 transition-all duration-300 ease-out 
        bottom-28 inset-x-4 mx-auto max-w-md sm:bottom-8 sm:left-8 sm:inset-x-auto sm:mx-0 sm:w-96
        bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-4 sm:p-5 text-slate-800 select-none animate-in fade-in slide-in-from-bottom-3"
    >
      {/* Top Header: System Category + Close Button */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
          <Activity className="h-3 w-3" />
          <span>{part.system}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close component card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Part Name & Description */}
      <div className="mt-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
          {part.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2 sm:line-clamp-3">
          {part.description}
        </p>
      </div>

      {/* Specs Grid */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-[11px]">
        {part.specs.map((spec, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium truncate">
              {spec.label}
            </span>
            <span className="font-semibold text-slate-700 truncate">
              {spec.value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer: OBD-II Status Badge + Back to Full Car Button */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{part.obdStatus}</span>
        </div>

        {/* Back to Full Car Action */}
        <button
          type="button"
          onClick={onResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Full Car</span>
        </button>
      </div>
    </div>
  );
};
