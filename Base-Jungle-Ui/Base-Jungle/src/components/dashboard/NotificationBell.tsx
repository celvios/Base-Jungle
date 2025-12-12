import { Bell, Settings } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useWallet } from '@/contexts/wallet-context';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
    unreadCount?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { address } = useWallet();
    const { isPermissionGranted, requestPermission } = usePushNotifications(address);

    const handleBellClick = async () => {
        // If not granted, request permission first
        if (!isPermissionGranted) {
            const granted = await requestPermission();
            if (!granted) return;
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block flex-shrink-0">
            {/* Bell Button */}
            <button
                onClick={handleBellClick}
                className="relative w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center group"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />

                {/* Badge for unread notifications */}
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}

                {/* Pulse indicator for new notifications */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-ping opacity-75" />
                )}

                {/* Permission indicator */}
                {!isPermissionGranted && (
                    <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" title="Click to enable notifications" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <NotificationDropdown
                        onClose={() => setIsOpen(false)}
                        isPermissionGranted={isPermissionGranted}
                        onRequestPermission={requestPermission}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
