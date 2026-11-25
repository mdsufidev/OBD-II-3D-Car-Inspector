import React from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Layers,
  Radio,
  SlidersHorizontal,
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
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none overflow-hidden font-sans">
      {/* ================================================================= */}
      {/* 1. TOP HEADER: OEM CAN-BUS TELEMETRY INSTRUMENTATION              */}
      {/* ================================================================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Left: Branding & Core Connection Status */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-sm"
        >
          {/* Hardware Connection LED */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
            <span className="flex h-2 w-2 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  simulateFault ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  simulateFault ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              />
            </span>
            <span className="tracking-wider">OBD-II DIAGNOSTICS</span>
          </div>

          <div className="h-3.5 w-px bg-slate-200" />

          {/* Bus Protocol Chips */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              CAN 500kbps
            </span>
            <span className="text-slate-400">|</span>
            <span>ISO 15765-4</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-700 font-semibold">ECU 0x7E8</span>
          </div>
        </div>

        {/* Right: Live Bus DTC Telemetry Status */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex items-center gap-2"
        >
          {simulateFault ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono text-xs font-bold tracking-wider shadow-lg shadow-red-500/20 border border-red-400 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>DTC DETECTED: [P0300]</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-600 font-mono text-xs font-semibold shadow-sm">
              <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>BUS: ACTIVE // DTC: 0</span>
            </div>
          )}
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. FLOATING OEM PART INSPECTION PANEL (When a zone is focused)    */}
      {/* ================================================================= */}
      <PartInfoCard
        part={selectedPart}
        onClose={onClearSelection}
        onResetView={onResetView}
      />

      {/* ================================================================= */}
      {/* 3. BOTTOM WORKSTATION TOOLSTRIP                                  */}
      {/* ================================================================= */}
      <footer className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2.5 sm:gap-0">
        {/* Left Telemetry Tag for Desktop Symmetry */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-slate-400 px-3 py-1.5 bg-white/80 backdrop-blur rounded-lg border border-slate-200">
          <SlidersHorizontal className="h-3 w-3" />
          <span>F136 PLATFORM // 3D DIGITAL TWIN</span>
        </div>

        {/* Center: Machined Technical Diagnostic Toolbar */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-2"
        >
          {/* Main Workstation Cluster */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-xl">
            {/* A. Chassis Mode Segmented Switch */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-mono text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setIsXray(false)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  !isXray
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                SOLID
              </button>
              <button
                type="button"
                onClick={() => setIsXray(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                  isXray
                    ? 'bg-slate-900 text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>X-RAY</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* B. Direct Diagnostic Target Selectors */}
            <div className="hidden md:flex items-center gap-1 font-mono text-xs">
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
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-sky-700 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-normal">
                      {part.zoneNumber}
                    </span>
                    <span>{part.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Fault Injection Action */}
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all border shadow-sm backdrop-blur-md ${
              simulateFault
                ? 'bg-red-600 text-white border-red-500 shadow-red-500/30'
                : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${simulateFault ? 'text-white' : 'text-red-600'}`} />
            <span>{simulateFault ? 'FAULT ACTIVE: P0300' : 'INJECT DTC P0300'}</span>
          </button>
        </div>

        {/* Right: Camera Calibrate Action */}
        <button
          onClick={onResetView}
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
          aria-label="Calibrate Camera View to Full Chassis"
          className="pointer-events-auto group flex items-center gap-2 rounded-xl bg-white/95 hover:bg-white active:bg-slate-100 backdrop-blur-md border border-slate-200 px-3.5 py-2 shadow-sm transition-all text-xs font-mono font-semibold text-slate-700 hover:text-slate-900"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-500 transition-transform duration-300 group-hover:-rotate-90 group-active:scale-95" />
          <span>CALIBRATE VIEW</span>
        </button>
      </footer>
    </div>
  );
};
