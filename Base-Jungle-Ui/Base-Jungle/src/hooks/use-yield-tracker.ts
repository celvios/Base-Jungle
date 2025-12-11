import { useState, useEffect, useCallback } from 'react';

interface YieldEvent {
  id: string;
  type: 'harvest' | 'compound' | 'deposit' | 'milestone';
  amount: number;
  timestamp: Date;
  message: string;
}

const STORAGE_KEY = 'base_jungle_yield_tracker';

interface StoredData {
  lastVisitBalance: number;
  lastVisitTime: number;
  events: Array<{
    id: string;
    type: string;
    amount: number;
    timestamp: string;
    message: string;
  }>;
}

export function useYieldTracker(currentBalance: number, address: string | undefined) {
  const [lastVisitBalance, setLastVisitBalance] = useState<number | null>(null);
  const [events, setEvents] = useState<YieldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored data on mount
  useEffect(() => {
    if (!address) return;

    const storageKey = `${STORAGE_KEY}_${address}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored);
        setLastVisitBalance(data.lastVisitBalance);
        setEvents(
          data.events.map((e) => ({
            ...e,
            type: e.type as YieldEvent['type'],
            timestamp: new Date(e.timestamp)
          }))
        );
      } catch (e) {
        console.error('Failed to parse yield tracker data:', e);
      }
    }

    setIsLoading(false);
  }, [address]);

  // Save current balance as last visit when leaving
  useEffect(() => {
    if (!address || currentBalance <= 0) return;

    const handleBeforeUnload = () => {
      const storageKey = `${STORAGE_KEY}_${address}`;
      const data: StoredData = {
        lastVisitBalance: currentBalance,
        lastVisitTime: Date.now(),
        events: events.slice(0, 20).map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString()
        }))
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [address, currentBalance, events]);

  // Add a new event
  const addEvent = useCallback((event: Omit<YieldEvent, 'id' | 'timestamp'>) => {
    const newEvent: YieldEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50));
  }, []);

  // Calculate earned since last visit
  const earnedSinceLastVisit = lastVisitBalance !== null && currentBalance > 0
    ? Math.max(0, currentBalance - lastVisitBalance)
    : 0;

  // Check for milestones
  useEffect(() => {
    if (currentBalance <= 0) return;

    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
    
    milestones.forEach((milestone) => {
      if (
        currentBalance >= milestone &&
        lastVisitBalance !== null &&
        lastVisitBalance < milestone
      ) {
        addEvent({
          type: 'milestone',
          amount: currentBalance,
          message: `Reached $${milestone.toLocaleString()} in deposits!`
        });
      }
    });
  }, [currentBalance, lastVisitBalance, addEvent]);

  return {
    lastVisitBalance,
    earnedSinceLastVisit,
    events,
    addEvent,
    isLoading
  };
}

export default useYieldTracker;

