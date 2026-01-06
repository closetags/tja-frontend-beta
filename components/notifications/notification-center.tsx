/**
 * NotificationCenter Component
 * Industry-standard notification dropdown with bell icon
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, Settings, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';

export function NotificationCenter() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAllAsRead, clearAll, refresh } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Show only recent unread + recent read (last 10)
  const displayNotifications = notifications.slice(0, 10);

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push('/settings/notifications');
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAll();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2.5 rounded-full hover:bg-[#E8F5F3] transition-all focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/50"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6 text-[#2D3748]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 px-1 text-xs font-bold bg-red-500 border-2 border-white shadow-md"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[420px] rounded-3xl bg-white border border-gray-200 shadow-2xl shadow-gray-300/50 p-0"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 rounded-t-3xl">
          <DropdownMenuLabel className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#4FD1C5]" />
              <span className="text-lg font-bold text-[#2D3748]">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-[#4FD1C5] text-white">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-[#E8F5F3]"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DropdownMenuLabel>

          {/* Action Bar */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 px-4 pb-3">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#4FD1C5] hover:bg-[#E8F5F3] h-7 rounded-xl"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:bg-gray-100 h-7 rounded-xl"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:bg-gray-100 h-7 rounded-xl ml-auto"
                onClick={handleSettings}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </Button>
            </div>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4FD1C5] mb-4"></div>
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="rounded-full bg-[#E8F5F3] p-4 mb-4">
                <Bell className="h-8 w-8 text-[#4FD1C5]" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No notifications</p>
              <p className="text-xs text-gray-500 text-center">
                You're all caught up! We'll notify you when something happens.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-3">
              <Button
                variant="ghost"
                className="w-full text-[#4FD1C5] hover:bg-[#E8F5F3] hover:text-[#38B2AC] font-semibold rounded-xl"
                onClick={handleViewAll}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
