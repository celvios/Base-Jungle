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
    <div className="w-full glass-card rounded-none border-x-0 border-t-0 border-b border-white/10 p-4 mb-6 sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

        {/* Left: Actions (Spans 3 cols) */}
        <div className="lg:col-span-3 flex gap-3">
          <Button
            onClick={onDeposit}
            className="bg-[#0052FF] hover:bg-[#0040DD] text-white font-bold tracking-wide px-6 shadow-[0_0_20px_rgba(0,82,255,0.3)] hover:shadow-[0_0_30px_rgba(0,82,255,0.5)] transition-all flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            DEPOSIT
          </Button>
          <Button
            variant="outline"
            onClick={onViewReferral}
            className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white px-3"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Center: Status Tubes (Spans 6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3 px-4 border-x border-white/5">
          <div className="flex items-center justify-center mb-1 gap-4">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-0.5 text-[10px] tracking-widest">
              <Shield className="w-3 h-3 mr-1" />
              {tier.toUpperCase()}
            </Badge>
            <span className="text-[10px] font-mono text-gray-600 tracking-widest">SYSTEM STATUS: ONLINE</span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Tube 1: Deposit */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono tracking-wider">
                <span className="text-blue-400">LIQUIDITY PRESSURE</span>
                <span className="text-gray-500">${depositAmount} / ${nextTierDeposit}</span>
              </div>
              <div className="liquid-tube h-1.5">
                <div
                  className="liquid-tube-fill bg-gradient-to-r from-blue-600 to-blue-400"
                  style={{ width: `${depositProgress}%` }}
                />
              </div>
            </div>

            {/* Tube 2: Network */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono tracking-wider">
                <span className="text-cyan-400">SIGNAL STRENGTH</span>
                <span className="text-gray-500">{referralCount} / {nextTierReferrals} REFS</span>
              </div>
              <div className="liquid-tube h-1.5">
                <div
                  className="liquid-tube-fill bg-gradient-to-r from-cyan-600 to-cyan-400"
                  style={{ width: `${networkProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Balance (Spans 3 cols) */}
        <div className="lg:col-span-3 text-right space-y-0.5">
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Total Balance</div>
          <div className="text-3xl font-bold tracking-tight text-white glow-text-blue">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-600 font-mono">
            <Zap className="w-3 h-3 text-yellow-500/80" />
            <span>NET WORTH / TOTAL TVL</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatusManifold;
