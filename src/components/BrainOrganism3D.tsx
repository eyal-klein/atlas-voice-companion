import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

type OrganismState = "idle" | "listening" | "processing" | "speaking";

interface BrainOrganismProps {
  state: OrganismState;
}

// Custom brain-shaped geometry
const createBrainGeometry = () => {
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const positions = geometry.attributes.position;
  
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // Create two-lobe brain shape
    const angle = Math.atan2(z, x);
    const radius = Math.sqrt(x * x + z * z);
    
    // Split into hemispheres with connection
    const hemisphereModulation = Math.abs(Math.sin(angle)) * 0.3;
    const verticalSquash = 1 - Math.abs(y) * 0.15;
    const lobeSeparation = Math.sin(angle * 2) * 0.15 * (1 - Math.abs(y));
    
    // Organic bumps and folds (cortical texture)
    const corticalBumps = 
      Math.sin(x * 8 + y * 6) * 0.05 +
      Math.sin(y * 10 + z * 7) * 0.04 +
      Math.sin(z * 9 + x * 8) * 0.03;
    
    // Apply deformations
    const newX = x * (1 + hemisphereModulation + lobeSeparation) * verticalSquash * (1 + corticalBumps);
    const newY = y * 1.15 * (1 + corticalBumps * 0.5); // Stretch vertically
    const newZ = z * (1 + hemisphereModulation + lobeSeparation) * verticalSquash * (1 + corticalBumps);
    
    positions.setXYZ(i, newX, newY, newZ);
  }
  
  geometry.computeVertexNormals();
  return geometry;
};

const BrainMesh = ({ state }: BrainOrganismProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  const brainGeometry = useMemo(() => createBrainGeometry(), []);

  // State-based colors (organic living colors - cyan/teal/green)
  const colors = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          color: "#06b6d4", // cyan
          emissive: "#22d3ee", // bright cyan
          emissiveIntensity: 0.6,
          secondaryColor: "#10b981", // emerald
        };
      case "processing":
        return {
          color: "#0ea5e9", // sky blue
          emissive: "#38bdf8",
          emissiveIntensity: 0.45,
          secondaryColor: "#3b82f6", // blue
        };
      case "speaking":
        return {
          color: "#14b8a6", // teal
          emissive: "#2dd4bf",
          emissiveIntensity: 0.65,
          secondaryColor: "#34d399", // green
        };
      default:
        return {
          color: "#0891b2", // cyan-600
          emissive: "#06b6d4",
          emissiveIntensity: 0.35,
          secondaryColor: "#0284c7", // sky-600
        };
    }
  }, [state]);

  // Organic animation based on state
  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = clock.getElapsedTime();

    switch (state) {
      case "listening":
        // Fast organic pulsing - asymmetric
        const listenScale = 1 + Math.sin(time * 3) * 0.08;
        meshRef.current.scale.set(
          listenScale * 1.02,
          listenScale * 0.98,
          listenScale
        );
        meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        materialRef.current.distort = 0.35 + Math.sin(time * 2) * 0.12;
        break;
      case "processing":
        // Slow rotation with organic wobble
        meshRef.current.rotation.y = time * 0.3;
        meshRef.current.rotation.x = Math.sin(time * 0.7) * 0.12;
        meshRef.current.rotation.z = Math.cos(time * 0.5) * 0.08;
        meshRef.current.scale.set(1.03, 0.97, 1);
        materialRef.current.distort = 0.45;
        break;
      case "speaking":
        // Rhythmic pulsing with expression
        const speakScale = 1 + Math.sin(time * 4) * 0.07;
        meshRef.current.scale.set(
          speakScale,
          speakScale * 1.05,
          speakScale * 0.98
        );
        meshRef.current.rotation.y = Math.sin(time * 0.8) * 0.08;
        materialRef.current.distort = 0.3 + Math.sin(time * 3) * 0.1;
        break;
      default:
        // Gentle organic breathing - asymmetric
        const breathScale = 1 + Math.sin(time * 0.8) * 0.05;
        meshRef.current.scale.set(
          breathScale * 1.02,
          breathScale * 0.97,
          breathScale
        );
        meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.06;
        meshRef.current.rotation.x = Math.cos(time * 0.4) * 0.04;
        meshRef.current.rotation.z = Math.sin(time * 0.35) * 0.03;
        materialRef.current.distort = 0.25;
        break;
    }
  });

  return (
    <mesh ref={meshRef} geometry={brainGeometry} scale={1.4}>
      <MeshDistortMaterial
        ref={materialRef}
        color={colors.color}
        emissive={colors.emissive}
        emissiveIntensity={colors.emissiveIntensity}
        metalness={0.25}
        roughness={0.35}
        distort={0.25}
        speed={1.2}
        transparent
        opacity={0.88}
        envMapIntensity={1.2}
      />
    </mesh>
  );
};

// Neural particles floating around brain
const NeuralParticles = ({ state }: BrainOrganismProps) => {
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Particles follow brain shape more closely
      const radius = 2.0 + Math.random() * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      // Brain-shaped distribution
      const brainModulation = Math.abs(Math.sin(theta * 2)) * 0.3;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * (1 + brainModulation);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 1.1;
      pos[i * 3 + 2] = radius * Math.cos(phi) * (1 + brainModulation);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const time = clock.getElapsedTime();
    
    // Organic rotation
    particlesRef.current.rotation.y = time * 0.08;
    particlesRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
    
    // Pulse particles based on state with organic motion
    const intensity = state === "listening" ? 2.5 : state === "speaking" ? 2 : 0.8;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const phase = i * 0.1;
      const pulse = Math.sin(time * intensity + phase) * 0.04;
      const drift = Math.cos(time * 0.5 + phase) * 0.02;
      
      positions[i3] += drift;
      positions[i3 + 1] += pulse;
      positions[i3 + 2] += Math.sin(time * 0.6 + phase) * 0.02;
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
        size={0.05}
        color={state === "listening" ? "#5eead4" : state === "speaking" ? "#34d399" : "#67e8f9"}
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
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
          ? "drop-shadow(0 0 80px rgba(6, 182, 212, 0.7)) drop-shadow(0 0 40px rgba(34, 211, 238, 0.5))"
          : state === "speaking"
          ? "drop-shadow(0 0 70px rgba(20, 184, 166, 0.7)) drop-shadow(0 0 40px rgba(52, 211, 153, 0.5))"
          : "drop-shadow(0 0 60px rgba(8, 145, 178, 0.6)) drop-shadow(0 0 35px rgba(6, 182, 212, 0.4))"
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 4.2], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.5} color="#e0f2fe" />
        <pointLight position={[8, 8, 8]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[-8, -8, -8]} intensity={0.6} color="#14b8a6" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#22d3ee" />
        <pointLight position={[5, -5, 5]} intensity={0.5} color="#0ea5e9" />
        
        <BrainMesh state={state} />
        <NeuralParticles state={state} />
      </Canvas>
    </div>
  );
};
