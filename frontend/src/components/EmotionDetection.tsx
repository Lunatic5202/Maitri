import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Brain, Eye, Mic, Activity, TrendingUp, AlertCircle, MicOff, Loader2, Download, Camera, CameraOff, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AudioRecorder, audioToFloat32Array } from "@/utils/AudioRecorder";
import { localAI, EmotionResult } from "@/utils/LocalAIModels";
import { facialAI, FacialEmotionResult, FrameAnalysisResult } from "@/utils/FacialEmotionDetector";
import { toast } from "sonner";

// Convert WebM blob to WAV format for backend compatibility
async function convertWebMToWAV(webmBlob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get mono audio data
    const rawData = audioBuffer.getChannelData(0);
    const wavData = encodeWAV(rawData, audioBuffer.sampleRate);
    return new Blob([wavData], { type: 'audio/wav' });
  } catch (error) {
    console.warn('WebM to WAV conversion failed, sending as-is:', error);
    return webmBlob; // fallback: send original blob
  }
}

// Simple WAV encoder
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  
  return buffer;
}

interface AnalysisEntry {
  time: string;
  type: "Facial" | "Voice" | "Combined";
  emotion: string;
  confidence: number;
}

interface EmotionSource {
  category: string;
  value: number;
  timestamp: number;
}

// Weights for combining sources (total = 1.0)
const VOICE_WEIGHT = 0.6;  // Voice analysis gets more weight
const FACIAL_WEIGHT = 0.4; // Facial analysis complement

