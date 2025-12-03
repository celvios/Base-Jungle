import { Github, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  protocol: [
    { label: "Blueprints", href: "/blueprints" },
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "Strategies", href: "/strategies" },
  ],
  resources: [
    { label: "Analytics", href: "#analytics" },
    { label: "Security", href: "#security" },
  ],
  resources2: [],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="w-full mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Base Jungle Logo" className="w-8 h-8 object-contain" data-testid="footer-logo-icon" />
              <span className="text-xl font-bold tracking-tight" data-testid="text-footer-logo">
                Base Jungle
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm" data-testid="text-footer-description">
              Base Jungle - The first fully automated passive DeFi aggregation protocol on Base blockchain.
              Deposit once, earn continuously through intelligent yield strategies.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-footer-twitter"
              >
                <Twitter className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-footer-github"
              >
                <Github className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-footer-discord"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4" data-testid="text-footer-protocol-title">
              Base Jungle
            </h3>
            <ul className="space-y-3">
              {footerLinks.protocol.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/ /g, '-')}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-semibold mb-4" data-testid="text-footer-resources-title">
              Docs & Security
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/ /g, '-')}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>


        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
            © 2025 Base Jungle. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground" data-testid="text-footer-network">
            Built on <span className="text-primary font-medium">Base</span> blockchain
          </p>
        </div>
      </div>
    </footer>
  );
}
