import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CarPart, DEFAULT_CAMERA_POS, DEFAULT_TARGET_POS } from '../data/partsConfig';

interface CameraRigProps {
  selectedPart: CarPart | null;
  resetSignal: number;
}

const DEFAULT_CAM_VEC = new THREE.Vector3(...DEFAULT_CAMERA_POS);
const DEFAULT_TARGET_VEC = new THREE.Vector3(...DEFAULT_TARGET_POS);

export const CameraRig: React.FC<CameraRigProps> = ({
  selectedPart,
  resetSignal,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isTransitioning = useRef<boolean>(false);
  const prevPartIdRef = useRef<string | null>(null);

  // Determine current destination vectors
  const targetCamPos = React.useMemo(() => {
    if (selectedPart) {
      return new THREE.Vector3(...selectedPart.cameraPosition);
    }
    return DEFAULT_CAM_VEC;
  }, [selectedPart]);

  const targetControlsTarget = React.useMemo(() => {
    if (selectedPart) {
      return new THREE.Vector3(...selectedPart.targetPosition);
    }
    return DEFAULT_TARGET_VEC;
  }, [selectedPart]);

  // Trigger smooth transition on selection change or reset signal
  useEffect(() => {
    const partChanged = selectedPart?.id !== prevPartIdRef.current;
    if (partChanged || resetSignal > 0) {
      isTransitioning.current = true;
    }
    prevPartIdRef.current = selectedPart?.id ?? null;
  }, [selectedPart, resetSignal]);

  // Sync initial target on mount
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(DEFAULT_TARGET_VEC);
      controlsRef.current.update();
    }
  }, []);

  // USER CONTROL PRIORITY: Touch / drag immediately cancels programmatic camera lerp
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

  // Frame-by-frame smooth dampening
  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls || !isTransitioning.current) return;

    // Use smooth damping lambda (4.8 gives a snappy, high-end automotive camera glide)
    const lambda = 4.8;
    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      targetCamPos.x,
      lambda,
      delta
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      targetCamPos.y,
      lambda,
      delta
    );
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      targetCamPos.z,
      lambda,
      delta
    );

    controls.target.x = THREE.MathUtils.damp(
      controls.target.x,
      targetControlsTarget.x,
      lambda,
      delta
    );
    controls.target.y = THREE.MathUtils.damp(
      controls.target.y,
      targetControlsTarget.y,
      lambda,
      delta
    );
    controls.target.z = THREE.MathUtils.damp(
      controls.target.z,
      targetControlsTarget.z,
      lambda,
      delta
    );

    controls.update();

    // Check completion threshold
    const camDist = state.camera.position.distanceTo(targetCamPos);
    const targetDist = controls.target.distanceTo(targetControlsTarget);

    if (camDist < 0.02 && targetDist < 0.02) {
      state.camera.position.copy(targetCamPos);
      controls.target.copy(targetControlsTarget);
      controls.update();
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={DEFAULT_TARGET_POS}
      makeDefault
      enableDamping={true}
      dampingFactor={0.05}
      enableZoom={true}
      enablePan={false}
      minDistance={0.8}
      maxDistance={9.5}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  );
};
