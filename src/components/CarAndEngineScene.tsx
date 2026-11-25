import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame, ThreeEvent } from '@react-three/fiber';

// Configure local Draco decoder path
useGLTF.setDecoderPath('/draco/');

// ============================================================================
// CONFIGURABLE ALIGNMENT CONSTANTS FOR 3D CAR & ENGINE MODELS
// ============================================================================
export const TARGET_CAR_LENGTH = 4.4;
export const TARGET_ENGINE_SIZE = 1.05;
export const ENGINE_BAY_OFFSET = new THREE.Vector3(0, 0.38, 0.55);

interface CarAndEngineSceneProps {
  isXray: boolean;
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
  simulateFault: boolean;
}

export const CarAndEngineScene: React.FC<CarAndEngineSceneProps> = ({
  isXray,
  selectedPartId,
  onSelectPart,
  simulateFault,
}) => {
  // Load real high-quality car.glb and engine.glb from public/
  const { scene: carScene } = useGLTF('/car.glb', '/draco/');
  const { scene: engineScene } = useGLTF('/engine.glb', '/draco/');

  // References for live transform and animation
  const carRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Group>(null);

  // Material caches for 100% reversible material restoration
  const carMaterialsMap = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const engineOriginalEmissives = useRef<Map<THREE.MeshStandardMaterial, { color: THREE.Color; intensity: number }>>(new Map());

  // Performance cache: store engine meshes in a flat array
  const engineStandardMeshesRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const lastFaultStateRef = useRef<boolean>(false);
  const lastHighlightPartRef = useRef<string | null>(null);

  // Smooth X-Ray opacity animation state
  const currentOpacityRef = useRef<number>(isXray ? 0.16 : 1.0);
  const isFullyOpaqueRef = useRef<boolean>(!isXray);

  // ============================================================================
  // REUSABLE SHARED TRANSPARENT MATERIALS (Phase 2 glass specs)
  // ============================================================================
  const sharedMaterials = useMemo(() => {
    return {
      transparentBody: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#38bdf8'),
        metalness: 0.15,
        roughness: 0.08,
        transparent: true,
        opacity: 0.16, // Phase 2 target opacity
        depthWrite: false,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      }),
      transparentGlass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#e0f2fe'),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        roughness: 0.02,
        clearcoat: 1.0,
      }),
      transparentInterior: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#334155'),
        roughness: 0.7,
        metalness: 0.2,
        transparent: true,
        opacity: 0.25,
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
  // 3. ZERO-ALLOCATION MATERIAL SWAPPING WITH INSTANT REVERSIBILITY
  // ============================================================================
  useEffect(() => {
    if (!normalizedCar) return;

    if (isXray) {
      isFullyOpaqueRef.current = false;
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
    } else {
      // When X-Ray turns OFF: restore exact original materials, textures, and depthWrite
      normalizedCar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const orig = carMaterialsMap.current.get(mesh);
          if (orig) {
            mesh.material = orig;
          }
        }
      });
      isFullyOpaqueRef.current = true;
    }
  }, [isXray, normalizedCar, sharedMaterials]);

  // ============================================================================
  // 4. ANIMATION FRAME (Smooth opacity lerp & emissive highlights)
  // ============================================================================
  useFrame((state, delta) => {
    // Smoothly lerp transparent material opacity when in X-Ray
    if (isXray) {
      const targetOpacity = 0.16;
      currentOpacityRef.current = THREE.MathUtils.damp(
        currentOpacityRef.current,
        targetOpacity,
        8.0,
        delta
      );
      sharedMaterials.transparentBody.opacity = currentOpacityRef.current;
    } else {
      currentOpacityRef.current = 1.0;
    }

    const engineMats = engineStandardMeshesRef.current;

    // A. OBD-II Fault Simulator Highlight (P0300)
    if (simulateFault && isXray) {
      lastFaultStateRef.current = true;
      const pulse = Math.sin(state.clock.elapsedTime * 6.0) * 0.5 + 0.5;
      const pulseIntensity = 0.8 + pulse * 2.8;

      for (let i = 0; i < engineMats.length; i++) {
        engineMats[i].emissive.set('#ef4444');
        engineMats[i].emissiveIntensity = pulseIntensity;
      }
    } else if (selectedPartId === 'engine') {
      // B. Selected Part Active Accent Highlight (Cyan/Sky glow)
      lastHighlightPartRef.current = 'engine';
      const pulse = Math.sin(state.clock.elapsedTime * 4.0) * 0.5 + 0.5;
      const highlightIntensity = 0.6 + pulse * 1.5;

      for (let i = 0; i < engineMats.length; i++) {
        engineMats[i].emissive.set('#38bdf8');
        engineMats[i].emissiveIntensity = highlightIntensity;
      }
    } else if (lastFaultStateRef.current || lastHighlightPartRef.current) {
      // C. Reset to original emissives exactly ONCE when highlight/fault clears
      lastFaultStateRef.current = false;
      lastHighlightPartRef.current = null;

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

  // Direct 3D mesh click handlers with strict tap-vs-drag protection (delta <= 5)
  const handleEngineClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.delta <= 5) {
      onSelectPart('engine');
    }
  };

  const handleCarMeshClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.delta > 5) return; // Ignore drag rotation on touch screens

    // Check mesh hierarchy for specific diagnostic zones
    let current: THREE.Object3D | null = e.object;
    let detectedPart: string | null = null;

    while (current && current !== normalizedCar) {
      const name = (current.name || '').toLowerCase();
      if (name.includes('wheel') || name.includes('tire') || name.includes('brake') || name.includes('rim')) {
        detectedPart = 'brakes';
        break;
      } else if (name.includes('exhaust') || name.includes('pipe') || name.includes('muffler')) {
        detectedPart = 'exhaust';
        break;
      }
      current = current.parent;
    }

    if (detectedPart) {
      onSelectPart(detectedPart);
    }
  };

  // Engine is visible when X-Ray is ON, or if Engine is selected
  const isEngineVisible = isXray || selectedPartId === 'engine';

  return (
    <group name="CarAndEngineScene">
      {/* 1. REAL CAR MODEL */}
      <primitive
        ref={carRef}
        object={normalizedCar}
        visible={true}
        onPointerUp={handleCarMeshClick}
      />

      {/* 2. REALISTIC ENGINE MODEL */}
      <group
        ref={engineRef}
        position={ENGINE_BAY_OFFSET.toArray()}
        visible={isEngineVisible}
        onPointerUp={handleEngineClick}
      >
        <primitive object={normalizedEngine} />

        {/* 3D FLOATING HTML FAULT BADGE (When P0300 active) */}
        {simulateFault && isXray && (
          <Html
            position={[0, 0.70, 0]}
            center
            distanceFactor={8}
            className="pointer-events-none select-none"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/95 text-white shadow-xl backdrop-blur-md border border-red-300 text-xs font-bold animate-pulse whitespace-nowrap shadow-red-500/50">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
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
