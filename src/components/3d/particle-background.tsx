"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 500 }) {
  const mesh = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      // Purple to cyan gradient
      const t = Math.random();
      col[i * 3] = 0.42 * (1 - t) + 0 * t;
      col[i * 3 + 1] = 0.39 * (1 - t) + 0.96 * t;
      col[i * 3 + 2] = 1 * (1 - t) + 0.83 * t;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.02;
    mesh.current.rotation.x += delta * 0.01;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function FloatingOrbs() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <group ref={group}>
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, Math.sin(i) * 1.5, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.08 + Math.random() * 0.05, 16, 16]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#6C63FF" : "#00F5D4"} transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }}>
        <Particles />
        <FloatingOrbs />
      </Canvas>
    </div>
  );
}
