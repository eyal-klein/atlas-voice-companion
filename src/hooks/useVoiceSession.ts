import { useState, useRef, useEffect, useCallback } from "react";

type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";

interface UseVoiceSessionReturn {
  state: VoiceState;
  errorMessage: string;
  transcript: string;
  startSession: () => Promise<void>;
  stopSession: () => void;
  toggleSession: () => Promise<void>;
}

// Updated to use Live API endpoint
const WEBSOCKET_URL = "wss://nucleus-atlas-backend-v2-796362729654.europe-west1.run.app/api/voice/stream?user_id=eyal_klein";

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end" }));
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // Helper functions for base64 conversion
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  const base64ToArrayBuffer = useCallback((base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }, []);

  const playPCMAudio = useCallback(async (arrayBuffer: ArrayBuffer, sampleRate: number) => {
    try {
      setState("speaking");
      
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContext({ sampleRate });
      }

      // Convert PCM Int16 to Float32
      const pcmData = new Int16Array(arrayBuffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF);
      }

      // Create AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        floatData.length,
        sampleRate
      );
      audioBuffer.getChannelData(0).set(floatData);

      // Add to queue
      audioQueueRef.current.push(audioBuffer);

      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (error) {
      console.error("Failed to play PCM audio:", error);
      setState("listening");
    }
  }, []);

  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        setState("listening");
      }
      return;
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift()!;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      playNextInQueue();
    };
    
    source.start();
  }, []);

  const startRecording = useCallback(() => {
    if (!mediaStreamRef.current || !wsRef.current || !audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    
    // Use ScriptProcessorNode to capture PCM audio
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32Array to Int16Array (PCM 16-bit)
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert to base64
      const base64Audio = arrayBufferToBase64(pcmData.buffer);

      // Send to server in JSON format
      wsRef.current.send(JSON.stringify({
        type: "audio",
        data: base64Audio,
        sample_rate: 16000
      }));
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);

    setState("listening");
    console.log("🎙️ Recording started (PCM 16kHz)");
  }, [arrayBufferToBase64]);

  const startSession = useCallback(async () => {
    try {
      setState("connecting");
      setErrorMessage("");
      setTranscript("");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Request 16kHz for Live API
        } 
      });
      mediaStreamRef.current = stream;

      // Create AudioContext for audio processing
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      // Connect to NUCLEUS Voice Gateway WebSocket (Live API)
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected to NUCLEUS Live API");
        startRecording();
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "session_started":
              console.log("🎤 Session started:", message.session_id);
              console.log("🎙️ Voice:", message.voice);
              console.log("🤖 Model:", message.model);
              break;
              
            case "audio":
              // Decode base64 PCM audio and play
              const audioData = base64ToArrayBuffer(message.data);
              await playPCMAudio(audioData, message.sample_rate || 24000);
              break;
              
            case "input_transcript":
              // User's speech transcription
              console.log("🎤 You said:", message.text);
              setTranscript(`את/ה: ${message.text}`);
              setState("processing");
              break;
              
            case "output_transcript":
              // NUCLEUS's speech transcription
              console.log("🤖 NUCLEUS said:", message.text);
              setTranscript(`NUCLEUS: ${message.text}`);
              break;
              
            case "tool_call":
              // Tool execution notification
              console.log("🔧 Tool called:", message.tool_name);
              setTranscript(`🔧 משתמש ב: ${message.tool_name}`);
              setState("processing");
              break;
              
            case "error":
              console.error("❌ Error from server:", message.message);
              setErrorMessage(message.message);
              setState("error");
              break;
              
            default:
              console.log("📩 Message:", message);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setErrorMessage("שגיאת חיבור. נסה שוב.");
        setState("error");
        cleanup();
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket closed");
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
  }, [cleanup, startRecording, base64ToArrayBuffer, playPCMAudio, state]);

  const stopSession = useCallback(() => {
    setState("idle");
    setTranscript("");
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
    transcript,
    startSession,
    stopSession,
    toggleSession
  };
}
