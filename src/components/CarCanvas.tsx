import React, { forwardRef, useImperativeHandle, Suspense, useState } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { CarAndEngineScene } from './CarAndEngineScene';
import { CameraRig } from './CameraRig';
import { DiagnosticHotspots } from './DiagnosticHotspots';
import { CarPart, DEFAULT_CAMERA_POS } from '../data/partsConfig';

export interface CarCanvasRef {
  resetCamera: () => void;
}

interface CarCanvasProps {
  isXray: boolean;
  selectedPart: CarPart | null;
  activeDTC: string | null;
  onSelectPart: (partId: string) => void;
  onClearSelection: () => void;
}

interface SceneContentProps {
  isXray: boolean;
  selectedPart: CarPart | null;
  activeDTC: string | null;
  onSelectPart: (partId: string) => void;
  onClearSelection: () => void;
  resetSignal: number;
}

const SceneContent: React.FC<SceneContentProps> = ({
  isXray,
  selectedPart,
  activeDTC,
  onSelectPart,
  onClearSelection,
  resetSignal,
}) => {
  const handleFloorClick = (e: ThreeEvent<PointerEvent>) => {
    if (e.delta <= 5) {
      onClearSelection();
    }
  };

  return (
    <>
      {/* Studio Showroom HDRI Lighting */}
      <Environment preset="studio" environmentIntensity={0.85} />

      {/* Ambient Fill */}
      <ambientLight intensity={0.55} color="#f8fafc" />

      {/* Directional Key Light */}
      <directionalLight position={[6, 8, 5]} intensity={1.25} color="#ffffff" />

      {/* Rim / Backlight for Metallic Highlights */}
      <directionalLight position={[-6, 5, -6]} intensity={0.75} color="#e2e8f0" />

      {/* Front Fill Light */}
      <directionalLight position={[0, 3, 6]} intensity={0.4} color="#f1f5f9" />

      {/* 2-Model Scene (Car + Engine with Direct Multi-DTC Alerts) */}
      <Suspense fallback={null}>
        <CarAndEngineScene
          isXray={isXray}
          selectedPartId={selectedPart?.id ?? null}
          activeDTC={activeDTC}
        />

        {/* 3D Interactive Diagnostic Hotspots with Multi-DTC Glow */}
        <DiagnosticHotspots
          selectedPartId={selectedPart?.id ?? null}
          activeDTC={activeDTC}
          onSelectPart={onSelectPart}
          isXray={isXray}
        />
      </Suspense>

      {/* Seamless Studio Floor Mesh */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        onPointerUp={handleFloorClick}
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Grounded Contact Shadows: Directly beneath tyres on floor */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.65}
        scale={10}
        blur={1.4}
        far={3.5}
        resolution={1024}
        color="#0f172a"
        frames={1}
      />

      {/* Dedicated Camera Rig Managing OrbitControls & Smooth Transitions */}
      <CameraRig selectedPart={selectedPart} resetSignal={resetSignal} />
    </>
  );
};

export const CarCanvas = forwardRef<CarCanvasRef, CarCanvasProps>(
  ({ isXray, selectedPart, activeDTC, onSelectPart, onClearSelection }, ref) => {
    const [resetSignal, setResetSignal] = useState(0);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        setResetSignal((prev) => prev + 1);
        onClearSelection();
      },
    }));

    return (
      <div className="absolute inset-0 w-full h-full touch-none select-none overflow-hidden bg-slate-50">
        <Canvas
          camera={{
            position: DEFAULT_CAMERA_POS,
            fov: 40,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'default',
          }}
          dpr={[1, 1.5]}
          className="touch-none select-none outline-none"
        >
          <SceneContent
            isXray={isXray}
            selectedPart={selectedPart}
            activeDTC={activeDTC}
            onSelectPart={onSelectPart}
            onClearSelection={onClearSelection}
            resetSignal={resetSignal}
          />
        </Canvas>
      </div>
    );
  }
);

CarCanvas.displayName = 'CarCanvas';
