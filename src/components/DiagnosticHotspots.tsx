import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAR_PARTS, CarPart } from '../data/partsConfig';

interface DiagnosticHotspotsProps {
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
  isXray: boolean;
}

interface SingleHotspotProps {
  part: CarPart;
  isSelected: boolean;
  onSelect: () => void;
  isXray: boolean;
}

const SingleHotspot: React.FC<SingleHotspotProps> = ({
  part,
  isSelected,
  onSelect,
  isXray,
}) => {
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Subtle 3D radar pulse animation
  useFrame((state) => {
    if (ringRef.current) {
      const t = state.clock.elapsedTime * 2.5;
      const scale = 1 + Math.sin(t) * 0.15;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!pointerDownPos.current) return;

    // Strict tap vs drag guard: movement must be <= 6 pixels
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 6) {
      onSelect();
    }
    pointerDownPos.current = null;
  };

  // Determine visibility: external parts (brakes) always visible; internal parts glow brightly in X-Ray
  const opacityClass = isSelected
    ? 'opacity-100 scale-110 ring-4 ring-sky-400 ring-offset-2'
    : isXray
    ? 'opacity-90 hover:opacity-100 hover:scale-105'
    : part.isInternal
    ? 'opacity-40 hover:opacity-90'
    : 'opacity-85 hover:opacity-100';

  return (
    <group position={part.hotspotPosition}>
      {/* 3D Visual Accent Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.11, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#38bdf8' : '#0284c7'}
          transparent
          opacity={isSelected ? 0.9 : isXray ? 0.6 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interactive 2D/3D DOM Diagnostic Badge */}
      <Html center distanceFactor={6.8} className="select-none pointer-events-auto">
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={`cursor-pointer transition-all duration-200 transform-gpu flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md border ${opacityClass} ${
            isSelected
              ? 'bg-sky-600 text-white border-sky-300 shadow-sky-500/40'
              : 'bg-white/95 text-slate-800 border-slate-200/90 shadow-slate-900/10 hover:border-sky-400'
          }`}
          title={`Inspect ${part.name}`}
        >
          {/* Animated Status Pulse Indicator */}
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSelected ? 'bg-white' : 'bg-sky-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSelected ? 'bg-white' : 'bg-sky-500'
              }`}
            />
          </span>

          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
            {part.name.split(' ')[0]}
          </span>
        </div>
      </Html>
    </group>
  );
};

export const DiagnosticHotspots: React.FC<DiagnosticHotspotsProps> = ({
  selectedPartId,
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
          onSelect={() => onSelectPart(part.id)}
          isXray={isXray}
        />
      ))}
    </group>
  );
};
