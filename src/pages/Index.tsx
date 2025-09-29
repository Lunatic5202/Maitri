import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import AICompanion from "@/components/AICompanion";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <Dashboard />
        <AICompanion />
      </main>
    </div>
  );
};

export default Index;
