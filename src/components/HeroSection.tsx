import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-space-station.jpg";
import maitriAvatar from "@/assets/maitri-ai-avatar.jpg";
import { Heart, Shield, Brain, Satellite } from "lucide-react";

const HeroSection = () => {
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
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/50 cosmic-glow">
                <Brain className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Emotion Detection</h3>
                  <p className="text-sm text-muted-foreground">Audio-Visual Analysis</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/50 cosmic-glow">
                <Heart className="w-8 h-8 text-secondary" />
                <div>
                  <h3 className="font-semibold">Well-being Monitor</h3>
                  <p className="text-sm text-muted-foreground">Real-time Tracking</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/50 cosmic-glow">
                <Shield className="w-8 h-8 text-accent" />
                <div>
                  <h3 className="font-semibold">Early Intervention</h3>
                  <p className="text-sm text-muted-foreground">Prevention Focus</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/50 cosmic-glow">
                <Satellite className="w-8 h-8 text-success" />
                <div>
                  <h3 className="font-semibold">Ground Reports</h3>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="cosmic" size="xl" className="float-subtle">
                Launch Dashboard
              </Button>
              <Button variant="aurora" size="xl">
                View Documentation
              </Button>
            </div>
          </div>

          {/* Right Column - AI Avatar */}
          <div className="relative flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-cosmic rounded-full blur-xl opacity-30 scale-110 pulse-glow" />
              <img
                src={maitriAvatar}
                alt="MAITRI AI Assistant"
                className="relative w-80 h-80 object-cover rounded-full border-4 border-primary/30 cosmic-glow float-subtle"
              />
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="text-sm font-medium cosmic-glow">
                  AI Status: Active
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