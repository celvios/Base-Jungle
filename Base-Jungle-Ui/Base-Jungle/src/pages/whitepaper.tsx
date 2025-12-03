import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity } from 'lucide-react';
import ScrollSpyNav from '@/components/whitepaper/ScrollSpyNav';
import SearchBar from '@/components/whitepaper/SearchBar';
import TierMatrix from '@/components/whitepaper/TierMatrix';
import TokenomicsPie from '@/components/whitepaper/TokenomicsPie';
import GlossaryTooltip from '@/components/whitepaper/GlossaryTooltip';
import MobileNavFab from '@/components/whitepaper/MobileNavFab';
import RoadmapTimeline from '@/components/whitepaper/RoadmapTimeline';
import ArchitectureStack from '@/components/whitepaper/ArchitectureStack';
import CodeBlockViewer from '@/components/whitepaper/CodeBlockViewer';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import BackToHome from '@/components/ui/BackToHome';

const WhitepaperPage: React.FC = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white font-sans">
                <BackToHome />
                <div className="flex w-full">
                    <aside className="hidden lg:block w-64 p-8 border-r border-gray-900">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-8" />
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    </aside>
                    <main className="flex-1 p-8 lg:p-12 space-y-8">
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-6 w-2/3" />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <BackToHome />
            <MobileNavFab />
            <div className="flex w-full">
                {/* Left Sidebar - Navigation */}
                <aside className="hidden lg:block w-64 p-8 border-r border-gray-900">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-2">The Archives</h2>
                        <p className="text-xs text-gray-500 font-mono">WHITEPAPER v1.0</p>
                    </div>
                    <ScrollSpyNav />
                </aside>

                {/* Right Content Area */}
                <main className="flex-1 p-8 lg:p-12">
                    {/* Search Bar */}
                    <div className="mb-12">
                        <SearchBar />
                    </div>

                    {/* Content */}
                    <article className="w-full max-w-none space-y-16">

                        {/* Executive Summary */}
                        <section id="executive-summary" className="scroll-mt-8">
                            <h1 className="text-4xl font-bold mb-6 font-mono">Executive Summary</h1>
                            <div className="space-y-4 text-gray-300 leading-relaxed">
                                <p>
                                    Base Jungle is an automated DeFi yield optimization protocol built on Base L2. It combines
                                    institutional-grade risk management with retail accessibility, enabling users to earn sustainable
                                    yields through diversified strategies across multiple protocols.
                                </p>
                                <p>
                                    Our protocol employs <GlossaryTooltip term="Keeper Bots" definition="Automated scripts that execute time-sensitive operations like harvesting rewards and rebalancing positions.">keeper-based automation</GlossaryTooltip> to
                                    maximize capital efficiency while minimizing gas costs. Users deposit stablecoins (USDC) and
                                    receive vault tokens representing their share of the pool's <GlossaryTooltip term="TVL" definition="Total Value Locked - the total amount of assets deposited in the protocol.">TVL</GlossaryTooltip>.
                                </p>
                                <p className="text-blue-400 font-bold">
                                    Key Metrics: $10M+ TVL Target • 8-15% APY Range • 99.9% Uptime
                                </p>
                            </div>
                        </section>

                        {/* Position Tiers */}
                        <section id="position-tiers" className="scroll-mt-8">
                            <h2 className="text-3xl font-bold mb-6 font-mono">Position Tiers</h2>
                            <div className="space-y-6">
                                <p className="text-gray-300">
                                    Base Jungle operates on a tiered system that rewards larger deposits with enhanced benefits.
                                    Each tier unlocks progressively better fee structures, strategy access, and points multipliers.
                                </p>
                                <TierMatrix />
                                <div className="mt-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                                    <h4 className="text-sm font-bold text-blue-400 mb-2">Tier Progression</h4>
                                    <p className="text-sm text-gray-400">
                                        Users automatically upgrade to higher tiers as their deposit grows. Tier benefits apply
                                        immediately upon reaching the minimum threshold. Withdrawal fees decrease with tier level,
                                        incentivizing long-term capital commitment.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Technical Architecture */}
                        <section id="technical-architecture" className="scroll-mt-8">
                            <h2 className="text-3xl font-bold mb-6 font-mono">Technical Architecture</h2>
                            <div className="space-y-6">
                                <p className="text-gray-300">
                                    The protocol is built on a modular architecture with clear separation of concerns:
                                </p>

                                {/* Architecture Layers */}
                                <div className="space-y-3">
                                    <div className="p-4 bg-gray-900/50 border-l-4 border-blue-600 rounded">
                                        <h4 className="font-bold text-blue-400 mb-2">Layer 1: Vaults</h4>
                                        <p className="text-sm text-gray-400">
                                            <code className="text-blue-300">BaseVault.sol</code>, <code className="text-blue-300">ConservativeVault.sol</code>, <code className="text-blue-300">AggressiveVault.sol</code> -
                                            User-facing contracts that accept deposits and issue vault tokens.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-900/50 border-l-4 border-blue-500 rounded">
                                        <h4 className="font-bold text-blue-400 mb-2">Layer 2: Strategy Controller</h4>
                                        <p className="text-sm text-gray-400">
                                            <code className="text-blue-300">StrategyController.sol</code> - Orchestrates capital allocation across multiple strategies
                                            including <span className="text-blue-400">Delta Neutral Farming</span>, based on risk parameters and yield opportunities.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-900/50 border-l-4 border-blue-400 rounded">
                                        <h4 className="font-bold text-blue-400 mb-2">Layer 3: Protocol Adapters</h4>
                                        <p className="text-sm text-gray-400">
                                            <code className="text-blue-300">AaveAdapter.sol</code>, <code className="text-blue-300">AerodromeGaugeAdapter.sol</code>, <code className="text-blue-300">BeefyVaultAdapter.sol</code> -
                                            Standardized interfaces for interacting with external DeFi protocols.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-900/50 border-l-4 border-blue-300 rounded">
                                        <h4 className="font-bold text-blue-400 mb-2">Layer 4: Automation</h4>
                                        <p className="text-sm text-gray-400">
                                            <code className="text-blue-300">HarvestKeeper.ts</code>, <code className="text-blue-300">RebalanceKeeper.ts</code>, <code className="text-blue-300">HealthMonitor.ts</code> -
                                            Off-chain bots that execute time-sensitive operations.
                                        </p>
                                    </div>
                                </div>

                                {/* Code Example */}
                                <div className="mt-6 p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg font-mono text-sm overflow-x-auto">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                                        <span className="text-xs text-gray-500">BaseVault.sol</span>
                                        <button className="text-xs text-blue-500 hover:text-blue-400">Copy</button>
                                    </div>
                                    <pre className="text-gray-300">
                                        {`function deposit(uint256 amount) external {
    require(amount >= minDeposit, "Below minimum");
    
    // Transfer USDC from user
    IERC20(usdc).transferFrom(msg.sender, address(this), amount);
    
    // Calculate shares
    uint256 shares = (totalSupply() == 0) 
        ? amount 
        : (amount * totalSupply()) / totalAssets();
    
    // Mint vault tokens
    _mint(msg.sender, shares);
    
    emit Deposited(msg.sender, amount, shares);
}`}
                                    </pre>
                                </div>
                            </div>
                        </section>

                        {/* Tokenomics */}
                        <section id="tokenomics" className="scroll-mt-8">
                            <h2 className="text-3xl font-bold mb-6 font-mono">Tokenomics & TGE</h2>
                            <div className="space-y-6">
                                <p className="text-gray-300">
                                    The <span className="text-blue-400 font-bold">$JUNGLE</span> governance token has a fixed supply of 10,000,000 tokens.
                                    Distribution is designed to align incentives between users, team, and long-term protocol health.
                                </p>

                                <TokenomicsPie />

                                <div className="grid md:grid-cols-2 gap-4 mt-8">
                                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                                        <h4 className="text-sm font-bold text-blue-400 mb-2">Vesting Schedule</h4>
                                        <ul className="text-sm text-gray-400 space-y-1">
                                            <li>• Team: 2-year linear vest, 6-month cliff</li>
                                            <li>• Community: Distributed over 4 years</li>
                                            <li>• Liquidity: Locked for 1 year minimum</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                                        <h4 className="text-sm font-bold text-blue-400 mb-2">Token Utility</h4>
                                        <ul className="text-sm text-gray-400 space-y-1">
                                            <li>• Governance voting rights</li>
                                            <li>• Fee discounts (up to 50%)</li>
                                            <li>• Revenue share from protocol fees</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Security & Risk */}
                        <section id="security" className="scroll-mt-8">
                            <h2 className="text-3xl font-bold mb-6 font-mono">Security & Risk Management</h2>
                            <div className="space-y-6">
                                <p className="text-gray-300">
                                    Security is paramount. Base Jungle implements multiple layers of protection:
                                </p>

                                <div className="space-y-4">
                                    <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
                                        <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Smart Contract Security</h4>
                                        <ul className="text-sm text-gray-400 space-y-1">
                                            <li>• OpenZeppelin battle-tested libraries</li>
                                            <li>• Multi-sig treasury (3-of-5 Gnosis Safe)</li>
                                            <li>• Emergency pause functionality</li>
                                            <li>• Time-locked upgrades (48-hour delay)</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                                        <h4 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Oracle Risk Mitigation</h4>
                                        <p className="text-sm text-gray-400">
                                            We use dual oracle feeds (Chainlink + Pyth) with a 1% deviation threshold.
                                            If price feeds diverge beyond this limit, deposits and withdrawals are automatically paused.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                                        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Health Factor Monitoring</h4>
                                        <p className="text-sm text-gray-400">
                                            For leveraged positions, the <GlossaryTooltip term="Health Factor" definition="A safety metric calculated as (collateral value × liquidation threshold) / borrowed value. Below 1.0 triggers liquidation.">Health Factor</GlossaryTooltip> is
                                            monitored every block. Automatic rebalancing occurs at HF &lt; 1.4 to prevent liquidations.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Roadmap */}
                        <section id="roadmap" className="scroll-mt-8">
                            <h2 className="text-3xl font-bold mb-6 font-mono">Roadmap</h2>
                            <div className="space-y-8">
                                <RoadmapTimeline />
                            </div>
                        </section>

                    </article>
                </main>
            </div>
        </div >
    );
};

export default WhitepaperPage;
