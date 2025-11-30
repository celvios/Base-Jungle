import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import type { TokenSaleData, StakingMultiplier } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center gap-4" data-testid="countdown-timer">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds },
      ].map((item, index) => (
        <div key={item.label}>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold font-mono text-primary" data-testid={`countdown-${item.label.toLowerCase()}`}>
                {String(item.value).padStart(2, "0")}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {item.label}
              </div>
            </div>
            {index < 3 && (
              <span className="text-3xl md:text-4xl font-bold text-muted-foreground">:</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TokenSale() {
  const { data: saleData, isLoading: saleLoading } = useQuery<TokenSaleData>({
    queryKey: ["/api/token-sale"],
  });

  const { data: multipliers, isLoading: multipliersLoading } = useQuery<StakingMultiplier[]>({
    queryKey: ["/api/staking-multipliers"],
  });

  if (saleLoading || multipliersLoading) {
    return (
      <section className="py-16 md:py-24 lg:py-32 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <Card className="p-8">
            <Skeleton className="h-12 w-64 mx-auto mb-8" />
            <Skeleton className="h-32 w-full mb-8" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-card/50">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <Card className="overflow-hidden border-primary/20 bg-card/50 backdrop-blur-md hover-elevate transition-all duration-300">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-3xl md:text-4xl" data-testid="text-token-sale-title">
              Token Sale Progress
            </CardTitle>
            <p className="text-muted-foreground" data-testid="text-token-sale-description">
              Invest in what you can trust - backed by real-world products
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Progress Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cap</span>
                  <span className="font-mono font-medium" data-testid="text-total-cap">
                    {saleData?.totalCap}
                  </span>
                </div>
                <Progress value={saleData?.progress || 0} className="h-3" data-testid="progress-token-sale" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Raised</span>
                  <span className="font-mono font-medium text-primary" data-testid="text-raised">
                    {saleData?.raised}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-accent/50 backdrop-blur-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Soft Cap
                  </p>
                  <p className="text-lg font-mono font-bold" data-testid="text-soft-cap">
                    {saleData?.softCap}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Hard Cap
                  </p>
                  <p className="text-lg font-mono font-bold" data-testid="text-hard-cap">
                    {saleData?.hardCap}
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground uppercase tracking-wider">
                Token sale ends in:
              </p>
              {saleData?.endsAt && <CountdownTimer targetDate={saleData.endsAt} />}
            </div>

            {/* Staking Multipliers Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center" data-testid="text-staking-title">
                Lock-up Multipliers
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Duration
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Multiplier
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Policy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {multipliers?.map((multiplier, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border last:border-0"
                        data-testid={`row-multiplier-${idx}`}
                      >
                        <td className="py-3 px-4 text-sm" data-testid={`text-duration-${idx}`}>
                          {multiplier.duration}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-primary" data-testid={`text-multiplier-${idx}`}>
                            {multiplier.multiplier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-muted-foreground" data-testid={`text-policy-${idx}`}>
                          {multiplier.withdrawalPolicy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full"
              data-testid="button-register-buy-token"
            >
              REGISTER & BUY TOKEN
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
