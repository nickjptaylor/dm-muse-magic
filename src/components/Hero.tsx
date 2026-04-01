import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient background - no image */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-gold/3 blur-[120px] rounded-full" />

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
