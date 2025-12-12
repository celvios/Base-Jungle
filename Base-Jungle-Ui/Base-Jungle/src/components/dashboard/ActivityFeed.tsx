import React from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityEvent {
    id: string;
    type: 'deposit' | 'withdraw' | 'allocate' | 'deallocate' | 'harvest' | 'rebalance';
    amount: string;
    strategy?: string;
    timestamp: Date;
    txHash: string;
}

interface ActivityFeedProps {
    activities: ActivityEvent[];
    isLoading: boolean;
}

const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
        case 'deposit':
            return <ArrowDownRight className="w-4 h-4 text-green-400" />;
        case 'withdraw':
            return <ArrowUpRight className="w-4 h-4 text-red-400" />;
        case 'allocate':
            return <TrendingUp className="w-4 h-4 text-blue-400" />;
        case 'deallocate':
            return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
        case 'harvest':
            return <TrendingUp className="w-4 h-4 text-yellow-400" />;
        case 'rebalance':
            return <RefreshCw className="w-4 h-4 text-purple-400" />;
    }
};

const getActivityText = (event: ActivityEvent) => {
    switch (event.type) {
        case 'deposit':
            return `Deposited $${Number(event.amount).toFixed(2)}`;
        case 'withdraw':
            return `Withdrew $${Number(event.amount).toFixed(2)}`;
        case 'allocate':
            return `Allocated $${Number(event.amount).toFixed(2)} to ${event.strategy}`;
        case 'deallocate':
            return `Withdrew $${Number(event.amount).toFixed(2)} from ${event.strategy}`;
        case 'harvest':
            return `Harvested $${Number(event.amount).toFixed(2)} yield`;
        case 'rebalance':
            return 'Rebalanced strategies';
    }
};

const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
        case 'deposit':
        case 'allocate':
            return 'border-green-500/20 bg-green-500/5';
        case 'withdraw':
        case 'deallocate':
            return 'border-orange-500/20 bg-orange-500/5';
        case 'harvest':
            return 'border-yellow-500/20 bg-yellow-500/5';
        case 'rebalance':
            return 'border-purple-500/20 bg-purple-500/5';
    }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-mono">Loading activity...</span>
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-mono">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {activities.map((activity) => (
                <div
                    key={activity.id}
                    className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border backdrop-blur-sm transition-all hover:scale-[1.02]",
                        getActivityColor(activity.type)
                    )}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">
                            {getActivityText(activity)}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {activity.timestamp.toLocaleTimeString()}
                        </p>
                    </div>
                    <a
                        href={`https://sepolia.basescan.org/tx/${activity.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-xs text-blue-400 hover:text-blue-300 font-mono"
                    >
                        View →
                    </a>
                </div>
            ))}
        </div>
    );
};
