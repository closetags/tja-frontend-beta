'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { getEventStatus } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Star,
  Gift,
  Ticket,
  Crown,
  Utensils,
  Presentation
} from 'lucide-react';

interface Activity {
  id: number;
  name: string;
  description: string;
  activity_type: 'check_in' | 'privilege' | 'collection';
  is_primary: boolean;
  is_active: boolean;
  icon: string;
  color: string;
  requires_scan: boolean;
  assigned_count: number;
  accessed_count: number;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  venue: string;
}

const iconMap: Record<string, any> = {
  ticket: Ticket,
  gift: Gift,
  star: Star,
  crown: Crown,
  utensils: Utensils,
  presentation: Presentation,
};

const activityTypeLabels: Record<string, string> = {
  check_in: 'Check-in',
  privilege: 'Privilege',
  collection: 'Collection',
};

export default function ActivitiesPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchEvent();
    fetchActivities();
  }, [eventId, router]);

  const fetchEvent = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/activities/`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setActivities(data);
        } else if (Array.isArray(data?.results)) {
          setActivities(data.results);
        } else if (Array.isArray(data?.data)) {
          setActivities(data.data);
        } else {
          setActivities([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteActivity = async (activityId: number) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity?.is_primary) {
      alert('Cannot delete primary check-in activity');
      return;
    }

    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const response = await apiClient.request(`/events/${eventId}/activities/${activityId}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Star;
    return IconComponent;
  };

  const getAccessRate = (activity: Activity) => {
    if (activity.assigned_count === 0) return 0;
    return Math.round((activity.accessed_count / activity.assigned_count) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if event is past
  const isPastEvent = event ? getEventStatus(
    event.start_date || event.date, 
    event.start_time || event.time || '00:00',
    event.end_date,
    event.end_time
  ).status === 'past' : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative">
        {/* Back Button */}
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors mb-6 group"
        >
          <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm group-hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-medium">Back to Event</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Activity Management</h1>
              {event && (
                <p className="text-gray-600 text-lg">
                  {event.name} • {new Date(event.date).toLocaleDateString()}
                </p>
              )}
              <p className="text-gray-500 mt-2">
                Create and manage custom activities for your event. Assign guests to activities for flexible access control.
              </p>
            </div>
            {isPastEvent ? (
              <Button 
                disabled
                className="bg-gray-200 text-gray-400 rounded-2xl px-6 font-medium cursor-not-allowed"
                title="Past events cannot be modified"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Activity
              </Button>
            ) : (
              <Link href={`/events/${eventId}/activities/new`}>
                <Button className="bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8D] text-white rounded-2xl px-6 font-medium shadow-lg shadow-teal-500/30">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Activity
                </Button>
              </Link>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{activities.length}</p>
            </div>

            <div className="bg-gradient-to-br from-[#4FD1C5]/20 to-[#38B2AC]/20 rounded-2xl p-6 border border-teal-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#4FD1C5] flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              </div>
              <p className="text-3xl font-bold text-[#4FD1C5]">
                {activities.reduce((sum, a) => sum + a.assigned_count, 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Accessed</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {activities.reduce((sum, a) => sum + a.accessed_count, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Activities</h2>
              <p className="text-gray-600">{activities.length} {activities.length === 1 ? 'activity' : 'activities'} configured</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[#F7FAFC] mx-auto mb-4 flex items-center justify-center">
                <Star className="h-10 w-10 text-[#CBD5E0]" />
              </div>
              <p className="text-xl font-semibold text-[#2D3748] mb-2">No activities yet</p>
              <p className="text-[#A0AEC0] mb-6">Create your first activity to get started with flexible access control</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const IconComponent = getIconComponent(activity.icon);
                const accessRate = getAccessRate(activity);

                return (
                  <div
                    key={activity.id}
                    className="bg-white border-2 border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                        style={{ backgroundColor: activity.color }}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">{activity.name}</h3>
                              {activity.is_primary && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl">
                                  Primary
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="rounded-xl"
                              >
                                {activityTypeLabels[activity.activity_type]}
                              </Badge>
                            </div>
                            {activity.description && (
                              <p className="text-gray-600">{activity.description}</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Hide Assign Guests for check-in since guests are auto-assigned */}
                            {activity.activity_type !== 'check_in' && !isPastEvent && (
                              <Link href={`/events/${eventId}/activities/${activity.id}/assign`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl hover:bg-teal-50 hover:border-[#4FD1C5]"
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Assign Guests
                                </Button>
                              </Link>
                            )}
                            {!activity.is_primary && !isPastEvent && (
                              <>
                                <Link href={`/events/${eventId}/activities/${activity.id}/edit`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl hover:bg-blue-50 hover:border-blue-400"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteActivity(activity.id)}
                                  className="rounded-xl hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-sm text-gray-600 mb-1">Assigned Guests</p>
                            <p className="text-2xl font-bold text-blue-600">{activity.assigned_count}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-sm text-gray-600 mb-1">Accessed</p>
                            <p className="text-2xl font-bold text-green-600">{activity.accessed_count}</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-sm text-gray-600 mb-1">Access Rate</p>
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold text-purple-600">{accessRate}%</p>
                              {accessRate > 0 && (
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-purple-500 h-full rounded-full transition-all"
                                    style={{ width: `${accessRate}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
