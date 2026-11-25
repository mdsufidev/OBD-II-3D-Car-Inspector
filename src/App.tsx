import React, { useState, useRef } from 'react';
import { CarCanvas, CarCanvasRef } from './components/CarCanvas';
import { StudioHUD } from './components/StudioHUD';
import { StudioLoader } from './components/Loader';
import { getPartById } from './data/partsConfig';

const App: React.FC = () => {
  // Phase 2 + Demo Enhancements State Management
  const [isXray, setIsXray] = useState<boolean>(true);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeDTC, setActiveDTC] = useState<string | null>(null);

  const canvasRef = useRef<CarCanvasRef>(null);

  // Active focused part object from config
  const selectedPart = getPartById(selectedPartId) ?? null;

  // Handle part selection from either 3D hotspots, direct click, or HUD
  const handleSelectPart = (partId: string) => {
    const part = getPartById(partId);
    if (!part) return;

    // Auto-enable X-Ray if the clicked part is internal
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
      {/* 3D Automotive Studio Canvas with Multi-DTC Alerts */}
      <CarCanvas
        ref={canvasRef}
        isXray={isXray}
        selectedPart={selectedPart}
        activeDTC={activeDTC}
        onSelectPart={handleSelectPart}
        onClearSelection={handleClearSelection}
      />

      {/* Floating OEM Automotive HUD with Demo Scan, VIN & Multi-DTC Controls */}
      <StudioHUD
        isXray={isXray}
        setIsXray={setIsXray}
        selectedPart={selectedPart}
        onSelectPart={handleSelectPart}
        onClearSelection={handleClearSelection}
        activeDTC={activeDTC}
        setActiveDTC={setActiveDTC}
        onResetView={handleResetView}
      />

      {/* Percentage Progress Loader */}
      <StudioLoader />
    </main>
  );
};

export default App;
