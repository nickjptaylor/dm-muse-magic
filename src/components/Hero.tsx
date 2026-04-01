import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Adventurers gathered around a magical table"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-4xl mx-auto text-center px-6 py-32">
        <div className="animate-float inline-block mb-6">
          <span className="text-gold font-display text-sm tracking-[0.3em] uppercase border border-gold/30 px-4 py-2 rounded-full">
            Your Session Scribe Awaits
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-tight mb-6 text-gold-gradient">
          Every Epic Moment,
          <br />
          Chronicled Forever
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Automatically transcribe your Discord TTRPG sessions, generate character art, 
          and receive AI-powered summaries with key moments and DM insights.
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
