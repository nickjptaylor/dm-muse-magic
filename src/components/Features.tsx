import { Mic, ScrollText, Paintbrush, Lightbulb } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Live Transcription",
    description: "Automatically transcribe your Discord sessions in real-time. Every word captured, every moment preserved.",
  },
  {
    icon: ScrollText,
    title: "Session Summaries",
    description: "After each session, receive a beautifully crafted summary highlighting key moments, decisions, and epic encounters.",
  },
  {
    icon: Paintbrush,
    title: "Character Portraits",
    description: "Upload character references and watch as AI generates stunning portraits that evolve with your story.",
  },
  {
    icon: Lightbulb,
    title: "DM Insights",
    description: "Get personalized tips and tricks to elevate your storytelling, pacing, and player engagement.",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <div className="relative container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-gold-gradient mb-4">
            Forged in Magic
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every tool a Dungeon Master needs to chronicle their greatest campaigns.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-lg border border-gold-subtle p-8 bg-card hover:bg-card-hover transition-all duration-500"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:glow-gold transition-all duration-500">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
