import React, { useState, useEffect } from 'react';
import { RotateCcw, X, AlertTriangle, Printer, Wrench, Gauge, Layers } from 'lucide-react';
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
  // Card Tab State: 'telemetry' | 'specs'
  const [activeTab, setActiveTab] = useState<'telemetry' | 'specs'>('telemetry');

  // Live fluctuating sensor readings to simulate live CAN-bus datastream
  const [livePids, setLivePids] = useState<{ [code: string]: number }>({});

  useEffect(() => {
    if (!part) return;

    // Initialize baseline numerical values
    const initialMap: { [code: string]: number } = {};
    part.pids.forEach((p) => {
      initialMap[p.code] = p.baseNumber;
    });
    setLivePids(initialMap);

    // Live micro-variance interval (every 850ms)
    const interval = setInterval(() => {
      setLivePids((prev) => {
        const next = { ...prev };
        part.pids.forEach((p) => {
          if (p.variance > 0) {
            const jitter = (Math.random() * 2 - 1) * p.variance;
            next[p.code] = Math.max(0, p.baseNumber + jitter);
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

  // Helper to calculate gauge percentage (0 to 100%)
  const getGaugePercentage = (code: string, currentVal: number) => {
    switch (code) {
      case 'PID 0x05': // Coolant Temp (0 - 120°C)
        return Math.min(100, Math.max(5, (currentVal / 115) * 100));
      case 'PID 0x42': // Battery Voltage (9 - 15V)
      case 'PID 0x1F':
        return Math.min(100, Math.max(5, ((currentVal - 9) / 6) * 100));
      case 'PID 0x5B': // State of Charge (0 - 100%)
      case 'PID 0x34': // Pad Wear (0 - 100%)
        return Math.min(100, Math.max(5, currentVal));
      case 'PID 0x0B': // MAP (0 - 150 kPa)
        return Math.min(100, Math.max(5, (currentVal / 150) * 100));
      case 'PID 0x3C': // Cat Temp (0 - 1000°C)
      case 'PID 0x3E':
        return Math.min(100, Math.max(5, (currentVal / 900) * 100));
      case 'PID 0x14': // O2 Sensor (0 - 1.0V)
      case 'PID 0x15':
        return Math.min(100, Math.max(5, (currentVal / 1.0) * 100));
      default:
        return 50;
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto fixed z-30 transition-all duration-300 ease-out 
        bottom-24 inset-x-3 mx-auto max-w-md sm:bottom-6 sm:left-6 sm:inset-x-auto sm:mx-0 sm:w-[380px]
        bg-white/98 backdrop-blur-2xl border border-slate-200/95 rounded-2xl shadow-2xl p-4 sm:p-5 text-slate-800 select-none animate-in fade-in slide-in-from-bottom-3"
    >
      {/* 1. TOP HEADER: Status Tag, Zone ID, Print & Close */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isFaultActive ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isFaultActive ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            />
          </span>
          <span className="font-mono text-[11px] font-bold tracking-wider text-slate-900 uppercase">
            ZONE {part.zoneNumber} // {part.ecuAddress.split(' ')[0]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrintReport}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Export / Print Diagnostic Sheet"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close component card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. COMPONENT TITLE & OEM BADGE */}
      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
            {part.name}
          </h3>
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
            {part.oemCode}
          </span>
        </div>
      </div>

      {/* 3. ACTIVE FAULT ALERT BANNER (If DTC triggered) */}
      {isFaultActive && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 font-mono text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>DTC {part.fault.code}</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200/80 text-red-800">
              {part.fault.severity}
            </span>
          </div>
          <p className="mt-1 font-sans text-xs font-semibold text-red-900">
            {part.fault.title}
          </p>
          <div className="mt-1.5 text-[11px] text-red-700 flex items-start gap-1">
            <Wrench className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2">Action: {part.fault.recommendedAction}</span>
          </div>
        </div>
      )}

      {/* 4. SLEEK SEGMENTED TAB SWITCHER */}
      <div className="mt-3 flex items-center bg-slate-100 p-0.5 rounded-lg font-mono text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
            activeTab === 'telemetry'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gauge className="h-3 w-3" />
          <span>LIVE TELEMETRY</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
            activeTab === 'specs'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-3 w-3" />
          <span>SYSTEM SPECS</span>
        </button>
      </div>

      {/* 5. TAB A: LIVE TELEMETRY GAUGES */}
      {activeTab === 'telemetry' && (
        <div className="mt-3 space-y-2 font-mono text-xs animate-in fade-in">
          {part.pids.map((pid) => {
            const valNum = livePids[pid.code] ?? pid.baseNumber;
            const decimals = pid.baseNumber % 1 !== 0 ? (pid.baseNumber.toString().split('.')[1]?.length || 1) : 0;
            const displayVal = valNum.toFixed(Math.min(decimals, 2));
            const pct = getGaugePercentage(pid.code, valNum);

            return (
              <div key={pid.code} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium truncate">{pid.label}</span>
                  <div className="flex items-baseline gap-1 font-bold text-slate-900">
                    <span className="tabular-nums">{displayVal}</span>
                    {pid.unit && <span className="text-[10px] text-slate-400 font-normal">{pid.unit}</span>}
                  </div>
                </div>

                {/* Mini Visual Gauge Bar */}
                <div className="mt-1.5 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isFaultActive ? 'bg-red-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TAB B: SYSTEM SPECIFICATIONS */}
      {activeTab === 'specs' && (
        <div className="mt-3 space-y-2 animate-in fade-in">
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            {part.description}
          </p>

          <div className="space-y-1.5 pt-1 font-mono text-xs">
            {part.specs.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                <span className="text-slate-400">{s.label}</span>
                <span className="font-bold text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CARD FOOTER ACTIONS */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleDTC(part.faultCode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold transition-all ${
            isFaultActive
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>{isFaultActive ? `CLEAR ${part.faultCode}` : `SIMULATE ${part.faultCode}`}</span>
        </button>

        <button
          type="button"
          onClick={onResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-semibold shadow-sm transition-all active:scale-95"
        >
          <RotateCcw className="h-3 w-3" />
          <span>FULL CAR</span>
        </button>
      </div>
    </div>
  );
};
