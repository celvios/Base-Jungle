import React from 'react';
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { getTokenDisplayName } from '@/constants/tokens';
import { ActivityFeed } from '../ActivityFeed';

interface ActivityEvent {
  id: string;
  type: 'deposit' | 'withdraw' | 'allocate' | 'deallocate' | 'harvest' | 'rebalance';
  amount: string;
  strategy?: string;
  timestamp: Date;
  txHash: string;
}

interface YieldReactorProps {
  principal: number;
  totalYield: number;
  harvestableYield: number;
  dailyPnL: number;
  data: Array<{ time: string; value: number }>;
  activities?: ActivityEvent[];
  isLoadingActivities?: boolean;
  onHarvest: () => void;
}

const YieldReactor: React.FC<YieldReactorProps> = ({
  principal,
  totalYield,
  harvestableYield,
  dailyPnL,
  data,
  activities = [],
  isLoadingActivities = false,
  onHarvest
}) => {
  return (
    <div className="glass-card rounded-xl p-6 h-full relative overflow-hidden group flex flex-col">
      {/* Background Pulse Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 shrink-0 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin-slow" />
            YIELD REACTOR
          </h3>
          <p className="text-xs text-gray-500 font-mono mt-1 tracking-wider">AUTO-COMPOUNDING ENGINE</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <TrendingUp className="w-3 h-3 text-green-400" />
          <span className="text-xs font-mono text-green-400">+{dailyPnL}% 24H</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-6 shrink-0 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Principal (TVL)</p>
          <p className="text-2xl font-bold text-white">
            ${principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Lifetime Yield</p>
          <p className="text-2xl font-bold text-blue-400 glow-text-blue">
            +${totalYield.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Harvestable</p>
          <p className="text-2xl font-bold text-green-400">
            ${harvestableYield.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[200px] relative z-10 -ml-2 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0052FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(5,5,5,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0052FF"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorYield)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Action */}
      <div className="mt-6 shrink-0 relative z-10">
        <Button
          onClick={onHarvest}
          className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 transition-all h-12 font-mono tracking-wider text-sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          HARVEST {getTokenDisplayName('USDC')} (${harvestableYield.toFixed(2)})
        </Button>
      </div>

      {/* Pulse Tube (Decorative) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-32 bg-gray-800 rounded-full overflow-hidden opacity-50">
        <div className="w-full h-full bg-blue-500/50 animate-pulse-glow" />
      </div>
    </div>
  );
};

export default YieldReactor;
