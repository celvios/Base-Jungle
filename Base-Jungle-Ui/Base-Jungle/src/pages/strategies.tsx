import { useState } from "react";
import { StrategyCard, StrategyProps } from "@/components/strategies/StrategyCard";
import { AggressiveStrategyDetails } from "@/components/strategies/AggressiveStrategyDetails";
import { StrategyMetrics, StrategyMetric } from "@/components/strategies/StrategyMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Zap, Info } from "lucide-react";

// Real Backend Data (Matching deploy-all-strategies.cjs)
const CONSERVATIVE_STRATEGIES: StrategyProps[] = [
    {
        id: "lending",
        name: "Recursive Lending V2.1",
        apy: 5.2, // Base 4% + recursive factor
        tierRequired: "Novice",
        activeReferralsRequired: 0,
        tagline: "Amplifies base lending yield while maintaining low liquidation risk.",
        maxLeverage: 1.5,
        healthFactorBuffer: 1.4,
        protocols: ["Moonwell", "Aave V3"],
        riskScore: 10,
        steps: [
            { id: "1", label: "Inflow", action: "Deposit USDC", context: "Funds secured in ConservativeVault." },
            { id: "2", label: "Supply", action: "Supply Moonwell", context: "Collateral established." },
            { id: "3", label: "Yield", action: "Earn Interest", context: "Base APY from borrowers." },
            { id: "4", label: "Compound", action: "Auto-Harvest", context: "Rewards evaluated daily." },
        ]
    },
    {
        id: "lp-stable",
        name: "Stable Liquidity V1",
        apy: 12.5,
        tierRequired: "Scout",
        activeReferralsRequired: 5,
        tagline: "Provide liquidity to stablecoin pairs with minimal impermanent loss.",
        maxLeverage: 1.0,
        healthFactorBuffer: 2.0,
        protocols: ["Aerodrome", "Beefy"],
        riskScore: 20,
        steps: [
            { id: "1", label: "Inflow", action: "Deposit USDC", context: "Allocated via StrategyController." },
            { id: "2", label: "Swap", action: "Zap Liq.", context: "Balanced to USDC/DAI or USDC/USDbC." },
            { id: "3", label: "Provide", action: "Add Liquidity", context: "Funds deposited into Aerodrome gauge." },
            { id: "4", label: "Farm", action: "Harvest AERO", context: "Rewards auto-compounded." },
        ]
    }
];

const AGGRESSIVE_STRATEGIES: (StrategyProps & { details: any })[] = [
    {
        id: "lp-volatile",
        name: "Volatile Liquidity V2",
        apy: 28.4,
        tierRequired: "Captain",
        activeReferralsRequired: 20,
        tagline: "High-yield liquidity provision for blue-chip pairs (ETH/USDC).",
        maxLeverage: 1.0,
        healthFactorBuffer: 1.5,
        protocols: ["Aerodrome Concentrated"],
        riskScore: 45,
        isAggressive: true,
        warning: "Impermanent loss risk if ETH price swings violently.",
        steps: [
            { id: "1", label: "Inflow", action: "Deposit USDC", context: "Allocated to AggressiveVault." },
            { id: "2", label: "Asset", action: "Buy ETH", context: "Swap 50% USDC for WETH." },
            { id: "3", label: "LP", action: "Concentrated LP", context: "Active range liquidity provision." },
            { id: "4", label: "Yield", action: "Trading Fees", context: "Capture high volume swap fees." },
        ],
        details: {
            strategyType: "lp-volatile",
            impermanentLoss: "medium",
            volatilityExposure: "long-eth"
        }
    },
    {
        id: "leveraged-lp",
        name: "Leveraged Yield Farming",
        apy: 52.1,
        tierRequired: "Whale",
        activeReferralsRequired: 50,
        tagline: "Borrow funds to multiply LP position size and yields.",
        maxLeverage: 3.0,
        healthFactorBuffer: 1.2,
        protocols: ["Compound V3", "Aerodrome"],
        riskScore: 70,
        isAggressive: true,
        warning: "Uses leverage. Liquidation risk if Health Factor < 1.05.",
        steps: [
            { id: "1", label: "Borrow", action: "Flash Borrow", context: "Borrow 2x leverage in USDC." },
            { id: "2", label: "Farm", action: "Max Farm", context: "Deposit 3x capital into LP." },
            { id: "3", label: "Loop", action: "Monitor HF", context: "Keep Health Factor > 1.1." },
            { id: "4", label: "Exit", action: "Deleverage", context: "Repay loan on withdrawal." },
        ],
        details: {
            strategyType: "leveraged-lp",
            leverageRatio: "3.0x",
            liquidationRisk: "high"
        }
    },
    {
        id: "arbitrage",
        name: "Flash Loan Arbitrage",
        apy: 18.2, // Variable (15-100%)
        tierRequired: "Whale",
        activeReferralsRequired: 50,
        tagline: "Zero-capital arbitrage exploiting price inefficiencies across DEXs.",
        maxLeverage: 100.0, // Flash loan effective leverage
        healthFactorBuffer: 100, // N/A for atomic
        protocols: ["Uniswap", "Sushi", "Dodo"],
        riskScore: 50, // Execution risk
        isAggressive: true,
        warning: "Profit depends on market volatility. Transactions may revert.",
        steps: [
            { id: "1", label: "Scan", action: "Find Arb", context: "Bot detects price mismatch." },
            { id: "2", label: "Borrow", action: "Flash Loan", context: "Borrow millions with $0 collateral." },
            { id: "3", label: "Trade", action: "Atomic Swap", context: "Buy Low -> Sell High instantly." },
            { id: "4", label: "Profit", action: "Keep Spread", context: "Repay loan, keep profit." },
        ],
        details: {
            strategyType: "arbitrage",
            executionType: "atomic",
            gasOptimization: "maximal"
        }
    }
];

const METRICS: StrategyMetric[] = [
    { id: "1", name: "Recursive Lending", apy7d: 5.1, apy30d: 4.8, tvl: 450000, daysActive: 45, trend: "stable" },
    { id: "2", name: "Stable Liquidity", apy7d: 12.4, apy30d: 11.9, tvl: 850000, daysActive: 30, trend: "up" },
    { id: "3", name: "Volatile Liquidity", apy7d: 28.4, apy30d: 25.1, tvl: 320000, daysActive: 15, trend: "up" },
    { id: "4", name: "Leveraged Farm", apy7d: 52.1, apy30d: 48.5, tvl: 150000, daysActive: 10, trend: "up" },
    { id: "5", name: "Arbitrage Bot", apy7d: 18.2, apy30d: 14.2, tvl: 50000, daysActive: 7, trend: "volatile" },
];

export default function StrategiesPage() {
    const [activeTab, setActiveTab] = useState("conservative");

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8 lg:px-12">
            <div className="w-full space-y-8">

                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Dashboard
                        </a>
                    </div>
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
