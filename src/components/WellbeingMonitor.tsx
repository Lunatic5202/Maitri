import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, Moon, Droplets, Thermometer, Wind, TrendingUp, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WellbeingMonitor = () => {
  const vitals = [
    { name: "Heart Rate", value: 72, unit: "BPM", icon: Heart, status: "normal", range: "60-100" },
    { name: "Blood Oxygen", value: 98, unit: "%", icon: Wind, status: "normal", range: "95-100" },
    { name: "Body Temp", value: 36.8, unit: "°C", icon: Thermometer, status: "normal", range: "36.1-37.2" },
    { name: "Hydration", value: 82, unit: "%", icon: Droplets, status: "good", range: ">70%" },
  ];

  const sleepData = {
    lastNight: 7.2,
    quality: 85,
    deepSleep: 2.1,
    remSleep: 1.8,
  };

  const recommendations = [
    { priority: "low", text: "Consider a 10-minute meditation session during next break" },
    { priority: "medium", text: "Hydration levels dropping - recommend 500ml water intake" },
    { priority: "low", text: "Physical activity goal 80% complete - 15 min remaining" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Heart className="w-10 h-10 text-neon-cyan pulse-glow" />
            <div>
              <h1 className="text-4xl font-bold text-gradient-cosmic">Well-being Monitor</h1>
              <p className="text-muted-foreground">Comprehensive crew health tracking system</p>
            </div>
          </div>
          <Badge variant="secondary" className="aurora-border">
            <Activity className="w-3 h-3 mr-1" />
            All Systems Nominal
          </Badge>
        </div>

        {/* Vitals Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vitals.map((vital) => {
            const Icon = vital.icon;
            return (
              <Card key={vital.name} className="holographic neon-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-8 h-8 text-neon-cyan" />
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{vital.name}</p>
                    <p className="text-3xl font-bold text-foreground">
                      {vital.value}
                      <span className="text-lg text-muted-foreground ml-1">{vital.unit}</span>
                    </p>
                    <p className="text-xs text-terminal">Normal: {vital.range}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sleep Analysis */}
          <Card className="holographic neon-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-purple">
                <Moon className="w-5 h-5" />
                Sleep Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Night's Sleep</p>
                  <p className="text-4xl font-bold text-foreground">{sleepData.lastNight}<span className="text-lg text-muted-foreground ml-1">hrs</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Sleep Quality</p>
                  <p className="text-2xl font-bold text-success">{sleepData.quality}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deep Sleep</span>
                    <span className="text-terminal">{sleepData.deepSleep} hrs</span>
                  </div>
                  <Progress value={(sleepData.deepSleep / sleepData.lastNight) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">REM Sleep</span>
                    <span className="text-terminal">{sleepData.remSleep} hrs</span>
                  </div>
                  <Progress value={(sleepData.remSleep / sleepData.lastNight) * 100} className="h-2" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-card/50 border border-success/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Sleep Trend</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Sleep quality improved 12% over the past week. Circadian rhythm adjustment proceeding well.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="holographic neon-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-purple">
                <Clock className="w-5 h-5" />
                AI Health Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.priority === "high" 
                      ? "bg-destructive/10 border-destructive/30" 
                      : rec.priority === "medium"
                      ? "bg-warning/10 border-warning/30"
                      : "bg-card/50 border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        rec.priority === "high" 
                          ? "border-destructive text-destructive" 
                          : rec.priority === "medium"
                          ? "border-warning text-warning"
                          : "border-muted-foreground"
                      }`}
                    >
                      {rec.priority}
                    </Badge>
                    <p className="text-sm text-foreground">{rec.text}</p>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Overall Status:</span> Crew member is in excellent physical condition. 
                  All biomarkers within optimal range for extended space operations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WellbeingMonitor;
