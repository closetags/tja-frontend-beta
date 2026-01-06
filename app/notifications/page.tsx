/**
 * Notifications Page
 * Full-page view of all notifications with filtering and management
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Filter,
  Calendar,
  Users,
  Activity,
  UserPlus,
  Info,
} from 'lucide-react';
import { NotificationCategory } from '@/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { isLoading: isCheckingAccess } = useProtectedRoute();
  const { notifications, unreadCount, stats, isLoading, markAllAsRead, clearAll } =
    useNotifications();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const categories = [
    { value: 'all', label: 'All Notifications', icon: Bell, count: stats?.total || 0 },
    { value: 'event', label: 'Events', icon: Calendar, count: stats?.by_category.event || 0 },
    { value: 'guest', label: 'Guests', icon: Users, count: stats?.by_category.guest || 0 },
    { value: 'activity', label: 'Activities', icon: Activity, count: stats?.by_category.activity || 0 },
    { value: 'team', label: 'Team', icon: UserPlus, count: stats?.by_category.team || 0 },
    { value: 'system', label: 'System', icon: Info, count: stats?.by_category.system || 0 },
  ];

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (showUnreadOnly && notification.read) return false;
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
    return true;
  });

  if (isCheckingAccess || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FD1C5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white px-3 py-1 text-base">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">Manage your notifications and stay updated</p>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  className="rounded-xl border-[#4FD1C5] text-[#4FD1C5] hover:bg-[#E8F5F3]"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  onClick={clearAll}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all read
                </Button>
              )}
              <Button
                onClick={() => router.push('/settings/notifications')}
                className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-xl"
              >
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Categories */}
          <div className="col-span-3">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#4FD1C5]" />
                Filters
              </h2>

              {/* Unread toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="w-4 h-4 text-[#4FD1C5] border-gray-300 rounded focus:ring-[#4FD1C5]"
                />
                <span className="text-sm font-medium text-gray-700">Unread only</span>
              </label>

              {/* Categories */}
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.value;

                  return (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value as typeof selectedCategory)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-[#E8F5F3] text-[#2D3748] font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-[#4FD1C5]' : 'text-gray-400'}`} />
                        <span className="text-sm">{category.label}</span>
                      </div>
                      {category.count > 0 && (
                        <Badge
                          variant="secondary"
                          className={`${isSelected ? 'bg-[#4FD1C5] text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          {category.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Notifications List */}
          <div className="col-span-9">
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="rounded-full bg-[#E8F5F3] p-6 mb-4">
                    <Bell className="h-12 w-12 text-[#4FD1C5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No notifications found</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    {showUnreadOnly
                      ? "You're all caught up! No unread notifications."
                      : selectedCategory !== 'all'
                      ? `No ${selectedCategory} notifications at the moment.`
                      : "You don't have any notifications yet. We'll notify you when something happens."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
