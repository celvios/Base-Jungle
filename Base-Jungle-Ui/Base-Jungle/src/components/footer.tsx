import { Github, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  protocol: [
    { label: "About", href: "#about" },
    { label: "Vaults", href: "#vaults" },
    { label: "Protocol", href: "#protocol" },
    { label: "Governance", href: "#governance" },
  ],
  resources: [
    { label: "Docs & Security", href: "#" },
    { label: "Brand", href: "#" },
    { label: "Roadmap", href: "#" },
    { label: "Analytics", href: "#" },
    { label: "Explorer", href: "#" },
  ],
  resources2: [
    { label: "Resources", href: "#" },
    { label: "Terms of use", href: "#" },
    { label: "Privacy policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-md" data-testid="footer-logo-icon" />
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

          <div className="lg:col-span-3">
            <h3 className="font-semibold mb-4" data-testid="text-footer-resources2-title">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources2.map((link) => (
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
