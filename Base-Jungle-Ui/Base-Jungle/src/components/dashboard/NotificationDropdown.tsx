import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, X, Zap, TrendingUp, Award, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useYieldEvents } from '@/hooks/use-yield-events';
import { useWallet } from '@/contexts/wallet-context';

interface NotificationDropdownProps {
    onClose: () => void;
    isPermissionGranted: boolean;
    onRequestPermission: () => Promise<boolean>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    onClose,
    isPermissionGranted,
    onRequestPermission
}) => {
    const { address } = useWallet();
    const { events, markAsRead, clearAll } = useYieldEvents(address);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'harvest': return <Zap className="w-4 h-4 text-yellow-400" />;
            case 'compound': return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'milestone': return <Award className="w-4 h-4 text-blue-400" />;
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

    const recentEvents = events.slice(0, 5);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Dropdown */}
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-96 z-50"
            >
                <div className="glass-card rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-green-400" />
                            <h3 className="font-mono text-sm text-green-400 tracking-wider">NOTIFICATIONS</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {events.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Permission Banner */}
                    {!isPermissionGranted && (
                        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
                            <div className="flex items-start gap-3">
                                <Bell className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-yellow-400 font-medium mb-1">
                                        Enable Notifications
                                    </p>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Get alerts when your yield is ready to harvest!
                                    </p>
                                    <Button
                                        onClick={onRequestPermission}
                                        size="sm"
                                        className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                                    >
                                        <Bell className="w-3 h-3 mr-2" />
                                        Enable Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {recentEvents.length > 0 ? (
                            <div className="divide-y divide-gray-800">
                                {recentEvents.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-4 hover:bg-gray-800/30 transition-colors cursor-pointer ${!event.read ? 'bg-gray-800/20' : ''
                                            }`}
                                        onClick={() => markAsRead(event.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded border ${getEventColor(event.type)}`}>
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium mb-1">
                                                    {event.message}
                                                </p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-mono text-green-400">
                                                        +${event.amount.toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(event.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                            {!event.read && (
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-6 h-6 text-gray-600" />
                                </div>
                                <p className="text-sm text-gray-500 font-mono mb-1">
                                    {'>'} no_notifications_yet
                                </p>
                                <p className="text-xs text-gray-600">
                                    Yield events will appear here
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {events.length > 0 && (
                        <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                            <button
                                onClick={() => {
                                    window.location.href = '/rewards';
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-white transition-colors font-mono"
                            >
                                View All Notifications
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Settings Link */}
                    <div className="p-2 border-t border-gray-800 bg-black/30">
                        <button
                            onClick={() => {
                                // TODO: Navigate to settings page or open settings modal
                                console.log('Open notification settings');
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors font-mono"
                        >
                            <Settings className="w-3 h-3" />
                            Notification Settings
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default NotificationDropdown;
