import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

interface BotActivity {
    id: string;
    type: 'HARVESTER' | 'REBALANCER' | 'LIQUIDATOR' | 'ARBITRAGE';
    action: string;
    gasUsd: number;
    txHash: string;
    timestamp: number;
}

interface MarketHealth {
    currentAPY: number;
    status: 'STABLE' | 'VOLATILE' | 'CRISIS';
    totalTVL: string;
    utilizationRate: number;
    timestamp: number;
}

interface UserUpdate {
    type: 'portfolio-update';
    data: {
        totalDeposited: string;
        activePositions: number;
        totalPoints: number;
        newPositions: any[];
        newPoints: any[];
    };
    timestamp: number;
}

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Create socket connection
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, []);

    return { socket: socketRef.current, isConnected };
}

// Hook for bot activity feed
export function useBotActivity() {
    const { socket, isConnected } = useSocket();
    const [activities, setActivities] = useState<BotActivity[]>([]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Subscribe to bot activity
        socket.emit('subscribe:bot-activity');

        // Listen for updates
        socket.on('bot-activity', (activity: BotActivity) => {
            setActivities((prev) => [activity, ...prev].slice(0, 10)); // Keep last 10
        });

        return () => {
            socket.emit('unsubscribe:bot-activity');
            socket.off('bot-activity');
        };
    }, [socket, isConnected]);

    return { activities, isConnected };
}

// Hook for market health
export function useMarketHealth() {
    const { socket, isConnected } = useSocket();
    const [health, setHealth] = useState<MarketHealth | null>(null);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Subscribe to market updates
        socket.emit('subscribe:market');

        // Listen for updates
        socket.on('market-update', (update: MarketHealth) => {
            setHealth(update);
        });

        return () => {
            socket.emit('unsubscribe:market');
            socket.off('market-update');
        };
    }, [socket, isConnected]);

    return { health, isConnected };
}

// Hook for user-specific updates
export function useUserUpdates(userAddress: string | undefined) {
    const { socket, isConnected } = useSocket();
    const [update, setUpdate] = useState<UserUpdate | null>(null);

    useEffect(() => {
        if (!socket || !isConnected || !userAddress) return;

        // Subscribe to user updates
        socket.emit('subscribe:user', userAddress);

        // Listen for updates
        socket.on('user-update', (userUpdate: UserUpdate) => {
            setUpdate(userUpdate);
        });

        return () => {
            socket.emit('unsubscribe:user', userAddress);
            socket.off('user-update');
        };
    }, [socket, isConnected, userAddress]);

    return { update, isConnected };
}
