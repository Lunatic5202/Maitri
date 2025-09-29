import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Camera, 
  Mic,
  TrendingUp,
  User
} from "lucide-react";

const Dashboard = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gradient-aurora mb-4">
            Mission Control Dashboard
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time monitoring of astronaut psychological and physical well-being aboard Bhartiya Antariksh Station
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-12">
          
          {/* System Status */}
          <Card className="cosmic-glow medical-status">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Operational</div>
              <p className="text-xs text-muted-foreground">All systems nominal</p>
            </CardContent>
          </Card>

          {/* Active Crew */}
          <Card className="cosmic-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Crew</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Members monitored</p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="cosmic-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">1</div>
              <p className="text-xs text-muted-foreground">Minor sleep disruption</p>
            </CardContent>
          </Card>

          {/* AI Interactions */}
          <Card className="cosmic-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">Today's sessions</p>
            </CardContent>
          </Card>

        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Emotion Detection Panel */}
          <Card className="lg:col-span-2 cosmic-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <span>Emotion Detection System</span>
                  </CardTitle>
                  <CardDescription>Real-time audio-visual emotional analysis</CardDescription>
                </div>
                <Badge variant="success" className="pulse-glow">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Camera Feed Simulation */}
              <div className="relative bg-muted rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center space-y-4">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Camera Feed Active</p>
                    <p className="text-sm text-muted-foreground">Analyzing facial expressions</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant="default" className="text-xs">
                    <div className="w-2 h-2 rounded-full bg-success mr-1 animate-pulse" />
                    Recording
                  </Badge>
                </div>
              </div>

              {/* Current Emotion Analysis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Happiness</span>
                    <span className="text-success">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stress Level</span>
                    <span className="text-warning">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Focus</span>
                    <span className="text-primary">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fatigue</span>
                    <span className="text-secondary">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="medical" size="sm">
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Analysis
                </Button>
                <Button variant="aurora" size="sm">
                  Generate Report
                </Button>
              </div>
              
            </CardContent>
          </Card>

          {/* Well-being Panel */}
          <Card className="cosmic-glow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-secondary" />
                <span>Well-being Monitor</span>
              </CardTitle>
              <CardDescription>Physical & mental health tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Health Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sleep Quality</span>
                  <Badge variant="warning">Disrupted</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Psychological State</span>
                  <Badge variant="success">Stable</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Social Interaction</span>
                  <Badge variant="default">Adequate</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Work Performance</span>
                  <Badge variant="success">Optimal</Badge>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
                <h4 className="font-semibold text-sm mb-2 text-accent">AI Recommendations</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Schedule 15-min relaxation session</li>
                  <li>• Adjust lighting for better sleep</li>
                  <li>• Increase team communication</li>
                </ul>
              </div>

              <Button variant="cosmic" className="w-full">
                Start AI Companion Session
              </Button>
              
            </CardContent>
          </Card>

        </div>

      </div>
    </section>
  );
};

export default Dashboard;