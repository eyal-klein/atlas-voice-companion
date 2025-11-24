import { useState, useEffect } from "react";

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

  const getSphereGradient = () => {
    switch (state) {
      case "listening":
        return "radial-gradient(circle at 30% 30%, hsl(var(--sphere-white)) 0%, hsl(var(--sphere-blue)) 20%, hsl(var(--listening-green)) 60%, hsl(var(--sphere-deep-purple)) 100%)";
      case "processing":
        return "radial-gradient(circle at 30% 30%, hsl(var(--sphere-white)) 0%, hsl(var(--sphere-blue)) 20%, hsl(var(--sphere-purple)) 60%, hsl(var(--sphere-deep-purple)) 100%)";
      case "speaking":
        return "radial-gradient(circle at 30% 30%, hsl(var(--sphere-white)) 0%, hsl(var(--speaking-yellow)) 20%, hsl(var(--speaking-orange)) 60%, hsl(var(--speaking-amber)) 100%)";
      default:
        return "radial-gradient(circle at 30% 30%, hsl(var(--sphere-white)) 0%, hsl(var(--sphere-blue)) 20%, hsl(var(--sphere-purple)) 60%, hsl(var(--sphere-deep-purple)) 100%)";
    }
  };

  const getSphereAnimation = () => {
    switch (state) {
      case "listening":
        return "animate-breathe-fast scale-110";
      case "processing":
        return "animate-slow-rotate";
      case "speaking":
        return "animate-breathe-fast scale-105";
      default:
        return "animate-breathe";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Waveform Rings - Only during listening */}
      {state === "listening" &&
        rings.map((id) => (
          <div
            key={id}
            className="absolute w-[180px] h-[180px] rounded-full border-2 border-secondary/50 animate-wave-ring pointer-events-none"
          />
        ))}

      {/* Main Neural Sphere */}
      <button
        onClick={onClick}
        className={`
          relative w-[180px] h-[180px] rounded-full cursor-pointer
          backdrop-blur-xl border border-white/10
          transition-all duration-300 ease-out
          ${getSphereAnimation()}
        `}
        style={{
          background: getSphereGradient(),
          boxShadow:
            state === "listening"
              ? "0 0 100px rgba(139, 92, 246, 0.8), 0 0 150px rgba(96, 165, 250, 0.5), inset 0 0 60px rgba(255, 255, 255, 0.1)"
              : state === "speaking"
              ? "0 0 80px rgba(251, 146, 60, 0.6), 0 0 120px rgba(251, 191, 36, 0.4), inset 0 0 60px rgba(255, 255, 255, 0.1)"
              : "0 0 60px rgba(139, 92, 246, 0.4), 0 0 100px rgba(96, 165, 250, 0.2), inset 0 0 60px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Neural Network Texture Overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 180 180"
        >
          <defs>
            <radialGradient id="neuralGrad">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Neural network pattern */}
          <circle cx="90" cy="90" r="60" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="90" cy="90" r="40" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="90" cy="90" r="20" fill="none" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="130" y2="130" stroke="white" strokeWidth="0.5" />
          <line x1="130" y1="50" x2="50" y2="130" stroke="white" strokeWidth="0.5" />
          <line x1="90" y1="30" x2="90" y2="150" stroke="white" strokeWidth="0.5" />
          <line x1="30" y1="90" x2="150" y2="90" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Audio Visualization - Speaking State */}
        {state === "speaking" && (
          <div className="absolute inset-0 flex items-center justify-center gap-1 pointer-events-none">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-speaking-amber/60 rounded-full transition-all duration-100"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                  animation: "pulse 0.5s ease-in-out infinite",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Orbit Ring - Processing State */}
      {state === "processing" && (
        <div className="absolute w-[200px] h-[200px] pointer-events-none">
          <div className="w-full h-full rounded-full border border-secondary/60 animate-orbit" />
        </div>
      )}
    </div>
  );
};
