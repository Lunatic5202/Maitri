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
import CrewWellnessChart from "./CrewWellnessChart";

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
          <Card className="cosmic-glow holographic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Crew</CardTitle>
              <User className="h-4 w-4 text-neon-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-cyan">6</div>
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

        {/* Crew Status Panel */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-neon-purple mb-6 text-center">Crew Status Matrix</h3>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-8">
            
            {/* Individual Astronaut Cards */}
            {[
              { name: "Anvesha", status: "Optimal", stress: 15, mood: "Focused" },
              { name: "Rajdeep Roy", status: "Good", stress: 28, mood: "Stable" },
              { name: "Sayak Majumdar", status: "Optimal", stress: 12, mood: "Positive" },
              { name: "Ishika Sarkar", status: "Alert", stress: 35, mood: "Concerned" },
              { name: "Satyansh Dubey", status: "Good", stress: 22, mood: "Calm" },
              { name: "Sanchayan Adhya", status: "Optimal", stress: 18, mood: "Content" }
            ].map((crew) => (
              <Card key={crew.name} className="neon-glow scan-lines">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-terminal">{crew.name}</CardTitle>
                    <Badge variant={crew.status === "Optimal" ? "success" : crew.status === "Good" ? "default" : "warning"} className="text-xs">
                      {crew.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Stress Level</span>
                    <span className={crew.stress > 30 ? "text-warning" : "text-success"}>{crew.stress}%</span>
                  </div>
                  <Progress value={crew.stress} className="h-1" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current Mood</span>
                    <span className="text-neon-cyan">{crew.mood}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
          </div>

          {/* Wellness Trend Charts */}
          <h4 className="text-xl font-semibold text-center mb-6 text-gradient-aurora">Individual Wellness Trends</h4>
          <div className="grid lg:grid-cols-2 gap-6">
            <CrewWellnessChart crewName="Anvesha" />
            <CrewWellnessChart crewName="Rajdeep Roy" />
            <CrewWellnessChart crewName="Sayak Majumdar" />
            <CrewWellnessChart crewName="Ishika Sarkar" />
            <CrewWellnessChart crewName="Satyansh Dubey" />
            <CrewWellnessChart crewName="Sanchayan Adhya" />
          </div>
        </div>


      </div>
    </section>
  );
};

export default Dashboard;