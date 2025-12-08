import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle, Clock, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const AlertsPanel = () => {
  const alerts = [
    { 
      id: 1,
      type: "warning", 
      title: "Elevated Stress Detected", 
      message: "Crew member showing elevated cortisol levels. Recommend scheduled break.",
      time: "2 min ago",
      status: "active"
    },
    { 
      id: 2,
      type: "info", 
      title: "Daily Check-in Reminder", 
      message: "Scheduled psychological wellness check due in 30 minutes.",
      time: "15 min ago",
      status: "pending"
    },
    { 
      id: 3,
      type: "success", 
      title: "Sleep Goal Achieved", 
      message: "Target of 7+ hours of quality sleep met for 5 consecutive days.",
      time: "1 hour ago",
      status: "resolved"
    },
    { 
      id: 4,
      type: "info", 
      title: "Hydration Reminder", 
      message: "Time for scheduled water intake - 250ml recommended.",
      time: "2 hours ago",
      status: "resolved"
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "error": return <XCircle className="w-5 h-5 text-destructive" />;
      case "success": return <CheckCircle className="w-5 h-5 text-success" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getAlertStyle = (type: string, status: string) => {
    // Only highlight active alerts, others get basic muted styling
    if (status !== "active") {
      return "border-muted/30 bg-muted/5 opacity-60";
    }
    
    switch (type) {
      case "warning": return "border-warning/30 bg-warning/5";
      case "error": return "border-destructive/30 bg-destructive/5";
      case "success": return "border-success/30 bg-success/5";
      default: return "border-primary/30 bg-primary/5";
    }
  };

  const stats = {
    active: alerts.filter(a => a.status === "active").length,
    pending: alerts.filter(a => a.status === "pending").length,
    resolved: alerts.filter(a => a.status === "resolved").length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-neon-cyan pulse-glow" />
            <div>
              <h1 className="text-4xl font-bold text-gradient-cosmic">Alerts & Notifications</h1>
              <p className="text-muted-foreground">Real-time health and system alerts</p>
            </div>
          </div>
          <Badge variant="secondary" className="aurora-border">
            <Shield className="w-3 h-3 mr-1" />
            Monitoring Active
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="holographic">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-3xl font-bold text-warning">{stats.active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning/50" />
            </CardContent>
          </Card>
          <Card className="holographic">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-primary">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-primary/50" />
            </CardContent>
          </Card>
          <Card className="holographic">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-3xl font-bold text-success">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/50" />
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="holographic neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neon-purple">
              <Bell className="w-5 h-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertStyle(alert.type, alert.status)} transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          alert.status === "active" 
                            ? "border-warning text-warning" 
                            : alert.status === "resolved"
                            ? "border-success text-success"
                            : "border-muted-foreground"
                        }`}
                      >
                        {alert.status}
                      </Badge>
                      {alert.status === "active" && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlertsPanel;
