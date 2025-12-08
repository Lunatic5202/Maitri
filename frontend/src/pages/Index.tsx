import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import EmotionDetection from "@/components/EmotionDetection";
import WellbeingMonitor from "@/components/WellbeingMonitor";
import AlertsPanel from "@/components/AlertsPanel";
import { useState, createContext, useContext } from "react";

type Section = "home" | "dashboard" | "emotion-detection" | "wellbeing" | "alerts";

interface NavigationContextType {
  currentSection: Section;
  navigateTo: (section: Section) => void;
  isTransitioning: boolean;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

const Index = () => {
  const [currentSection, setCurrentSection] = useState<Section>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = (section: Section) => {
    if (section === currentSection || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Start exit animation, then switch section
    setTimeout(() => {
      setCurrentSection(section);
      // Allow enter animation to complete
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }, 300);
  };

  const renderSection = () => {
    const baseClasses = "min-h-[calc(100vh-4rem)] transition-all duration-300 ease-out";
    const activeClasses = isTransitioning 
      ? "opacity-0 scale-[0.98] blur-sm" 
      : "opacity-100 scale-100 blur-0";

    switch (currentSection) {
      case "home":
        return (
          <section id="home" className={`${baseClasses} ${activeClasses}`}>
            <HeroSection />
          </section>
        );
      case "dashboard":
        return (
          <section id="dashboard" className={`${baseClasses} ${activeClasses}`}>
            <Dashboard />
          </section>
        );
      case "emotion-detection":
        return (
          <section id="emotion-detection" className={`${baseClasses} ${activeClasses}`}>
            <EmotionDetection />
          </section>
        );
      case "wellbeing":
        return (
          <section id="wellbeing" className={`${baseClasses} ${activeClasses}`}>
            <WellbeingMonitor />
          </section>
        );
      case "alerts":
        return (
          <section id="alerts" className={`${baseClasses} ${activeClasses}`}>
            <AlertsPanel />
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <NavigationContext.Provider value={{ currentSection, navigateTo, isTransitioning }}>
      <div className="h-screen overflow-hidden">
        <Navigation />
        <main className="h-[calc(100vh-4rem)] mt-16 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderSection()}
        </main>
      </div>
    </NavigationContext.Provider>
  );
};

export default Index;
