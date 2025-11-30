import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { StatsDisplay } from "@/components/stats-display";
import { Features } from "@/components/features";
import { ReferralTiers } from "@/components/referral-tiers";
import { Strategies } from "@/components/strategies";
import { TokenSale } from "@/components/token-sale";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <StatsDisplay />
      <Features />
      <ReferralTiers />
      <Strategies />
      <TokenSale />
      <Footer />
    </div>
  );
}
