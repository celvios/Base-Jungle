import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, TrendingUp, Zap, History } from "lucide-react";

export function PointsBreakdown() {
    return (
        <Card className="glass-card border-t-2 border-t-blue-500/50 h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-400" />
                            Points Engine
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-primary/80">
                            Live tracking of your contribution to the ecosystem.
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white glow-text-blue">45,200</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Points</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Multipliers Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-400" /> Base Multiplier
                        </div>
                        <div className="text-xl font-mono font-bold text-white">1.0x</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-purple-400" /> Tier Bonus
                        </div>
                        <div className="text-xl font-mono font-bold text-purple-400">+0.25x</div>
                    </div>
                </div>

                {/* Velocity Stats */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Base Velocity</span>
                        <span className="font-mono text-white">85.00 pts/hr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Referral Boost (10%)</span>
                        <span className="font-mono text-green-400">+8.50 pts/hr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Tier Boost (25%)</span>
                        <span className="font-mono text-purple-400">+21.25 pts/hr</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">Net Velocity</span>
                        <span className="font-mono font-bold text-blue-400">114.75 pts/hr</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-xs font-mono">
                    <History className="w-3 h-3 mr-2" /> VIEW HISTORY
                </Button>
            </CardContent>
        </Card>
    );
}
