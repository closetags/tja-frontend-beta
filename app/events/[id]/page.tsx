'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { showError, showSuccess, showWarning } from '@/lib/toast';
import { getEventStatus } from '@/lib/utils';
import { normalizeTimezone } from '@/lib/timezones';
import { ArrowLeft, Upload, UserPlus, Trash2, Edit, Gift, Camera, BarChart, Calendar, MapPin, Users, UserCheck, QrCode, Mail, Loader2, Bell } from 'lucide-react';

interface Guest {
  id: number;
  salutation: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  status_display: string;
  checked_in: boolean;
  souvenir_collected: boolean;
  invitation_sent: boolean;
  invitation_qr_token: string;
  souvenir_qr_token: string;
  assigned_activities?: {
    id: number;
    activity: number;
    activity_name: string;
    activity_icon: string;
    activity_color: string;
    activity_type: string;
    is_primary: boolean;
    accessed: boolean;
    accessed_at: string | null;
    assigned_at: string;
    notes?: string;
  }[];
}

interface Event {
  id: number;
  name: string;
  description: string;
  // Legacy fields
  date: string;
  time: string;
  venue: string;
  // New expanded date/time fields
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  timezone?: string;
  // New expanded location fields
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  zip_code?: string;
  // Other fields
  banner: string | null;
  custom_message: string;
  guest_count: number;
  checked_in_count: number;
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);
  const [pageSize, setPageSize] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isGuestsLoading, setIsGuestsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchEventDetails();
  }, [eventId, router]);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      return;
    }

    fetchGuests(currentPage, debouncedSearch);
  }, [eventId, currentPage, debouncedSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, eventId]);

  useEffect(() => {
    setSelectedGuestIds([]);
  }, [currentPage, debouncedSearch]);

  // Add refresh when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchGuests(currentPage, debouncedSearch);
        fetchEventDetails();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [eventId, currentPage, debouncedSearch]);

  const fetchEventDetails = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else {
        showError('Failed to load event details');
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
      showError(error, 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuests = async (page = currentPage, search = debouncedSearch) => {
    try {
      setIsGuestsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) {
        params.set('search', search);
      }
      // Add timestamp to prevent caching
      params.set('_t', Date.now().toString());
      
      const query = params.toString();
      const response = await apiClient.request(
        query ? `/events/${eventId}/guests/?${query}` : `/events/${eventId}/guests/`
      );
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        const total = typeof data?.count === 'number' ? data.count : items.length;

        let resolvedPageSize = pageSize;
        if (items.length > 0 && items.length > (pageSize || 0)) {
          resolvedPageSize = items.length;
          setPageSize(items.length);
        } else if (!resolvedPageSize) {
          resolvedPageSize = items.length || 100;
          if (pageSize === 0) {
            setPageSize(resolvedPageSize);
          }
        }
        const sizeForPagination = resolvedPageSize || 1;
        const computedTotalPages = Math.max(1, Math.ceil(Math.max(total, 0) / sizeForPagination));

        if (total > 0 && items.length === 0 && page > computedTotalPages) {
          setTotalGuests(total);
          setTotalPages(computedTotalPages);
          setIsGuestsLoading(false);
          setCurrentPage(computedTotalPages);
          return;
        }

        setGuests(items);
        setTotalGuests(total);
        setTotalPages(computedTotalPages);
        setSelectedGuestIds((prev) =>
          prev.filter((id) => items.some((guest) => guest.id === id))
        );
      } else {
        console.error('Failed to fetch guests, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    } finally {
      setIsGuestsLoading(false);
    }
  };

  const deleteGuest = async (guestId: number) => {
    if (!confirm('Are you sure you want to delete this guest?')) {
      return;
    }

    try {
      const response = await apiClient.request(`/events/${eventId}/guests/${guestId}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showSuccess('Guest deleted successfully');
        fetchGuests(currentPage, debouncedSearch);
        fetchEventDetails();
      } else {
        showError('Failed to delete guest');
      }
    } catch (error) {
      console.error('Failed to delete guest:', error);
      showError(error, 'Failed to delete guest');
    }
  };

  const [isDistributingInvitations, setIsDistributingInvitations] = useState(false);
  const [invitationDistributionResult, setInvitationDistributionResult] = useState<{
    sent_count: number;
    failed_count: number;
    errors: { guest_name: string; error: string }[];
  } | null>(null);

  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<{
    sent_count: number;
    failed_count: number;
    skipped_count: number;
    errors: { guest_name: string; error: string }[];
  } | null>(null);

  // Count confirmed guests for the reminder button
  const confirmedGuestsCount = guests.filter(g => g.status === 'invitation_accepted').length;

  const handleDistributeInvitations = async (targetGuestIds?: number[]) => {
    const isTargeted = Array.isArray(targetGuestIds) && targetGuestIds.length > 0;
    const confirmationMessage = isTargeted
      ? `Send invitation QR codes to ${targetGuestIds.length} selected guest(s)?`
      : 'Send invitation QR codes to all guests with email addresses?';

    if (!confirm(confirmationMessage)) {
      return;
    }

    setIsDistributingInvitations(true);
    setInvitationDistributionResult(null);

    try {
      const response = await apiClient.request(
        `/events/${eventId}/guests/distribute-invitations/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isTargeted
              ? { guest_ids: targetGuestIds }
              : {}
          )
        }
      );

      if (response.ok) {
        const result = await response.json();
        setInvitationDistributionResult(result);
        // Refresh guest list to show updated status
        // Add a small delay to ensure DB write propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchGuests(currentPage, debouncedSearch);
        if (isTargeted) {
          setSelectedGuestIds((prev) =>
            prev.filter((id) => !targetGuestIds.includes(id))
          );
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to send invitation codes';
        showError(errorData, 'Failed to send invitations');
      }
    } catch (error) {
      console.error('Failed to distribute invitations:', error);
      showError(error, 'Error sending invitations');
    } finally {
      setIsDistributingInvitations(false);
    }
  };

  const handleSendReminders = async () => {
    // Get confirmed guest IDs from current selection, or all confirmed guests
    const confirmedSelectedIds = selectedGuestIds.filter(id => 
      guests.find(g => g.id === id && g.status === 'invitation_accepted')
    );
    
    const targetIds = confirmedSelectedIds.length > 0 ? confirmedSelectedIds : undefined;
    const targetCount = targetIds ? targetIds.length : confirmedGuestsCount;

    if (targetCount === 0) {
      showWarning('No confirmed guests', 'Reminders can only be sent to guests who have accepted their invitation.');
      return;
    }

    const confirmationMessage = targetIds
      ? `Send reminder emails to ${targetIds.length} selected confirmed guest(s)?`
      : `Send reminder emails to all ${confirmedGuestsCount} confirmed guests?`;

    if (!confirm(confirmationMessage)) {
      return;
    }

    setIsSendingReminders(true);
    setReminderResult(null);

    try {
      const response = await apiClient.request(
        `/events/${eventId}/guests/send-reminders/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetIds ? { guest_ids: targetIds } : {})
        }
      );

      if (response.ok) {
        const result = await response.json();
        setReminderResult(result);
        showSuccess('Reminders sent successfully');
        await fetchGuests(currentPage, debouncedSearch);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(errorData, 'Failed to send reminders');
      }
    } catch (error) {
      console.error('Failed to send reminders:', error);
      showError(error, 'Error sending reminders');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const toggleGuestSelection = (guestId: number, checked: boolean) => {
    // Clear "select all across pages" when individual selection changes
    setSelectAllAcrossPages(false);
    setSelectedGuestIds((prev) => {
      if (checked) {
        return prev.includes(guestId) ? prev : [...prev, guestId];
      }
      return prev.filter((id) => id !== guestId);
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGuestIds(guests.map((guest) => guest.id));
    } else {
      setSelectedGuestIds([]);
      setSelectAllAcrossPages(false);
    }
  };

  const handleSelectAllAcrossPages = () => {
    setSelectAllAcrossPages(true);
  };

  const clearSelection = () => {
    setSelectedGuestIds([]);
    setSelectAllAcrossPages(false);
  };

  const handleBulkDelete = async () => {
    const deleteCount = selectAllAcrossPages ? totalGuests : selectedGuestIds.length;
    const confirmMessage = selectAllAcrossPages 
      ? `Are you sure you want to delete ALL ${totalGuests} guests? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedGuestIds.length} selected guest(s)? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const body = selectAllAcrossPages 
        ? { all: true }
        : { guest_ids: selectedGuestIds };
      
      const response = await apiClient.request(`/events/${eventId}/guests/bulk-delete/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess(`Successfully deleted ${result.deleted_count} guest(s)`);
        clearSelection();
        // Reset to page 1 after bulk delete
        setCurrentPage(1);
        await fetchGuests(1, debouncedSearch);
        await fetchEventDetails();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(errorData, 'Failed to delete guests');
      }
    } catch (error) {
      console.error('Failed to delete guests:', error);
      showError(error, 'Error deleting guests');
    } finally {
      setIsDeleting(false);
    }
  };

  const allGuestsSelected = guests.length > 0 && selectedGuestIds.length === guests.length;
  const hasSelectedGuests = selectedGuestIds.length > 0 || selectAllAcrossPages;
  const effectivePageSize = pageSize || guests.length || 1;
  const pageStart = totalGuests === 0 ? 0 : Math.min((currentPage - 1) * effectivePageSize + 1, totalGuests);
  const pageEnd =
    totalGuests === 0
      ? 0
      : Math.min(pageStart + Math.max(guests.length - 1, 0), totalGuests);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Event not found</p>
      </div>
    );
  }

  // Check if event is past
  const eventStatus = getEventStatus(
    event.start_date || event.date, 
    event.start_time || event.time || '00:00',
    event.end_date,
    event.end_time
  );
  const isPastEvent = eventStatus.status === 'past';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative">
        {/* Back Button */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors mb-6 group"
        >
          <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm group-hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-medium">Back to Dashboard</span>
        </Link>

        {/* Event Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] shadow-lg shadow-teal-500/30">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-800">{event.name}</h1>
                    {(() => {
                      const eventStatus = getEventStatus(
                        event.start_date || event.date, 
                        event.start_time || event.time || '00:00',
                        event.end_date,
                        event.end_time
                      );
                      return (
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${eventStatus.bgColor} border border-current`}>
                          <div className={`w-2 h-2 rounded-full ${eventStatus.status === 'live' ? 'animate-pulse' : ''} ${eventStatus.dotColor}`}></div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${eventStatus.color}`}>
                            {eventStatus.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col gap-2 mt-2 text-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {event.start_date
                            ? new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                          }
                        </span>
                      </div>
                      {(event.start_time || event.time) && (
                        <>
                          <span>•</span>
                          <span>{event.start_time || event.time}</span>
                        </>
                      )}
                      {event.timezone && (
                        <>
                          <span>•</span>
                          <span className="text-sm">({normalizeTimezone(event.timezone) || event.timezone})</span>
                        </>
                      )}
                    </div>
                    {event.end_date && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">Ends:</span>
                        <span>
                          {new Date(event.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {event.end_time && (
                          <>
                            <span>•</span>
                            <span>{event.end_time}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {event.address || event.venue}
                        {event.city && `, ${event.city}`}
                        {event.state && `, ${event.state}`}
                        {event.zip_code && ` ${event.zip_code}`}
                        {event.country && `, ${event.country}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Banner */}
              {event.banner && (
                <div className="mt-6 rounded-3xl overflow-hidden border-2 border-teal-200 shadow-lg">
                  <img
                    src={event.banner.startsWith('http') ? event.banner : `${process.env.NEXT_PUBLIC_API_URL}${event.banner}`}
                    alt={`${event.name} banner`}
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      console.error('Failed to load banner:', event.banner);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {event.description && (
                <p className="text-gray-600 text-lg leading-relaxed pl-20 mt-6">{event.description}</p>
              )}
            </div>

            {isPastEvent ? (
              <Button 
                variant="outline"
                disabled
                className="rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed px-6"
                title="Past events cannot be edited"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Button>
            ) : (
              <Link href={`/events/${eventId}/edit`}>
                <Button 
                  variant="outline"
                  className="rounded-2xl border-2 border-gray-200 hover:border-[#4FD1C5] hover:bg-teal-50 transition-all px-6"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </Button>
              </Link>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Guests</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{event.guest_count}</p>
            </div>

            <div className="bg-gradient-to-br from-[#4FD1C5]/20 to-[#38B2AC]/20 rounded-2xl p-6 border border-teal-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#4FD1C5] flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Checked In</p>
              </div>
              <p className="text-3xl font-bold text-[#4FD1C5]">{event.checked_in_count}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 border border-orange-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
              </div>
              <p className="text-3xl font-bold text-orange-600">{event.guest_count - event.checked_in_count}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Attendance</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {event.guest_count > 0 ? Math.round((event.checked_in_count / event.guest_count) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Link href={`/events/${eventId}/activities`}>
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all border border-white/50 hover:border-teal-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Activities</h3>
                  <p className="text-sm text-gray-600">Manage access</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Create custom activities and assign guests for flexible access control</p>
            </div>
          </Link>

          <Link href={`/events/${eventId}/scanner`}>
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-green-500/20 transition-all border border-white/50 hover:border-green-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                  <Camera className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Scanner</h3>
                  <p className="text-sm text-gray-600">Activity verification</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Scan guest QR codes and verify access to activities</p>
            </div>
          </Link>

          <Link href={`/events/${eventId}/reports`}>
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all border border-white/50 hover:border-blue-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <BarChart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Reports</h3>
                  <p className="text-sm text-gray-600">Analytics & insights</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">View detailed statistics and export attendance data</p>
            </div>
          </Link>
        </div>

        {/* Guest List Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Guest List</h2>
                <p className="text-gray-600">{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'} registered</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {isPastEvent ? (
                <>
                  <Button
                    disabled
                    className="bg-gray-200 text-gray-400 rounded-2xl px-6 font-medium cursor-not-allowed"
                    title="Past events cannot be modified"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitations
                  </Button>
                  <Button
                    disabled
                    className="bg-gray-200 text-gray-400 rounded-2xl px-6 font-medium cursor-not-allowed"
                    title="Past events cannot be modified"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Send Reminders
                  </Button>
                  <Button 
                    disabled
                    className="bg-gray-200 text-gray-400 rounded-2xl px-6 font-medium cursor-not-allowed"
                    title="Past events cannot be modified"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                  <Button 
                    variant="outline"
                    disabled
                    className="rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed px-6"
                    title="Past events cannot be modified"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Guest
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleDistributeInvitations(selectedGuestIds.length > 0 ? selectedGuestIds : undefined)}
                    disabled={isDistributingInvitations || guests.length === 0}
                    className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#653a8b] text-white rounded-2xl px-6 font-medium shadow-lg shadow-purple-500/30"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isDistributingInvitations 
                      ? 'Sending...' 
                      : selectedGuestIds.length > 0 
                        ? `Send Invitations (${selectedGuestIds.length})`
                        : 'Send Invitations to All'
                    }
                  </Button>
                  <Button
                    onClick={handleSendReminders}
                    disabled={isSendingReminders || confirmedGuestsCount === 0}
                    className="bg-gradient-to-r from-[#F6AD55] to-[#ED8936] hover:from-[#ED8936] hover:to-[#DD6B20] text-white rounded-2xl px-6 font-medium shadow-lg shadow-orange-500/30"
                    title={confirmedGuestsCount === 0 ? 'No confirmed guests to remind' : `Send reminders to ${confirmedGuestsCount} confirmed guest(s)`}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isSendingReminders 
                      ? 'Sending...' 
                      : `Send Reminders (${confirmedGuestsCount})`
                    }
                  </Button>
                  <Link href={`/events/${eventId}/guests/upload`}>
                    <Button className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-2xl px-6 font-medium shadow-lg shadow-teal-500/30">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV
                    </Button>
                  </Link>
                  <Link href={`/events/${eventId}/guests/new`}>
                    <Button 
                      variant="outline"
                      className="rounded-2xl border-2 border-gray-200 hover:border-[#4FD1C5] hover:bg-teal-50 transition-all px-6"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Guest
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {invitationDistributionResult && (
            <div className={`mb-6 p-6 rounded-3xl border-2 ${
              invitationDistributionResult.failed_count === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">
                  {invitationDistributionResult.failed_count === 0 ? '✅' : '⚠️'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    Invitation Distribution Complete
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white rounded-2xl p-4 border border-green-100">
                      <p className="text-sm text-gray-600">Sent Successfully</p>
                      <p className="text-2xl font-bold text-green-600">
                        {invitationDistributionResult.sent_count}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-red-100">
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {invitationDistributionResult.failed_count}
                      </p>
                    </div>
                  </div>
                  {invitationDistributionResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Errors:</p>
                      <div className="space-y-1">
                        {invitationDistributionResult.errors.slice(0, 5).map((error, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            • {error.guest_name}: {error.error}
                          </p>
                        ))}
                        {invitationDistributionResult.errors.length > 5 && (
                          <p className="text-sm text-gray-500 italic">
                            ...and {invitationDistributionResult.errors.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setInvitationDistributionResult(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {reminderResult && (
            <div className={`mb-6 p-6 rounded-3xl border-2 ${
              reminderResult.failed_count === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">
                  {reminderResult.failed_count === 0 ? '🔔' : '⚠️'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    Reminders Sent
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-white rounded-2xl p-4 border border-green-100">
                      <p className="text-sm text-gray-600">Sent Successfully</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reminderResult.sent_count}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-red-100">
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reminderResult.failed_count}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <p className="text-sm text-gray-600">Skipped</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {reminderResult.skipped_count}
                      </p>
                    </div>
                  </div>
                  {reminderResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Errors:</p>
                      <div className="space-y-1">
                        {reminderResult.errors.slice(0, 5).map((error, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            • {error.guest_name}: {error.error}
                          </p>
                        ))}
                        {reminderResult.errors.length > 5 && (
                          <p className="text-sm text-gray-500 italic">
                            ...and {reminderResult.errors.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setReminderResult(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {!isGuestsLoading && totalGuests === 0 ? (
            debouncedSearch ? (
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F7FAFC] mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-[#CBD5E0]" />
                </div>
                <p className="text-xl font-semibold text-[#2D3748] mb-2">No guests found</p>
                <p className="text-[#A0AEC0] mb-6">No guests match “{debouncedSearch}”. Try adjusting your search.</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="rounded-2xl border-2 border-gray-200"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F7FAFC] mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-[#CBD5E0]" />
                </div>
                <p className="text-xl font-semibold text-[#2D3748] mb-2">No guests yet</p>
                <p className="text-[#A0AEC0] mb-6">Add guests individually or upload a CSV file to get started</p>
              </div>
            )
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guests by name, email, or phone..."
                  className="w-full max-w-xs rounded-2xl border border-gray-200 bg-[#F7FAFC] px-4 py-2.5 text-sm focus:border-[#4FD1C5] focus:ring-[#4FD1C5] transition-colors"
                />
              </div>

              {/* Gmail-style Selection Action Bar */}
              {hasSelectedGuests && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-blue-800">
                        {selectAllAcrossPages 
                          ? `All ${totalGuests} guests selected`
                          : `${selectedGuestIds.length} guest${selectedGuestIds.length !== 1 ? 's' : ''} selected`
                        }
                      </span>
                      {allGuestsSelected && !selectAllAcrossPages && totalGuests > guests.length && (
                        <button
                          onClick={handleSelectAllAcrossPages}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                        >
                          Select all {totalGuests} guests
                        </button>
                      )}
                      <button
                        onClick={clearSelection}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting 
                          ? 'Deleting...' 
                          : `Delete ${selectAllAcrossPages ? `All (${totalGuests})` : `(${selectedGuestIds.length})`}`
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isGuestsLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7FAFC] hover:bg-[#F7FAFC]">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allGuestsSelected}
                        onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                        aria-label="Select all guests"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id} className="hover:bg-teal-50/50 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedGuestIds.includes(guest.id)}
                          onCheckedChange={(checked) =>
                            toggleGuestSelection(guest.id, Boolean(checked))
                          }
                          aria-label={`Select ${guest.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {guest.salutation ? `${guest.salutation} ${guest.name}` : guest.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {guest.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {guest.email}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">{guest.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 flex-wrap">
                            {/* Guest invitation status */}
                            {guest.status === 'checked_in' ? (
                              <Badge className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-xl px-3">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Checked In
                              </Badge>
                            ) : guest.status === 'invitation_accepted' ? (
                              <Badge className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-3">
                                ✓ Accepted
                              </Badge>
                            ) : guest.status === 'invitation_declined' ? (
                              <Badge className="bg-red-400 hover:bg-red-500 text-white rounded-xl px-3">
                                ✗ Declined
                              </Badge>
                            ) : guest.status === 'invitation_sent' ? (
                              <Badge className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-3">
                                <Mail className="h-3 w-3 mr-1" />
                                Invitation Sent
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 rounded-xl px-3">
                                Awaiting Invite
                              </Badge>
                            )}
                            {guest.souvenir_collected && (
                              <Badge className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-3">
                                <Gift className="h-3 w-3 mr-1" />
                                Souvenir
                              </Badge>
                            )}
                          </div>
                          {/* Only show activity status for guests who accepted invitation or checked in */}
                          {guest.assigned_activities && guest.assigned_activities.length > 0 && 
                           (guest.status === 'invitation_accepted' || guest.status === 'checked_in') && (
                            <div className="flex flex-wrap gap-2">
                              {guest.assigned_activities.map((activity) => {
                                const accessed = activity.accessed;
                                const activityColor = activity.activity_color || '#CBD5E0';
                                return (
                                  <span
                                    key={activity.id}
                                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs font-semibold ${
                                      accessed
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                                    style={{
                                      borderColor: accessed ? undefined : activityColor,
                                    }}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor: accessed ? '#10B981' : activityColor,
                                      }}
                                    ></span>
                                    <span>{activity.activity_name}</span>
                                    <span className="uppercase tracking-wide text-[10px]">
                                      {accessed ? 'Completed' : 'Pending'}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isPastEvent ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                              title="Past events cannot be edited"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Link href={`/events/${eventId}/guests/${guest.id}/edit`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteGuest(guest.id)}
                            disabled={isPastEvent}
                            className={`rounded-xl ${isPastEvent ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-400 hover:text-red-600'}`}
                            title={isPastEvent ? "Past events cannot be modified" : undefined}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
                {totalGuests > 0 && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                    <p>
                      Showing {pageStart}-{pageEnd} of {totalGuests} guests
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={currentPage === 1 || isGuestsLoading}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="rounded-xl"
                      >
                        Previous
                      </Button>
                      <span className="text-gray-700">
                        Page {totalGuests === 0 ? 0 : currentPage} of {totalGuests === 0 ? 0 : totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={currentPage >= totalPages || isGuestsLoading || totalGuests === 0}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className="rounded-xl"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
