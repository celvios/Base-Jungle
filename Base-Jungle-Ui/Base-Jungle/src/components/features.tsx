import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Vault, Gift, TrendingUp, Users2 } from "lucide-react";

const features = [
  {
    id: "master-vaults",
    icon: Vault,
    title: "Master Vaults",
    description: "Deposit assets into automated vaults that intelligently allocate funds across DEXs, lending protocols, and yield farms for optimal returns.",
    highlights: ["ERC-4626 Compliant", "Auto-Rebalancing", "Multi-Protocol"],
  },
  {
    id: "points-system",
    icon: Gift,
    title: "Points-Based Rewards",
    description: "Earn points for every action - deposits, yields, and swaps. Points convert to protocol tokens at TGE with additional multipliers for long-term stakers.",
    highlights: ["1 Point per $1 TVL/day", "2x Yield Multiplier", "Staking Boosts"],
  },
  {
    id: "automated-leverage",
    icon: TrendingUp,
    title: "Automated Leverage",
    description: "Our system intelligently borrows and compounds positions to amplify yields. Health factors are continuously monitored with automatic safety mechanisms.",
    highlights: ["Up to 5x Leverage", "Auto Safety", "Risk Management"],
  },
  {
    id: "referral-matrix",
    icon: Users2,
    title: "Referral Matrix",
    description: "Build your network and unlock higher leverage ratios plus point multipliers. Four tiers from Novice to Whale with increasing benefits at each level.",
    highlights: ["4 Tier System", "Social Rewards", "Unlock Leverage"],
  },
];

export function Features() {
  return (
    <section id="protocol" className="py-16 md:py-24 lg:py-32">
      <div className="w-full mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold" data-testid="text-features-title">
            Hammurabi Code of DAOs
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-features-description">
            Build high-level web3 products on different chains with our passive DeFi protocol
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.id}
                className="bg-card/50 backdrop-blur-md border-border/50 hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group"
                data-testid={`card-feature-${feature.id}`}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <CardTitle className="text-2xl" data-testid={`text-feature-title-${feature.id}`}>
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" data-testid={`text-feature-description-${feature.id}`}>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-accent/50 text-sm font-medium text-accent-foreground"
                        data-testid={`badge-highlight-${feature.id}-${idx}`}
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
