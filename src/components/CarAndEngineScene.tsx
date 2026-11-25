import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export type ViewMode = 'xray' | 'exterior' | 'engine';

// Configure local Draco decoder path
useGLTF.setDecoderPath('/draco/');

// ============================================================================
// CONFIGURABLE ALIGNMENT CONSTANTS FOR 3D CAR & ENGINE MODELS
// ============================================================================
export const TARGET_CAR_LENGTH = 4.4; // Normalized length of the car along Z
export const TARGET_ENGINE_SIZE = 1.05; // Normalized size of the engine
export const ENGINE_BAY_OFFSET = new THREE.Vector3(0, 0.38, 0.55);
export const ENGINE_INSPECT_POS = new THREE.Vector3(0, 0.50, 0); // Position when isolated
export const ENGINE_INSPECT_SCALE = 1.5; // Scale multiplier in Inspect Engine mode

interface CarAndEngineSceneProps {
  viewMode: ViewMode;
  simulateFault: boolean;
}

export const CarAndEngineScene: React.FC<CarAndEngineSceneProps> = ({
  viewMode,
  simulateFault,
}) => {
  // Load real high-quality car.glb and engine.glb from public/
  const { scene: carScene } = useGLTF('/car.glb', '/draco/');
  const { scene: engineScene } = useGLTF('/engine.glb', '/draco/');

  // References for live transform and animation
  const carRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Group>(null);

  // Material caches for 100% reversible material swapping
  const carMaterialsMap = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const engineOriginalEmissives = useRef<Map<THREE.MeshStandardMaterial, { color: THREE.Color; intensity: number }>>(new Map());

  // Performance cache: store engine meshes in a flat array
  const engineStandardMeshesRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const lastFaultStateRef = useRef<boolean>(false);

  // ============================================================================
  // REUSABLE SHARED TRANSPARENT MATERIALS
  // ============================================================================
  const sharedMaterials = useMemo(() => {
    return {
      transparentBody: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#38bdf8'),
        metalness: 0.15,
        roughness: 0.08,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      }),
      transparentGlass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#e0f2fe'),
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        roughness: 0.02,
        clearcoat: 1.0,
      }),
      transparentInterior: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#334155'),
        roughness: 0.7,
        metalness: 0.2,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    };
  }, []);

  // ============================================================================
  // 1. CAR GROUNDING & AUTO-ALIGNMENT
  // ============================================================================
  const normalizedCar = useMemo(() => {
    const clone = carScene.clone(true);
    clone.position.set(0, 0, 0);

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

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_ENGINE_SIZE / maxDim;
    clone.scale.setScalar(scale);

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
      const stdMats: THREE.MeshStandardMaterial[] = [];

      normalizedEngine.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            if (mat && 'emissive' in mat) {
              const stdMat = mat as THREE.MeshStandardMaterial;
              engineOriginalEmissives.current.set(stdMat, {
                color: stdMat.emissive.clone(),
                intensity: stdMat.emissiveIntensity,
              });
              stdMats.push(stdMat);
            }
          });
        }
      });

      engineStandardMeshesRef.current = stdMats;
    }
  }, [normalizedEngine]);

  // ============================================================================
  // 3. ZERO-ALLOCATION MATERIAL SWAPPING
  // ============================================================================
  useEffect(() => {
    if (!normalizedCar) return;

    if (viewMode === 'xray') {
      normalizedCar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const name = (mesh.name || '').toLowerCase();

          if (
            name.includes('body') ||
            name.includes('carbon') ||
            name.includes('trim') ||
            name.includes('blue') ||
            name.includes('yellow') ||
            name.includes('main')
          ) {
            mesh.material = sharedMaterials.transparentBody;
          } else if (name.includes('glass')) {
            mesh.material = sharedMaterials.transparentGlass;
          } else if (
            name.includes('interior') ||
            name.includes('leather') ||
            name.includes('carpet')
          ) {
            mesh.material = sharedMaterials.transparentInterior;
          }
        }
      });
    } else if (viewMode === 'exterior') {
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
  }, [viewMode, normalizedCar, sharedMaterials]);

  // ============================================================================
  // 4. LOW-LOAD ANIMATION FRAME (Zero calculations when idle)
  // ============================================================================
  useFrame((state, delta) => {
    if (!engineRef.current) return;

    const targetPos = viewMode === 'engine' ? ENGINE_INSPECT_POS : ENGINE_BAY_OFFSET;
    const targetScale = viewMode === 'engine' ? ENGINE_INSPECT_SCALE : 1.0;

    // Only calculate position lerp if not already at target
    if (engineRef.current.position.distanceTo(targetPos) > 0.002) {
      const smoothStep = Math.min(delta * 5.0, 1.0);
      engineRef.current.position.lerp(targetPos, smoothStep);
    } else {
      engineRef.current.position.copy(targetPos);
    }

    // Only calculate scale lerp if not already at target
    if (Math.abs(engineRef.current.scale.x - targetScale) > 0.002) {
      const smoothStep = Math.min(delta * 5.0, 1.0);
      const nextScale = THREE.MathUtils.lerp(engineRef.current.scale.x, targetScale, smoothStep);
      engineRef.current.scale.setScalar(nextScale);
    } else {
      engineRef.current.scale.setScalar(targetScale);
    }

    // LOAD FIX: Only update emissive when fault is ACTUALLY active
    const engineMats = engineStandardMeshesRef.current;
    if (simulateFault && (viewMode === 'xray' || viewMode === 'engine')) {
      lastFaultStateRef.current = true;
      const pulse = Math.sin(state.clock.elapsedTime * 6.0) * 0.5 + 0.5;
      const pulseIntensity = 0.8 + pulse * 2.8;

      for (let i = 0; i < engineMats.length; i++) {
        engineMats[i].emissive.set('#ef4444');
        engineMats[i].emissiveIntensity = pulseIntensity;
      }
    } else if (lastFaultStateRef.current) {
      // LOAD FIX: Reset EXACTLY ONCE when fault turns off, NOT 60 times every second!
      lastFaultStateRef.current = false;
      for (let i = 0; i < engineMats.length; i++) {
        const mat = engineMats[i];
        const orig = engineOriginalEmissives.current.get(mat);
        if (orig) {
          mat.emissive.copy(orig.color);
          mat.emissiveIntensity = orig.intensity;
        } else {
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        }
      }
    }
  });

  const isCarVisible = viewMode !== 'engine';
  const isEngineVisible = viewMode !== 'exterior';

  return (
    <group name="CarAndEngineScene">
      {/* 1. REAL CAR MODEL */}
      <primitive
        ref={carRef}
        object={normalizedCar}
        visible={isCarVisible}
      />

      {/* 2. REALISTIC ENGINE MODEL */}
      <group
        ref={engineRef}
        position={ENGINE_BAY_OFFSET.toArray()}
        visible={isEngineVisible}
      >
        <primitive object={normalizedEngine} />

        {/* 3D FLOATING HTML FAULT BADGE */}
        {simulateFault && (viewMode === 'xray' || viewMode === 'engine') && (
          <Html
            position={[0, 0.70, 0]}
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

// Pre-load GLTF assets
useGLTF.preload('/car.glb', '/draco/');
useGLTF.preload('/engine.glb', '/draco/');
