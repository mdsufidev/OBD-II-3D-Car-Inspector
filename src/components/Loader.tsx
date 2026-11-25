import React from 'react';
import { useProgress } from '@react-three/drei';

export const StudioLoader: React.FC = () => {
  const { active, progress } = useProgress();

  if (!active && progress === 100) return null;

  return (
    // BUG #7 FIX: pointer-events-auto prevents dragging half-loaded 3D scenes before completion
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-opacity duration-500 pointer-events-auto select-none">
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="h-16 w-16 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
        <span className="absolute text-xs font-semibold text-slate-800 tracking-wider">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1 select-none">
        <span className="text-xs uppercase font-medium tracking-widest text-slate-600">
          Loading 3D Studio
        </span>
        <span className="text-[10px] text-slate-400">Calibrating Shaders & Studio Environment</span>
      </div>
    </div>
  );
};
