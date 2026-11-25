import React from 'react';
import { RotateCcw, X, ShieldCheck, Activity } from 'lucide-react';
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
        bottom-28 inset-x-4 mx-auto max-w-md sm:bottom-8 sm:left-8 sm:inset-x-auto sm:mx-0 sm:w-[410px]
        bg-white/95 backdrop-blur-xl border border-slate-200/95 rounded-xl shadow-2xl p-4 sm:p-5 text-slate-800 select-none animate-in fade-in slide-in-from-bottom-2"
    >
      {/* 1. Header: Zone ID, ECU Address & Close Action */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold tracking-wider">
            ZONE {part.zoneNumber}
          </span>
          <span className="text-slate-400">/</span>
          <span className="tracking-wide text-slate-700">{part.ecuAddress}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Close component card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Component Name, OEM Code & Description */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {part.name}
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
            {part.oemCode}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          {part.description}
        </p>
      </div>

      {/* 3. Live OBD-II PID Diagnostic Telemetry Grid */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 text-slate-600">
            <Activity className="h-3 w-3 text-sky-600" />
            LIVE ECU TELEMETRY (CAN-ID {part.ecuAddress.split(' ')[0]})
          </span>
          <span className="text-emerald-600">STATUS: ACTIVE</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
          {part.pids.map((pid, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150/70"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 leading-tight">
                  {pid.code}
                </span>
                <span className="text-[11px] font-medium text-slate-700 leading-tight truncate">
                  {pid.label}
                </span>
              </div>
              <div className="flex items-baseline gap-0.5 font-bold text-slate-900">
                <span>{pid.value}</span>
                {pid.unit && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {pid.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Specifications Strip */}
      <div className="mt-2.5 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/70 text-[11px] text-slate-600 font-mono">
        {part.specs.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1 text-[10px] truncate">
            <span className="text-slate-400">{s.label}:</span>
            <span className="font-semibold text-slate-700">{s.value}</span>
          </div>
        ))}
      </div>

      {/* 5. Footer: System Readiness Status + Calibrate Action */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{part.obdStatus}</span>
        </div>

        <button
          type="button"
          onClick={onResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-semibold tracking-wide shadow-sm transition-all active:scale-95"
        >
          <RotateCcw className="h-3 w-3" />
          <span>FULL CHASSIS</span>
        </button>
      </div>
    </div>
  );
};
