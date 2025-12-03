import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TGEChecklist() {
    const steps = [
        { id: 1, label: "Connect Wallet", status: "completed", description: "Wallet connected successfully" },
        { id: 2, label: "First Deposit", status: "completed", description: "Minimum $500 deposit active" },
        { id: 3, label: "Activate Strategy", status: "completed", description: "Capital deployed to a Vault" },
        { id: 4, label: "Accumulate Points", status: "in-progress", description: "Target: 100,000 PTS (Current: 45,200)" },
        { id: 5, label: "Referral Network", status: "pending", description: "Invite 3 active users (Current: 1)" },
    ];

    const progress = (steps.filter(s => s.status === "completed").length / steps.length) * 100;

    return (
        <Card className="glass-card border-t-2 border-t-purple-500/50 h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-purple-400" />
                            TGE Readiness
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-primary/80">
                            Complete these milestones to maximize your TGE allocation.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {progress.toFixed(0)}% READY
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Progress value={progress} className="h-2 bg-purple-950/30" indicatorClassName="bg-purple-500" />

                <div className="space-y-4">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-3 group">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                step.status === "completed" ? "bg-green-500/20 text-green-400" :
                                    step.status === "in-progress" ? "bg-blue-500/20 text-blue-400 animate-pulse" :
                                        "bg-white/5 text-muted-foreground"
                            )}>
                                {step.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> :
                                    step.status === "in-progress" ? <Circle className="w-4 h-4" /> :
                                        <Lock className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        step.status === "completed" ? "text-white" : "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </span>
                                    {step.status === "in-progress" && (
                                        <Badge variant="secondary" className="text-[10px] h-5 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                            IN PROGRESS
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded bg-yellow-500/10 border border-yellow-500/20 p-3 flex gap-3 items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-200/80 leading-relaxed">
                        TGE Snapshot date is approaching. Ensure all criteria are met before the snapshot to guarantee eligibility.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
