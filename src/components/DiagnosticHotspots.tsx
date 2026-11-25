import React, { useRef, useState } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { CAR_PARTS, CarPart } from '../data/partsConfig';

interface DiagnosticHotspotsProps {
  selectedPartId: string | null;
  activeDTC: string | null;
  onSelectPart: (partId: string) => void;
  isXray: boolean;
}

interface SingleHotspotProps {
  part: CarPart;
  isSelected: boolean;
  isFaulty: boolean;
  onSelect: () => void;
  isXray: boolean;
}

const SingleHotspot: React.FC<SingleHotspotProps> = ({
  part,
  isSelected,
  isFaulty,
  onSelect,
  isXray,
}) => {
  const [hovered, setHovered] = useState(false);
  const beaconRef = useRef<THREE.Mesh>(null);

  // Smooth subtle pulse on 3D beacon ring when active or faulty
  useFrame((state) => {
    if (beaconRef.current) {
      if (isSelected || isFaulty) {
        const freq = isFaulty ? 5.0 : 3.0;
        const scale = 1.0 + Math.sin(state.clock.elapsedTime * freq) * 0.15;
        beaconRef.current.scale.set(scale, scale, scale);
      } else {
        beaconRef.current.scale.set(1, 1, 1);
      }
    }
  });

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Strict tap-vs-drag protection: delta <= 5 ensures rotating car doesn't trigger part click
    if (e.delta <= 5) {
      onSelect();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Color scheme: Red when DTC active, Sky Blue when selected/hovered, Titanium Slate when nominal
  const accentColor = isFaulty
    ? '#ef4444'
    : isSelected
    ? '#0284c7'
    : hovered
    ? '#0ea5e9'
    : '#64748b';

  return (
    <group position={part.hotspotPosition}>
      {/* 1. Subtle 3D Circular Ground/Surface Beacon Ring (NO AI crosshairs) */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <mesh ref={beaconRef}>
          <ringGeometry args={[0.07, 0.082, 36]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={isFaulty ? 0.9 : isSelected ? 0.8 : hovered ? 0.6 : isXray ? 0.35 : 0.2}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>
      </Billboard>

      {/* 2. Authentic OEM Technical Inspection Marker (Razor-Sharp, Clean Numbered Badge) */}
      <Html
        center
        distanceFactor={9.5}
        zIndexRange={[40, 0]}
        className="pointer-events-none select-none"
      >
        <div
          className={`relative flex items-center justify-center transition-transform duration-200 ease-out ${
            isSelected ? 'scale-110' : hovered ? 'scale-105' : 'scale-100'
          }`}
        >
          {/* Subtle status pulse wave when selected or fault */}
          {(isSelected || isFaulty) && (
            <span
              className={`absolute -inset-1 rounded-full animate-ping opacity-60 ${
                isFaulty ? 'bg-red-500' : 'bg-sky-400'
              }`}
            />
          )}

          {/* Solid Opaque Numbered OEM Inspection Pill */}
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full font-mono text-[11px] font-bold shadow-lg transition-all duration-200 border-2 ${
              isFaulty
                ? 'bg-red-600 text-white border-white shadow-red-500/50'
                : isSelected
                ? 'bg-sky-600 text-white border-white shadow-sky-500/50 ring-2 ring-sky-300'
                : hovered
                ? 'bg-slate-900 text-white border-sky-400 ring-2 ring-sky-400/30'
                : 'bg-slate-900 text-white border-white/90 shadow-md'
            }`}
          >
            {part.zoneNumber}
          </div>

          {/* Subsystem Name Tag on Hover, Active, or Fault */}
          {(hovered || isSelected || isFaulty) && (
            <div
              className={`absolute left-full ml-2 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide whitespace-nowrap shadow-lg border animate-in fade-in duration-150 ${
                isFaulty
                  ? 'bg-red-600 text-white border-red-400'
                  : isSelected
                  ? 'bg-sky-700 text-white border-sky-400'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              {part.name.split(' ')[0].toUpperCase()}
            </div>
          )}
        </div>
      </Html>

      {/* 3. Invisible Hit Proxy Sphere for Native Three.js Raycasting & Tap-vs-Drag Protection */}
      <mesh
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
};

export const DiagnosticHotspots: React.FC<DiagnosticHotspotsProps> = ({
  selectedPartId,
  activeDTC,
  onSelectPart,
  isXray,
}) => {
  return (
    <group name="DiagnosticHotspots">
      {CAR_PARTS.map((part) => (
        <SingleHotspot
          key={part.id}
          part={part}
          isSelected={selectedPartId === part.id}
          isFaulty={activeDTC === part.faultCode}
          onSelect={() => onSelectPart(part.id)}
          isXray={isXray}
        />
      ))}
    </group>
  );
};
