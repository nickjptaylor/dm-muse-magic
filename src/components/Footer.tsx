import tavernLogo from "@/assets/tavernrecap_logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-gold-subtle py-12 px-6">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src={tavernLogo} alt="TavernRecap" className="h-5 w-auto object-contain" />
          <span className="font-display text-sm text-foreground">TavernRecap</span>
        </div>
        <p className="text-muted-foreground text-sm">
          © 2026 TavernRecap. All rights reserved.
        </p>
        <a href="mailto:hey@tavernrecap.com" className="text-sm text-muted-foreground hover:text-gold transition-colors">
          Contact
        </a>
      </div>
    </footer>
  );
};

export default Footer;
