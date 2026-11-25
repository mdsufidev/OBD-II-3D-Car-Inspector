import React, { useState, useRef } from 'react';
import { CarCanvas, CarCanvasRef } from './components/CarCanvas';
import { StudioHUD } from './components/StudioHUD';
import { StudioLoader } from './components/Loader';
import { ViewMode } from './components/CarAndEngineScene';

const App: React.FC = () => {
  // Default to 'xray' (Transparent Car) so the engine is immediately visible!
  const [viewMode, setViewMode] = useState<ViewMode>('xray');
  const [simulateFault, setSimulateFault] = useState<boolean>(false);
  const canvasRef = useRef<CarCanvasRef>(null);

  const handleResetView = () => {
    canvasRef.current?.resetCamera();
  };

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-slate-50 touch-none select-none">
      {/* 3D Automotive Studio Canvas (Real Car + Engine) */}
      <CarCanvas
        ref={canvasRef}
        viewMode={viewMode}
        simulateFault={simulateFault}
      />

      {/* Floating 3-Mode Studio HUD & Diagnostics */}
      <StudioHUD
        viewMode={viewMode}
        setViewMode={setViewMode}
        simulateFault={simulateFault}
        setSimulateFault={setSimulateFault}
        onResetView={handleResetView}
      />

      {/* Percentage Progress Loader */}
      <StudioLoader />
    </main>
  );
};

export default App;
