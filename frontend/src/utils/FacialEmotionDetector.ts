import { pipeline } from '@huggingface/transformers';

type LoadingCallback = (progress: number, status: string) => void;

export interface FacialEmotionResult {
  emotion: string;
  confidence: number;
}

class FacialEmotionDetector {
  private emotionClassifier: any = null;
  private isLoading = false;
  private isReady = false;
  private videoStream: MediaStream | null = null;

  async initialize(onProgress?: LoadingCallback): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) return false;

    this.isLoading = true;

    try {
      onProgress?.(20, 'Loading facial emotion model...');
      
      // Use image classification model for facial emotions
      this.emotionClassifier = await pipeline(
        'image-classification',
        'Xenova/facial_emotions_image_detection',
        { 
          device: 'webgpu',
        }
      );

      onProgress?.(100, 'Facial model ready!');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to load facial emotion model with WebGPU:', error);
      
      // Fallback to WASM
      try {
        onProgress?.(20, 'Loading facial model (fallback)...');
        
        this.emotionClassifier = await pipeline(
          'image-classification',
          'Xenova/facial_emotions_image_detection',
        );

        onProgress?.(100, 'Facial model ready!');
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

  async startCamera(): Promise<MediaStream | null> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      return this.videoStream;
    } catch (error) {
      console.error('Failed to access camera:', error);
      return null;
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  async classifyFrame(videoElement: HTMLVideoElement): Promise<FacialEmotionResult[]> {
    if (!this.emotionClassifier) {
      throw new Error('Facial emotion classifier not initialized');
    }

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL for the model
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      const results = await this.emotionClassifier(imageData, { topk: 5 });
      
      const resultsArray = Array.isArray(results) ? results : [results];
      
      return resultsArray.map((r: any) => ({
        emotion: r.label as string,
        confidence: Math.round((r.score as number) * 100),
      }));
    } catch (error) {
      console.error('Classification error:', error);
      return [];
    }
  }

  getStatus(): { isReady: boolean; isLoading: boolean } {
    return { isReady: this.isReady, isLoading: this.isLoading };
  }
}

// Singleton instance
export const facialAI = new FacialEmotionDetector();
