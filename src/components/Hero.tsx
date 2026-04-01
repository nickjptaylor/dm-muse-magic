import heroAmbient from "@/assets/hero-ambient.jpg";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle background image with heavy overlay */}
      <div className="absolute inset-0">
        <img
          src={heroAmbient}
          alt=""
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold/30 animate-float-particle"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${10 + Math.random() * 80}%`,
              bottom: `${Math.random() * 40}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-3xl mx-auto text-center px-6 py-32">
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] mb-8 text-gold-gradient">
          Every Epic Moment,
          <br />
          Chronicled Forever
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
          Transcribe your TTRPG sessions, generate character art, and get AI-powered recaps — automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" className="text-base px-8 py-6">
            Start Your Chronicle
          </Button>
          <Button variant="heroOutline" size="lg" className="text-base px-8 py-6">
            See How It Works
          </Button>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gold/10 blur-[100px] rounded-full animate-glow-pulse" />
    </section>
  );
};

export default Hero;
