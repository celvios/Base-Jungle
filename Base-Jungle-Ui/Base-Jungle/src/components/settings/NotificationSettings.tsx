import React from 'react';
import { Bell, BellOff, Zap, Award, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface NotificationSettingsProps {
  address?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ address }) => {
  const {
    settings,
    updateSettings,
    isPermissionGranted,
    isSupported,
    requestPermission
  } = usePushNotifications(address);

  if (!isSupported) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 text-yellow-400">
          <BellOff className="w-5 h-5" />
          <span className="font-mono text-sm">NOTIFICATIONS_NOT_SUPPORTED</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your browser doesn't support push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-400" />
          <h3 className="font-mono text-green-400 tracking-wider">NOTIFICATION_CONFIG</h3>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-mono ${
          isPermissionGranted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isPermissionGranted ? 'ENABLED' : 'DISABLED'}
        </div>
      </div>

      {/* Permission Request */}
      {!isPermissionGranted && (
        <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <p className="text-sm text-yellow-400 mb-3">
            Enable notifications to get alerts when your yield is ready to harvest!
          </p>
          <Button
            onClick={requestPermission}
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
          >
            <Bell className="w-4 h-4 mr-2" />
            Enable Push Notifications
          </Button>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white">All Notifications</p>
              <p className="text-xs text-gray-500">Master toggle for all alerts</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.enabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
              settings.enabled ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Harvest Reminders */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-white">Harvest Reminders</p>
              <p className="text-xs text-gray-500">Alert when yield is ready</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ harvestReminder: !settings.harvestReminder })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.harvestReminder ? 'bg-green-500' : 'bg-gray-600'
            }`}
            disabled={!settings.enabled}
          >
            <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
              settings.harvestReminder ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Milestone Alerts */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white">Milestone Alerts</p>
              <p className="text-xs text-gray-500">Celebrate earning achievements</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ milestoneAlerts: !settings.milestoneAlerts })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.milestoneAlerts ? 'bg-green-500' : 'bg-gray-600'
            }`}
            disabled={!settings.enabled}
          >
            <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
              settings.milestoneAlerts ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Min USDC</span>
            </div>
            <input
              type="number"
              value={settings.yieldThreshold}
              onChange={(e) => updateSettings({ yieldThreshold: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono"
              min="0"
              step="0.1"
            />
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Hours Between</span>
            </div>
            <input
              type="number"
              value={settings.intervalHours}
              onChange={(e) => updateSettings({ intervalHours: parseInt(e.target.value) || 1 })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono"
              min="1"
              max="24"
            />
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="mt-4 p-3 rounded bg-black/50 font-mono text-xs">
        <div className="text-gray-500">{'>'} notification_status</div>
        <div className={settings.enabled ? 'text-green-400' : 'text-red-400'}>
          [{settings.enabled ? 'ACTIVE' : 'INACTIVE'}] Push notifications
        </div>
        <div className="text-gray-400">
          [INFO] Min threshold: ${settings.yieldThreshold} USDC
        </div>
        <div className="text-gray-400">
          [INFO] Cooldown: {settings.intervalHours}h between alerts
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

