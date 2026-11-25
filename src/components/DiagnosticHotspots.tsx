import React, { useRef, useState, useMemo } from 'react';
import { Billboard } from '@react-three/drei';
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

// Pre-generate and cache procedural CanvasTextures for locked 60 FPS performance and ZERO DOM overlay bleed
const textureCache = new Map<string, THREE.CanvasTexture>();

function getHotspotTexture(
  zoneNumber: string,
  state: 'nominal' | 'hover' | 'selected' | 'fault'
): THREE.CanvasTexture {
  const key = `${zoneNumber}-${state}`;
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const centerX = 128;
  const centerY = 128;
  const radius = 96;

  let bgColor = '#0f172a'; // Deep slate nominal
  let borderColor = '#ffffff';
  const textColor = '#ffffff';

  if (state === 'fault') {
    bgColor = '#dc2626'; // Emergency Red
    borderColor = '#ffffff';
  } else if (state === 'selected') {
    bgColor = '#0284c7'; // Active Sky Blue
    borderColor = '#ffffff';
  } else if (state === 'hover') {
    bgColor = '#0369a1'; // Hover Sky
    borderColor = '#38bdf8';
  }

  // Subtle drop shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Solid circular disc
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Reset shadow for border & text
  ctx.shadowColor = 'transparent';

  // Crisp high-contrast border
  ctx.lineWidth = 14;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  // Zone Number (01, 02, 03, 04) in bold monospace
  ctx.fillStyle = textColor;
  ctx.font = '900 86px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(zoneNumber, centerX, centerY + 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

const SingleHotspot: React.FC<SingleHotspotProps> = ({
  part,
  isSelected,
  isFaulty,
  onSelect,
  isXray: _isXray,
}) => {
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);

  // Determine current badge state
  const stateKey: 'nominal' | 'hover' | 'selected' | 'fault' = isFaulty
    ? 'fault'
    : isSelected
    ? 'selected'
    : hovered
    ? 'hover'
    : 'nominal';

  const badgeTexture = useMemo(
    () => getHotspotTexture(part.zoneNumber, stateKey),
    [part.zoneNumber, stateKey]
  );

  // Pulse animation on outer halo when active or faulty
  useFrame((state) => {
    if (pulseRef.current) {
      if (isSelected || isFaulty) {
        const freq = isFaulty ? 5.0 : 3.0;
        const s = 1.0 + Math.sin(state.clock.elapsedTime * freq) * 0.18;
        pulseRef.current.scale.set(s, s, s);
      } else {
        pulseRef.current.scale.set(1, 1, 1);
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

  const baseScale = isSelected ? 1.2 : hovered ? 1.1 : 1.0;

  return (
    <group position={part.hotspotPosition}>
      {/* 1. Camera-Facing Hardware-Accelerated 3D Badge (100% Inside WebGL Canvas - NEVER bleeds over HTML modals/cards) */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Pulsing Outer Halo Wave when selected or faulty */}
        {(isSelected || isFaulty) && (
          <mesh ref={pulseRef}>
            <ringGeometry args={[0.13, 0.155, 36]} />
            <meshBasicMaterial
              color={isFaulty ? '#ef4444' : '#38bdf8'}
              transparent
              opacity={isFaulty ? 0.8 : 0.6}
              side={THREE.DoubleSide}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Crisp Numbered OEM Marker Disc */}
        <mesh scale={[baseScale, baseScale, 1]}>
          <planeGeometry args={[0.24, 0.24]} />
          <meshBasicMaterial
            map={badgeTexture}
            transparent={true}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* 2. Invisible Hit Proxy Sphere for Instant Native Pointer & Touch Events */}
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
