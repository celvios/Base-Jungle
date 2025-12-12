import React, { useEffect, useState } from 'react';
import { Bell, TrendingUp, Zap, Clock, ChevronRight, X, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface YieldEvent {
  id: string;
  type: 'harvest' | 'compound' | 'deposit' | 'milestone';
  amount: number;
  timestamp: Date;
  message: string;
}

interface ActivityEvent {
  id: string;
  type: 'deposit' | 'withdraw' | 'allocate' | 'deallocate' | 'harvest' | 'rebalance';
  amount: string;
  strategy?: string;
  timestamp: Date;
  txHash: string;
}

interface YieldNotificationsProps {
  currentBalance: number;
  lastVisitBalance: number | null;
  events: YieldEvent[];
  activities?: ActivityEvent[];
  isLoadingActivities?: boolean;
  onDismiss?: (id: string) => void;
}

const YieldNotifications: React.FC<YieldNotificationsProps> = ({
  currentBalance,
  lastVisitBalance,
  events,
  activities = [],
  isLoadingActivities = false,
  onDismiss
}) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const earnedSinceLastVisit = lastVisitBalance !== null
    ? Math.max(0, currentBalance - lastVisitBalance)
    : 0;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-3 h-3 text-green-400" />;
      case 'withdraw':
        return <ArrowUpRight className="w-3 h-3 text-red-400" />;
      case 'allocate':
        return <TrendingUp className="w-3 h-3 text-blue-400" />;
      case 'deallocate':
        return <ArrowUpRight className="w-3 h-3 text-orange-400" />;
      case 'harvest':
        return <Zap className="w-3 h-3 text-yellow-400" />;
      case 'rebalance':
        return <RefreshCw className="w-3 h-3 text-purple-400" />;
    }
  };

  const getActivityText = (event: ActivityEvent) => {
    switch (event.type) {
      case 'deposit':
        return `Deposited $${Number(event.amount).toFixed(2)}`;
      case 'withdraw':
        return `Withdrew $${Number(event.amount).toFixed(2)}`;
      case 'allocate':
        return `→ ${event.strategy}: $${Number(event.amount).toFixed(2)}`;
      case 'deallocate':
        return `← ${event.strategy}: $${Number(event.amount).toFixed(2)}`;
      case 'harvest':
        return `Harvested $${Number(event.amount).toFixed(2)}`;
      case 'rebalance':
        return 'Rebalanced strategies';
    }
  };

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'deposit':
      case 'allocate':
        return 'border-green-500/20 bg-green-500/5 text-green-400';
      case 'withdraw':
      case 'deallocate':
        return 'border-orange-500/20 bg-orange-500/5 text-orange-400';
      case 'harvest':
        return 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400';
      case 'rebalance':
        return 'border-purple-500/20 bg-purple-500/5 text-purple-400';
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 relative overflow-hidden">
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,0,0.03)_2px,rgba(0,255,0,0.03)_4px)]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-green-400" />
            {activities.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="text-sm font-mono text-green-400 tracking-wider">YIELD_MONITOR</h3>
        </div>
        <span className="text-[10px] font-mono text-gray-500">
          [{new Date().toLocaleTimeString('en-US', { hour12: false })}]
        </span>
      </div>

      {/* Welcome Back Message */}
      <AnimatePresence>
        {showWelcome && earnedSinceLastVisit > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 relative"
          >
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">SINCE_LAST_VISIT</p>
                <p className="text-lg font-bold text-green-400 glow-text-green">
                  +${earnedSinceLastVisit.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
                className="h-full bg-gradient-to-r from-green-500 to-green-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Output */}
      <div className="space-y-2 font-mono text-xs">
        <div className="text-gray-500">
          {'>'} yield_tracker --status
        </div>
        <div className="text-green-400 pl-4">
          [OK] Auto-compound: ACTIVE
        </div>
        <div className="text-green-400 pl-4">
          [OK] Strategy allocation: 70/30
        </div>
        {activities.length > 0 ? (
          <div className="text-blue-400 pl-4">
            [ACTIVE: {activities.length}] AT_RISK: 0
          </div>
        ) : (
          <div className="text-yellow-400 pl-4">
            ACTIVE: 0  AT_RISK: 0
          </div>
        )}
      </div>

      {/* Live Activity Feed */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-[10px] font-mono text-gray-500 mb-2 tracking-wider">LIVE_TRANSACTIONS</p>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
            {activities.slice(0, 8).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-2 rounded border text-xs font-mono ${getActivityColor(activity.type)}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getActivityIcon(activity.type)}
                  <span className="truncate">{getActivityText(activity)}</span>
                </div>
                <span className="text-[10px] text-gray-500 ml-2 shrink-0">
                  {formatTime(activity.timestamp)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingActivities && activities.length === 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center py-4">
          <p className="text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            {'>'} loading_activity...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingActivities && activities.length === 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center py-4">
          <p className="text-xs text-gray-500 font-mono">
            {'>'} awaiting_transactions...
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Activity will appear as strategies execute
          </p>
        </div>
      )}
    </div>
  );
};

export default YieldNotifications;

