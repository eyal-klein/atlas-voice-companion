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
        return "animate-breathe animate-gentle-rotate";
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
        {/* Brain Cortical Texture Overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
          viewBox="0 0 180 180"
        >
          <defs>
            <radialGradient id="neuralGrad">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Cortical folds - organic brain-like curves */}
          <path d="M 40 50 Q 50 45, 60 50 T 80 50 Q 90 55, 100 50" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M 45 70 Q 60 65, 75 70 T 95 70 Q 110 75, 125 70" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M 35 90 Q 50 85, 65 90 T 85 90 Q 100 95, 115 90" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M 50 110 Q 65 105, 80 110 T 100 110 Q 115 115, 130 110" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M 60 130 Q 75 125, 90 130 T 110 130 Q 125 135, 140 130" stroke="white" strokeWidth="1.5" fill="none" />
          
          {/* Additional organic curves */}
          <path d="M 70 40 Q 85 50, 90 65 T 95 85" stroke="white" strokeWidth="1" fill="none" />
          <path d="M 110 45 Q 105 60, 110 75 T 115 95" stroke="white" strokeWidth="1" fill="none" />
          <path d="M 55 60 Q 65 75, 60 90 T 55 110" stroke="white" strokeWidth="1" fill="none" />
          
          {/* Hemisphere division */}
          <path d="M 90 20 Q 88 60, 90 90 T 92 140" stroke="white" strokeWidth="0.5" opacity="0.08" fill="none" />
        </svg>

        {/* Neural Network Connections */}
        <svg
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
          viewBox="0 0 180 180"
        >
          {/* Neural nodes */}
          <circle cx="60" cy="55" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '0s' }} />
          <circle cx="90" cy="45" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="120" cy="60" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="70" cy="90" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '1.5s' }} />
          <circle cx="110" cy="85" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '2s' }} />
          <circle cx="50" cy="110" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '2.5s' }} />
          <circle cx="90" cy="115" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '0.8s' }} />
          <circle cx="130" cy="105" r="3" fill="white" opacity="0.6" className="animate-neural-pulse" style={{ animationDelay: '1.3s' }} />
          
          {/* Synaptic connections */}
          <line x1="60" y1="55" x2="90" y2="45" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="90" y1="45" x2="120" y2="60" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="60" y1="55" x2="70" y2="90" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="120" y1="60" x2="110" y2="85" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="70" y1="90" x2="90" y2="115" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="110" y1="85" x2="130" y2="105" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="50" y1="110" x2="90" y2="115" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="90" y1="115" x2="130" y2="105" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="90" y1="45" x2="90" y2="115" stroke="white" strokeWidth="0.5" opacity="0.15" />
          <line x1="70" y1="90" x2="110" y2="85" stroke="white" strokeWidth="0.5" opacity="0.15" />
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
