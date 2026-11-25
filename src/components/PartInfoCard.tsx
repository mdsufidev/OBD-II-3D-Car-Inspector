import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Activity, AlertTriangle, Printer, Wrench } from 'lucide-react';
import { CarPart } from '../data/partsConfig';

interface PartInfoCardProps {
  part: CarPart | null;
  activeDTC: string | null;
  onClose: () => void;
  onResetView: () => void;
  onToggleDTC: (code: string) => void;
}

export const PartInfoCard: React.FC<PartInfoCardProps> = ({
  part,
  activeDTC,
  onClose,
  onResetView,
  onToggleDTC,
}) => {
  // Live fluctuating sensor readings to simulate live CAN-bus datastream
  const [livePids, setLivePids] = useState<{ [code: string]: string }>({});

  useEffect(() => {
    if (!part) return;

    // Initialize baseline values
    const initialMap: { [code: string]: string } = {};
    part.pids.forEach((p) => {
      initialMap[p.code] = p.value;
    });
    setLivePids(initialMap);

    // Live micro-variance interval (every 850ms)
    const interval = setInterval(() => {
      setLivePids((prev) => {
        const next = { ...prev };
        part.pids.forEach((p) => {
          if (p.variance > 0) {
            const jitter = (Math.random() * 2 - 1) * p.variance;
            const updated = Math.max(0, p.baseNumber + jitter);
            // Format decimals
            const decimals = p.baseNumber % 1 !== 0 ? (p.baseNumber.toString().split('.')[1]?.length || 1) : 0;
            next[p.code] = updated.toFixed(Math.min(decimals, 2));
          }
        });
        return next;
      });
    }, 850);

    return () => clearInterval(interval);
  }, [part]);

  if (!part) return null;

  const isFaultActive = activeDTC === part.faultCode;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto fixed z-20 transition-all duration-300 ease-out 
        bottom-28 inset-x-3 mx-auto max-w-md sm:bottom-8 sm:left-8 sm:inset-x-auto sm:mx-0 sm:w-[420px]
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrintReport}
            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Print / Save Diagnostic Report"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close component card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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

      {/* 3. DTC Fault Banner (If active for this part) */}
      {isFaultActive ? (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200/90 text-red-900 font-mono animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
              <AlertTriangle className="h-4 w-4" />
              DTC ACTIVE: {part.fault.code}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200/80 text-red-800">
              {part.fault.severity}
            </span>
          </div>
          <p className="mt-1 text-xs font-sans text-red-800 font-medium">
            {part.fault.title}
          </p>
          <div className="mt-2 text-[11px] text-red-700/90 flex items-start gap-1">
            <Wrench className="h-3 w-3 shrink-0 mt-0.5" />
            <span>Action: {part.fault.recommendedAction}</span>
          </div>
        </div>
      ) : null}

      {/* 4. Live OBD-II PID Diagnostic Telemetry Grid with Live Fluctuation */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 text-slate-600">
            <Activity className="h-3 w-3 text-sky-600 animate-pulse" />
            LIVE ECU TELEMETRY (CAN-ID {part.ecuAddress.split(' ')[0]})
          </span>
          <span className={isFaultActive ? 'text-red-600' : 'text-emerald-600'}>
            {isFaultActive ? 'STATUS: FAULT DETECTED' : 'STATUS: STREAMING'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
          {part.pids.map((pid, idx) => {
            const currentVal = livePids[pid.code] || pid.value;
            return (
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
                  <span className="tabular-nums transition-all duration-300">
                    {currentVal}
                  </span>
                  {pid.unit && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      {pid.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Specifications Strip */}
      <div className="mt-2.5 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/70 text-[11px] text-slate-600 font-mono">
        {part.specs.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1 text-[10px] truncate">
            <span className="text-slate-400">{s.label}:</span>
            <span className="font-semibold text-slate-700">{s.value}</span>
          </div>
        ))}
      </div>

      {/* 6. Footer: System Readiness Status + DTC Inject Action + Full Chassis */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleDTC(part.faultCode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
            isFaultActive
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>{isFaultActive ? `CLEAR ${part.faultCode}` : `SIMULATE ${part.faultCode}`}</span>
        </button>

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
