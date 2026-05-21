"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function HoloSphere() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.3;
    mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color="#6C63FF"
          emissive="#6C63FF"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function HoloRing({ radius = 1.5, color = "#00F5D4" }) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime) * 0.1;
    ring.current.rotation.z = state.clock.elapsedTime * 0.2;
  });

  return (
    <mesh ref={ring}>
      <torusGeometry args={[radius, 0.01, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

export function HolographicOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }} style={{ pointerEvents: "none" }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#6C63FF" />
        <HoloSphere />
        <HoloRing radius={1.5} color="#00F5D4" />
        <HoloRing radius={1.8} color="#6C63FF" />
      </Canvas>
    </div>
  );
}
