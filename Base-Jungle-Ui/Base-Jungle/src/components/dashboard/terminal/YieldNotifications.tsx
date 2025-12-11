import React, { useEffect, useState } from 'react';
import { Bell, TrendingUp, Zap, Clock, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface YieldEvent {
  id: string;
  type: 'harvest' | 'compound' | 'deposit' | 'milestone';
  amount: number;
  timestamp: Date;
  message: string;
}

interface YieldNotificationsProps {
  currentBalance: number;
  lastVisitBalance: number | null;
  events: YieldEvent[];
  onDismiss?: (id: string) => void;
}

const YieldNotifications: React.FC<YieldNotificationsProps> = ({
  currentBalance,
  lastVisitBalance,
  events,
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'harvest': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'compound': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'milestone': return <Bell className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'harvest': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'compound': return 'border-green-500/30 bg-green-500/5';
      case 'milestone': return 'border-blue-500/30 bg-blue-500/5';
      default: return 'border-gray-500/30 bg-gray-500/5';
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
            {events.length > 0 && (
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
        <div className="text-yellow-400 pl-4">
          [INFO] Next harvest check: ~1h
        </div>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-[10px] font-mono text-gray-500 mb-2 tracking-wider">RECENT_EVENTS</p>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {events.slice(0, 5).map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-2 rounded border ${getEventColor(event.type)}`}
              >
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="text-xs text-gray-300">{event.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-400">
                    +${event.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && earnedSinceLastVisit === 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center py-4">
          <p className="text-xs text-gray-500 font-mono">
            {'>'} awaiting_yield_events...
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Yield will accumulate as strategies generate returns
          </p>
        </div>
      )}
    </div>
  );
};

export default YieldNotifications;

