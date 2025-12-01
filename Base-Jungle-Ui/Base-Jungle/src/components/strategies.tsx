import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Strategy } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Layers, Sprout, ArrowRightLeft } from "lucide-react";

const iconMap = {
  "dollar-sign": DollarSign,
  "layers": Layers,
  "sprout": Sprout,
  "arrow-right-left": ArrowRightLeft,
};

const riskColorMap = {
  low: "text-green-500 bg-green-500/10",
  medium: "text-yellow-500 bg-yellow-500/10",
  high: "text-red-500 bg-red-500/10",
};

export function Strategies() {
  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-12 w-12 rounded-md mb-4" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-20 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="w-full mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold" data-testid="text-strategies-title">
            Basic smart contract factories and your capabilities
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-strategies-description">
            Automated strategies that work 24/7 to maximize your yields
          </p>
        </div>

        {/* Strategies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {strategies?.map((strategy) => {
            const Icon = iconMap[strategy.icon as keyof typeof iconMap] || DollarSign;

            return (
              <Card
                key={strategy.id}
                className="bg-card/50 backdrop-blur-md border-border/50 hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group"
                data-testid={`card-strategy-${strategy.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={riskColorMap[strategy.riskLevel]}
                      data-testid={`badge-risk-${strategy.id}`}
                    >
                      {strategy.riskLevel}
                    </Badge>
                  </div>

                  <CardTitle className="text-xl" data-testid={`text-strategy-title-${strategy.id}`}>
                    {strategy.name}
                  </CardTitle>

                  <CardDescription className="text-sm leading-relaxed" data-testid={`text-strategy-description-${strategy.id}`}>
                    {strategy.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-primary" data-testid={`text-apy-${strategy.id}`}>
                        {strategy.apyRange}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        APY
                      </span>
                    </div>

                    <div className="space-y-2">
                      {strategy.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2"
                          data-testid={`feature-${strategy.id}-${idx}`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
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
