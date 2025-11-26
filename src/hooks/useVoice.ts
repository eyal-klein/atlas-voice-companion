/**
 * useVoice - Hook for real-time voice interaction with NUCLEUS ATLAS
 * Uses PCM audio format for Gemini Live API compatibility
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { usePCMAudio } from './usePCMAudio';

interface VoiceMessage {
  type: string;
  transcript?: string;
  response?: string;
  audio?: string;
  action?: string;
  actionData?: any;
  error?: string;
}

interface UseVoiceOptions {
  agentId?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onAction?: (action: string, data: any) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { agentId = 'nucleus-atlas', onTranscript, onResponse, onAction } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  /**
   * Get WebSocket URL - NUCLEUS ATLAS backend
   */
  const getWsUrl = useCallback(() => {
    const backendUrl = 'https://nucleus-atlas-backend-v2-796362729654.europe-west1.run.app';
    const wsUrl = backendUrl.replace('https://', 'wss://');
    return `${wsUrl}/api/voice/stream`;
  }, []);

  /**
   * PCM Audio hook
   */
  const { startRecording: startPCMRecording, stopRecording: stopPCMRecording, playAudioChunk, cleanup: cleanupPCM } = usePCMAudio({
    onAudioChunk: (base64PCM) => {
      // Send PCM audio to backend
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionIdRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'audio',
          sessionId: sessionIdRef.current,
          audioData: base64PCM,
        }));
      }
    },
    sampleRate: 16000,
    chunkIntervalMs: 100, // Send every 100ms for low latency
  });

  /**
   * Connect to Voice WebSocket
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🎙️ Voice WebSocket connected');
        setIsConnected(true);
        toast.success('מחובר ל-NUCLEUS ATLAS');
      };

      ws.onmessage = async (event) => {
        try {
          const message: VoiceMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'session_started':
              console.log('✅ Session started');
              setIsSessionActive(true);
              toast.success('שיחה התחילה');
              break;

            case 'voice_response':
              // Handle text transcript
              if (message.transcript && onTranscript) {
                onTranscript(message.transcript);
              }
              
              // Handle text response
              if (message.response && onResponse) {
                onResponse(message.response);
              }
              
              // Handle audio response
              if (message.audio) {
                try {
                  await playAudioChunk(message.audio);
                } catch (error) {
                  console.error('Failed to play audio:', error);
                  toast.error('שגיאה בהשמעת אודיו');
                }
              }
              
              // Handle action
              if (message.action && onAction) {
                onAction(message.action, message.actionData);
              }
              break;

            case 'session_stopped':
              console.log('⏹️ Session stopped');
              setIsSessionActive(false);
              setIsRecording(false);
              toast.info('שיחה הסתיימה');
              break;

            case 'error':
              console.error('❌ Voice error:', message.error);
              toast.error(message.error || 'שגיאה בעיבוד קולי');
              break;

            case 'audio_response':
              // Handle audio response from Gemini Live
              if (message.audio) {
                try {
                  await playAudioChunk(message.audio);
                } catch (error) {
                  console.error('Failed to play audio:', error);
                  toast.error('שגיאה בהשמעת אודיו');
                }
              }
              break;

            case 'pong':
              // Keepalive response
              break;

            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        toast.error('שגיאת חיבור');
      };

      ws.onclose = () => {
        console.log('🔌 Voice WebSocket disconnected');
        setIsConnected(false);
        setIsSessionActive(false);
        setIsRecording(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('נכשל חיבור ל-NUCLEUS ATLAS');
    }
  }, [getWsUrl, onTranscript, onResponse, onAction, playAudioChunk]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSessionActive(false);
    setIsRecording(false);
  }, []);

  /**
   * Start voice session and recording
   */
  const startCall = useCallback(async () => {
    // Connect first if not connected
    if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('Connecting to voice service...');
      connect();
      
      // Wait for connection to be ready (max 5 seconds)
      const maxWait = 5000;
      const checkInterval = 100;
      let waited = 0;
      
      while (waited < maxWait) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('✅ Voice WebSocket ready');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }
      
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error('נכשל חיבור לשירות קולי');
        return;
      }
    }

    if (isSessionActive) {
      console.log('Session already active');
      return;
    }

    try {
      // Generate session ID
      const newSessionId = Date.now().toString();
      sessionIdRef.current = newSessionId;

      // Send start message
      wsRef.current.send(JSON.stringify({
        type: 'start',
        sessionId: newSessionId,
        agentId,
      }));

      // Start PCM recording
      try {
        await startPCMRecording();
        setIsRecording(true);
        setIsSessionActive(true);
        console.log('▶️ Voice call started:', newSessionId);
        toast.success('שיחה התחילה - דבר עכשיו!');
      } catch (micError) {
        console.error('Failed to start microphone:', micError);
        
        // Send stop message to backend since we can't continue
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'stop' }));
        }
        
        // Show specific error message
        const errorMsg = micError instanceof Error ? micError.message : 'Unknown error';
        if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
          toast.error('גישה למיקרופון נדחתה. אנא אפשר גישה ונסה שוב.');
        } else if (errorMsg.includes('NotFoundError')) {
          toast.error('לא נמצא מיקרופון. אנא חבר מיקרופון ונסה שוב.');
        } else {
          toast.error(`נכשלה גישה למיקרופון: ${errorMsg}`);
        }
        
        setIsSessionActive(false);
        setIsRecording(false);
        throw micError;
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      // Error already handled above, just ensure state is clean
      setIsSessionActive(false);
      setIsRecording(false);
    }
  }, [isConnected, isSessionActive, agentId, startPCMRecording, connect]);

  /**
   * Stop voice session and recording
   */
  const endCall = useCallback(() => {
    if (!wsRef.current || !sessionIdRef.current) return;

    try {
      // Stop PCM recording
      stopPCMRecording();
      setIsRecording(false);

      // Send stop message
      wsRef.current.send(JSON.stringify({
        type: 'stop',
        sessionId: sessionIdRef.current,
      }));

      sessionIdRef.current = null;
      setIsSessionActive(false);

      console.log('⏹️ Voice call ended');
      toast.info('שיחה הסתיימה');
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [stopPCMRecording]);

  /**
   * Toggle recording (for manual control)
   */
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopPCMRecording();
      setIsRecording(false);
      toast.info('הקלטה הושהתה');
    } else {
      if (!isSessionActive) {
        toast.error('התחל שיחה קודם');
        return;
      }
      await startPCMRecording();
      setIsRecording(true);
      toast.success('הקלטה התחדשה');
    }
  }, [isRecording, isSessionActive, startPCMRecording, stopPCMRecording]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cleanup only on unmount, not on dependency changes
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      cleanupPCM();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  /**
   * Keepalive ping
   */
  useEffect(() => {
    if (!isConnected || !wsRef.current) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isConnected,
    isSessionActive,
    isRecording,
    startCall,
    endCall,
    toggleRecording,
    connect,
    disconnect,
  };
}
