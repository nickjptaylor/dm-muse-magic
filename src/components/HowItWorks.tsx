import { MessageSquare, Bot, ScrollText, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Bot,
    step: "01",
    title: "Invite the Bot",
    description:
      "Add TavernRecap to your Discord server with a single click. It joins your voice channel ready to listen.",
  },
  {
    icon: MessageSquare,
    step: "02",
    title: "Play Your Session",
    description:
      "Run your game as normal. TavernRecap silently transcribes everything — dialogue, combat calls, and roleplay moments.",
  },
  {
    icon: ScrollText,
    step: "03",
    title: "Get Your Summary",
    description:
      "After the session, receive a polished summary with key moments, funny quotes, and narrative highlights.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Portraits & DM Tips",
    description:
      "Character portraits are generated from your references, and DMs get tailored tips to level up their game.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-gold-gradient mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From voice channel to chronicle in four simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-24 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gradient-to-r from-gold/0 via-gold/30 to-gold/0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
            {steps.map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center group">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border border-gold/30 bg-card flex items-center justify-center group-hover:border-gold/60 group-hover:glow-gold transition-all duration-300">
                    <step.icon className="w-7 h-7 text-gold" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-display text-gold bg-background border border-gold/30 rounded-full w-6 h-6 flex items-center justify-center">
                    {step.step}
                  </span>
                </div>

                {/* Text */}
                <h3 className="font-display text-lg text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
