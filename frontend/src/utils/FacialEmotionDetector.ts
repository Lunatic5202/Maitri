import { pipeline } from '@huggingface/transformers';

type LoadingCallback = (progress: number, status: string) => void;

export interface FacialEmotionResult {
  emotion: string;
  confidence: number;
}

export interface DetectedFace {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  emotion: string;
  confidence: number;
}

class FacialEmotionDetector {
  private emotionClassifier: any = null;
  private faceDetector: any = null;
  private isLoading = false;
  private isReady = false;
  private videoStream: MediaStream | null = null;

  async initialize(onProgress?: LoadingCallback): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) return false;

    this.isLoading = true;

    try {
      onProgress?.(10, 'Loading face detection model...');
      
      // Load face detector (object detection model)
      this.faceDetector = await pipeline(
        'object-detection',
        'Xenova/detr-resnet-50',
        { device: 'webgpu' }
      );

      onProgress?.(50, 'Loading emotion classifier...');
      
      // Load emotion classifier
      this.emotionClassifier = await pipeline(
        'image-classification',
        'Xenova/facial_emotions_image_detection',
        { device: 'webgpu' }
      );

      onProgress?.(100, 'Models ready!');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to load models with WebGPU:', error);
      
      // Fallback to WASM
      try {
        onProgress?.(10, 'Loading models (fallback)...');
        
        this.faceDetector = await pipeline(
          'object-detection',
          'Xenova/detr-resnet-50'
        );

        onProgress?.(50, 'Loading emotion classifier...');
        
        this.emotionClassifier = await pipeline(
          'image-classification',
          'Xenova/facial_emotions_image_detection'
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

  async detectFacesWithEmotions(videoElement: HTMLVideoElement): Promise<DetectedFace[]> {
    if (!this.emotionClassifier || !this.faceDetector) {
      throw new Error('Models not initialized');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      // Detect objects (looking for person/face)
      const detections = await this.faceDetector(imageData, { threshold: 0.5 });
      
      const faces: DetectedFace[] = [];
      
      // Filter for person detections and treat head region as face
      const personDetections = detections.filter((d: any) => 
        d.label === 'person' && d.score > 0.5
      );

      for (const detection of personDetections.slice(0, 3)) { // Max 3 faces
        const box = detection.box;
        
        // Estimate face region (upper portion of person bounding box)
        const faceBox = {
          x: box.xmin,
          y: box.ymin,
          width: box.xmax - box.xmin,
          height: Math.min((box.ymax - box.ymin) * 0.4, box.ymax - box.ymin)
        };

        // Crop face region for emotion classification
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 224;
        faceCanvas.height = 224;
        const faceCtx = faceCanvas.getContext('2d');
        if (faceCtx) {
          faceCtx.drawImage(
            canvas,
            faceBox.x, faceBox.y, faceBox.width, faceBox.height,
            0, 0, 224, 224
          );
          
          const faceImageData = faceCanvas.toDataURL('image/jpeg', 0.8);
          const emotionResults = await this.emotionClassifier(faceImageData, { topk: 1 });
          
          if (emotionResults && emotionResults.length > 0) {
            faces.push({
              box: faceBox,
              emotion: emotionResults[0].label,
              confidence: Math.round(emotionResults[0].score * 100)
            });
          }
        }
      }

      // If no person detected, classify whole frame
      if (faces.length === 0) {
        const results = await this.emotionClassifier(imageData, { topk: 1 });
        if (results && results.length > 0) {
          faces.push({
            box: { x: canvas.width * 0.2, y: canvas.height * 0.1, width: canvas.width * 0.6, height: canvas.height * 0.5 },
            emotion: results[0].label,
            confidence: Math.round(results[0].score * 100)
          });
        }
      }

      return faces;
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  }

  async classifyFrame(videoElement: HTMLVideoElement): Promise<FacialEmotionResult[]> {
    const faces = await this.detectFacesWithEmotions(videoElement);
    return faces.map(f => ({ emotion: f.emotion, confidence: f.confidence }));
  }

  getStatus(): { isReady: boolean; isLoading: boolean } {
    return { isReady: this.isReady, isLoading: this.isLoading };
  }
}

// Singleton instance
export const facialAI = new FacialEmotionDetector();
