import { useState, useEffect } from "react";
import { BrainOrganism3D } from "./BrainOrganism3D";

type SphereState = "idle" | "listening" | "processing" | "speaking";

interface NeuralSphereProps {
  state: SphereState;
  onClick: () => void;
}

export const NeuralSphere = ({ state, onClick }: NeuralSphereProps) => {
  const [rings, setRings] = useState<number[]>([]);
  const [pulseWaves, setPulseWaves] = useState<number[]>([]);

  // Generate waveform rings during listening
  useEffect(() => {
    if (state === "listening") {
      const interval = setInterval(() => {
        setRings((prev) => [...prev, Date.now()]);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setRings([]);
    }
  }, [state]);

  // Generate pulse waves during active conversation (listening, processing, speaking)
  useEffect(() => {
    if (state !== "idle") {
      // Different intervals for different states
      const interval = state === "listening" ? 800 : state === "speaking" ? 600 : 1000;
      
      const pulseInterval = setInterval(() => {
        setPulseWaves((prev) => [...prev, Date.now()]);
      }, interval);
      return () => clearInterval(pulseInterval);
    } else {
      setPulseWaves([]);
    }
  }, [state]);

  // Clean up old rings
  useEffect(() => {
    if (rings.length > 0) {
      const timer = setTimeout(() => {
        setRings((prev) => prev.slice(1));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [rings]);

  // Clean up old pulse waves
  useEffect(() => {
    if (pulseWaves.length > 0) {
      const timer = setTimeout(() => {
        setPulseWaves((prev) => prev.slice(1));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pulseWaves]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse Waves - During active conversation */}
      {state !== "idle" &&
        pulseWaves.map((id) => (
          <div
            key={`pulse-${id}`}
            className="absolute w-[240px] h-[240px] rounded-full animate-pulse-wave pointer-events-none"
            style={{
              background: state === "listening" 
                ? "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0) 70%)"
                : state === "speaking"
                ? "radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, rgba(52, 211, 153, 0) 70%)"
                : "radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0) 70%)",
              border: state === "listening"
                ? "2px solid rgba(34, 211, 238, 0.5)"
                : state === "speaking"
                ? "2px solid rgba(45, 212, 191, 0.5)"
                : "2px solid rgba(56, 189, 248, 0.4)"
            }}
          />
        ))}

      {/* Waveform Rings - Only during listening */}
      {state === "listening" &&
        rings.map((id) => (
          <div
            key={`ring-${id}`}
            className="absolute w-[240px] h-[240px] rounded-full border-2 border-secondary/50 animate-wave-ring pointer-events-none"
          />
        ))}

      {/* 3D Brain Organism */}
      <BrainOrganism3D state={state} onClick={onClick} />

      {/* Orbit Ring - Processing State */}
      {state === "processing" && (
        <div className="absolute w-[260px] h-[260px] pointer-events-none">
          <div className="w-full h-full rounded-full border border-secondary/60 animate-orbit" />
        </div>
      )}
    </div>
  );
};
