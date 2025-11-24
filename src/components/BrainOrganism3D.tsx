import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

type OrganismState = "idle" | "listening" | "processing" | "speaking";

interface BrainOrganismProps {
  state: OrganismState;
}

const BrainMesh = ({ state }: BrainOrganismProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  // State-based colors (organic bio colors)
  const colors = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          color: "#10b981", // emerald green
          emissive: "#86efac",
          emissiveIntensity: 0.4,
        };
      case "processing":
        return {
          color: "#8b5cf6", // purple
          emissive: "#a78bfa",
          emissiveIntensity: 0.3,
        };
      case "speaking":
        return {
          color: "#fb923c", // orange
          emissive: "#fcd34d",
          emissiveIntensity: 0.5,
        };
      default:
        return {
          color: "#a78bfa", // soft purple
          emissive: "#ec4899",
          emissiveIntensity: 0.25,
        };
    }
  }, [state]);

  // Animation based on state
  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = clock.getElapsedTime();

    switch (state) {
      case "listening":
        // Fast pulsing
        meshRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.08);
        materialRef.current.distort = 0.3 + Math.sin(time * 2) * 0.1;
        break;
      case "processing":
        // Slow rotation with distortion
        meshRef.current.rotation.y = time * 0.3;
        meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
        materialRef.current.distort = 0.4;
        break;
      case "speaking":
        // Rhythmic pulsing
        meshRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.06);
        materialRef.current.distort = 0.25 + Math.sin(time * 3) * 0.1;
        break;
      default:
        // Gentle breathing
        meshRef.current.scale.setScalar(1 + Math.sin(time * 0.8) * 0.04);
        meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
        meshRef.current.rotation.x = Math.cos(time * 0.4) * 0.05;
        materialRef.current.distort = 0.2;
        break;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.4, 128, 128]} scale={[1, 1.1, 0.95]}>
      <MeshDistortMaterial
        ref={materialRef}
        color={colors.color}
        emissive={colors.emissive}
        emissiveIntensity={colors.emissiveIntensity}
        metalness={0.2}
        roughness={0.3}
        distort={0.2}
        speed={1.5}
        transparent
        opacity={0.95}
      />
    </Sphere>
  );
};

// Neural particles floating around
const NeuralParticles = ({ state }: BrainOrganismProps) => {
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 80;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.8 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const time = clock.getElapsedTime();
    particlesRef.current.rotation.y = time * 0.1;
    
    // Pulse particles based on state
    const intensity = state === "listening" ? 2 : state === "speaking" ? 1.5 : 0.5;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const pulse = Math.sin(time * intensity + i * 0.1) * 0.05;
      positions[i3 + 1] += pulse;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#a78bfa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

export const BrainOrganism3D = ({ state, onClick }: { state: OrganismState; onClick: () => void }) => {
  return (
    <div 
      className="w-[240px] h-[240px] cursor-pointer"
      onClick={onClick}
      style={{
        filter: state === "listening" 
          ? "drop-shadow(0 0 80px rgba(34, 197, 94, 0.6))"
          : state === "speaking"
          ? "drop-shadow(0 0 70px rgba(251, 146, 60, 0.6))"
          : "drop-shadow(0 0 60px rgba(139, 92, 246, 0.5))"
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#a78bfa" />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#ec4899" />
        
        <BrainMesh state={state} />
        <NeuralParticles state={state} />
      </Canvas>
    </div>
  );
};
