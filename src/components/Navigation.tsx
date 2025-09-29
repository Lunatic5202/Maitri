import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, MessageCircle, BarChart3, AlertTriangle, Settings } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-gradient-cosmic">MAITRI</div>
            <Badge variant="secondary" className="text-xs">
              v1.0 Beta
            </Badge>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Emotion Detection</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>AI Companion</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Well-being</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Alerts</span>
            </Button>
          </div>

          {/* Status & Settings */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">System Operational</span>
            </div>
            
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navigation;