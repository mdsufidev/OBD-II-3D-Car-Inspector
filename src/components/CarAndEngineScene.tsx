import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export type ViewMode = 'xray' | 'exterior' | 'engine';

// Configure local Draco decoder path
useGLTF.setDecoderPath('/draco/');

// ============================================================================
// CONFIGURABLE ALIGNMENT CONSTANTS FOR REAL 3D CAR & ENGINE MODELS
// ============================================================================
export const TARGET_CAR_LENGTH = 4.4; // Normalized length of the car along Z
export const TARGET_ENGINE_SIZE = 1.05; // Normalized size of the engine
export const ENGINE_BAY_OFFSET = new THREE.Vector3(0, 0.46, 0.55); // Position inside the Ferrari engine bay
export const ENGINE_INSPECT_POS = new THREE.Vector3(0, 0.60, 0); // Position when isolated
export const ENGINE_INSPECT_SCALE = 1.6; // Scale multiplier in Inspect Engine mode

interface CarAndEngineSceneProps {
  viewMode: ViewMode;
  simulateFault: boolean;
}

export const CarAndEngineScene: React.FC<CarAndEngineSceneProps> = ({
  viewMode,
  simulateFault,
}) => {
  // Load real high-quality car.glb (Ferrari 458 Italia) and engine.glb from public/
  const { scene: carScene } = useGLTF('/car.glb', '/draco/');
  const { scene: engineScene } = useGLTF('/engine.glb', '/draco/');

  // References for live transform and animation
  const carRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Group>(null);

  // Material caches for 100% reversible material swapping
  const carMaterialsMap = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const engineOriginalEmissives = useRef<Map<THREE.MeshStandardMaterial, { color: THREE.Color; intensity: number }>>(new Map());

  // ============================================================================
  // 1. AUTO-ALIGNMENT & BOUNDING BOX NORMALIZATION
  // ============================================================================
  const normalizedCar = useMemo(() => {
    const clone = carScene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Normalize length so max horizontal dimension is TARGET_CAR_LENGTH
    const maxLen = Math.max(size.z, size.x) || 1;
    const scale = TARGET_CAR_LENGTH / maxLen;
    clone.scale.setScalar(scale);

    // Recompute box after scaling to ground exactly at y = 0 and center on X & Z
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    clone.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

    const wrapper = new THREE.Group();
    wrapper.name = 'Car_Wrapper';
    wrapper.add(clone);
    return wrapper;
  }, [carScene]);

  const normalizedEngine = useMemo(() => {
    const clone = engineScene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Normalize scale so engine max dimension is TARGET_ENGINE_SIZE
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_ENGINE_SIZE / maxDim;
    clone.scale.setScalar(scale);

    // Center engine around origin (0, 0, 0)
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    clone.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

    const wrapper = new THREE.Group();
    wrapper.name = 'Engine_Wrapper';
    wrapper.add(clone);
    return wrapper;
  }, [engineScene]);

  // ============================================================================
  // 2. CACHE ORIGINAL MATERIALS
  // ============================================================================
  useEffect(() => {
    if (normalizedCar) {
      carMaterialsMap.current.clear();
      normalizedCar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          carMaterialsMap.current.set(mesh, mesh.material);
        }
      });
    }
  }, [normalizedCar]);

  useEffect(() => {
    if (normalizedEngine) {
      engineOriginalEmissives.current.clear();
      normalizedEngine.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissive' in mesh.material) {
            const stdMat = mesh.material as THREE.MeshStandardMaterial;
            engineOriginalEmissives.current.set(stdMat, {
              color: stdMat.emissive.clone(),
              intensity: stdMat.emissiveIntensity,
            });
          }
        }
      });
    }
  }, [normalizedEngine]);

  // ============================================================================
  // 3. TRANSPARENCY SHADER & MATERIAL SWAPPING
  // ============================================================================
  useEffect(() => {
    if (!normalizedCar) return;

    if (viewMode === 'xray') {
      // TRANSPARENT X-RAY CAR (Default): Body shell is crystal see-through glass
      normalizedCar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const name = (mesh.name || '').toLowerCase();

          // Target outer body panels and trims to make transparent
          if (
            name.includes('body') ||
            name.includes('carbon') ||
            name.includes('trim') ||
            name.includes('blue') ||
            name.includes('yellow') ||
            name.includes('main')
          ) {
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#38bdf8'), // Sleek automotive cyan glass
              metalness: 0.1,
              roughness: 0.12,
              transmission: 0.85, // High transmission = crystal see-through
              transparent: true,
              opacity: 0.22,
              depthWrite: false, // Prevents clipping with engine inside
              ior: 1.45,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
              reflectivity: 0.9,
            });
          } else if (name.includes('glass')) {
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#e0f2fe'),
              transmission: 0.95,
              transparent: true,
              opacity: 0.12,
              depthWrite: false,
              roughness: 0.02,
            });
          } else if (
            name.includes('interior') ||
            name.includes('leather') ||
            name.includes('carpet')
          ) {
            // Semi-transparent interior so cockpit is subtly visible without blocking the engine
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#334155'),
              roughness: 0.7,
              metalness: 0.2,
              transparent: true,
              opacity: 0.35,
              depthWrite: false,
            });
          }
          // Note: Rims, tyres, brakes remain fully opaque to maintain structural realism
        }
      });
    } else if (viewMode === 'exterior') {
      // SOLID SHOWROOM: Restores original opaque materials
      normalizedCar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const orig = carMaterialsMap.current.get(mesh);
          if (orig) {
            mesh.material = orig;
          }
        }
      });
    }
  }, [viewMode, normalizedCar]);

  // ============================================================================
  // 4. ANIMATION FRAME: ENGINE POSITION & P0300 FAULT PULSING
  // ============================================================================
  useFrame((state, delta) => {
    if (!engineRef.current) return;

    // Smoothly animate engine between the car bay and isolated center inspection
    const targetPos = viewMode === 'engine' ? ENGINE_INSPECT_POS : ENGINE_BAY_OFFSET;
    const targetScale = viewMode === 'engine' ? ENGINE_INSPECT_SCALE : 1.0;

    const smoothStep = Math.min(delta * 5.0, 1.0);
    engineRef.current.position.lerp(targetPos, smoothStep);

    const currentScale = engineRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, smoothStep);
    engineRef.current.scale.setScalar(nextScale);

    // OBD-II Fault Pulse Animation (P0300 Misfire)
    if (simulateFault) {
      const pulse = Math.sin(state.clock.elapsedTime * 6.0) * 0.5 + 0.5; // 0.0 to 1.0
      const pulseIntensity = 0.8 + pulse * 3.0;

      normalizedEngine.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissive' in mesh.material) {
            const stdMat = mesh.material as THREE.MeshStandardMaterial;
            stdMat.emissive.set('#ef4444');
            stdMat.emissiveIntensity = pulseIntensity;
          }
        }
      });
    } else {
      // Reset emissives back to pristine original state
      normalizedEngine.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissive' in mesh.material) {
            const stdMat = mesh.material as THREE.MeshStandardMaterial;
            const orig = engineOriginalEmissives.current.get(stdMat);
            if (orig) {
              stdMat.emissive.copy(orig.color);
              stdMat.emissiveIntensity = orig.intensity;
            } else {
              stdMat.emissive.set('#000000');
              stdMat.emissiveIntensity = 0;
            }
          }
        }
      });
    }
  });

  const isCarVisible = viewMode !== 'engine';

  return (
    <group name="CarAndEngineScene">
      {/* 1. REAL CAR MODEL (Ferrari 458 Italia) */}
      <primitive
        ref={carRef}
        object={normalizedCar}
        visible={isCarVisible}
      />

      {/* 2. REALISTIC ENGINE MODEL (Visible inside transparent car) */}
      <group
        ref={engineRef}
        position={ENGINE_BAY_OFFSET.toArray()}
        visible={true}
      >
        <primitive object={normalizedEngine} />

        {/* 3D FLOATING HTML FAULT BADGE */}
        {simulateFault && (
          <Html
            position={[0, 0.75, 0]}
            center
            distanceFactor={8}
            className="pointer-events-none select-none"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/95 text-white shadow-xl backdrop-blur-md border border-red-300 text-xs font-bold animate-pulse whitespace-nowrap shadow-red-500/50">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>P0300: Engine Misfire Detected</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Pre-load GLTF assets into Drei cache
useGLTF.preload('/car.glb', '/draco/');
useGLTF.preload('/engine.glb', '/draco/');
