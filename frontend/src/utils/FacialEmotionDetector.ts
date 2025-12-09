import { pipeline, env } from '@huggingface/transformers';

// Disable local model caching issues
env.allowLocalModels = false;

type LoadingCallback = (progress: number, status: string) => void;

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FacialEmotionResult {
  emotion: string;
  confidence: number;
  faceBox?: FaceBox;
}

class FacialEmotionDetector {
  private emotionClassifier: any = null;
  private faceDetector: any = null;
  private isLoading = false;
  private isReady = false;
  private videoStream: MediaStream | null = null;
  private lastDetectedFaces: FaceBox[] = [];

  async initialize(onProgress?: LoadingCallback): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) return false;

    this.isLoading = true;

    try {
      onProgress?.(10, 'Loading face detection model...');
      
      // Use object detection for face detection (DETR model fine-tuned for faces)
      try {
        this.faceDetector = await pipeline(
          'object-detection',
          'Xenova/detr-resnet-50',
          { device: 'webgpu' }
        );
      } catch {
        // Fallback to WASM for face detection
        this.faceDetector = await pipeline(
          'object-detection',
          'Xenova/detr-resnet-50'
        );
      }

      onProgress?.(50, 'Loading facial emotion model...');
      
      // Use image classification model for facial emotions
      try {
        this.emotionClassifier = await pipeline(
          'image-classification',
          'Xenova/facial_emotions_image_detection',
          { device: 'webgpu' }
        );
      } catch {
        // Fallback to WASM
        this.emotionClassifier = await pipeline(
          'image-classification',
          'Xenova/facial_emotions_image_detection'
        );
      }

      onProgress?.(100, 'Models ready!');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to load facial models:', error);
      this.isLoading = false;
      return false;
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
    this.lastDetectedFaces = [];
  }

  getLastDetectedFaces(): FaceBox[] {
    return this.lastDetectedFaces;
  }

  private async detectFaces(imageData: string): Promise<FaceBox[]> {
    if (!this.faceDetector) return [];

    try {
      const results = await this.faceDetector(imageData);
      
      // Filter for person detections (DETR can detect people/faces)
      const faces: FaceBox[] = [];
      
      for (const detection of results) {
        // DETR labels: look for "person" which usually includes face area
        const label = detection.label?.toLowerCase() || '';
        if (label === 'person' && detection.score > 0.5) {
          const box = detection.box;
          // Estimate face region from person detection (upper portion)
          faces.push({
            x: box.xmin,
            y: box.ymin,
            width: box.xmax - box.xmin,
            height: Math.min((box.ymax - box.ymin) * 0.5, box.ymax - box.ymin) // Upper half for face
          });
        }
      }
      
      return faces;
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  private async cropFaceRegion(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D,
    faceBox: FaceBox
  ): Promise<string> {
    // Create a new canvas for the cropped face
    const faceCanvas = document.createElement('canvas');
    const padding = 20; // Add padding around face
    
    const x = Math.max(0, faceBox.x - padding);
    const y = Math.max(0, faceBox.y - padding);
    const width = Math.min(canvas.width - x, faceBox.width + padding * 2);
    const height = Math.min(canvas.height - y, faceBox.height + padding * 2);
    
    faceCanvas.width = 224; // Standard input size for vision models
    faceCanvas.height = 224;
    
    const faceCtx = faceCanvas.getContext('2d');
    if (!faceCtx) return canvas.toDataURL('image/jpeg', 0.9);
    
    // Draw the cropped face region, scaled to 224x224
    faceCtx.drawImage(
      canvas,
      x, y, width, height,
      0, 0, 224, 224
    );
    
    return faceCanvas.toDataURL('image/jpeg', 0.9);
  }

  // Simple face detection using skin tone and edge detection
  private async detectFaceSimple(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<FaceBox | null> {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Find skin-colored regions (simplified HSV-based detection)
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let skinPixelCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Skin tone detection (simplified RGB rules)
        const isSkin = r > 95 && g > 40 && b > 20 &&
                       r > g && r > b &&
                       Math.abs(r - g) > 15 &&
                       r - g > 15;

        if (isSkin) {
          skinPixelCount++;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Need minimum skin pixels and reasonable aspect ratio
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const aspectRatio = boxWidth / (boxHeight || 1);

    if (skinPixelCount > 1000 && aspectRatio > 0.5 && aspectRatio < 2) {
      // Add some padding
      const padding = 30;
      return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width - minX + padding * 2, boxWidth + padding * 2),
        height: Math.min(height - minY + padding * 2, boxHeight + padding * 2)
      };
    }

    return null;
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
    
    try {
      // Try simple face detection first
      const faceBox = await this.detectFaceSimple(canvas, ctx);
      
      let imageToClassify: string;
      
      if (faceBox) {
        // Store detected face for overlay rendering
        this.lastDetectedFaces = [faceBox];
        
        // Crop the face region for better accuracy
        imageToClassify = await this.cropFaceRegion(canvas, ctx, faceBox);
      } else {
        // No face detected - use center region as fallback
        const centerBox: FaceBox = {
          x: canvas.width * 0.2,
          y: canvas.height * 0.1,
          width: canvas.width * 0.6,
          height: canvas.height * 0.7
        };
        this.lastDetectedFaces = [centerBox];
        imageToClassify = await this.cropFaceRegion(canvas, ctx, centerBox);
      }
      
      const results = await this.emotionClassifier(imageToClassify, { topk: 7 });
      
      const resultsArray = Array.isArray(results) ? results : [results];
      
      return resultsArray.map((r: any) => ({
        emotion: r.label as string,
        confidence: Math.round((r.score as number) * 100),
        faceBox: this.lastDetectedFaces[0],
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
