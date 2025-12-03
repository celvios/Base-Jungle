import { useState } from "react";
import { StrategyCard, StrategyProps } from "@/components/strategies/StrategyCard";
import { AggressiveStrategyDetails } from "@/components/strategies/AggressiveStrategyDetails";
import { StrategyMetrics, StrategyMetric } from "@/components/strategies/StrategyMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Zap, Info } from "lucide-react";

// Mock Data - In a real app, this would come from an API
const CONSERVATIVE_STRATEGIES: StrategyProps[] = [
    {
        id: "recursive-lending",
        name: "Recursive Lending V2.1",
        apy: 14.5,
        tierRequired: "Scout",
        activeReferralsRequired: 5,
        tagline: "Amplifies base lending yield while maintaining low liquidation risk.",
        maxLeverage: 2.0,
        healthFactorBuffer: 1.4,
        protocols: ["Aave V3", "Chainlink"],
        steps: [
            { id: "1", label: "Inflow", action: "Deposit USDC", context: "Funds are secured in the BaseVault.sol contract." },
            { id: "2", label: "Supply", action: "Supply USDC to Aave", context: "Collateral is established. Health Factor is calculated." },
            { id: "3", label: "Borrow", action: "Borrow DAI", context: "Borrow limit is strictly capped to prevent HF < 1.4." },
            { id: "4", label: "Loop (xN)", action: "Re-Supply DAI", context: "The automated recursive loop runs multiple times." },
            { id: "5", label: "Exit", action: "Auto-Harvest", context: "Keeper Bots perform batch harvesting to minimize gas." },
        ]
    },
    {
        id: "stable-lp",
        name: "Stable Liquidity V1",
        apy: 8.2,
        tierRequired: "Novice",
        activeReferralsRequired: 0,
        tagline: "Provide liquidity to stablecoin pairs with minimal impermanent loss.",
        maxLeverage: 1.0,
        healthFactorBuffer: 2.0,
        protocols: ["Aerodrome", "Beefy"],
        steps: [
            { id: "1", label: "Inflow", action: "Deposit USDC", context: "Funds are secured in the BaseVault.sol contract." },
            { id: "2", label: "Swap", action: "Swap 50% to DAI", context: "Optimized swap via 1inch aggregator." },
            { id: "3", label: "Provide", action: "Add Liquidity", context: "Funds deposited into Aerodrome USDC-DAI pool." },
            { id: "4", label: "Stake", action: "Stake LP Tokens", context: "LP tokens staked in Beefy for auto-compounding." },
        ]
    }
];

const AGGRESSIVE_STRATEGIES: (StrategyProps & { details: any })[] = [
    {
        id: "delta-neutral",
        name: "Delta-Neutral Farm",
        apy: 42.0,
        tierRequired: "Whale",
        activeReferralsRequired: 50,
        tagline: "Hedged farming strategy capturing high yields with neutralized exposure.",
        maxLeverage: 5.0,
        healthFactorBuffer: 1.1,
        protocols: ["Aave V3", "Uniswap V3", "GMX"],
        isAggressive: true,
        warning: "This strategy uses borrowed funds. High volatility could trigger liquidation.",
        steps: [
            { id: "1", label: "Inflow", action: "Deposit USDC", context: "Funds are secured in the BaseVault.sol contract." },
            { id: "2", label: "Flash", action: "Flash Loan ETH", context: "Borrow ETH to establish position atomically." },
            { id: "3", label: "Long", action: "Buy Spot ETH", context: "Acquire underlying asset." },
            { id: "4", label: "Short", action: "Short ETH Perp", context: "Open 1x short to neutralize delta." },
            { id: "5", label: "Farm", action: "Collect Yield", context: "Earn funding rates + LP fees." },
        ],
        details: {
            strategyType: "delta-neutral",
            flashLoanProvider: "Aave V3",
            hedgingAsset: "ETH",
            fundingRateRisk: "medium",
            impermanentLoss: "hedged"
        }
    }
];

const METRICS: StrategyMetric[] = [
    { id: "1", name: "Recursive Lending V2.1", apy7d: 14.2, apy30d: 13.8, tvl: 1250000, daysActive: 45, trend: "up" },
    { id: "2", name: "Stable Liquidity V1", apy7d: 8.1, apy30d: 8.3, tvl: 850000, daysActive: 120, trend: "flat" },
    { id: "3", name: "Delta-Neutral Farm", apy7d: 41.5, apy30d: 38.2, tvl: 450000, daysActive: 15, trend: "up" },
];

export default function StrategiesPage() {
    const [activeTab, setActiveTab] = useState("conservative");

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8 lg:px-12">
            <div className="w-full space-y-8">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
                        Strategy Vaults
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        Engineering schematics and detailed readouts for every active strategy.
                        Understand the mechanics, risks, and flows of your capital.
                    </p>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="conservative" className="space-y-8" onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between">
                        <TabsList className="bg-black/20 border border-white/10 p-1">
                            <TabsTrigger value="conservative" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                                <Shield className="w-4 h-4 mr-2" />
                                Conservative Protocols
                            </TabsTrigger>
                            <TabsTrigger value="aggressive" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                                <Zap className="w-4 h-4 mr-2" />
                                Aggressive Protocols
                            </TabsTrigger>
                        </TabsList>

                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="w-4 h-4" />
                            <span>Hover over technical terms for holographic tooltips</span>
                        </div>
                    </div>

                    <TabsContent value="conservative" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {CONSERVATIVE_STRATEGIES.map(strategy => (
                                <StrategyCard key={strategy.id} {...strategy} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="aggressive" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {AGGRESSIVE_STRATEGIES.map(strategy => (
                                <div key={strategy.id} className="flex flex-col h-full">
                                    <StrategyCard {...strategy}>
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <AggressiveStrategyDetails {...strategy.details} />
                                        </div>
                                    </StrategyCard>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Global Metrics */}
                <div className="pt-8 border-t border-white/5">
                    <StrategyMetrics metrics={METRICS} />
                </div>

                {/* Glossary Hint */}
                <div className="text-center text-xs text-muted-foreground/50 pt-8">
                    <p>Data sourced from Chainlink & Pyth Oracles. Updates every block.</p>
                </div>
            </div>
        </div>
    );
}
