import React from 'react';
import {
  RotateCcw,
  Sparkles,
  Eye,
  Cpu,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ViewMode } from './CarAndEngineScene';

interface StudioHUDProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  simulateFault: boolean;
  setSimulateFault: (simulate: boolean | ((prev: boolean) => boolean)) => void;
  onResetView: () => void;
}

export const StudioHUD: React.FC<StudioHUDProps> = ({
  viewMode,
  setViewMode,
  simulateFault,
  setSimulateFault,
  onResetView,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-hidden">
      {/* ================================================================= */}
      {/* TOP HEADER / BRANDING & TELEMETRY                                */}
      {/* ================================================================= */}
      <header className="flex items-start justify-between">
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-white/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/90 shadow-sm transition-all hover:bg-white/95">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${simulateFault ? 'bg-red-400' : 'bg-sky-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${simulateFault ? 'bg-red-500' : 'bg-sky-500'}`}></span>
            </span>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              OBD-II 3D INSPECTOR
            </h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
              3D GLB SHOWROOM
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-slate-400" />
              100% Client-Side
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-semibold">
              {viewMode === 'xray' && 'Transparent X-Ray (Engine Visible)'}
              {viewMode === 'exterior' && 'Solid Showroom Paint'}
              {viewMode === 'engine' && 'Isolated Engine Inspection'}
            </span>
            {simulateFault && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  DTC P0300 Active
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right Active Diagnostic Pill */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/90 px-3.5 py-1.5 shadow-sm text-xs font-medium text-slate-700">
          {simulateFault ? (
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Fault Code: P0300 Misfire
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Engine Online • Nominal
            </span>
          )}
        </div>
      </header>

      {/* ================================================================= */}
      {/* BOTTOM FLOATING CONTROLS & 3-MODE PILL BAR                       */}
      {/* ================================================================= */}
      <footer className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 sm:gap-0">
        {/* Bottom-Left Controls Helper */}
        <div className="pointer-events-auto hidden md:block rounded-xl bg-white/80 backdrop-blur-md border border-slate-200/90 px-3.5 py-2 text-[11px] text-slate-500 shadow-sm">
          <div className="font-semibold text-slate-700 mb-0.5">
            {viewMode === 'engine' ? 'Engine Zoom Mode' : '360° Studio View'}
          </div>
          <div className="flex items-center gap-2">
            <span>🖱️ Drag to Orbit</span>
            <span className="text-slate-300">•</span>
            <span>🔍 Pinch / Scroll to Zoom</span>
          </div>
        </div>

        {/* Center: 3-Mode Pill Bar + Fault Simulator Toggle */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-center gap-2">
          {/* Main 3-Mode Pill Bar */}
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('xray')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                viewMode === 'xray'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Transparent Car</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('exterior')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                viewMode === 'exterior'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Solid Car</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('engine')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                viewMode === 'engine'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Inspect Engine</span>
            </button>
          </div>

          {/* Toggleable OBD-II Fault Simulator Button */}
          <button
            type="button"
            onClick={() => setSimulateFault((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 border shadow-sm backdrop-blur-md ${
              simulateFault
                ? 'bg-red-500 text-white border-red-400 shadow-red-200 animate-pulse'
                : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200'
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${simulateFault ? 'text-white' : 'text-red-500'}`} />
            <span>{simulateFault ? 'P0300 Active (Engine Pulsing)' : 'Simulate Fault (P0300)'}</span>
          </button>
        </div>

        {/* Bottom-Right Reset View Action */}
        <button
          onClick={onResetView}
          type="button"
          aria-label="Reset Camera View"
          className="pointer-events-auto group flex items-center gap-2 rounded-xl bg-white/90 hover:bg-white active:bg-slate-50 backdrop-blur-md border border-slate-200 px-4 py-2.5 shadow-sm hover:shadow transition-all duration-200 text-xs font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-500 transition-transform duration-300 group-hover:-rotate-90 group-active:scale-95" />
          <span>Reset View</span>
        </button>
      </footer>
    </div>
  );
};
