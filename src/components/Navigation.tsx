import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, MessageCircle, BarChart3, AlertTriangle, Settings } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeProvider";

const Navigation = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const { theme, setTheme } = useTheme();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={() => scrollToSection('dashboard')}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={() => scrollToSection('dashboard')}
            >
              <Brain className="w-4 h-4" />
              <span>Emotion Detection</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={() => scrollToSection('ai-companion')}
            >
              <MessageCircle className="w-4 h-4" />
              <span>AI Companion</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={() => scrollToSection('dashboard')}
            >
              <Heart className="w-4 h-4" />
              <span>Well-being</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={() => scrollToSection('dashboard')}
            >
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
            
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>System Settings</SheetTitle>
                  <SheetDescription>
                    Configure MAITRI system preferences
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="flex flex-col gap-1">
                      <span>Notifications</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        Receive alerts and updates
                      </span>
                    </Label>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                      <span>Dark Mode</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        Use dark theme
                      </span>
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound" className="flex flex-col gap-1">
                      <span>Sound Effects</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        Enable audio feedback
                      </span>
                    </Label>
                    <Switch
                      id="sound"
                      checked={soundEffects}
                      onCheckedChange={setSoundEffects}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navigation;