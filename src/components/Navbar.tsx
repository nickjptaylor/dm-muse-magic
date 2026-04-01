import { useState } from "react";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import tavernLogo from "@/assets/tavernrecap_logo.png";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const authLinks = user ? (
    <>
      <a href="/dashboard" className="flex items-center gap-1.5 text-sm font-display text-gold hover:text-gold-light transition-colors">
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </a>
      <button
        onClick={() => { setOpen(false); signOut(); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </>
  ) : (
    <a href="/auth" className="text-sm font-display text-gold hover:text-gold-light transition-colors">
      Sign In
    </a>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gold-subtle bg-background/80 backdrop-blur-md">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <a href="/" className="flex items-center gap-2">
          <img src={tavernLogo} alt="TavernRecap" className="h-8 w-auto object-contain" />
          <span className="font-display text-lg text-foreground tracking-wide">TavernRecap</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-gold transition-colors">
              {l.label}
            </a>
          ))}
          {authLinks}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-muted-foreground hover:text-gold transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gold-subtle bg-background/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {l.label}
            </a>
          ))}
          {authLinks}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
