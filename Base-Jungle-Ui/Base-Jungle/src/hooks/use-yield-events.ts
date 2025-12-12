import { useState, useEffect, useCallback } from 'react';
import { usePushNotifications } from './use-push-notifications';

export interface YieldEvent {
    id: string;
    type: 'harvest' | 'compound' | 'deposit' | 'milestone';
    amount: number;
    timestamp: Date;
    message: string;
    read: boolean;
}

const EVENTS_STORAGE_KEY = 'base_jungle_yield_events';
const LAST_VISIT_KEY = 'base_jungle_last_visit';
const MAX_EVENTS = 50;

export function useYieldEvents(address?: string) {
    const [events, setEvents] = useState<YieldEvent[]>([]);
    const [lastVisitBalance, setLastVisitBalance] = useState<number | null>(null);
    const { notifyYield, notifyHarvest, notifyMilestone } = usePushNotifications(address);

    // Load events from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert timestamp strings back to Date objects
                const eventsWithDates = parsed.map((e: any) => ({
                    ...e,
                    timestamp: new Date(e.timestamp)
                }));
                setEvents(eventsWithDates);
            } catch (e) {
                console.error('Failed to load yield events');
            }
        }

        // Load last visit timestamp
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        if (lastVisit) {
            setLastVisitBalance(parseFloat(lastVisit));
        }

        // Update last visit timestamp
        const now = Date.now();
        localStorage.setItem(LAST_VISIT_KEY, now.toString());
    }, []);

    // Save events to localStorage whenever they change
    useEffect(() => {
        if (events.length > 0) {
            localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
        }
    }, [events]);

    // Add a new event
    const addEvent = useCallback((
        type: YieldEvent['type'],
        amount: number,
        message: string
    ) => {
        const newEvent: YieldEvent = {
            id: `${Date.now()}-${Math.random()}`,
            type,
            amount,
            message,
            timestamp: new Date(),
            read: false
        };

        setEvents((prev) => {
            const updated = [newEvent, ...prev];
            // Keep only the most recent MAX_EVENTS
            return updated.slice(0, MAX_EVENTS);
        });

        // Trigger push notification based on type
        if (type === 'harvest' && amount > 0) {
            notifyHarvest(amount, 0); // Points TBD
        } else if (type === 'yield' || type === 'compound') {
            notifyYield(amount, 0);
        } else if (type === 'milestone') {
            notifyMilestone(message, amount);
        }

        return newEvent.id;
    }, [notifyYield, notifyHarvest, notifyMilestone]);

    // Mark an event as read
    const markAsRead = useCallback((eventId: string) => {
        setEvents((prev) =>
            prev.map((e) => (e.id === eventId ? { ...e, read: true } : e))
        );
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    }, []);

    // Clear all events
    const clearAll = useCallback(() => {
        setEvents([]);
        localStorage.removeItem(EVENTS_STORAGE_KEY);
    }, []);

    // Get unread count
    const unreadCount = events.filter((e) => !e.read).length;

    // Get events by type
    const getEventsByType = useCallback(
        (type: YieldEvent['type']) => events.filter((e) => e.type === type),
        [events]
    );

    return {
        events,
        unreadCount,
        lastVisitBalance,
        addEvent,
        markAsRead,
        markAllAsRead,
        clearAll,
        getEventsByType
    };
}

export default useYieldEvents;
