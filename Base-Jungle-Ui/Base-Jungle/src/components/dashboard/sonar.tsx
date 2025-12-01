import { useState, useEffect } from "react";
import { GlassPanel } from "./glass-panel";
import { useRecentActivities } from "@/hooks/use-activity";

interface SonarProps {
  isBooting: boolean;
}

interface ActivityBlip {
  id: number;
  type: string;
  action: string;
  amount?: number;
  angle: number;
  timestamp: number;
}

export function Sonar({ isBooting }: SonarProps) {
  const [rotation, setRotation] = useState(0);
  const [blips, setBlips] = useState<ActivityBlip[]>([]);
  const [currentActivity, setCurrentActivity] = useState<string>("");

  // ✅ Get real activities from backend
  const { data, isLoading } = useRecentActivities(10);
  const activities = data?.activities || [];

  // Rotating sweep
  useEffect(() => {
    if (isBooting) return;

    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360);
    }, 16); // 120 RPM = 2 degrees per frame at 60fps

    return () => clearInterval(interval);
  }, [isBooting]);

  // Convert real activities to radar blips
  useEffect(() => {
    if (isBooting || activities.length === 0) return;

    // Map each activity to a random angle for radar display
    const newBlips: ActivityBlip[] = activities.map((activity, index) => ({
      id: activity.id,
      type: activity.event_type.toUpperCase(),
      action: activity.event_type === 'deposit' ? 'Deposited' : 'Withdrew',
      amount: activity.amount,
      angle: (index * 360 / activities.length) + Math.random() * 30, // Distribute around circle
      timestamp: activity.timestamp,
    }));

    setBlips(newBlips.slice(0, 5)); // Show last 5 activities as blips
  }, [activities, isBooting]);

  // Show latest activity message
  useEffect(() => {
    if (isBooting || activities.length === 0) return;

    const latestActivity = activities[0];
    const eventType = latestActivity.event_type.toUpperCase();
    const action = latestActivity.event_type === 'deposit' ? 'DEPOSIT' : 'WITHDRAW';
    const amount = latestActivity.amount ? `$${latestActivity.amount.toLocaleString()}` : '';
    const address = `${latestActivity.user_address.slice(0, 6)}...${latestActivity.user_address.slice(-4)}`;

    setCurrentActivity(`> [${eventType}] ${address} ${action} ${amount}`);

    // Clear after 5 seconds or when new activity arrives
    const timeout = setTimeout(() => setCurrentActivity(""), 5000);
    return () => clearTimeout(timeout);
  }, [activities, isBooting]);

  // Show loading state
  if (isLoading) {
    return (
      <GlassPanel className="h-[280px]">
        <div className="flex flex-col h-full items-center justify-center">
          <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
            SONAR
          </h3>
          <div className="text-xs text-gray-500">Initializing...</div>
        </div>
      </GlassPanel>
    );
  }

  // Show empty state with animated radar if no activities
  if (activities.length === 0) {
    return (
      <GlassPanel className="h-[280px]">
        <div className="flex flex-col h-full">
          <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
            SONAR • NO ACTIVITY YET
          </h3>

          {/* Radar Circle - Same as main view */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Radar background */}
              <svg className="absolute inset-0" viewBox="0 0 100 100">
                {/* Concentric circles */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="0.5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="0.5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="15"
                  fill="none"
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="0.5"
                />

                {/* Cross hairs */}
                <line
                  x1="50"
                  y1="5"
                  x2="50"
                  y2="95"
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="0.5"
                />
                <line
                  x1="5"
                  y1="50"
                  x2="95"
                  y2="50"
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="0.5"
                />

                {/* Sweep line */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="5"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  transform={`rotate(${rotation} 50 50)`}
                  style={{ transformOrigin: "50% 50%" }}
                />

                {/* Sweep gradient */}
                <defs>
                  <radialGradient id="sweep-gradient-empty">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path
                  d={`M 50 50 L 50 5 A 45 45 0 0 1 ${50 + 45 * Math.sin((rotation * Math.PI) / 180)} ${50 - 45 * Math.cos((rotation * Math.PI) / 180)} Z`}
                  fill="url(#sweep-gradient-empty)"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>

          {/* Empty state message */}
          <div className="mt-4 h-12 overflow-hidden">
            <div className="font-mono text-xs text-gray-500">
              {'>'}  Waiting for vault transactions...
            </div>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-[280px]">
      <div className="flex flex-col h-full">
        {/* Title */}
        <h3 className="text-sm font-medium text-primary/70 tracking-wider mb-4">
          SONAR • {activities.length} EVENTS
        </h3>

        {/* Radar Circle */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-40 h-40">
            {/* Radar background */}
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              {/* Concentric circles */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />
              <circle
                cx="50"
                cy="50"
                r="15"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />

              {/* Cross hairs */}
              <line
                x1="50"
                y1="5"
                x2="50"
                y2="95"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />
              <line
                x1="5"
                y1="50"
                x2="95"
                y2="50"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="0.5"
              />

              {/* Sweep line */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="5"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                transform={`rotate(${rotation} 50 50)`}
                style={{ transformOrigin: "50% 50%" }}
              />

              {/* Sweep gradient */}
              <defs>
                <radialGradient id="sweep-gradient">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path
                d={`M 50 50 L 50 5 A 45 45 0 0 1 ${50 + 45 * Math.sin((rotation * Math.PI) / 180)} ${50 - 45 * Math.cos((rotation * Math.PI) / 180)} Z`}
                fill="url(#sweep-gradient)"
                opacity="0.5"
              />
            </svg>

            {/* Real activity blips */}
            {blips.map((blip) => {
              const x = 50 + 30 * Math.cos((blip.angle * Math.PI) / 180);
              const y = 50 + 30 * Math.sin((blip.angle * Math.PI) / 180);
              const color = blip.type === 'DEPOSIT' ? 'bg-green-500' : 'bg-yellow-500';

              return (
                <div
                  key={blip.id}
                  className={`absolute w-2 h-2 ${color} rounded-full animate-ping`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="mt-4 h-12 overflow-hidden">
          {currentActivity && (
            <div className="font-mono text-xs text-green-500 dark:text-green-400 animate-typing">
              {currentActivity}
            </div>
          )}
          {!currentActivity && activities.length > 0 && (
            <div className="font-mono text-xs text-gray-500">
              {'\u003e'} Monitoring {activities.length} recent transactions...
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
