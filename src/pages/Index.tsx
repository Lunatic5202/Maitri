import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import AICompanion from "@/components/AICompanion";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <section id="home">
          <HeroSection />
        </section>
        <section id="dashboard">
          <Dashboard />
        </section>
        <section id="ai-companion">
          <AICompanion />
        </section>
      </main>
    </div>
  );
};

export default Index;
