import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Link as LinkIcon, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusManifoldProps {
    tier: string;
    depositAmount: string;
    depositProgress: number;
    nextTierDeposit: string;
    referralCount: number;
    nextTierReferrals: number;
    networkProgress: number;
    totalBalance: number;
    onDeposit: () => void;
    onViewReferral: () => void;
}

const StatusManifold: React.FC<StatusManifoldProps> = ({
    tier,
    depositAmount,
    depositProgress,
    nextTierDeposit,
    referralCount,
    nextTierReferrals,
    networkProgress,
    totalBalance,
    onDeposit,
    onViewReferral
}) => {
    return (
        <div className="w-full glass-card rounded-none border-x-0 border-t-0 border-b border-white/10 p-6 mb-8 sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                {/* Left: Actions */}
                <div className="flex gap-4">
                    <Button
                        onClick={onDeposit}
                        className="bg-[#0052FF] hover:bg-[#0040DD] text-white font-bold tracking-wide px-6 shadow-[0_0_20px_rgba(0,82,255,0.3)] hover:shadow-[0_0_30px_rgba(0,82,255,0.5)] transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        DEPOSIT USDC
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onViewReferral}
                        className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        REFERRAL LINK
                    </Button>
                </div>

                {/* Center: Status Tubes */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">
                            <Shield className="w-3 h-3 mr-1" />
                            {tier.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-mono text-gray-500">SYSTEM STATUS: ONLINE</span>
                    </div>

                    {/* Tube 1: Deposit */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-blue-400">LIQUIDITY PRESSURE</span>
                            <span className="text-gray-400">${depositAmount} / ${nextTierDeposit}</span>
                        </div>
                        <div className="liquid-tube h-2">
                            <div
                                className="liquid-tube-fill bg-gradient-to-r from-blue-600 to-blue-400"
                                style={{ width: `${depositProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Tube 2: Network */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-cyan-400">SIGNAL STRENGTH</span>
                            <span className="text-gray-400">{referralCount} / {nextTierReferrals} REFS</span>
                        </div>
                        <div className="liquid-tube h-2">
                            <div
                                className="liquid-tube-fill bg-gradient-to-r from-cyan-600 to-cyan-400"
                                style={{ width: `${networkProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Balance */}
                <div className="text-right space-y-1">
                    <div className="text-sm font-mono text-gray-400">TOTAL BALANCE</div>
                    <div className="text-4xl font-bold tracking-tight text-white glow-text-blue">
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs text-gray-500 font-mono">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span>NET WORTH / TOTAL TVL</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StatusManifold;
