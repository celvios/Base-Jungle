import { Card } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { VaultStat } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap = {
  "trending-up": TrendingUp,
  "users": Users,
  "dollar-sign": DollarSign,
  "zap": Zap,
};

export function StatsDisplay() {
  const { data: stats, isLoading } = useQuery<VaultStat[]>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-12 w-12 rounded-md mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats?.map((stat) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap] || DollarSign;
            
            return (
              <Card
                key={stat.id}
                className="p-6 md:p-8 bg-card/50 backdrop-blur-md border-border/50 hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group"
                data-testid={`card-stat-${stat.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {stat.change && (
                    <span className="text-sm font-medium text-primary" data-testid={`text-change-${stat.id}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-bold font-mono" data-testid={`text-value-${stat.id}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider" data-testid={`text-label-${stat.id}`}>
                    {stat.label}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
