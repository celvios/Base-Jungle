import { Button } from "@/components/ui/button";
import { Menu, X, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/contexts/theme-context";
import { WalletProfile } from "@/components/wallet-profile";
import { useModal } from "@/contexts/modal-context";
import { useWallet } from "@/contexts/wallet-context";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { openModal } = useModal();
  const { isConnected } = useWallet();
  const [location] = useLocation();

  const navLinks = [
    { label: "Home", href: "/", type: "link" as const },
    { label: "Dashboard", href: "/dashboard", type: "link" as const },
    { label: "Whitepaper", href: "/whitepaper", type: "link" as const },
    { label: "Governance", href: "/governance", type: "link" as const },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-background/70 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-md animate-pulse-slow" data-testid="logo-icon" />
          <span className="text-xl font-bold tracking-tight" data-testid="text-logo">
            Base Jungle
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) =>
            link.type === "link" ? (
              <Link key={link.label} href={link.href}>
                <span
                  className="px-4 py-2 text-sm font-medium text-muted-foreground bg-gradient-to-r from-blue-500/10 to-blue-400/5 dark:from-blue-500/15 dark:to-blue-400/10 backdrop-blur-md border border-blue-500/30 dark:border-blue-400/20 rounded-full hover-elevate transition-all duration-200 cursor-pointer inline-block"
                  data-testid={`link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </span>
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-gradient-to-r from-blue-500/10 to-blue-400/5 dark:from-blue-500/15 dark:to-blue-400/10 backdrop-blur-md border border-blue-500/30 dark:border-blue-400/20 rounded-full hover-elevate transition-all duration-200"
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <div className="flex items-center gap-2">
            {/* Show deposit button only on dashboard when connected */}
            {location === '/dashboard' && isConnected && (
              <button
                onClick={() => openModal('deposit')}
                className="px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xs md:text-sm font-semibold rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105 flex items-center gap-1 md:gap-2"
                data-testid="button-deposit"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Deposit</span>
              </button>
            )}
            <div className="hidden md:block">
              <WalletProfile />
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card/60 backdrop-blur-2xl border-b border-border/40" data-testid="mobile-menu">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
            {navLinks.map((link) =>
              link.type === "link" ? (
                <Link key={link.label} href={link.href}>
                  <span
                    className="block px-4 py-3 text-sm font-medium rounded-lg hover-elevate cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-4 py-3 text-sm font-medium rounded-lg hover-elevate"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="px-4 py-2">
              <WalletProfile />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
