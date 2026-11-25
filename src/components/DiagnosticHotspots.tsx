import React, { useRef, useState } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame, ThreeEvent } from '@react-three/fiber';
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
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  // High-performance micro-pulse on selected/hovered state
  useFrame((state) => {
    if (isSelected && pulseRef.current) {
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 4.0) * 0.18;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Strict tap vs drag guard (e.delta <= 5)
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

  // Color scheme: high-contrast OEM technical palette
  const accentColor = isSelected ? '#0284c7' : hovered ? '#0ea5e9' : '#475569';
  const ringOpacity = isSelected ? 0.95 : hovered ? 0.85 : isXray ? 0.60 : 0.35;

  return (
    <group position={part.hotspotPosition}>
      {/* 1. Camera-Facing Hardware-Accelerated Technical Reticle (Zero DOM Reflows) */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Outer Circular Targeting Reticle */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.075, 0.092, 32]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={ringOpacity}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* Selected Active Radar Wave */}
        {isSelected && (
          <mesh ref={pulseRef}>
            <ringGeometry args={[0.095, 0.108, 32]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
        )}

        {/* Center Target Point */}
        <mesh>
          <circleGeometry args={[0.024, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#0284c7' : hovered ? '#0ea5e9' : '#0f172a'}
            transparent
            opacity={isSelected ? 1.0 : 0.75}
            depthTest={false}
          />
        </mesh>

        {/* CAD Crosshairs (Technical Reticle Tickmarks) */}
        <mesh position={[0, 0.115, 0]}>
          <planeGeometry args={[0.008, 0.035]} />
          <meshBasicMaterial color={accentColor} transparent opacity={ringOpacity} depthTest={false} />
        </mesh>
        <mesh position={[0, -0.115, 0]}>
          <planeGeometry args={[0.008, 0.035]} />
          <meshBasicMaterial color={accentColor} transparent opacity={ringOpacity} depthTest={false} />
        </mesh>
        <mesh position={[0.115, 0, 0]}>
          <planeGeometry args={[0.035, 0.008]} />
          <meshBasicMaterial color={accentColor} transparent opacity={ringOpacity} depthTest={false} />
        </mesh>
        <mesh position={[-0.115, 0, 0]}>
          <planeGeometry args={[0.035, 0.008]} />
          <meshBasicMaterial color={accentColor} transparent opacity={ringOpacity} depthTest={false} />
        </mesh>
      </Billboard>

      {/* 2. Low-Poly Invisible Hit Proxy Sphere for Instant Tap Detection */}
      <mesh
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>
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
