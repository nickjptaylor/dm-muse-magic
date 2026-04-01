import { LogOut, LayoutDashboard } from "lucide-react";
import tavernLogo from "@/assets/tavernrecap_logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gold-subtle bg-background/80 backdrop-blur-md">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <a href="/" className="flex items-center gap-2">
          <img src={tavernLogo} alt="TavernRecap" className="h-8 w-auto object-contain" />
          <span className="font-display text-lg text-foreground tracking-wide">TavernRecap</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-gold transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-gold transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-gold transition-colors">
            Pricing
          </a>
          {user ? (
            <>
              <a href="/dashboard" className="flex items-center gap-1.5 text-sm font-display text-gold hover:text-gold-light transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </a>
              <button
                onClick={signOut}
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
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
