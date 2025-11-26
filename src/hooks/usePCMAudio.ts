/**
 * usePCMAudio - Hook for recording and playing PCM audio
 * Uses AudioWorklet (modern API) instead of deprecated ScriptProcessorNode
 * Based on Google's Live API demo implementation
 */

import { useRef, useCallback } from 'react';

interface UsePCMAudioOptions {
  onAudioChunk?: (base64PCM: string) => void;
  sampleRate?: number;
  chunkIntervalMs?: number;
}

export function usePCMAudio(options: UsePCMAudioOptions = {}) {
  const {
    onAudioChunk,
    sampleRate = 16000,
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  /**
   * Start recording PCM audio from microphone using AudioWorklet
   */
  const startRecording = useCallback(async () => {
    // Prevent concurrent start operations
    if (isStartingRef.current) {
      console.warn('⚠️ Recording start already in progress');
      return;
    }
    
    isStartingRef.current = true;
    
    try {
      // Create AudioContext with 16kHz sample rate
      try {
        audioContextRef.current = new AudioContext({
          sampleRate,
        });
      } catch (err) {
        console.warn('Failed to create AudioContext with custom sample rate, using default:', err);
        // Fallback to default sample rate if custom rate fails
        audioContextRef.current = new AudioContext();
      }

      if (!audioContextRef.current) {
        throw new Error('Failed to create AudioContext');
      }

      console.log('✅ AudioContext created:', {
        sampleRate: audioContextRef.current.sampleRate,
        state: audioContextRef.current.state
      });

      // Load AudioWorklet module
      try {
        await audioContextRef.current.audioWorklet.addModule('/worklets/audio-recorder-worklet.js');
        console.log('✅ AudioWorklet module loaded');
      } catch (err) {
        console.error('❌ Failed to load AudioWorklet module:', err);
        throw new Error('Failed to load AudioWorklet module');
      }

      // Request microphone access
      const constraints = {
        audio: {
          channelCount: 1,
          sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      console.log('🎤 Requesting microphone access...');
      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got media stream:', {
        id: streamRef.current.id,
        tracks: streamRef.current.getAudioTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });

      // Create audio source from microphone
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Create AudioWorklet node
      workletNodeRef.current = new AudioWorkletNode(
        audioContextRef.current,
        'audio-recorder-worklet'
      );

      // Listen for audio data from worklet
      workletNodeRef.current.port.onmessage = (event) => {
        if (event.data.type === 'audio') {
          const int16Array = event.data.data as Int16Array;
          
          console.log('📤 Received audio from worklet:', int16Array.length, 'samples');
          
          // Convert Int16Array to ArrayBuffer
          const buffer = new ArrayBuffer(int16Array.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < int16Array.length; i++) {
            view.setInt16(i * 2, int16Array[i], true); // little-endian
          }

          // Convert to base64
          const uint8Array = new Uint8Array(buffer);
          const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

          // Send to callback
          if (onAudioChunk) {
            onAudioChunk(base64);
          }
        }
      };

      // Connect audio nodes
      source.connect(workletNodeRef.current);
      // DO NOT connect to destination - we only want to process, not play back the microphone

      console.log('🎤 PCM recording started successfully with AudioWorklet', {
        audioContextState: audioContextRef.current.state,
        sampleRate: audioContextRef.current.sampleRate,
        streamActive: streamRef.current?.active,
        workletConnected: !!workletNodeRef.current
      });
      
      // Mark start as complete
      isStartingRef.current = false;
    } catch (error) {
      console.error('❌ Failed to start PCM recording:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Clean up on error
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      isStartingRef.current = false;
      throw error;
    }
  }, [sampleRate, onAudioChunk]);

  /**
   * Stop recording PCM audio
   */
  const stopRecording = useCallback(() => {
    // Prevent stop during start
    if (isStartingRef.current) {
      console.warn('⚠️ Cannot stop recording while start is in progress');
      return;
    }
    
    try {
      // Disconnect worklet
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current.port.close();
        workletNodeRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      console.log('⏹️ PCM recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, []);

  /**
   * Play audio chunk from base64 PCM data
   * Queues chunks and plays them sequentially to avoid overlap
   */
  const playAudioChunk = useCallback(async (base64PCM: string) => {
    // Add to queue
    audioQueueRef.current.push(base64PCM);
    
    // If already playing, the current playback will handle the queue
    if (isPlayingRef.current) {
      return;
    }
    
    // Start playing the queue
    isPlayingRef.current = true;
    
    try {
      // Create playback context if needed (24kHz for output)
      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({
          sampleRate: 24000, // Gemini outputs at 24kHz
        });
      }
      
      // Process queue sequentially
      while (audioQueueRef.current.length > 0) {
        const chunk = audioQueueRef.current.shift();
        if (!chunk) continue;
        
        try {
          // Decode base64 to ArrayBuffer
          const binaryString = atob(chunk);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Convert PCM16 to Float32
          const int16Array = new Int16Array(bytes.buffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
          }

          // Create audio buffer
          const audioBuffer = playbackContextRef.current!.createBuffer(
            1, // mono
            float32Array.length,
            playbackContextRef.current!.sampleRate
          );
          audioBuffer.getChannelData(0).set(float32Array);

          // Play the buffer and wait for it to finish
          await new Promise<void>((resolve) => {
            const source = playbackContextRef.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(playbackContextRef.current!.destination);
            source.onended = () => resolve();
            source.start();
            
            console.log('🔊 Playing audio chunk:', float32Array.length, 'samples');
          });
        } catch (error) {
          console.error('Error playing audio chunk:', error);
        }
      }
    } finally {
      isPlayingRef.current = false;
    }
  }, []);

  /**
   * Cleanup all audio resources
   */
  const cleanup = useCallback(() => {
    stopRecording();
    
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
  }, [stopRecording]);

  return {
    startRecording,
    stopRecording,
    playAudioChunk,
    cleanup,
  };
}
