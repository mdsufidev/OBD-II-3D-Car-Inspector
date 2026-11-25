import React, { useState, useRef } from 'react';
import { CarCanvas, CarCanvasRef } from './components/CarCanvas';
import { StudioHUD } from './components/StudioHUD';
import { StudioLoader } from './components/Loader';
import { getPartById } from './data/partsConfig';

const App: React.FC = () => {
  // Phase 2 State Management
  const [isXray, setIsXray] = useState<boolean>(true);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [simulateFault, setSimulateFault] = useState<boolean>(false);

  const canvasRef = useRef<CarCanvasRef>(null);

  // Active focused part object from config
  const selectedPart = getPartById(selectedPartId) ?? null;

  // Handle part selection from either 3D hotspots, direct mesh click, or HUD
  const handleSelectPart = (partId: string) => {
    const part = getPartById(partId);
    if (!part) return;

    // Auto-enable X-Ray if the clicked part is internal (like Engine or Battery)
    if (part.isInternal && !isXray) {
      setIsXray(true);
    }

    setSelectedPartId(partId);
  };

  const handleClearSelection = () => {
    setSelectedPartId(null);
  };

  const handleResetView = () => {
    setSelectedPartId(null);
    canvasRef.current?.resetCamera();
  };

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-slate-50 touch-none select-none">
      {/* 3D Automotive Studio Canvas */}
      <CarCanvas
        ref={canvasRef}
        isXray={isXray}
        selectedPart={selectedPart}
        onSelectPart={handleSelectPart}
        onClearSelection={handleClearSelection}
        simulateFault={simulateFault}
      />

      {/* Floating Automotive HUD & Diagnostics */}
      <StudioHUD
        isXray={isXray}
        setIsXray={setIsXray}
        selectedPart={selectedPart}
        onSelectPart={handleSelectPart}
        onClearSelection={handleClearSelection}
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
