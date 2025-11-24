import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/CosmicBackground";
import { NeuralSphere } from "@/components/NeuralSphere";
import { toast } from "sonner";

type AppState = "idle" | "listening" | "processing" | "speaking";

const Index = () => {
  const [state, setState] = useState<AppState>("idle");

  // Simulate state transitions for demo
  const handleSphereClick = () => {
    if (state === "idle") {
      // Start listening
      setState("listening");
      toast.success("מתחיל הקלטה", {
        description: "דבר עכשיו עם NUCLEUS-ATLAS",
      });

      // Simulate user stopping after 3 seconds
      setTimeout(() => {
        setState("processing");
        toast.info("מעבד...", {
          description: "חושב על התשובה",
        });

        // Simulate AI response after 2 seconds
        setTimeout(() => {
          setState("speaking");
          toast.success("NUCLEUS משיב", {
            description: "מקשיב לתשובה",
          });

          // Return to idle after 4 seconds
          setTimeout(() => {
            setState("idle");
          }, 4000);
        }, 2000);
      }, 3000);
    } else if (state === "listening") {
      // Stop recording manually
      setState("processing");
      toast.info("מעבד...");
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "listening":
        return { main: "אני מקשיב...", sub: "NUCLEUS ATLAS" };
      case "processing":
        return { main: "חושב על זה...", sub: "NUCLEUS ATLAS" };
      case "speaking":
        return { main: "NUCLEUS משיב", sub: "" };
      default:
        return { main: "", sub: "NUCLEUS ATLAS" };
    }
  };

  const statusText = getStatusText();

  // Simulate haptic feedback on state changes
  useEffect(() => {
    if ("vibrate" in navigator) {
      if (state === "listening" || state === "speaking") {
        navigator.vibrate(50);
      }
    }
  }, [state]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <CosmicBackground />

      <div className="relative flex flex-col items-center justify-start min-h-screen pt-[25vh] px-6">
        {/* WE 2.0 Title */}
        <div className="text-center mb-8">
          <h2
            className="text-xl tracking-[0.4em] font-light transition-opacity duration-300"
            style={{
              color: "rgba(255, 255, 255, 0.5)",
              opacity: state === "idle" ? 1 : 0.3,
            }}
          >
            WE 2.0
          </h2>
        </div>

        {/* Neural Sphere */}
        <div className="mb-10">
          <NeuralSphere state={state} onClick={handleSphereClick} />
        </div>

        {/* Logo Text */}
        {statusText.sub && (
          <div className="text-center mb-2">
            <h1
              className="text-2xl tracking-[0.3em] font-extralight transition-opacity duration-300"
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                opacity: state === "idle" ? 1 : 0.3,
              }}
            >
              {statusText.sub}
            </h1>
          </div>
        )}

        {/* © 2025 THRIVE SYSTEM Subtitle */}
        {statusText.sub && (
          <div className="text-center mb-4">
            <h3
              className="text-xs tracking-[0.35em] font-extralight transition-opacity duration-300"
              style={{
                color: "rgba(255, 255, 255, 0.35)",
                opacity: state === "idle" ? 1 : 0.3,
              }}
            >
              © 2025 THRIVE SYSTEM
            </h3>
          </div>
        )}

        {/* Status Text */}
        <div className="text-center" dir="rtl">
          <p
            className={`text-sm font-light transition-all duration-300 ${
              state === "idle" ? "animate-gentle-pulse" : ""
            }`}
            style={{
              color:
                state === "idle"
                  ? "rgba(255, 255, 255, 0.4)"
                  : "rgba(255, 255, 255, 0.7)",
            }}
          >
            {statusText.main}
          </p>
        </div>

        {/* Recording Indicator */}
        {state === "listening" && (
          <div className="absolute bottom-[60px] flex items-center gap-2" dir="rtl">
            <div className="w-2 h-2 rounded-full bg-destructive animate-recording-pulse" />
            <span className="text-xs text-destructive/80">הקלטה פעילה</span>
          </div>
        )}

        {/* Subtle Hint Text */}
        {state === "idle" && (
          <div className="absolute bottom-8 text-center px-6" dir="rtl">
            <p className="text-xs text-muted-foreground/30 font-light">
              ממשק קול עתידני לתקשורת עם NUCLEUS-ATLAS
            </p>
          </div>
        )}
      </div>

      {/* Settings Icon - Minimal, only visible on first load */}
      {state === "idle" && (
        <button
          className="absolute top-6 right-6 w-6 h-6 opacity-30 hover:opacity-60 transition-opacity"
          onClick={() => toast.info("הגדרות", { description: "בקרוב..." })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-full h-full text-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Index;
