import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Activity, ArrowRightLeft } from "lucide-react";

export interface AggressiveDetailsProps {
    strategyType: "delta-neutral" | "leveraged-lp" | "momentum";
    flashLoanProvider: string;
    hedgingAsset: string;
    fundingRateRisk: "low" | "medium" | "high";
    impermanentLoss: "none" | "hedged" | "exposed";
}

export function AggressiveStrategyDetails({
    strategyType,
    flashLoanProvider,
    hedgingAsset,
    fundingRateRisk,
    impermanentLoss
}: AggressiveDetailsProps) {
    return (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Advanced Mechanics</h4>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
                {strategyType === "delta-neutral" && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-2 font-semibold text-blue-300">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Delta Neutral Hedge
                        </div>
                        <div className="space-y-1.5 text-blue-100/80">
                            <div className="flex justify-between">
                                <span>Long Position:</span>
                                <span className="font-mono">Spot {hedgingAsset}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Short Position:</span>
                                <span className="font-mono">Perp {hedgingAsset} (1x)</span>
                            </div>
                            <div className="flex justify-between border-t border-blue-500/20 pt-1 mt-1">
                                <span>Net Exposure:</span>
                                <span className="font-mono text-green-400">~0.00%</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card/30 rounded p-2 border border-white/5">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">Impermanent Loss</div>
                        <Badge variant="outline" className={
                            impermanentLoss === "none" || impermanentLoss === "hedged"
                                ? "text-green-400 border-green-400/20 bg-green-400/5"
                                : "text-red-400 border-red-400/20 bg-red-400/5"
                        }>
                            {impermanentLoss.toUpperCase()}
                        </Badge>
                    </div>

                    <div className="bg-card/30 rounded p-2 border border-white/5">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">Funding Risk</div>
                        <Badge variant="outline" className={
                            fundingRateRisk === "low"
                                ? "text-green-400 border-green-400/20 bg-green-400/5"
                                : fundingRateRisk === "medium"
                                    ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5"
                                    : "text-red-400 border-red-400/20 bg-red-400/5"
                        }>
                            {fundingRateRisk.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-black/20 p-2 rounded">
                    <Activity className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                        Flash loans via <span className="text-foreground font-medium">{flashLoanProvider}</span> are used to leverage the position atomically.
                    </span>
                </div>
            </div>
        </div>
    );
}
