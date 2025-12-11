import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Award, X } from 'lucide-react';

interface YieldToast {
  id: string;
  type: 'harvest' | 'compound' | 'milestone';
  title: string;
  message: string;
  amount?: number;
}

interface YieldToastContainerProps {
  toasts: YieldToast[];
  onDismiss: (id: string) => void;
}

const getToastConfig = (type: string) => {
  switch (type) {
    case 'harvest':
      return {
        icon: <Zap className="w-5 h-5" />,
        color: 'yellow',
        gradient: 'from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-500/30',
        glow: 'shadow-yellow-500/20'
      };
    case 'compound':
      return {
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'green',
        gradient: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-500/30',
        glow: 'shadow-green-500/20'
      };
    case 'milestone':
      return {
        icon: <Award className="w-5 h-5" />,
        color: 'blue',
        gradient: 'from-blue-500/20 to-purple-500/20',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/20'
      };
    default:
      return {
        icon: <Zap className="w-5 h-5" />,
        color: 'gray',
        gradient: 'from-gray-500/20 to-gray-600/20',
        border: 'border-gray-500/30',
        glow: 'shadow-gray-500/20'
      };
  }
};

const YieldToastItem: React.FC<{ toast: YieldToast; onDismiss: () => void }> = ({
  toast,
  onDismiss
}) => {
  const config = getToastConfig(toast.type);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={`
        relative overflow-hidden rounded-xl p-4 min-w-[320px]
        bg-gradient-to-r ${config.gradient}
        border ${config.border}
        backdrop-blur-xl shadow-lg ${config.glow}
      `}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
      </div>

      {/* Pulse Effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1, repeat: 2 }}
        className={`absolute top-4 left-4 w-8 h-8 rounded-full bg-${config.color}-500`}
      />

      <div className="flex items-start gap-3 relative z-10">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          bg-${config.color}-500/20 text-${config.color}-400
        `}>
          {config.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-sm text-white tracking-wider">
              {toast.title}
            </h4>
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">{toast.message}</p>
          {toast.amount !== undefined && (
            <p className={`text-lg font-bold text-${config.color}-400 mt-2 font-mono`}>
              +${toast.amount.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 bg-${config.color}-500/50`}
      />
    </motion.div>
  );
};

export const YieldToastContainer: React.FC<YieldToastContainerProps> = ({
  toasts,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <YieldToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook to manage toasts
export const useYieldToasts = () => {
  const [toasts, setToasts] = useState<YieldToast[]>([]);

  const addToast = (toast: Omit<YieldToast, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showHarvestToast = (amount: number) => {
    addToast({
      type: 'harvest',
      title: 'YIELD_HARVESTED',
      message: 'Your yield has been harvested successfully',
      amount
    });
  };

  const showCompoundToast = (amount: number) => {
    addToast({
      type: 'compound',
      title: 'AUTO_COMPOUND',
      message: 'Your yield has been reinvested',
      amount
    });
  };

  const showMilestoneToast = (milestone: string, amount: number) => {
    addToast({
      type: 'milestone',
      title: 'MILESTONE_REACHED',
      message: milestone,
      amount
    });
  };

  return {
    toasts,
    dismissToast,
    showHarvestToast,
    showCompoundToast,
    showMilestoneToast
  };
};

export default YieldToastContainer;

