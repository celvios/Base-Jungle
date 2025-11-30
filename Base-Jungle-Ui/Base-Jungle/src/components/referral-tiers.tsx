import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ReferralTier } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";

export function ReferralTiers() {
  const { data: tiers, isLoading } = useQuery<ReferralTier[]>({
    queryKey: ["/api/referral-tiers"],
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 lg:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-6 w-24 mb-6" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold" data-testid="text-tiers-title">
            Referral Rewards Program
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-tiers-description">
            Earn bonus points and unlock exclusive benefits by inviting friends
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {tiers?.map((tier, index) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden bg-card/50 backdrop-blur-md border-border/50 hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group ${index === tiers.length - 1 ? 'border-primary' : ''
                }`}
              data-testid={`card-tier-${tier.id}`}
            >
              {index === tiers.length - 1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
              )}

              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={index === tiers.length - 1 ? "default" : "secondary"}
                    data-testid={`badge-tier-name-${tier.id}`}
                  >
                    {tier.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium" data-testid={`text-tier-requirement-${tier.id}`}>
                    {tier.requirement}
                  </span>
                </div>

                <CardTitle className="text-xl" data-testid={`text-tier-title-${tier.id}`}>
                  {tier.name} Tier
                </CardTitle>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Points
                    </p>
                    <p className="text-2xl font-bold font-mono text-primary" data-testid={`text-tier-multiplier-${tier.id}`}>
                      {tier.pointMultiplier}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Leverage
                    </p>
                    <p className="text-2xl font-bold font-mono text-primary" data-testid={`text-tier-leverage-${tier.id}`}>
                      {tier.maxLeverage}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {tier.benefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2"
                      data-testid={`benefit-${tier.id}-${idx}`}
                    >
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
