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

  const getOrganismGradient = () => {
    switch (state) {
      case "listening":
        return "radial-gradient(ellipse at 35% 40%, rgba(240, 255, 244, 0.95) 0%, rgba(134, 239, 172, 0.85) 30%, rgba(34, 197, 94, 0.9) 60%, rgba(22, 163, 74, 1) 100%)";
      case "processing":
        return "radial-gradient(ellipse at 35% 40%, rgba(245, 243, 255, 0.95) 0%, rgba(167, 139, 250, 0.85) 30%, rgba(139, 92, 246, 0.9) 60%, rgba(109, 40, 217, 1) 100%)";
      case "speaking":
        return "radial-gradient(ellipse at 35% 40%, rgba(255, 251, 235, 0.95) 0%, rgba(252, 211, 77, 0.85) 30%, rgba(251, 146, 60, 0.9) 60%, rgba(234, 88, 12, 1) 100%)";
      default:
        return "radial-gradient(ellipse at 35% 40%, rgba(255, 240, 255, 0.95) 0%, rgba(167, 139, 250, 0.85) 30%, rgba(139, 92, 246, 0.9) 60%, rgba(109, 40, 217, 1) 100%)";
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

      {/* Organic Brain Organism */}
      <button
        onClick={onClick}
        className={`
          relative w-[200px] h-[220px] cursor-pointer
          backdrop-blur-xl
          transition-all duration-300 ease-out
          ${getSphereAnimation()}
        `}
        style={{
          background: getOrganismGradient(),
          clipPath: `path('M 100,20 Q 80,15 60,28 Q 42,40 37,65 Q 34,88 42,110 Q 50,128 65,138 Q 78,145 92,142 L 100,125 L 108,142 Q 122,145 135,138 Q 150,128 158,110 Q 166,88 163,65 Q 158,40 140,28 Q 120,15 100,20 Z')`,
          boxShadow:
            state === "listening"
              ? "0 0 80px rgba(34, 197, 94, 0.7), 0 0 120px rgba(134, 239, 172, 0.4), inset 0 0 60px rgba(255, 255, 255, 0.15)"
              : state === "speaking"
              ? "0 0 70px rgba(251, 146, 60, 0.7), 0 0 110px rgba(252, 211, 77, 0.4), inset 0 0 60px rgba(255, 255, 255, 0.15)"
              : "0 0 50px rgba(139, 92, 246, 0.6), 0 0 90px rgba(167, 139, 250, 0.3), 0 0 120px rgba(236, 72, 153, 0.15), inset 0 0 60px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Membrane shimmer edge */}
        <div 
          className="absolute inset-[-2px] pointer-events-none animate-membrane-shimmer"
          style={{
            clipPath: `path('M 100,20 Q 80,15 60,28 Q 42,40 37,65 Q 34,88 42,110 Q 50,128 65,138 Q 78,145 92,142 L 100,125 L 108,142 Q 122,145 135,138 Q 150,128 158,110 Q 166,88 163,65 Q 158,40 140,28 Q 120,15 100,20 Z')`,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
          }}
        />
        {/* Organic Cortical Folds - Following Brain Shape */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 220"
          style={{ opacity: 0.3 }}
        >
          {/* Left hemisphere cortical folds */}
          <path d="M50,60 Q55,55 58,58 C65,63 68,68 70,75 S72,88 68,95" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M45,80 Q52,75 58,78 C65,82 70,87 72,95 S70,108 65,115" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M55,100 Q62,95 68,98 C75,102 78,110 76,120" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M48,115 Q55,110 62,115 C68,120 70,128 68,138" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M60,130 Q68,125 75,130 C80,135 82,142 80,150" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          
          {/* Right hemisphere cortical folds */}
          <path d="M150,60 Q145,55 142,58 C135,63 132,68 130,75 S128,88 132,95" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M155,80 Q148,75 142,78 C135,82 130,87 128,95 S130,108 135,115" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M145,100 Q138,95 132,98 C125,102 122,110 124,120" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M152,115 Q145,110 138,115 C132,120 130,128 132,138" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M140,130 Q132,125 125,130 C120,135 118,142 120,150" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          
          {/* Corpus callosum area - connecting fibers */}
          <path d="M85,125 Q92,122 100,125 T115,128" stroke="white" strokeWidth="1" fill="none" strokeDasharray="2,3" opacity="0.5" />
          <path d="M88,130 Q95,128 100,130 T112,133" stroke="white" strokeWidth="0.8" fill="none" strokeDasharray="2,3" opacity="0.4" />
          
          {/* Additional organic textures */}
          <path d="M65,70 Q72,68 75,72 C78,77 76,83 72,88" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M135,70 Q128,68 125,72 C122,77 124,83 128,88" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M70,145 Q78,143 85,147" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M130,145 Q122,143 115,147" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>

        {/* Living Neural Network with Traveling Signals */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 220"
          style={{ opacity: 0.7 }}
        >
          <defs>
            <radialGradient id="nodeGlow">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
            </radialGradient>
          </defs>
          
          {/* Synaptic connections - subtle lines */}
          <line x1="60" y1="70" x2="85" y2="60" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="85" y1="60" x2="115" y2="60" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="115" y1="60" x2="140" y2="70" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="60" y1="70" x2="70" y2="100" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="140" y1="70" x2="130" y2="100" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="70" y1="100" x2="100" y2="110" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="130" y1="100" x2="100" y2="110" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="70" y1="100" x2="65" y2="135" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="130" y1="100" x2="135" y2="135" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="65" y1="135" x2="100" y2="150" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="135" y1="135" x2="100" y2="150" stroke="white" strokeWidth="0.5" opacity="0.25" />
          <line x1="85" y1="60" x2="100" y2="110" stroke="white" strokeWidth="0.4" opacity="0.15" />
          <line x1="115" y1="60" x2="100" y2="110" stroke="white" strokeWidth="0.4" opacity="0.15" />
          
          {/* Neural nodes with glow */}
          <circle cx="60" cy="70" r="3" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '0s' }} />
          <circle cx="85" cy="60" r="3.5" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '0.6s' }} />
          <circle cx="115" cy="60" r="3.5" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '1.2s' }} />
          <circle cx="140" cy="70" r="3" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '1.8s' }} />
          <circle cx="70" cy="100" r="3.2" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '2.4s' }} />
          <circle cx="130" cy="100" r="3.2" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '0.4s' }} />
          <circle cx="100" cy="110" r="4" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="65" cy="135" r="3" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '1.6s' }} />
          <circle cx="135" cy="135" r="3" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '2.2s' }} />
          <circle cx="100" cy="150" r="3.5" fill="url(#nodeGlow)" className="animate-neural-pulse" style={{ animationDelay: '0.8s' }} />
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
