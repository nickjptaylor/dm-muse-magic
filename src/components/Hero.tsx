import heroAmbient from "@/assets/hero-ambient.jpg";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const embers: Ember[] = [];
    const EMBER_COUNT = 40;

    interface Ember {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      flickerSpeed: number;
      flickerPhase: number;
      life: number;
      maxLife: number;
      hue: number;
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnEmber = (): Ember => ({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * (0.6 + Math.random() * 0.4),
      size: 1.5 + Math.random() * 3,
      speedY: -(0.3 + Math.random() * 1.2),
      speedX: (Math.random() - 0.5) * 0.8,
      opacity: 0.4 + Math.random() * 0.6,
      flickerSpeed: 3 + Math.random() * 5,
      flickerPhase: Math.random() * Math.PI * 2,
      life: 0,
      maxLife: 120 + Math.random() * 180,
      hue: 30 + Math.random() * 20, // warm gold to orange
    });

    for (let i = 0; i < EMBER_COUNT; i++) {
      const ember = spawnEmber();
      ember.life = Math.random() * ember.maxLife;
      embers.push(ember);
    }

    let t = 0;
    const animate = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life++;
        e.x += e.speedX + Math.sin(t * 0.02 + e.flickerPhase) * 0.3;
        e.y += e.speedY;

        // Flicker
        const flicker = Math.sin(t * 0.1 * e.flickerSpeed + e.flickerPhase);
        const fadeIn = Math.min(e.life / 20, 1);
        const fadeOut = Math.max(1 - (e.life - e.maxLife * 0.7) / (e.maxLife * 0.3), 0);
        const alpha = e.opacity * (0.5 + flicker * 0.5) * fadeIn * fadeOut;

        if (e.life > e.maxLife) {
          embers[i] = spawnEmber();
          continue;
        }

        // Glow
        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 4);
        gradient.addColorStop(0, `hsla(${e.hue}, 80%, 60%, ${alpha})`);
        gradient.addColorStop(0.3, `hsla(${e.hue}, 70%, 50%, ${alpha * 0.4})`);
        gradient.addColorStop(1, `hsla(${e.hue}, 60%, 40%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${e.hue}, 90%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroAmbient}
          alt=""
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-70 animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>

      {/* Ember particles canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />

      {/* Content */}
      <div className="relative z-10 container max-w-3xl mx-auto text-center px-6 py-32">
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] mb-8 text-gold-gradient">
          Every Epic Moment,
          <br />
          Chronicled Forever
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
          Transcribe your TTRPG sessions, generate character art, and get AI-powered recaps, automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/auth?mode=signup")}>
            Start Your Chronicle
          </Button>
          <Button variant="heroOutline" size="lg" className="text-base px-8 py-6" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
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
