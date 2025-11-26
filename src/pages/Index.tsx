import { useEffect, useState } from "react";
import { CosmicBackground } from "@/components/CosmicBackground";
import { NeuralSphere } from "@/components/NeuralSphere";
import { toast } from "sonner";
import { useVoice } from "@/hooks/useVoice";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Use new useVoice hook
  const { isSessionActive, isRecording, startCall, endCall } = useVoice({
    onTranscript: (text) => {
      console.log('📝 Transcript:', text);
      setTranscript(`את/ה: ${text}`);
    },
    onResponse: (text) => {
      console.log('💬 Response:', text);
      setTranscript(`NUCLEUS: ${text}`);
    },
  });

  // Map voice session states to app states
  const appState: AppState = 
    isRecording ? "listening" :
    isSessionActive ? "processing" :
    "idle";

  // Handle state changes with toasts
  useEffect(() => {
    if (isRecording) {
      console.log('🎤 Recording started');
    } else if (isSessionActive) {
      console.log('⏸️ Recording paused');
    }
  }, [isRecording, isSessionActive]);

  // Update messages when transcript changes
  useEffect(() => {
    if (transcript) {
      const isUser = transcript.startsWith("את/ה:");
      const isNucleus = transcript.startsWith("NUCLEUS:");
      const isTool = transcript.startsWith("🔧");

      const content = transcript.replace(/^(את\/ה:|NUCLEUS:|🔧 משתמש ב:)\s*/, "");
      
      setMessages(prev => {
        // Remove last message if it's the same role (updating transcript)
        const filtered = prev.filter((msg, idx) => {
          if (idx === prev.length - 1) {
            if (isUser && msg.role === "user") return false;
            if (isNucleus && msg.role === "assistant") return false;
            if (isTool && msg.role === "system") return false;
          }
          return true;
        });

        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: isUser ? "user" : isNucleus ? "assistant" : "system",
            content,
            timestamp: new Date(),
          },
        ];
      });

      // Show chat panel when there are messages
      if (!showChat) {
        setShowChat(true);
      }
    }
  }, [transcript, showChat]);

  const handleSphereClick = async () => {
    if (isSessionActive) {
      endCall();
    } else {
      await startCall();
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setTextInput("");
    setShowChat(true);

    // TODO: Send to NUCLEUS text API
    toast.info("Text Mode", {
      description: "בקרוב - חיבור ל-NUCLEUS text API",
    });
  };

  const getStatusText = () => {
    switch (appState) {
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

  // Haptic feedback on state changes
  useEffect(() => {
    if ("vibrate" in navigator) {
      if (appState === "listening" || appState === "speaking") {
        navigator.vibrate(50);
      }
    }
  }, [appState]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <CosmicBackground />

      <div className="relative flex flex-col items-center justify-start min-h-screen pt-[15vh] px-6">
        {/* WE 2.0 Title */}
        <div className="text-center mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2
            className="text-2xl tracking-[0.4em] font-light lightning-text transition-opacity duration-300"
            style={{
              opacity: appState === "idle" ? 1 : 0.3,
            }}
          >
            WE 2.0
          </h2>
        </div>

        {/* Neural Sphere */}
        <div className="mb-6">
          <NeuralSphere state={appState} onClick={handleSphereClick} />
        </div>

        {/* Logo Text */}
        {statusText.sub && (
          <div className="text-center mb-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h1
              className="text-3xl tracking-[0.3em] font-extralight lightning-text transition-opacity duration-300"
              style={{
                opacity: appState === "idle" ? 1 : 0.3,
              }}
            >
              {statusText.sub}
            </h1>
          </div>
        )}

        {/* © 2025 THRIVE SYSTEM Subtitle */}
        {statusText.sub && (
          <div className="text-center mb-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3
              className="text-xs tracking-[0.35em] font-extralight transition-opacity duration-300"
              style={{
                color: "rgba(255, 255, 255, 0.35)",
                opacity: appState === "idle" ? 1 : 0.3,
              }}
            >
              © 2025 THRIVE SYSTEM
            </h3>
          </div>
        )}

        {/* Status Text */}
        <div className="text-center animate-fade-in mb-4" dir="rtl" style={{ animationDelay: '0.7s' }}>
          <p
            className={`text-base font-light transition-all duration-300 ${
              appState === "idle" ? "animate-gentle-pulse" : ""
            }`}
            style={{
              color:
                appState === "idle"
                  ? "rgba(255, 255, 255, 0.4)"
                  : "rgba(255, 255, 255, 0.7)",
            }}
          >
            {statusText.main}
          </p>
        </div>

        {/* Chat Panel */}
        {showChat && messages.length > 0 && (
          <div className="w-full max-w-2xl mx-auto mb-4 animate-fade-in">
            <ScrollArea className="h-[200px] rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm p-4">
              <div className="space-y-3" dir="rtl">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary/20 text-primary-foreground"
                          : message.role === "assistant"
                          ? "bg-secondary/20 text-secondary-foreground"
                          : "bg-muted/20 text-muted-foreground text-sm"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Text Input Area */}
        <div className="w-full max-w-2xl mx-auto mb-4 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="הקלד הודעה ל-NUCLEUS..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              className="flex-1 bg-black/30 backdrop-blur-sm border-white/10 text-white placeholder:text-white/40"
              dir="rtl"
            />
            <Button
              onClick={handleSendText}
              disabled={!textInput.trim()}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/30"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/30 text-center mt-2" dir="rtl">
            לחץ Enter לשליחה • Shift+Enter לשורה חדשה
          </p>
        </div>

        {/* Recording Indicator */}
        {appState === "listening" && (
          <div className="absolute bottom-[80px] flex items-center gap-2" dir="rtl">
            <div className="w-2 h-2 rounded-full bg-destructive animate-recording-pulse" />
            <span className="text-sm text-destructive/80">הקלטה פעילה</span>
          </div>
        )}

        {/* Subtle Hint Text */}
        {appState === "idle" && !showChat && (
          <div className="absolute bottom-8 text-center px-6 animate-fade-in" dir="rtl" style={{ animationDelay: '1.1s' }}>
            <p className="text-xs text-muted-foreground/30 font-light">
              לחץ על הכדור לשיחה קולית או הקלד הודעה למטה
            </p>
          </div>
        )}
      </div>

      {/* Settings Icon - Minimal, only visible on first load */}
      {appState === "idle" && (
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
