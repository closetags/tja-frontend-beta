'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { getEventStatus } from '@/lib/utils';
import {
  ArrowLeft,
  Users,
  Search,
  CheckCircle2,
  Circle,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';

interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  checked_in: boolean;
  assigned_activities?: Array<{
    activity: number;
    activity_name: string;
    accessed: boolean;
  }>;
}

interface Activity {
  id: number;
  name: string;
  description: string;
  activity_type: string;
  icon: string;
  color: string;
  assigned_count: number;
  accessed_count: number;
}

export default function AssignGuestsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const activityId = params.activityId as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{
    assigned_count: number;
    already_assigned_count: number;
  } | null>(null);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if event is past and redirect
    const checkEventAndFetch = async () => {
      try {
        const eventResponse = await apiClient.request(`/events/${eventId}/`);
        if (eventResponse.ok) {
          const event = await eventResponse.json();
          const eventDate = event.start_date || event.date;
          const eventTime = event.start_time || event.time || '00:00';
          const status = getEventStatus(eventDate, eventTime, event.end_date, event.end_time);
          if (status.status === 'past') {
            router.replace(`/events/${eventId}/activities`);
            return;
          }
        }
        // Fetch activity and guests if event is not past
        fetchActivity();
        fetchGuests();
      } catch (error) {
        console.error('Failed to check event:', error);
        fetchActivity();
        fetchGuests();
      }
    };

    checkEventAndFetch();
  }, [eventId, activityId, router]);

  const fetchActivity = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/activities/${activityId}/`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/guests/`);
      if (response.ok) {
        const data = await response.json();
        const guestList = Array.isArray(data) ? data : data?.results || [];
        setGuests(guestList);
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allGuestIds = filteredGuests.map(g => g.id);
      setSelectedGuestIds(new Set(allGuestIds));
    } else {
      setSelectedGuestIds(new Set());
    }
  };

  const handleSelectGuest = (guestId: number, checked: boolean) => {
    const newSelected = new Set(selectedGuestIds);
    if (checked) {
      newSelected.add(guestId);
    } else {
      newSelected.delete(guestId);
    }
    setSelectedGuestIds(newSelected);
  };

  const handleAssignGuests = async () => {
    if (selectedGuestIds.size === 0) {
      alert('Please select at least one guest');
      return;
    }

    setIsAssigning(true);
    setAssignmentResult(null);

    try {
      const response = await apiClient.request(
        `/events/${eventId}/activities/${activityId}/assign-guests/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guest_ids: Array.from(selectedGuestIds)
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAssignmentResult(result);
        // Refresh activity and guests to show updated counts
        fetchActivity();
        fetchGuests();
        // Clear selection
        setSelectedGuestIds(new Set());
      } else {
        alert('Failed to assign guests');
      }
    } catch (error) {
      console.error('Failed to assign guests:', error);
      alert('Error assigning guests');
    } finally {
      setIsAssigning(false);
    }
  };

  const isGuestAssigned = (guest: Guest): boolean => {
    return guest.assigned_activities?.some(a => a.activity === parseInt(activityId)) || false;
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.phone?.includes(searchQuery)
  );

  const allSelected = filteredGuests.length > 0 && filteredGuests.every(g => selectedGuestIds.has(g.id));
  const someSelected = filteredGuests.some(g => selectedGuestIds.has(g.id)) && !allSelected;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative">
        {/* Back Button */}
        <Link
          href={`/events/${eventId}/activities`}
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors mb-6 group"
        >
          <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm group-hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-medium">Back to Activities</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Assign Guests</h1>
              {activity && (
                <>
                  <p className="text-gray-600 text-lg mb-4">
                    {activity.name}
                  </p>
                  {activity.description && (
                    <p className="text-gray-500">{activity.description}</p>
                  )}
                </>
              )}
            </div>
            {activity && (
              <div className="flex gap-4">
                <div className="bg-blue-50 rounded-2xl p-4 text-center min-w-[120px]">
                  <p className="text-sm text-gray-600 mb-1">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">{activity.assigned_count}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 text-center min-w-[120px]">
                  <p className="text-sm text-gray-600 mb-1">Accessed</p>
                  <p className="text-2xl font-bold text-green-600">{activity.accessed_count}</p>
                </div>
              </div>
            )}
          </div>

          {assignmentResult && (
            <div className="mb-6 p-6 rounded-3xl border-2 bg-green-50 border-green-200">
              <div className="flex items-start gap-4">
                <div className="text-3xl">✅</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">Assignment Complete</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-green-100">
                      <p className="text-sm text-gray-600">Newly Assigned</p>
                      <p className="text-2xl font-bold text-green-600">
                        {assignmentResult.assigned_count}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">Already Assigned</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {assignmentResult.already_assigned_count}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAssignmentResult(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search guests by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-2xl border-2 border-gray-200 focus:border-[#4FD1C5] h-12"
              />
            </div>
            <Button
              onClick={handleAssignGuests}
              disabled={selectedGuestIds.size === 0 || isAssigning}
              className="bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8D] text-white rounded-2xl px-8 h-12 font-medium shadow-lg shadow-teal-500/30"
            >
              <Users className="mr-2 h-4 w-4" />
              {isAssigning ? 'Assigning...' : `Assign ${selectedGuestIds.size} Guest${selectedGuestIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>

        {/* Guest List Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Select Guests</h2>
              <p className="text-gray-600">
                {filteredGuests.length} {filteredGuests.length === 1 ? 'guest' : 'guests'}
                {searchQuery && ' found'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-[#4FD1C5] data-[state=checked]:border-[#4FD1C5]"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Select All {filteredGuests.length > 0 && `(${filteredGuests.length})`}
              </label>
            </div>
          </div>

          {filteredGuests.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[#F7FAFC] mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-[#CBD5E0]" />
              </div>
              <p className="text-xl font-semibold text-[#2D3748] mb-2">
                {searchQuery ? 'No guests found' : 'No guests yet'}
              </p>
              <p className="text-[#A0AEC0]">
                {searchQuery ? 'Try a different search term' : 'Add guests to the event first'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGuests.map((guest) => {
                const isAssigned = isGuestAssigned(guest);
                const isSelected = selectedGuestIds.has(guest.id);

                return (
                  <div
                    key={guest.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#4FD1C5] bg-teal-50/50'
                        : isAssigned
                        ? 'border-green-200 bg-green-50/30'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Checkbox
                      id={`guest-${guest.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectGuest(guest.id, checked as boolean)}
                      className="data-[state=checked]:bg-[#4FD1C5] data-[state=checked]:border-[#4FD1C5]"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <label
                          htmlFor={`guest-${guest.id}`}
                          className="font-semibold text-gray-800 cursor-pointer"
                        >
                          {guest.name}
                        </label>
                        {isAssigned && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Already Assigned
                          </Badge>
                        )}
                        {guest.checked_in && (
                          <Badge className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-xl text-xs">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {guest.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{guest.email}</span>
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{guest.phone}</span>
                          </div>
                        )}
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
