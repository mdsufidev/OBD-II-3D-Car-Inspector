import React, { useRef, useEffect, forwardRef, useImperativeHandle, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CarAndEngineScene, ViewMode } from './CarAndEngineScene';

export interface CarCanvasRef {
  resetCamera: () => void;
}

interface CarCanvasProps {
  viewMode: ViewMode;
  simulateFault: boolean;
}

// Camera targets per view mode
const CAR_HERO_POS = new THREE.Vector3(4.2, 1.8, 4.2);
const CAR_TARGET = new THREE.Vector3(0, 0.55, 0);

const ENGINE_HERO_POS = new THREE.Vector3(1.8, 1.1, 1.8);
const ENGINE_TARGET = new THREE.Vector3(0, 0.60, 0);

interface SceneContentProps {
  viewMode: ViewMode;
  simulateFault: boolean;
  resetSignal: number;
}

const SceneContent: React.FC<SceneContentProps> = ({
  viewMode,
  simulateFault,
  resetSignal,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isTransitioning = useRef(false);
  const prevModeRef = useRef<ViewMode>(viewMode);

  // Determine current mode camera goals
  const targetCamPos = viewMode === 'engine' ? ENGINE_HERO_POS : CAR_HERO_POS;
  const targetControlsTarget = viewMode === 'engine' ? ENGINE_TARGET : CAR_TARGET;

  // CRITICAL FIX:
  // 1. Only trigger camera animation on explicit Reset View button (resetSignal > 0)
  // 2. OR when switching TO or FROM 'engine' mode.
  // 3. Switching between 'xray' and 'exterior' (Transparent ↔ Solid) DOES NOT move camera!
  useEffect(() => {
    const isEngineSwitch =
      (viewMode === 'engine' && prevModeRef.current !== 'engine') ||
      (viewMode !== 'engine' && prevModeRef.current === 'engine');

    if (resetSignal > 0 || isEngineSwitch) {
      isTransitioning.current = true;
    }

    prevModeRef.current = viewMode;
  }, [viewMode, resetSignal]);

  // TOUCH OVERRIDE FIX: User touch immediately cancels transition so rotation NEVER freezes!
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onUserInteractionStart = () => {
      isTransitioning.current = false;
    };

    controls.addEventListener('start', onUserInteractionStart);
    return () => {
      controls.removeEventListener('start', onUserInteractionStart);
    };
  }, []);

  // Smooth camera & target lerp
  useFrame((state, delta) => {
    if (controlsRef.current && isTransitioning.current) {
      const step = Math.min(delta * 4.2, 1);
      state.camera.position.lerp(targetCamPos, step);
      controlsRef.current.target.lerp(targetControlsTarget, step);
      controlsRef.current.update();

      if (
        state.camera.position.distanceTo(targetCamPos) < 0.02 &&
        controlsRef.current.target.distanceTo(targetControlsTarget) < 0.02
      ) {
        state.camera.position.copy(targetCamPos);
        controlsRef.current.target.copy(targetControlsTarget);
        controlsRef.current.update();
        isTransitioning.current = false;
      }
    }
  });

  return (
    <>
      {/* Studio Showroom HDRI Lighting */}
      <Environment preset="studio" environmentIntensity={0.85} />

      {/* Ambient Fill */}
      <ambientLight intensity={0.55} color="#f8fafc" />

      {/* Directional Key Light */}
      <directionalLight
        position={[6, 8, 5]}
        intensity={1.25}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Rim / Backlight for Metallic Highlights */}
      <directionalLight position={[-6, 5, -6]} intensity={0.75} color="#e2e8f0" />

      {/* Front Fill Light */}
      <directionalLight position={[0, 3, 6]} intensity={0.4} color="#f1f5f9" />

      {/* 2-Model Scene (Car + Engine) */}
      <Suspense fallback={null}>
        <CarAndEngineScene viewMode={viewMode} simulateFault={simulateFault} />
      </Suspense>

      {/* Seamless Studio Floor Mesh */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Grounded Contact Shadows: key={viewMode} cleanly re-bakes once per mode switch */}
      <ContactShadows
        key={viewMode}
        position={[0, 0, 0]}
        opacity={0.65}
        scale={viewMode === 'engine' ? 5 : 10}
        blur={1.4}
        far={3.5}
        resolution={1024}
        color="#0f172a"
        frames={1}
      />

      {/* Smooth OrbitControls with Damping & Wide Distance Bounds */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        enableZoom={true}
        enablePan={false}
        minDistance={0.9}
        maxDistance={9.5}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />
    </>
  );
};

export const CarCanvas = forwardRef<CarCanvasRef, CarCanvasProps>(
  ({ viewMode, simulateFault }, ref) => {
    const [resetSignal, setResetSignal] = React.useState(0);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        setResetSignal((prev) => prev + 1);
      },
    }));

    return (
      <div className="absolute inset-0 w-full h-full touch-none select-none overflow-hidden bg-slate-50">
        <Canvas
          camera={{
            position: [4.2, 1.8, 4.2],
            fov: 40,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 1.5]}
          shadows
          className="touch-none select-none outline-none"
        >
          <SceneContent
            viewMode={viewMode}
            simulateFault={simulateFault}
            resetSignal={resetSignal}
          />
        </Canvas>
      </div>
    );
  }
);

CarCanvas.displayName = 'CarCanvas';
