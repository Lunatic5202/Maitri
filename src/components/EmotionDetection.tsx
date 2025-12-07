import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Eye, Mic, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const EmotionDetection = () => {
  const emotions = [
    { name: "Calm", value: 72, color: "bg-success" },
    { name: "Focus", value: 85, color: "bg-primary" },
    { name: "Stress", value: 23, color: "bg-warning" },
    { name: "Fatigue", value: 31, color: "bg-destructive" },
  ];

  const recentAnalysis = [
    { time: "14:32", type: "Facial", emotion: "Neutral", confidence: 94 },
    { time: "14:28", type: "Voice", emotion: "Engaged", confidence: 87 },
    { time: "14:15", type: "Facial", emotion: "Focused", confidence: 91 },
    { time: "13:55", type: "Voice", emotion: "Calm", confidence: 89 },
  ];

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
          <Badge variant="secondary" className="aurora-border">
            <Activity className="w-3 h-3 mr-1" />
            Neural Processing Active
          </Badge>
        </div>

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
              <div className="p-4 rounded-lg bg-card/50 border border-success/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Facial Analysis</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">Processing 30 FPS</p>
              </div>

              <div className="p-4 rounded-lg bg-card/50 border border-success/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Voice Analysis</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">Real-time processing</p>
              </div>

              <div className="p-4 rounded-lg bg-card/50 border border-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Neural Network</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">Model v3.2 Active</p>
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
