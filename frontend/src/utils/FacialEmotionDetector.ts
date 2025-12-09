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

    // Create canvas to capture frame with higher resolution for better detection
    const canvas = document.createElement('canvas');
    const sourceWidth = videoElement.videoWidth || 640;
    const sourceHeight = videoElement.videoHeight || 480;
    
    // Use higher resolution for better emotion detection
    canvas.width = Math.min(sourceWidth, 512);
    canvas.height = Math.min(sourceHeight, 512);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Draw the frame first without filters to check brightness
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Check if frame is too dark (blocked camera)
    const imageDataRaw = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageDataRaw.data;
    let totalBrightness = 0;
    const sampleSize = Math.min(pixels.length / 4, 10000); // Sample up to 10000 pixels
    const step = Math.floor(pixels.length / 4 / sampleSize);
    
    for (let i = 0; i < pixels.length; i += step * 4) {
      // Calculate perceived brightness using luminance formula
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    const avgBrightness = totalBrightness / sampleSize;
    
    // If average brightness is too low (dark/blocked camera), return empty
    if (avgBrightness < 15) {
      console.log('Frame too dark, skipping classification. Avg brightness:', avgBrightness);
      return [];
    }
    
    // Apply image enhancements for better emotion detection
    ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    
    // Convert to data URL with higher quality for better detection
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    
    try {
      // Get more results for better coverage of all emotions including disgust
      const results = await this.emotionClassifier(imageData, { topk: 7 });
      
      const resultsArray = Array.isArray(results) ? results : [results];
      
      // Apply sensitivity adjustments for specific emotions
      return resultsArray.map((r: any) => {
        let score = r.score as number;
        const label = (r.label as string).toLowerCase();
        
        // Boost happy/smile detection sensitivity
        if (label === 'happy' || label === 'happiness' || label === 'smile') {
          score = Math.min(1, score * 1.4); // 40% boost for smile detection
        }
        
        // Boost disgust detection sensitivity
        if (label === 'disgust' || label === 'disgusted') {
          score = Math.min(1, score * 1.5); // 50% boost for disgust detection
        }
        
        // Slightly boost subtle emotions
        if (label === 'surprise' || label === 'fear') {
          score = Math.min(1, score * 1.2);
        }
        
        return {
          emotion: r.label as string,
          confidence: Math.round(score * 100),
        };
      });
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
