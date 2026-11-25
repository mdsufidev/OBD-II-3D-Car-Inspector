import React from 'react';
import {
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Cpu,
  Battery,
  Disc,
  Flame,
} from 'lucide-react';
import { CarPart, CAR_PARTS } from '../data/partsConfig';
import { PartInfoCard } from './PartInfoCard';

interface StudioHUDProps {
  isXray: boolean;
  setIsXray: (xray: boolean | ((prev: boolean) => boolean)) => void;
  selectedPart: CarPart | null;
  onSelectPart: (partId: string) => void;
  onClearSelection: () => void;
  simulateFault: boolean;
  setSimulateFault: (simulate: boolean | ((prev: boolean) => boolean)) => void;
  onResetView: () => void;
}

export const StudioHUD: React.FC<StudioHUDProps> = ({
  isXray,
  setIsXray,
  selectedPart,
  onSelectPart,
  onClearSelection,
  simulateFault,
  setSimulateFault,
  onResetView,
}) => {
  const getPartIcon = (id: string) => {
    switch (id) {
      case 'engine':
        return <Cpu className="h-3.5 w-3.5" />;
      case 'battery':
        return <Battery className="h-3.5 w-3.5" />;
      case 'brakes':
        return <Disc className="h-3.5 w-3.5" />;
      case 'exhaust':
        return <Flame className="h-3.5 w-3.5" />;
      default:
        return <Cpu className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-hidden">
      {/* ================================================================= */}
      {/* TOP HEADER: BRANDING & ACTIVE DIAGNOSTIC STATUS                   */}
      {/* ================================================================= */}
      <header className="flex items-start justify-between">
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-sm transition-all hover:bg-white"
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                simulateFault ? 'bg-red-400' : isXray ? 'bg-sky-400' : 'bg-slate-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                simulateFault ? 'bg-red-500' : isXray ? 'bg-sky-500' : 'bg-slate-600'
              }`}
            />
          </span>

          <h1 className="text-sm font-bold tracking-tight text-slate-900">
            OBD-II 3D INSPECTOR
          </h1>

          {selectedPart && (
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
              {getPartIcon(selectedPart.id)}
              <span>{selectedPart.name}</span>
            </span>
          )}

          {simulateFault && (
            <span className="ml-1 text-xs font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              P0300
            </span>
          )}
        </div>
      </header>

      {/* ================================================================= */}
      {/* FLOATING PART INFO CARD (When a diagnostic zone is focused)       */}
      {/* ================================================================= */}
      <PartInfoCard
        part={selectedPart}
        onClose={onClearSelection}
        onResetView={onResetView}
      />

      {/* ================================================================= */}
      {/* BOTTOM FLOATING CONTROLS PILL BAR                                */}
      {/* ================================================================= */}
      <footer className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 sm:gap-0">
        {/* Spacer for desktop symmetry */}
        <div className="hidden sm:block sm:w-28" />

        {/* Center: Main Pill Bar Controls */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-2"
        >
          {/* Main Controls Container */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg">
            {/* 1. X-Ray Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsXray((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isXray
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
              title="Toggle transparent chassis X-Ray mode"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>X-Ray Mode</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isXray ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isXray ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* 2. Diagnostic Parts Direct Selector */}
            <div className="hidden md:flex items-center gap-1">
              {CAR_PARTS.map((part) => {
                const isActive = selectedPart?.id === part.id;
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        onClearSelection();
                      } else {
                        onSelectPart(part.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {getPartIcon(part.id)}
                    <span>{part.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. OBD-II Fault Simulator Toggle (Auto-enables X-Ray) */}
          <button
            type="button"
            onClick={() => {
              setSimulateFault((prev) => {
                const nextState = !prev;
                if (nextState) {
                  setIsXray(true);
                  onSelectPart('engine');
                }
                return nextState;
              });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 border shadow-sm backdrop-blur-md ${
              simulateFault
                ? 'bg-red-500 text-white border-red-400 shadow-red-200 animate-pulse'
                : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${simulateFault ? 'text-white' : 'text-red-500'}`} />
            <span>{simulateFault ? 'Fault Active (P0300)' : 'Simulate Fault'}</span>
          </button>
        </div>

        {/* Bottom-Right Reset View Action */}
        <button
          onClick={onResetView}
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
          aria-label="Reset Camera View to Full Car"
          className="pointer-events-auto group flex items-center gap-2 rounded-xl bg-white/95 hover:bg-white active:bg-slate-50 backdrop-blur-md border border-slate-200 px-4 py-2.5 shadow-sm hover:shadow transition-all duration-200 text-xs font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-500 transition-transform duration-300 group-hover:-rotate-90 group-active:scale-95" />
          <span>Reset View</span>
        </button>
      </footer>
    </div>
  );
};
