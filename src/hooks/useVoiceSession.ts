import { useState, useRef, useEffect, useCallback } from "react";

type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";

interface UseVoiceSessionReturn {
  state: VoiceState;
  errorMessage: string;
  startSession: () => Promise<void>;
  stopSession: () => void;
  toggleSession: () => Promise<void>;
}

const WEBSOCKET_URL = "wss://nucleus-atlas-backend-v2-796362729654.europe-west1.run.app/voice/ws";

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  const playAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setState("speaking");
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      // Return to listening when audio finishes
      source.onended = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          setState("listening");
        }
      };
      
      source.start();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setState("listening");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!mediaStreamRef.current || !wsRef.current) return;

    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: "audio/webm;codecs=opus"
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(event.data);
      }
    };

    mediaRecorder.start(100); // Send chunks every 100ms
    setState("listening");
  }, []);

  const startSession = useCallback(async () => {
    try {
      setState("connecting");
      setErrorMessage("");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      // Connect to NUCLEUS Voice Gateway WebSocket
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        startRecording();
      };

      ws.onmessage = async (event) => {
        // Handle incoming audio from NUCLEUS
        if (event.data instanceof Blob) {
          await playAudio(event.data);
        } else if (typeof event.data === "string") {
          // Handle text messages (e.g., status updates)
          try {
            const message = JSON.parse(event.data);
            if (message.type === "processing") {
              setState("processing");
            }
          } catch {
            // Ignore non-JSON messages
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setErrorMessage("שגיאת חיבור. נסה שוב.");
        setState("error");
        cleanup();
      };

      ws.onclose = () => {
        if (state !== "error") {
          setState("idle");
        }
        cleanup();
      };

    } catch (error) {
      console.error("Failed to start voice session:", error);
      setErrorMessage("אין גישה למיקרופון");
      setState("error");
      cleanup();
    }
  }, [cleanup, playAudio, startRecording, state]);

  const stopSession = useCallback(() => {
    setState("idle");
    cleanup();
  }, [cleanup]);

  const toggleSession = useCallback(async () => {
    if (state === "idle" || state === "error") {
      await startSession();
    } else {
      stopSession();
    }
  }, [state, startSession, stopSession]);

  return {
    state,
    errorMessage,
    startSession,
    stopSession,
    toggleSession
  };
}
