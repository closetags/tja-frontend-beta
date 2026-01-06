/**
 * useNotifications Hook
 * Custom hook for managing notifications with real-time updates
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Notification, NotificationStats } from '@/types/notification';
import { toast } from 'sonner';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from the API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.request('/notifications/?ordering=-created_at');

      if (response.ok) {
        const data = await response.json();
        const notificationList = data.results || data;
        setNotifications(notificationList);
        setUnreadCount(notificationList.filter((n: Notification) => !n.read).length);
        setError(null);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch notification statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.request('/notifications/stats/');

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  }, []);

  /**
   * Fetch only unread notifications
   */
  const fetchUnread = useCallback(async () => {
    try {
      const response = await apiClient.request('/notifications/unread/');

      if (response.ok) {
        const data = await response.json();
        const unreadList = data.notifications || data.results || data;
        setNotifications(unreadList);
        setUnreadCount(unreadList.length);
      }
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
    }
  }, []);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await apiClient.request(
        `/notifications/${notificationId}/mark_read/`,
        { method: 'POST' }
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient.request('/notifications/mark_all_read/', {
        method: 'POST',
      });

      if (response.ok) {
        const now = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read: true,
            read_at: now,
          }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } else {
        throw new Error('Failed to mark all as read');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await apiClient.request(`/notifications/${notificationId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setNotifications((prev) => {
          const filtered = prev.filter((n) => n.id !== notificationId);
          // Update unread count
          const wasUnread = prev.find((n) => n.id === notificationId && !n.read);
          if (wasUnread) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return filtered;
        });
        toast.success('Notification deleted');
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  }, []);

  /**
   * Clear all read notifications
   */
  const clearAll = useCallback(async () => {
    try {
      const response = await apiClient.request('/notifications/clear_all/', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove read notifications from local state
        setNotifications((prev) => prev.filter((n) => !n.read));
        toast.success('All read notifications cleared');
      } else {
        throw new Error('Failed to clear notifications');
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast.error('Failed to clear notifications');
    }
  }, []);

  /**
   * Refresh all notification data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchNotifications(), fetchStats()]);
    setIsLoading(false);
  }, [fetchNotifications, fetchStats]);

  // Initial load
  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    fetchNotifications();
    fetchStats();

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [fetchNotifications, fetchStats]);

  return {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchUnread,
    refresh,
  };
}
