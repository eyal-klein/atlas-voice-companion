import { useState, useEffect } from "react";
import { BrainOrganism3D } from "./BrainOrganism3D";

type SphereState = "idle" | "listening" | "processing" | "speaking";

interface NeuralSphereProps {
  state: SphereState;
  onClick: () => void;
}

export const NeuralSphere = ({ state, onClick }: NeuralSphereProps) => {
  const [rings, setRings] = useState<number[]>([]);

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

  // Clean up old rings
  useEffect(() => {
    if (rings.length > 0) {
      const timer = setTimeout(() => {
        setRings((prev) => prev.slice(1));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [rings]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Waveform Rings - Only during listening */}
      {state === "listening" &&
        rings.map((id) => (
          <div
            key={id}
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
