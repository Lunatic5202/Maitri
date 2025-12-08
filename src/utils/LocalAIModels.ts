import { pipeline } from '@huggingface/transformers';

type LoadingCallback = (progress: number, status: string) => void;

class LocalAIModels {
  private speechRecognizer: any = null;
  private emotionClassifier: any = null;
  private isLoading = false;
  private isReady = false;

  async initialize(onProgress?: LoadingCallback): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) return false;

    this.isLoading = true;

    try {
      // Load Whisper for speech recognition
      onProgress?.(10, 'Loading speech recognition model...');
      this.speechRecognizer = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        { 
          dtype: 'fp32',
          device: 'webgpu',
        }
      );

      onProgress?.(50, 'Loading emotion classifier...');
      // Load emotion classification model
      this.emotionClassifier = await pipeline(
        'text-classification',
        'SamLowe/roberta-base-go_emotions',
        { 
          dtype: 'fp32',
          device: 'webgpu',
        }
      );

      onProgress?.(100, 'Models ready!');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to load AI models:', error);
      
      // Fallback to WASM if WebGPU fails
      try {
        onProgress?.(10, 'Loading models (fallback mode)...');
        
        this.speechRecognizer = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-tiny.en',
        );

        onProgress?.(50, 'Loading emotion classifier...');
        
        this.emotionClassifier = await pipeline(
          'text-classification',
          'SamLowe/roberta-base-go_emotions',
        );

        onProgress?.(100, 'Models ready!');
        this.isReady = true;
        this.isLoading = false;
        return true;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        this.isLoading = false;
        return false;
      }
    }
  }

  async transcribe(audio: Float32Array): Promise<string> {
    if (!this.speechRecognizer) {
      throw new Error('Speech recognizer not initialized');
    }

    const result = await this.speechRecognizer(audio);
    return result?.text || '';
  }

  async classifyEmotion(text: string): Promise<EmotionResult[]> {
    if (!this.emotionClassifier) {
      throw new Error('Emotion classifier not initialized');
    }

    const results = await this.emotionClassifier(text, { top_k: 5 });
    
    // Handle both single result and array
    const resultsArray = Array.isArray(results) ? results : [results];
    
    return resultsArray.map((r: any) => ({
      emotion: r.label as string,
      confidence: Math.round((r.score as number) * 100),
    }));
  }

  getStatus(): { isReady: boolean; isLoading: boolean } {
    return { isReady: this.isReady, isLoading: this.isLoading };
  }
}

export interface EmotionResult {
  emotion: string;
  confidence: number;
}

// Singleton instance
export const localAI = new LocalAIModels();
