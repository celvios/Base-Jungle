import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface StrategyMetric {
    id: string;
    name: string;
    apy7d: number;
    apy30d: number;
    tvl: number;
    daysActive: number;
    trend: "up" | "down" | "flat";
}

export function StrategyMetrics({ metrics }: { metrics: StrategyMetric[] }) {
    return (
        <Card className="glass-card border-t-0">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Performance Matrix</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="w-[200px]">Strategy</TableHead>
                            <TableHead className="text-right">7d APY</TableHead>
                            <TableHead className="text-right">30d APY</TableHead>
                            <TableHead className="text-right">TVL</TableHead>
                            <TableHead className="text-right">Active Days</TableHead>
                            <TableHead className="text-right">Trend</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {metrics.map((metric) => (
                            <TableRow key={metric.id} className="hover:bg-white/5 border-white/5 transition-colors">
                                <TableCell className="font-medium">{metric.name}</TableCell>
                                <TableCell className="text-right font-mono text-green-400">
                                    {metric.apy7d.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-400/80">
                                    {metric.apy30d.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    ${metric.tvl.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                    {metric.daysActive}d
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end">
                                        {metric.trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                                        {metric.trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                                        {metric.trend === "flat" && <Minus className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
