import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import AICompanion from "@/components/AICompanion";

const Index = () => {
  return (
    <div className="h-screen overflow-hidden">
      <Navigation />
      <main className="h-[calc(100vh-4rem)] mt-16 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ overscrollBehavior: 'none' }} onWheel={(e) => e.preventDefault()}>
        <section id="home" className="min-h-[calc(100vh-4rem)]">
          <HeroSection />
        </section>
        <section id="dashboard" className="min-h-[calc(100vh-4rem)]">
          <Dashboard />
        </section>
        <section id="ai-companion" className="min-h-[calc(100vh-4rem)]">
          <AICompanion />
        </section>
      </main>
    </div>
  );
};

export default Index;
