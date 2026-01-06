/**
 * NotificationItem Component
 * Individual notification item with actions
 */
'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Users,
  Activity,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
} from 'lucide-react';
import { Notification } from '@/types/notification';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

const CATEGORY_ICONS = {
  event: Calendar,
  guest: Users,
  activity: Activity,
  team: UserPlus,
  system: Info,
};

const PRIORITY_COLORS = {
  urgent: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-blue-600 bg-blue-50',
  low: 'text-gray-600 bg-gray-50',
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, deleteNotification } = useNotifications();

  const Icon = CATEGORY_ICONS[notification.category] || Info;
  const priorityColor = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.medium;

  const handleClick = async () => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if exists
    if (notification.action_url) {
      if (onClose) onClose();
      router.push(notification.action_url);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      className={`relative px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group ${
        !notification.read ? 'bg-[#F0FAF8]' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#4FD1C5]" />
      )}

      <div className="flex gap-3 ml-2">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${priorityColor} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-sm font-semibold ${!notification.read ? 'text-[#2D3748]' : 'text-gray-700'} line-clamp-1`}>
              {notification.title}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 rounded-full"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {notification.priority === 'urgent' && (
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                Urgent
              </span>
            )}
            {notification.priority === 'high' && (
              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                Important
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
