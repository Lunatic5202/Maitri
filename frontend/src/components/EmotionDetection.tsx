import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Brain, Eye, Mic, Activity, TrendingUp, AlertCircle, MicOff, Loader2, Download, Camera, CameraOff, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AudioRecorder, audioToFloat32Array } from "@/utils/AudioRecorder";
import { localAI, EmotionResult } from "@/utils/LocalAIModels";
import { facialAI, FacialEmotionResult } from "@/utils/FacialEmotionDetector";
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
  type: "Facial" | "Voice";
  emotion: string;
  confidence: number;
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  
  const [emotions, setEmotions] = useState([
    { name: "Calm", value: 72, color: "bg-success" },
    { name: "Focus", value: 85, color: "bg-primary" },
    { name: "Stress", value: 23, color: "bg-warning" },
    { name: "Fatigue", value: 31, color: "bg-destructive" },
  ]);

  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisEntry[]>([
    { time: "14:32", type: "Facial", emotion: "Neutral", confidence: 94 },
    { time: "14:28", type: "Voice", emotion: "Engaged", confidence: 87 },
    { time: "14:15", type: "Facial", emotion: "Focused", confidence: 91 },
    { time: "13:55", type: "Voice", emotion: "Calm", confidence: 89 },
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

  const updateEmotionsFromResults = (results: EmotionResult[] | FacialEmotionResult[]) => {
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

    setEmotions(prev => prev.map(emotion => {
      const scores = categoryScores[emotion.name];
      if (scores.length > 0) {
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return { ...emotion, value: avgScore };
      }
      // Decay existing values slightly if no new data
      return { ...emotion, value: Math.max(10, emotion.value - 5) };
    }));
  };

  const updateEmotionsFromFacialResults = (results: FacialEmotionResult[]) => {
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

    setEmotions(prev => prev.map(emotion => {
      const scores = categoryScores[emotion.name];
      if (scores.length > 0) {
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return { ...emotion, value: Math.min(100, Math.max(0, avgScore)) };
      }
      return emotion;
    }));
  };

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
      const results = await facialAI.classifyFrame(videoRef.current);
      
      if (results.length > 0) {
        const topEmotion = results[0];
        setLastFacialEmotion(topEmotion.emotion);
        updateEmotionsFromFacialResults(results);
        
        // Add to analysis log periodically (not every frame)
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        setRecentAnalysis(prev => {
          // Only add if different from last facial entry or if enough time passed
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
      }
    } catch (error) {
      console.error('Frame analysis error:', error);
    } finally {
      setIsCameraProcessing(false);
    }
  }, [isCameraProcessing]);

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
        
        // Update emotion display
        updateEmotionsFromResults(emotionResults);

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
        toast.success(`Detected: ${topEmotion.emotion} (${topEmotion.confidence}%)`);

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
            <Brain className="w-10 h-10 text-neon-cyan pulse-glow" />
            <div>
              <h1 className="text-4xl font-bold text-gradient-cosmic">Emotion Detection System</h1>
              <p className="text-muted-foreground">Real-time multimodal emotional state analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="aurora-border">
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
        <Card className="holographic neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neon-purple">
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
        <Card className="holographic neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neon-purple">
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

                {lastFacialEmotion && (
                  <div className="p-3 rounded-lg bg-card/50 border border-success/30">
                    <p className="text-xs text-muted-foreground mb-1">Detected Emotion:</p>
                    <p className="text-lg font-semibold text-success capitalize">{lastFacialEmotion}</p>
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
          <Card className="lg:col-span-2 holographic neon-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-purple">
                <Eye className="w-5 h-5" />
                Live Emotional State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {emotions.map((emotion) => (
                <div key={emotion.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{emotion.name}</span>
                    <span className="text-terminal">{emotion.value}%</span>
                  </div>
                  <Progress value={emotion.value} className="h-2" />
                </div>
              ))}
              
              <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Current Assessment</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Crew member displaying optimal cognitive focus with low stress indicators. 
                  Emotional stability within normal mission parameters.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detection Sources */}
          <Card className="holographic neon-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-purple">
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
        <Card className="holographic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neon-purple">
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
