/**
 * AudioWorklet Processor for PCM Audio Recording
 * Based on Google's Live API implementation
 * Processes audio in real-time and sends PCM16 data to the main thread
 */

class AudioRecorderWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Buffer to accumulate audio samples before sending
    // Send every 2048 samples (about 128ms at 16kHz)
    this.buffer = new Int16Array(2048);
    this.bufferWriteIndex = 0;
  }

  /**
   * Process audio data
   * Called automatically by the browser for each audio block
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    // If no input, continue processing
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0]; // Get first channel (mono)
    
    // Convert Float32 samples to Int16 (PCM16)
    for (let i = 0; i < inputChannel.length; i++) {
      // Clamp to [-1, 1] range
      const sample = Math.max(-1, Math.min(1, inputChannel[i]));
      
      // Convert to 16-bit integer
      const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      
      // Add to buffer
      this.buffer[this.bufferWriteIndex++] = int16Sample;
      
      // If buffer is full, send it to main thread
      if (this.bufferWriteIndex >= this.buffer.length) {
        // Create a copy of the buffer to send
        const bufferCopy = new Int16Array(this.buffer);
        
        // Send to main thread
        this.port.postMessage({
          type: 'audio',
          data: bufferCopy
        });
        
        // Reset buffer index
        this.bufferWriteIndex = 0;
      }
    }
    
    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor('audio-recorder-worklet', AudioRecorderWorklet);
