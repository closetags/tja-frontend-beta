/**
 * Notification System Types
 * Type definitions for the notification system
 */

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationCategory =
  | 'event'
  | 'guest'
  | 'activity'
  | 'team'
  | 'system';

export interface Notification {
  id: string;
  organization: string;
  organization_name: string;
  user: number;
  user_name: string;
  notification_type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: NotificationPriority;
  channels: string[];
  action_url: string;
  action_label: string;
  read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_priority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  by_category: {
    event: number;
    guest: number;
    activity: number;
    team: number;
    system: number;
  };
}

export interface NotificationPreference {
  id?: string;
  user?: number;
  organization?: string;
  notification_type: string;
  label?: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  enabled_channels?: string[];
  digest_mode: boolean;
  digest_frequency: 'hourly' | 'daily' | 'weekly';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at?: string;
  updated_at?: string;
}