const EmotionDetection = () => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const [useServer, setUseServer] = useState<boolean>(Boolean(API_BASE));
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [transcription, setTranscription] = useState<string>('');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraProcessing, setIsCameraProcessing] = useState(false);
  const [cameraModelStatus, setCameraModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [cameraLoadingProgress, setCameraLoadingProgress] = useState(0);
  const [cameraLoadingMessage, setCameraLoadingMessage] = useState('');
  const [lastFacialEmotion, setLastFacialEmotion] = useState<string>('');
  const [lastVoiceEmotion, setLastVoiceEmotion] = useState<string>('');
  const [isFrameTooDark, setIsFrameTooDark] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  
  // Track emotion sources for weighted averaging
  const [voiceEmotions, setVoiceEmotions] = useState<Record<string, EmotionSource>>({});
  const [facialEmotions, setFacialEmotions] = useState<Record<string, EmotionSource>>({});
  
  const [emotions, setEmotions] = useState([
    { name: "Calm", value: 50, color: "bg-success", voiceValue: 0, facialValue: 0 },
    { name: "Focus", value: 50, color: "bg-primary", voiceValue: 0, facialValue: 0 },
    { name: "Stress", value: 20, color: "bg-warning", voiceValue: 0, facialValue: 0 },
    { name: "Fatigue", value: 20, color: "bg-destructive", voiceValue: 0, facialValue: 0 },
  ]);

  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisEntry[]>([
    { time: "14:32", type: "Combined", emotion: "Calm + Focused", confidence: 92 },
    { time: "14:28", type: "Voice", emotion: "Engaged", confidence: 87 },
    { time: "14:15", type: "Facial", emotion: "Neutral", confidence: 91 },
  ]);

  const recorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    return () => {
      recorderRef.current?.cleanup();
      facialAI.stopCamera();
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const initializeModels = async () => {
    // Only initialize local models when not using server-side inference
    if (useServer) return false;

    setModelStatus('loading');
    setLoadingProgress(0);
    
    const success = await localAI.initialize((progress, status) => {
      setLoadingProgress(progress);
      setLoadingMessage(status);
    });

    setModelStatus(success ? 'ready' : 'error');
    if (!success) {
      toast.error('Failed to load AI models. Please refresh and try again.');
    }
    return success;
  };

  const checkHealth = async () => {
    if (!API_BASE) return setHealthStatus('unknown');
    setCheckingHealth(true);
    try {
      const url = `${API_BASE.replace(/\/$/, '')}/health`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        setHealthStatus('down');
        return;
      }
      const json = await res.json();
      if (json && (json.status === 'ok' || json.status === 'OK')) {
        setHealthStatus('ok');
      } else {
        setHealthStatus('down');
      }
    } catch (err) {
      setHealthStatus('down');
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    // On mount, if API base is provided, check health
    if (API_BASE) {
      checkHealth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapEmotionToCategory = (emotion: string): string => {
    const emotionMap: Record<string, string> = {
      // Calm/Neutral emotions
      'neutral': 'Calm',
      'calm': 'Calm',
      'relief': 'Calm',
      'approval': 'Calm',
      
      // Focus/Engagement emotions  
      'curiosity': 'Focus',
      'realization': 'Focus',
      'admiration': 'Focus',
      'desire': 'Focus',
      
      // Stress emotions
      'nervousness': 'Stress',
      'fear': 'Stress',
      'anxiety': 'Stress',
      'annoyance': 'Stress',
      'anger': 'Stress',
      'disgust': 'Stress',
      'disapproval': 'Stress',
      'embarrassment': 'Stress',
      
      // Fatigue/Negative emotions
      'sadness': 'Fatigue',
      'grief': 'Fatigue',
      'disappointment': 'Fatigue',
      'remorse': 'Fatigue',
      'confusion': 'Fatigue',
    };
    
    return emotionMap[emotion.toLowerCase()] || 'Calm';
  };

  const mapFacialEmotionToCategory = (emotion: string): string => {
    const emotionMap: Record<string, string> = {
      'happy': 'Calm',
      'neutral': 'Focus',
      'surprise': 'Focus',
      'sad': 'Fatigue',
      'angry': 'Stress',
      'fear': 'Stress',
      'disgust': 'Stress',
    };
    return emotionMap[emotion.toLowerCase()] || 'Calm';
  };

  // Calculate combined emotions with weighted averaging
  const calculateCombinedEmotions = useCallback(() => {
    const now = Date.now();
    const DECAY_TIME = 30000; // 30 seconds before data becomes stale

    setEmotions(prev => prev.map(emotion => {
      const voiceData = voiceEmotions[emotion.name];
      const facialData = facialEmotions[emotion.name];
      
      // Check if data is still fresh
      const voiceAge = voiceData ? now - voiceData.timestamp : Infinity;
      const facialAge = facialData ? now - facialData.timestamp : Infinity;
      
      const voiceValid = voiceData && voiceAge < DECAY_TIME;
      const facialValid = facialData && facialAge < DECAY_TIME;
      
      let combinedValue: number;
      let voiceVal = voiceValid ? voiceData.value : 0;
      let facialVal = facialValid ? facialData.value : 0;
      
      if (voiceValid && facialValid) {
        // Both sources available - use weighted average
        combinedValue = Math.round(voiceVal * VOICE_WEIGHT + facialVal * FACIAL_WEIGHT);
      } else if (voiceValid) {
        // Only voice available
        combinedValue = Math.round(voiceVal);
      } else if (facialValid) {
        // Only facial available
        combinedValue = Math.round(facialVal);
      } else {
        // No fresh data - decay toward baseline
        combinedValue = Math.max(10, emotion.value - 2);
      }
      
      return { 
        ...emotion, 
        value: Math.min(100, Math.max(0, combinedValue)),
        voiceValue: voiceValid ? Math.round(voiceVal) : 0,
        facialValue: facialValid ? Math.round(facialVal) : 0,
      };
    }));
  }, [voiceEmotions, facialEmotions]);

  // Update combined emotions when either source changes
  useEffect(() => {
    calculateCombinedEmotions();
  }, [calculateCombinedEmotions]);

  const updateVoiceEmotions = (results: EmotionResult[]) => {
    const categoryScores: Record<string, number[]> = {
      'Calm': [],
      'Focus': [],
      'Stress': [],
      'Fatigue': [],
    };

    results.forEach(result => {
      const category = mapEmotionToCategory(result.emotion);
      if (categoryScores[category]) {
        categoryScores[category].push(result.confidence);
      }
    });

    const now = Date.now();
    const newVoiceEmotions: Record<string, EmotionSource> = {};
    
    Object.entries(categoryScores).forEach(([category, scores]) => {
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        newVoiceEmotions[category] = { category, value: avgScore, timestamp: now };
      }
    });

    setVoiceEmotions(prev => ({ ...prev, ...newVoiceEmotions }));
    
    // Find top emotion for display
    const topCategory = Object.entries(newVoiceEmotions)
      .sort((a, b) => b[1].value - a[1].value)[0];
    if (topCategory) {
      setLastVoiceEmotion(topCategory[0]);
    }
  };

  const updateFacialEmotions = (results: FacialEmotionResult[]) => {
    const categoryScores: Record<string, number[]> = {
      'Calm': [],
      'Focus': [],
      'Stress': [],
      'Fatigue': [],
    };

    results.forEach(result => {
      const category = mapFacialEmotionToCategory(result.emotion);
      if (categoryScores[category]) {
        categoryScores[category].push(result.confidence);
      }
    });

    const now = Date.now();
    const newFacialEmotions: Record<string, EmotionSource> = {};
    
    Object.entries(categoryScores).forEach(([category, scores]) => {
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        newFacialEmotions[category] = { category, value: avgScore, timestamp: now };
      }
    });

    setFacialEmotions(prev => ({ ...prev, ...newFacialEmotions }));
  };

  // Log combined analysis periodically
  const logCombinedAnalysis = useCallback(() => {
    if (!lastVoiceEmotion && !lastFacialEmotion) return;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let emotionLabel: string;
    if (lastVoiceEmotion && lastFacialEmotion) {
      emotionLabel = `${lastVoiceEmotion} + ${lastFacialEmotion}`;
    } else {
      emotionLabel = lastVoiceEmotion || lastFacialEmotion;
    }
    
    const avgConfidence = Math.round(
      emotions.reduce((sum, e) => sum + e.value, 0) / emotions.length
    );

    const newEntry: AnalysisEntry = {
      time: timeStr,
      type: "Combined",
      emotion: emotionLabel,
      confidence: avgConfidence,
    };

    setRecentAnalysis(prev => {
      const lastCombined = prev.find(e => e.type === 'Combined');
      if (!lastCombined || lastCombined.emotion !== emotionLabel) {
        return [newEntry, ...prev.slice(0, 9)];
      }
      return prev;
    });
  }, [lastVoiceEmotion, lastFacialEmotion, emotions]);

  // Camera handling functions
  const initializeCameraModel = async () => {
    setCameraModelStatus('loading');
    setCameraLoadingProgress(0);
    
    const success = await facialAI.initialize((progress, status) => {
      setCameraLoadingProgress(progress);
      setCameraLoadingMessage(status);
    });

    setCameraModelStatus(success ? 'ready' : 'error');
    if (!success) {
      toast.error('Failed to load facial emotion model');
    }
    return success;
  };

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !facialAI.getStatus().isReady || isCameraProcessing) return;
    
    setIsCameraProcessing(true);
    try {
      const result = await facialAI.classifyFrame(videoRef.current);
      
      // Handle dark frame detection
      setIsFrameTooDark(result.isTooDark);
      
      if (result.isTooDark) {
        setLastFacialEmotion('');
        setIsCameraProcessing(false);
        return;
      }
      
      if (result.emotions.length > 0) {
        const topEmotion = result.emotions[0];
        setLastFacialEmotion(topEmotion.emotion);
        updateFacialEmotions(result.emotions);
        
        // Add to analysis log periodically
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        setRecentAnalysis(prev => {
          const lastFacial = prev.find(e => e.type === 'Facial');
          if (!lastFacial || lastFacial.emotion !== topEmotion.emotion) {
            const newEntry: AnalysisEntry = {
              time: timeStr,
              type: "Facial",
              emotion: topEmotion.emotion.charAt(0).toUpperCase() + topEmotion.emotion.slice(1),
              confidence: topEmotion.confidence,
            };
            return [newEntry, ...prev.slice(0, 9)];
          }
          return prev;
        });
        
        // Trigger combined analysis logging
        logCombinedAnalysis();
      } else {
        setLastFacialEmotion('');
      }
    } catch (error) {
      console.error('Frame analysis error:', error);
    } finally {
      setIsCameraProcessing(false);
    }
  }, [isCameraProcessing, logCombinedAnalysis]);

  const handleCameraToggle = async () => {
    if (isCameraActive) {
      // Stop camera
      facialAI.stopCamera();
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      setIsCameraActive(false);
      setLastFacialEmotion('');
      toast.info('Camera stopped');
    } else {
      // Initialize model if needed
      if (cameraModelStatus === 'idle') {
        const ok = await initializeCameraModel();
        if (!ok) return;
      }
      
      if (cameraModelStatus === 'loading') {
        toast.info('Please wait for facial model to load...');
        return;
      }

      // Start camera
      const stream = await facialAI.startCamera();
      if (!stream) {
        toast.error('Could not access camera');
        return;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCameraActive(true);
      toast.success('Camera started - analyzing expressions');
      
      // Start periodic analysis (every 2 seconds to avoid overload)
      analysisIntervalRef.current = window.setInterval(() => {
        analyzeFrame();
      }, 2000);
    }
  };

  const handleRecordingToggle = async () => {
    if (!recorderRef.current) return;

    // Initialize models on first use
    if (!useServer && modelStatus === 'idle') {
      const ok = await initializeModels();
      if (!ok) return;
    }

    if (!useServer && modelStatus === 'loading') {
      toast.info('Please wait for models to finish loading...');
      return;
    }

    if (isRecording) {
      // Stop recording and process
      setIsRecording(false);
      setIsProcessing(true);

      try {
        const audioBlob = await recorderRef.current.stopRecording();
        
        if (audioBlob.size === 0) {
          toast.error('No audio recorded');
          setIsProcessing(false);
          return;
        }

        // If using server-side inference, send the raw audio to the backend immediately
        if (API_BASE && useServer) {
          try {
            // Convert WebM blob to WAV for backend compatibility
            const wavBlob = await convertWebMToWAV(audioBlob);
            
            const fd = new FormData();
            fd.append('audio', wavBlob, 'recording.wav');
            // optional client-side transcription is skipped when using server
            fd.append('message', '');

            const url = `${API_BASE.replace(/\/$/, '')}/classify`;
            const res = await fetch(url, { method: 'POST', body: fd });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(errText || `Status ${res.status}`);
            }
            const json = await res.json();

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const serverEmotion = json.emotion || 'Unknown';
            const serverConfidence = typeof json.confidence === 'number' ? Math.round((json.confidence as number) * 100) : (json.confidence ?? 0);

            const newEntry: AnalysisEntry = {
              time: timeStr,
              type: 'Voice',
              emotion: serverEmotion,
              confidence: serverConfidence,
            };

            setRecentAnalysis(prev => [newEntry, ...prev.slice(0, 9)]);
            toast.success(`Server detected: ${serverEmotion} (${serverConfidence}%)`);
            setIsProcessing(false);
            return; // skip local classification when server used
          } catch (err: any) {
            console.error('Server classify error:', err);
            toast.error(`Server error: ${err?.message || err}`);
            // fallthrough to local classification as fallback
          }
        }

        // Classify emotions locally if no server or server failed
        // Convert audio to format for Whisper/local transcribe
        const audioData = await audioToFloat32Array(audioBlob);
        const text = await localAI.transcribe(audioData);
        setTranscription(text);

        if (!text.trim()) {
          toast.info('No speech detected');
          setIsProcessing(false);
          return;
        }

        const emotionResults = await localAI.classifyEmotion(text);
        
        // Update voice emotions for weighted averaging
        updateVoiceEmotions(emotionResults);

        // Add to analysis log
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const topEmotion = emotionResults[0];
        const newEntry: AnalysisEntry = {
          time: timeStr,
          type: "Voice",
          emotion: topEmotion.emotion.charAt(0).toUpperCase() + topEmotion.emotion.slice(1),
          confidence: topEmotion.confidence,
        };

        setRecentAnalysis(prev => [newEntry, ...prev.slice(0, 9)]);
        toast.success(`Voice: ${topEmotion.emotion} (${topEmotion.confidence}%)`);
        
        // Trigger combined analysis logging
        logCombinedAnalysis();

      } catch (error) {
        console.error('Processing error:', error);
        toast.error('Error processing audio');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Start recording
      const started = await recorderRef.current.startRecording();
      if (started) {
        setIsRecording(true);
        setTranscription('');
        toast.info('Recording... Speak now');
      } else {
        toast.error('Could not access microphone');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">Emotion Detection System</h1>
              <p className="text-muted-foreground">Real-time multimodal emotional state analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              <Activity className="w-3 h-3 mr-1" />
              {modelStatus === 'ready' ? 'AI Models Ready' : 'Neural Processing Active'}
            </Badge>
            {modelStatus === 'ready' && (
              <Badge variant="outline" className="text-success border-success/50">
                100% Offline
              </Badge>
            )}

            {/* Server / Local toggle */}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">Server</span>
              <Switch checked={useServer} onCheckedChange={(v) => { setUseServer(Boolean(v)); if (v) checkHealth(); }} />
              <div className="ml-2">
                {API_BASE ? (
                  checkingHealth ? (
                    <Badge variant="secondary">Checking...</Badge>
                  ) : healthStatus === 'ok' ? (
                    <Badge variant="secondary" className="text-success">Server OK</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-destructive">Server Down</Badge>
                  )
                ) : (
                  <Badge variant="secondary">No Server</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Voice Recording Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Emotion Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {modelStatus === 'loading' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>{loadingMessage}</span>
                </div>
                <Progress value={loadingProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  First-time setup: Downloading AI models (~150MB). They'll be cached for offline use.
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={handleRecordingToggle}
                disabled={isProcessing || modelStatus === 'loading'}
                className="min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : isRecording ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    {modelStatus === 'idle' ? 'Start (Load Models)' : 'Start Recording'}
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm text-destructive">Recording...</span>
                </div>
              )}
            </div>

            {transcription && (
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Transcription:</p>
                <p className="text-foreground">"{transcription}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Facial Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Facial Emotion Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cameraModelStatus === 'loading' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>{cameraLoadingMessage}</span>
                </div>
                <Progress value={cameraLoadingProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Downloading facial emotion model (~50MB). It will be cached for offline use.
                </p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
              {/* Camera Controls */}
              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  variant={isCameraActive ? "destructive" : "default"}
                  onClick={handleCameraToggle}
                  disabled={cameraModelStatus === 'loading'}
                  className="min-w-[200px]"
                >
                  {cameraModelStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading Model...
                    </>
                  ) : isCameraActive ? (
                    <>
                      <CameraOff className="w-5 h-5 mr-2" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-2" />
                      {cameraModelStatus === 'idle' ? 'Start (Load Model)' : 'Start Camera'}
                    </>
                  )}
                </Button>

                {isCameraActive && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-success">Camera active</span>
                  </div>
                )}

                {isCameraActive && (
                  <div className={`p-3 rounded-lg bg-card/50 border ${
                    isFrameTooDark 
                      ? 'border-warning/50' 
                      : lastFacialEmotion 
                        ? 'border-success/30' 
                        : 'border-muted'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">Detected Emotion:</p>
                    {isFrameTooDark ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <p className="text-lg font-semibold text-warning">Camera blocked/too dark</p>
                      </div>
                    ) : lastFacialEmotion ? (
                      <p className="text-lg font-semibold text-success capitalize">{lastFacialEmotion}</p>
                    ) : (
                      <p className="text-lg font-semibold text-muted-foreground">No face detected</p>
                    )}
                  </div>
                )}

                {cameraModelStatus === 'ready' && (
                  <Badge variant="outline" className="text-success border-success/50 w-fit">
                    100% Offline
                  </Badge>
                )}
              </div>

              {/* Video Preview */}
              <div className="flex-1 min-w-[280px]">
                <div className="relative aspect-video bg-card/50 rounded-lg border border-border overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraActive ? '' : 'hidden'}`}
                  />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Camera Preview</p>
                        <p className="text-xs">Click "Start Camera" to begin</p>
                      </div>
                    </div>
                  )}
                  {isCameraActive && isCameraProcessing && (
                    <div className="absolute top-2 right-2 bg-background/80 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Analysis Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Emotional State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weighting info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-border">
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3" /> Voice: {Math.round(VOICE_WEIGHT * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Facial: {Math.round(FACIAL_WEIGHT * 100)}%
                </span>
              </div>
              
              {emotions.map((emotion) => (
                <div key={emotion.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{emotion.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        V:{emotion.voiceValue}% F:{emotion.facialValue}%
                      </span>
                      <span className="text-terminal font-semibold">{emotion.value}%</span>
                    </div>
                  </div>
                  {/* Stacked progress bar showing voice and facial contributions */}
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    {/* Voice contribution */}
                    <div 
                      className="absolute h-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${emotion.voiceValue * VOICE_WEIGHT}%` }}
                    />
                    {/* Facial contribution (offset by voice) */}
                    <div 
                      className="absolute h-full bg-success/70 transition-all duration-500"
                      style={{ 
                        left: `${emotion.voiceValue * VOICE_WEIGHT}%`,
                        width: `${emotion.facialValue * FACIAL_WEIGHT}%` 
                      }}
                    />
                    {/* Combined value indicator */}
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-foreground/50 transition-all duration-500"
                      style={{ left: `${emotion.value}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Combined Assessment</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {lastVoiceEmotion && lastFacialEmotion 
                    ? `Multimodal analysis active. Voice indicates ${lastVoiceEmotion}, facial expression shows ${lastFacialEmotion}. Combined emotional state weighted at ${Math.round(VOICE_WEIGHT * 100)}/${Math.round(FACIAL_WEIGHT * 100)} voice/facial ratio.`
                    : lastVoiceEmotion 
                      ? `Voice analysis active: ${lastVoiceEmotion} detected. Enable camera for multimodal analysis.`
                      : lastFacialEmotion
                        ? `Facial analysis active: ${lastFacialEmotion} detected. Record voice for multimodal analysis.`
                        : 'Activate voice recording or camera to begin multimodal emotion analysis.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detection Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Detection Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg bg-card/50 border ${isCameraActive ? 'border-success/50' : cameraModelStatus === 'ready' ? 'border-success/30' : 'border-muted/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Camera className={`w-4 h-4 ${isCameraActive ? 'text-success' : cameraModelStatus === 'ready' ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Facial Analysis</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-success' : 'bg-muted'} animate-pulse`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isCameraActive ? `Analyzing (${lastFacialEmotion || 'detecting...'})` : cameraModelStatus === 'ready' ? 'Ready (Offline)' : 'Click to activate'}
                </p>
              </div>

              <div className={`p-4 rounded-lg bg-card/50 border ${isRecording ? 'border-destructive/50' : modelStatus === 'ready' ? 'border-success/30' : 'border-muted/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className={`w-4 h-4 ${isRecording ? 'text-destructive' : modelStatus === 'ready' ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Voice Analysis</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-destructive' : modelStatus === 'ready' ? 'bg-success' : 'bg-muted'} animate-pulse`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRecording ? 'Recording active' : modelStatus === 'ready' ? 'Ready (Offline)' : 'Click to activate'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card/50 border border-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Neural Network</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${modelStatus === 'ready' ? 'bg-primary' : 'bg-muted'} animate-pulse`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {modelStatus === 'ready' ? 'Whisper + GoEmotions' : modelStatus === 'loading' ? 'Loading...' : 'Not loaded'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analysis Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent Analysis Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalysis.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-terminal text-sm font-mono">{item.time}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    <span className="text-foreground">{item.emotion}</span>
                  </div>
                  <span className="text-success text-sm">{item.confidence}% confidence</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmotionDetection;
