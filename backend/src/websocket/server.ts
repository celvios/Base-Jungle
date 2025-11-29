import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { redis } from '../database/connection.js';

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Handle room subscriptions
        socket.on('subscribe:bot-activity', () => {
            socket.join('bot-activity');
            console.log(`📡 ${socket.id} subscribed to bot-activity`);
        });

        socket.on('subscribe:market', () => {
            socket.join('market');
            console.log(`📡 ${socket.id} subscribed to market`);
        });

        socket.on('subscribe:user', (userAddress: string) => {
            if (userAddress && userAddress.startsWith('0x')) {
                const room = `user:${userAddress.toLowerCase()}`;
                socket.join(room);
                console.log(`📡 ${socket.id} subscribed to ${room}`);
            }
        });

        // Handle unsubscribe
        socket.on('unsubscribe:bot-activity', () => {
            socket.leave('bot-activity');
        });

        socket.on('unsubscribe:market', () => {
            socket.leave('market');
        });

        socket.on('unsubscribe:user', (userAddress: string) => {
            const room = `user:${userAddress.toLowerCase()}`;
            socket.leave(room);
        });

        // Disconnection
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    console.log('✅ WebSocket server initialized');
    return io;
}

// Broadcast functions
export function broadcastBotActivity(activity: any) {
    if (!io) return;
    io.to('bot-activity').emit('bot-activity', activity);
}

export function broadcastMarketHealth(health: any) {
    if (!io) return;
    io.to('market').emit('market-update', health);
}

export function broadcastUserUpdate(userAddress: string, update: any) {
    if (!io) return;
    const room = `user:${userAddress.toLowerCase()}`;
    io.to(room).emit('user-update', update);
}

// Get connection count
export function getConnectionCount(): number {
    if (!io) return 0;
    return io.sockets.sockets.size;
}

export { io };
