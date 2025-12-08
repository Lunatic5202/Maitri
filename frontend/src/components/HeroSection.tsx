import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-space-station.jpg";
import maitriAvatar from "@/assets/maitri-logo.jpg";
import { Heart, Shield, Brain, Satellite, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigation } from "@/pages/Index";

const HeroSection = () => {
  const [isLaunching, setIsLaunching] = useState(false);
  const { navigateTo } = useNavigation();

  const handleLaunchDashboard = () => {
    setIsLaunching(true);
    
    // Futuristic loading delay then navigate
    setTimeout(() => {
      navigateTo("dashboard");
      setIsLaunching(false);
    }, 1500);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="aurora-border text-sm font-medium">
                <Satellite className="w-4 h-4 mr-2" />
                ISRO Initiative
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-gradient-cosmic">MAITRI</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                An AI Assistant for Psychological & Physical Well-Being of Astronauts
              </p>
              
              <p className="text-lg text-foreground/80 max-w-2xl">
                Advanced multimodal AI system designed to monitor crew members' emotional and physical health aboard space stations, providing psychological companionship and early intervention for optimal mission success.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 rounded-lg holographic neon-glow">
                <Brain className="w-8 h-8 text-neon-cyan pulse-glow" />
                <div>
                  <h3 className="font-semibold text-neon-purple">Neural Analysis</h3>
                  <p className="text-sm text-terminal">Audio-Visual Processing</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg holographic neon-glow">
                <Heart className="w-8 h-8 text-neon-cyan pulse-glow" />
                <div>
                  <h3 className="font-semibold text-neon-purple">Biometric Monitor</h3>
                  <p className="text-sm text-terminal">Real-time Vitals</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg holographic neon-glow">
                <Shield className="w-8 h-8 text-neon-cyan pulse-glow" />
                <div>
                  <h3 className="font-semibold text-neon-purple">Auto-Intervention</h3>
                  <p className="text-sm text-terminal">AI Prevention System</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg holographic neon-glow">
                <Satellite className="w-8 h-8 text-neon-cyan pulse-glow" />
                <div>
                  <h3 className="font-semibold text-neon-purple">Ground Link</h3>
                  <p className="text-sm text-terminal">Critical Data Stream</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="cosmic" 
                size="xl" 
                className="float-subtle relative overflow-hidden"
                onClick={handleLaunchDashboard}
                disabled={isLaunching}
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="text-terminal">Initializing Systems...</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[slide-in-right_1s_ease-in-out_infinite]" />
                  </>
                ) : (
                  "Launch Dashboard"
                )}
              </Button>
              <Button variant="aurora" size="xl">
                View Documentation
              </Button>
            </div>
          </div>

          {/* Right Column - AI Avatar */}
          <div className="relative flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-holographic rounded-full blur-xl opacity-40 scale-110 pulse-glow" />
              <img
                src={maitriAvatar}
                alt="MAITRI AI Assistant"
                className="relative w-80 h-80 object-cover rounded-full border-4 border-neon-cyan neon-glow float-subtle scan-lines"
              />
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="text-sm font-medium neon-glow terminal-style">
                  <span className="text-terminal">[AI_STATUS: ONLINE]</span>
                </Badge>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default HeroSection;