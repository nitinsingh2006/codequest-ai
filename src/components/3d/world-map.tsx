"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";

interface WorldNode {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  unlocked: boolean;
}

function WorldSphere({ node, onClick }: { node: WorldNode; onClick: () => void }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.position.y += Math.sin(state.clock.elapsedTime + node.position[0]) * 0.001;
  });

  return (
    <group position={node.position}>
      <Float speed={1.5} floatIntensity={0.3}>
        <mesh ref={mesh} onClick={onClick} scale={node.unlocked ? 1 : 0.7}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial
            color={node.unlocked ? node.color : "#333"}
            emissive={node.unlocked ? node.color : "#111"}
            emissiveIntensity={node.unlocked ? 0.4 : 0}
            transparent
            opacity={node.unlocked ? 1 : 0.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

function ConnectionLines({ nodes }: { nodes: WorldNode[] }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      pts.push(new THREE.Vector3(...nodes[i].position));
      pts.push(new THREE.Vector3(...nodes[i + 1].position));
    }
    return pts;
  }, [nodes]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#6C63FF" transparent opacity={0.3} />
    </lineSegments>
  );
}

export function WorldMap3D({ worlds, onSelect }: { worlds: WorldNode[]; onSelect: (id: string) => void }) {
  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden neon-border">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#6C63FF" />
        <ConnectionLines nodes={worlds} />
        {worlds.map((node) => (
          <WorldSphere key={node.id} node={node} onClick={() => onSelect(node.id)} />
        ))}
      </Canvas>
    </div>
  );
}
