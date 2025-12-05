/**
 * Tier Notifications Component
 * Displays tier-related notifications (low balance, grace period, etc.)
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Info, CheckCircle, X, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  notification_type: string;
  subject: string;
  message: string;
  created_at: string;
}

export const TierNotifications: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.uid)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const dismissNotification = async (id: string) => {
    setDismissed(prev => new Set([...prev, id]));

    // Mark as sent in database
    try {
      await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tokens_low':
      case 'grace_period_started':
      case 'grace_period_ending':
        return <AlertCircle className="w-5 h-5" />;
      case 'tokens_depleted':
      case 'downgraded_to_free':
      case 'payment_failed':
        return <AlertCircle className="w-5 h-5" />;
      case 'upgraded_to_paid':
      case 'auto_refill_success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'tokens_low':
      case 'grace_period_started':
      case 'grace_period_ending':
        return theme === 'light'
          ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
          : 'bg-yellow-900/20 border-yellow-700/50 text-yellow-200';
      case 'tokens_depleted':
      case 'downgraded_to_free':
      case 'payment_failed':
        return theme === 'light'
          ? 'bg-red-50 border-red-200 text-red-900'
          : 'bg-red-900/20 border-red-700/50 text-red-200';
      case 'upgraded_to_paid':
      case 'auto_refill_success':
        return theme === 'light'
          ? 'bg-green-50 border-green-200 text-green-900'
          : 'bg-green-900/20 border-green-700/50 text-green-200';
      default:
        return theme === 'light'
          ? 'bg-blue-50 border-blue-200 text-blue-900'
          : 'bg-blue-900/20 border-blue-700/50 text-blue-200';
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40 flex flex-col gap-2 max-w-md">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border-2 shadow-lg animate-slide-in-right ${getNotificationColor(notification.notification_type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.notification_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                {notification.subject}
              </h4>
              <p className="text-sm opacity-90">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                <Clock className="w-3 h-3" />
                <span>{new Date(notification.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
