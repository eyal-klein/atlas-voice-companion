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

  // State-based colors with rich color palette (purple/pink/cyan/blue/green)
  const colors = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          color: "#8b5cf6", // purple
          emissive: "#a78bfa", // bright purple
          emissiveIntensity: 0.6,
          secondaryColor: "#ec4899", // pink
        };
      case "processing":
        return {
          color: "#06b6d4", // cyan
          emissive: "#22d3ee",
          emissiveIntensity: 0.45,
          secondaryColor: "#3b82f6", // blue
        };
      case "speaking":
        return {
          color: "#14b8a6", // teal
          emissive: "#5eead4",
          emissiveIntensity: 0.65,
          secondaryColor: "#10b981", // green
        };
      default:
        return {
          color: "#6366f1", // indigo
          emissive: "#818cf8",
          emissiveIntensity: 0.35,
          secondaryColor: "#8b5cf6", // purple
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

// Bioluminescent spots on brain surface
const BioluminescentSpots = ({ state }: BrainOrganismProps) => {
  const spotsRef = useRef<THREE.Points>(null);
  const opacitiesRef = useRef<Float32Array>();
  
  const spotCount = 60;
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(spotCount * 3);
    const phs = new Float32Array(spotCount);
    
    for (let i = 0; i < spotCount; i++) {
      // Position on brain surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 1.45; // Slightly larger than brain radius to sit on surface
      
      const brainModulation = Math.abs(Math.sin(theta * 2)) * 0.3;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * (1 + brainModulation);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 1.1;
      pos[i * 3 + 2] = radius * Math.cos(phi) * (1 + brainModulation);
      
      // Random phase for flickering
      phs[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions: pos, phases: phs };
  }, []);
  
  useFrame(({ clock }) => {
    if (!spotsRef.current) return;
    
    const time = clock.getElapsedTime();
    const material = spotsRef.current.material as THREE.PointsMaterial;
    
    // Rotate with brain
    spotsRef.current.rotation.y = time * 0.05;
    
    // Individual spot flickering (would need custom shader for true per-particle opacity)
    // For now, we'll use global pulsing with variation
    const basePulse = Math.sin(time * 2) * 0.3 + 0.7;
    material.opacity = basePulse * (state === "listening" ? 0.9 : 0.7);
  });
  
  return (
    <points ref={spotsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={spotCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={state === "listening" ? "#f0abfc" : state === "speaking" ? "#6ee7b7" : state === "processing" ? "#7dd3fc" : "#c4b5fd"}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Internal energy light moving through the brain
const InternalLight = ({ state }: BrainOrganismProps) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;

    const time = clock.getElapsedTime();
    
    // Organic movement path through brain interior
    const speed = state === "processing" ? 1.5 : state === "listening" ? 1.2 : 0.8;
    const radius = 0.8; // Inside the brain
    
    // Lissajous curve for complex organic movement
    lightRef.current.position.x = Math.sin(time * speed) * radius;
    lightRef.current.position.y = Math.cos(time * speed * 1.3) * radius * 0.9;
    lightRef.current.position.z = Math.sin(time * speed * 0.7) * radius;
    
    // Intensity varies by state
    const baseIntensity = state === "processing" ? 3.5 : state === "listening" ? 2.5 : 1.8;
    const pulse = Math.sin(time * 2) * 0.4 + 0.6;
    lightRef.current.intensity = baseIntensity * pulse;
  });

  return (
    <pointLight
      ref={lightRef}
      color={state === "processing" ? "#06b6d4" : state === "listening" ? "#a78bfa" : "#8b5cf6"}
      distance={4}
      decay={2}
    />
  );
};

// Synaptic connections between bioluminescent spots
const SynapticConnections = ({ state }: BrainOrganismProps) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const connectionCount = 25;
  const { positions, connections, phases } = useMemo(() => {
    const pos = new Float32Array(connectionCount * 6); // 2 points per line, 3 coords per point
    const conn = [];
    const phs = new Float32Array(connectionCount);
    
    // Generate random connections between spots on brain surface
    for (let i = 0; i < connectionCount; i++) {
      // Random points on brain surface (matching BioluminescentSpots positioning)
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.random() * Math.PI;
      const theta2 = Math.random() * Math.PI * 2;
      const phi2 = Math.random() * Math.PI;
      const radius = 1.45;
      
      const brainMod1 = Math.abs(Math.sin(theta1 * 2)) * 0.3;
      const brainMod2 = Math.abs(Math.sin(theta2 * 2)) * 0.3;
      
      // First point
      pos[i * 6] = radius * Math.sin(phi1) * Math.cos(theta1) * (1 + brainMod1);
      pos[i * 6 + 1] = radius * Math.sin(phi1) * Math.sin(theta1) * 1.1;
      pos[i * 6 + 2] = radius * Math.cos(phi1) * (1 + brainMod1);
      
      // Second point
      pos[i * 6 + 3] = radius * Math.sin(phi2) * Math.cos(theta2) * (1 + brainMod2);
      pos[i * 6 + 4] = radius * Math.sin(phi2) * Math.sin(theta2) * 1.1;
      pos[i * 6 + 5] = radius * Math.cos(phi2) * (1 + brainMod2);
      
      conn.push({ start: i * 2, end: i * 2 + 1 });
      phs[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions: pos, connections: conn, phases: phs };
  }, []);
  
  useFrame(({ clock }) => {
    if (!linesRef.current) return;
    
    const time = clock.getElapsedTime();
    const material = linesRef.current.material as THREE.LineBasicMaterial;
    
    // Rotate with brain
    linesRef.current.rotation.y = time * 0.05;
    
    // Flickering effect - varies by state
    const flickerSpeed = state === "processing" ? 3 : state === "listening" ? 2.5 : 1.5;
    const baseOpacity = state === "processing" ? 0.7 : state === "listening" ? 0.6 : 0.4;
    
    // Create pulsing flicker effect
    const flicker = Math.sin(time * flickerSpeed) * 0.3 + 0.7;
    material.opacity = baseOpacity * flicker;
  });
  
  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={connectionCount * 2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={state === "processing" ? "#22d3ee" : state === "listening" ? "#c084fc" : "#a78bfa"}
        transparent
        opacity={0.5}
        linewidth={1}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

// Neurotransmitter particles traveling along synaptic connections
const NeurotransmitterParticles = ({ state }: BrainOrganismProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 40;
  const { synapticPaths, speeds } = useMemo(() => {
    const paths: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];
    const spds = new Float32Array(particleCount);
    
    // Generate synaptic paths (matching SynapticConnections)
    for (let i = 0; i < particleCount; i++) {
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.random() * Math.PI;
      const theta2 = Math.random() * Math.PI * 2;
      const phi2 = Math.random() * Math.PI;
      const radius = 1.45;
      
      const brainMod1 = Math.abs(Math.sin(theta1 * 2)) * 0.3;
      const brainMod2 = Math.abs(Math.sin(theta2 * 2)) * 0.3;
      
      const start = new THREE.Vector3(
        radius * Math.sin(phi1) * Math.cos(theta1) * (1 + brainMod1),
        radius * Math.sin(phi1) * Math.sin(theta1) * 1.1,
        radius * Math.cos(phi1) * (1 + brainMod1)
      );
      
      const end = new THREE.Vector3(
        radius * Math.sin(phi2) * Math.cos(theta2) * (1 + brainMod2),
        radius * Math.sin(phi2) * Math.sin(theta2) * 1.1,
        radius * Math.cos(phi2) * (1 + brainMod2)
      );
      
      paths.push({ start, end });
      spds[i] = 0.3 + Math.random() * 0.4; // Random speed variation
    }
    
    return { synapticPaths: paths, speeds: spds };
  }, []);
  
  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const time = clock.getElapsedTime();
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Rotate with brain
    particlesRef.current.rotation.y = time * 0.05;
    
    // Movement speed varies by state
    const speedMultiplier = state === "processing" ? 1.8 : state === "listening" ? 1.5 : 1.0;
    
    for (let i = 0; i < particleCount; i++) {
      const path = synapticPaths[i];
      const speed = speeds[i] * speedMultiplier;
      
      // Calculate position along the path (0 to 1)
      const progress = (time * speed + i * 0.25) % 1;
      
      // Linear interpolation between start and end
      const x = path.start.x + (path.end.x - path.start.x) * progress;
      const y = path.start.y + (path.end.y - path.start.y) * progress;
      const z = path.start.z + (path.end.z - path.start.z) * progress;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(particleCount * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color={state === "processing" ? "#38bdf8" : state === "listening" ? "#f0abfc" : "#86efac"}
        transparent
        opacity={0.95}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Energy waves traveling along synaptic connections
const EnergyWaves = ({ state }: BrainOrganismProps) => {
  const wavesRef = useRef<THREE.Group>(null);
  
  const waveCount = 15;
  const { synapticPaths } = useMemo(() => {
    const paths: Array<{ start: THREE.Vector3; end: THREE.Vector3; direction: THREE.Vector3 }> = [];
    
    // Generate synaptic paths (matching previous components)
    for (let i = 0; i < waveCount; i++) {
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.random() * Math.PI;
      const theta2 = Math.random() * Math.PI * 2;
      const phi2 = Math.random() * Math.PI;
      const radius = 1.45;
      
      const brainMod1 = Math.abs(Math.sin(theta1 * 2)) * 0.3;
      const brainMod2 = Math.abs(Math.sin(theta2 * 2)) * 0.3;
      
      const start = new THREE.Vector3(
        radius * Math.sin(phi1) * Math.cos(theta1) * (1 + brainMod1),
        radius * Math.sin(phi1) * Math.sin(theta1) * 1.1,
        radius * Math.cos(phi1) * (1 + brainMod1)
      );
      
      const end = new THREE.Vector3(
        radius * Math.sin(phi2) * Math.cos(theta2) * (1 + brainMod2),
        radius * Math.sin(phi2) * Math.sin(theta2) * 1.1,
        radius * Math.cos(phi2) * (1 + brainMod2)
      );
      
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      
      paths.push({ start, end, direction });
    }
    
    return { synapticPaths: paths };
  }, []);
  
  useFrame(({ clock }) => {
    if (!wavesRef.current) return;
    
    const time = clock.getElapsedTime();
    
    // Rotate with brain
    wavesRef.current.rotation.y = time * 0.05;
    
    // Movement speed varies by state
    const speedMultiplier = state === "processing" ? 2.0 : state === "listening" ? 1.6 : 1.2;
    
    wavesRef.current.children.forEach((wave, i) => {
      const path = synapticPaths[i];
      const speed = 0.4 * speedMultiplier;
      
      // Calculate position along the path (0 to 1)
      const progress = (time * speed + i * 0.35) % 1;
      
      // Position along the line
      wave.position.lerpVectors(path.start, path.end, progress);
      
      // Orient the ring perpendicular to the path
      const lookAtPoint = new THREE.Vector3().addVectors(wave.position, path.direction);
      wave.lookAt(lookAtPoint);
      
      // Pulse effect - waves expand and contract as they travel
      const pulse = 0.8 + Math.sin(progress * Math.PI * 2) * 0.3;
      wave.scale.setScalar(pulse);
      
      // Fade in/out at start and end
      const material = (wave as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const fadeIn = Math.min(progress * 4, 1);
      const fadeOut = Math.min((1 - progress) * 4, 1);
      material.opacity = Math.min(fadeIn, fadeOut) * 0.7;
    });
  });
  
  const waveColor = state === "processing" ? "#0ea5e9" : state === "listening" ? "#d946ef" : "#14b8a6";
  
  return (
    <group ref={wavesRef}>
      {Array.from({ length: waveCount }).map((_, i) => (
        <mesh key={i}>
          <torusGeometry args={[0.08, 0.02, 8, 16]} />
          <meshBasicMaterial
            color={waveColor}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Face features - eyes and eyebrows that give it a face-like appearance
const FaceFeatures = ({ state }: BrainOrganismProps) => {
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftEyeGlowRef = useRef<THREE.Mesh>(null);
  const rightEyeGlowRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;

    const time = clock.getElapsedTime();

    // Subtle eye movement/blinking effect
    const blink = Math.abs(Math.sin(time * 0.5)) * 0.15 + 0.85;
    leftEyeRef.current.scale.set(1, blink, 1);
    rightEyeRef.current.scale.set(1, blink, 1);

    // Enhanced glow pulsing with stronger effect
    const glowIntensity = state === "listening" ? 2.0 : state === "speaking" ? 1.8 : 1.2;
    const pulse = Math.sin(time * 2) * 0.4 + glowIntensity;
    
    (leftEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    (rightEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;

    // Animate glow spheres
    if (leftEyeGlowRef.current && rightEyeGlowRef.current) {
      const glowScale = 1 + Math.sin(time * 3) * 0.2;
      leftEyeGlowRef.current.scale.setScalar(glowScale);
      rightEyeGlowRef.current.scale.setScalar(glowScale);
      
      const glowOpacity = 0.3 + Math.sin(time * 2) * 0.2;
      (leftEyeGlowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity;
      (rightEyeGlowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity;
    }

    // Subtle eyebrow animation based on state
    if (leftBrowRef.current && rightBrowRef.current) {
      const browLift = state === "listening" ? 0.05 : state === "speaking" ? 0.02 : 0;
      leftBrowRef.current.position.y = 0.55 + browLift + Math.sin(time * 0.5) * 0.01;
      rightBrowRef.current.position.y = 0.55 + browLift + Math.sin(time * 0.5) * 0.01;
    }
  });

  const eyeColor = state === "listening" ? "#f0abfc" : state === "speaking" ? "#6ee7b7" : state === "processing" ? "#7dd3fc" : "#c4b5fd";
  const browColor = state === "listening" ? "#d946ef" : state === "speaking" ? "#14b8a6" : state === "processing" ? "#0ea5e9" : "#a78bfa";

  return (
    <group>
      {/* Left Eye */}
      <mesh ref={leftEyeRef} position={[-0.45, 0.3, 1.2]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={1.5}
          metalness={0.4}
          roughness={0.1}
          transparent
          opacity={0.98}
        />
      </mesh>
      
      {/* Right Eye */}
      <mesh ref={rightEyeRef} position={[0.45, 0.3, 1.2]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={1.5}
          metalness={0.4}
          roughness={0.1}
          transparent
          opacity={0.98}
        />
      </mesh>

      {/* Left Eye Outer Glow */}
      <mesh ref={leftEyeGlowRef} position={[-0.45, 0.3, 1.2]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial
          color={eyeColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Right Eye Outer Glow */}
      <mesh ref={rightEyeGlowRef} position={[0.45, 0.3, 1.2]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial
          color={eyeColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Left Eyebrow - curved arc */}
      <mesh ref={leftBrowRef} position={[-0.45, 0.55, 1.15]} rotation={[0, 0, -0.1]}>
        <torusGeometry args={[0.22, 0.03, 8, 16, Math.PI * 0.6]} />
        <meshStandardMaterial
          color={browColor}
          emissive={browColor}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Right Eyebrow - curved arc */}
      <mesh ref={rightBrowRef} position={[0.45, 0.55, 1.15]} rotation={[0, 0, 0.1]}>
        <torusGeometry args={[0.22, 0.03, 8, 16, Math.PI * 0.6]} />
        <meshStandardMaterial
          color={browColor}
          emissive={browColor}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Enhanced Eye lights */}
      <pointLight position={[-0.45, 0.3, 1.5]} intensity={1.5} color={eyeColor} distance={2.5} />
      <pointLight position={[0.45, 0.3, 1.5]} intensity={1.5} color={eyeColor} distance={2.5} />
      
      {/* Additional rim lights for dramatic effect */}
      <pointLight position={[-0.45, 0.3, 1.0]} intensity={0.8} color={eyeColor} distance={1.5} />
      <pointLight position={[0.45, 0.3, 1.0]} intensity={0.8} color={eyeColor} distance={1.5} />
    </group>
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
        color={state === "listening" ? "#fbbf24" : state === "speaking" ? "#34d399" : state === "processing" ? "#60a5fa" : "#f472b6"}
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
          ? "drop-shadow(0 0 80px rgba(139, 92, 246, 0.7)) drop-shadow(0 0 40px rgba(236, 72, 153, 0.5))"
          : state === "speaking"
          ? "drop-shadow(0 0 70px rgba(20, 184, 166, 0.7)) drop-shadow(0 0 40px rgba(16, 185, 129, 0.5))"
          : "drop-shadow(0 0 60px rgba(99, 102, 241, 0.6)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.4))"
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 4.2], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.5} color="#f3e8ff" />
        <pointLight position={[8, 8, 8]} intensity={1.2} color="#a78bfa" />
        <pointLight position={[-8, -8, -8]} intensity={0.6} color="#06b6d4" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#ec4899" />
        <pointLight position={[5, -5, 5]} intensity={0.5} color="#14b8a6" />
        
        <BrainMesh state={state} />
        <InternalLight state={state} />
        <BioluminescentSpots state={state} />
        <SynapticConnections state={state} />
        <EnergyWaves state={state} />
        <NeurotransmitterParticles state={state} />
        <NeuralParticles state={state} />
        <FaceFeatures state={state} />
      </Canvas>
    </div>
  );
};
