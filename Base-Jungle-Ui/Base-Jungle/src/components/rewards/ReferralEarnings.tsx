import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, ArrowRight } from "lucide-react";
import { getTokenDisplayName } from "@/constants/tokens";

export function ReferralEarnings() {
    return (
        <Card className="glass-card border-t-2 border-t-green-500/50 h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-400" />
                            Referral Earnings
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-primary/80">
                            Commissions from your downstream network.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        ACTIVE
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-4 border border-white/5">
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unclaimed {getTokenDisplayName('USDC')}</div>
                        <div className="text-2xl font-bold text-white">$124.50</div>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-bold">
                        CLAIM <DollarSign className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Referred Volume</span>
                        <span className="font-mono text-white">$15,200.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Active Referrals</span>
                        <span className="font-mono text-white">3 Users</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Commission Rate</span>
                        <span className="font-mono text-green-400">10%</span>
                    </div>
                </div>

                <Button variant="ghost" className="w-full text-muted-foreground hover:text-white text-xs font-mono group">
                    MANAGE NETWORK <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </CardContent>
        </Card>
    );
}
