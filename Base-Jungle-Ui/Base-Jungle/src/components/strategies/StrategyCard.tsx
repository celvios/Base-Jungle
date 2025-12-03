import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertTriangle, ShieldCheck, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StrategyStep {
    id: string;
    label: string;
    action: string;
    context: string;
}

export interface StrategyProps {
    id: string;
    name: string;
    apy: number;
    tierRequired: string;
    activeReferralsRequired: number;
    tagline: string;
    steps: StrategyStep[];
    maxLeverage: number;
    healthFactorBuffer: number;
    protocols: string[];
    warning?: string;
    isAggressive?: boolean;
    userTier?: string; // To check if unlocked
    userReferrals?: number;
}

export function StrategyCard({
    name,
    apy,
    tierRequired,
    activeReferralsRequired,
    tagline,
    steps,
    maxLeverage,
    healthFactorBuffer,
    protocols,
    warning,
    isAggressive,
    userTier = "Novice", // Default for now
    userReferrals = 0
}: StrategyProps) {
    const isLocked = false; // TODO: Implement actual lock logic based on tier/referrals

    return (
        <Card className={cn(
            "glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-t-2",
            isAggressive ? "border-t-orange-500/50" : "border-t-blue-500/50"
        )}>
            {/* A. Header & Executive Summary */}
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl font-bold tracking-tight">{name}</CardTitle>
                            {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <CardDescription className="text-sm font-medium text-primary/80">
                            {tagline}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{apy}%</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Live APY</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className={cn(
                        "border-primary/20 bg-primary/5",
                        isLocked ? "text-muted-foreground" : "text-primary"
                    )}>
                        {isLocked ? "LOCKED" : "UNLOCKED"}
                    </Badge>
                    <span className="text-muted-foreground">
                        Req: <span className="font-semibold text-foreground">{tierRequired}</span> + {activeReferralsRequired} Refs
                    </span>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* B. The Flow Visualization (The "Anatomy") */}
                <div className="space-y-3 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 to-transparent -z-10" />

                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-background/50 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground shrink-0 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-foreground/90">{step.label}</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-xs glass-card">
                                                <p className="text-xs">{step.context}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <p className="text-xs text-muted-foreground">{step.action}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* C. Risk & Compliance Readout */}
                <div className="rounded-lg bg-black/20 border border-white/5 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Max Leverage</div>
                            <div className="text-lg font-mono font-bold text-orange-400">{maxLeverage.toFixed(1)}x</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">HF Buffer</div>
                            <div className="text-lg font-mono font-bold text-green-400">{healthFactorBuffer.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Protocol Exposure</div>
                        <div className="flex flex-wrap gap-2">
                            {protocols.map(proto => (
                                <Badge key={proto} variant="secondary" className="text-[10px] bg-white/5 hover:bg-white/10 border-white/5">
                                    {proto}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {warning && (
                        <div className="flex gap-2 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-200 text-xs leading-relaxed">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                            {warning}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
