import { Beer } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-gold-subtle py-12 px-6">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Beer className="w-5 h-5 text-gold" />
          <span className="font-display text-sm text-foreground">TavernRecap</span>
        </div>
        <p className="text-muted-foreground text-sm">
          © 2026 TavernRecap. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-gold transition-colors">Privacy</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-gold transition-colors">Terms</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-gold transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
