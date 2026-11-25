import React, { useRef, useState } from 'react';
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

const SingleHotspot: React.FC<SingleHotspotProps> = ({
  part,
  isSelected,
  isFaulty,
  onSelect,
  isXray,
}) => {
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);

  // Hardware-accelerated pulse when selected or faulty
  useFrame((state) => {
    if ((isSelected || isFaulty) && pulseRef.current) {
      const freq = isFaulty ? 6.0 : 4.0;
      const s = 1.0 + Math.sin(state.clock.elapsedTime * freq) * 0.22;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
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

  // Color scheme: Red when DTC active, Cyan when selected/hovered, Titanium Slate when nominal
  const accentColor = isFaulty
    ? '#ef4444'
    : isSelected
    ? '#0284c7'
    : hovered
    ? '#0ea5e9'
    : '#475569';

  const ringOpacity = isFaulty
    ? 1.0
    : isSelected
    ? 0.95
    : hovered
    ? 0.85
    : isXray
    ? 0.60
    : 0.35;

  return (
    <group position={part.hotspotPosition}>
      {/* 1. Camera-Facing Hardware-Accelerated Technical Reticle */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Outer Circular Targeting Reticle */}
        <mesh>
          <ringGeometry args={[0.075, 0.092, 32]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={ringOpacity}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* Selected or Fault Pulse Wave */}
        {(isSelected || isFaulty) && (
          <mesh ref={pulseRef}>
            <ringGeometry args={[0.095, 0.112, 32]} />
            <meshBasicMaterial
              color={isFaulty ? '#f87171' : '#38bdf8'}
              transparent
              opacity={isFaulty ? 0.65 : 0.45}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
        )}

        {/* Center Target Point */}
        <mesh>
          <circleGeometry args={[0.024, 16]} />
          <meshBasicMaterial
            color={isFaulty ? '#ef4444' : isSelected ? '#0284c7' : hovered ? '#0ea5e9' : '#0f172a'}
            transparent
            opacity={isFaulty || isSelected ? 1.0 : 0.75}
            depthTest={false}
          />
        </mesh>

        {/* CAD Crosshairs */}
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
