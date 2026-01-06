'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/user-dropdown';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { apiClient } from '@/lib/api';
import { showError } from '@/lib/toast';
import { getEventStatus } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Calendar, Users, LogOut, Plus, QrCode, Gift, TrendingUp, UserCheck, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { 
  AnalyticsAreaChart, 
  AnalyticsBarChart, 
  AnalyticsPieChart, 
  ChartCard,
  StatCardWithChart,
  chartColors 
} from '@/components/analytics/charts';

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  venue: string;
  guest_count: number;
  checked_in_count: number;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  banner?: string;
}

interface AnalyticsData {
  period: { start_date: string; end_date: string; label: string };
  totals: {
    events_created: number;
    guests_added: number;
    guests_checked_in: number;
    qr_codes_generated: number;
    invitations_sent: number;
  };
  current_stats: { total_events: number; total_guests: number; active_events: number };
  trends: { events_change: number; guests_change: number; checkins_change: number };
  daily_breakdown: Array<{ date: string; events: number; guests: number; checkins: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: isCheckingAccess } = useProtectedRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [activeView, setActiveView] = useState<'overview' | 'reports'>('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;
  const [analyticsPeriod, setAnalyticsPeriod] = useState('current');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    // Only fetch events if access check is complete
    if (isCheckingAccess) {
      return;
    }

    fetchEvents();
    fetchAnalytics('current');
  }, [isCheckingAccess]);

  // Refetch analytics when period changes
  useEffect(() => {
    if (activeView === 'reports') {
      fetchAnalytics(analyticsPeriod);
    }
  }, [analyticsPeriod, activeView]);

  const fetchAnalytics = async (period: string) => {
    try {
      setIsLoadingAnalytics(true);
      const response = await apiClient.request(`/analytics/usage/monthly/?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      showError(error, 'Failed to load analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await apiClient.request('/events/');
      if (response.ok) {
        const data = await response.json();
        console.log('Events API response:', data);
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : [];
        console.log('Processed events:', items);
        setEvents(items);
      } else {
        console.error('Events API failed:', response.status, await response.text());
        showError('Failed to load events');
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showError(error, 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events based on selected tab
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const eventStatus = getEventStatus(
        event.start_date || event.date, 
        event.start_time || event.time,
        event.end_date,
        event.end_time
      );
      
      if (eventFilter === 'all') return true;
      if (eventFilter === 'active') return eventStatus.status === 'live';
      if (eventFilter === 'upcoming') return eventStatus.status === 'upcoming';
      if (eventFilter === 'past') return eventStatus.status === 'past';
      return true;
    });
  }, [events, eventFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [eventFilter]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push('/login');
  };

  if (isCheckingAccess || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8]">
      {/* Main Container with white rounded card */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-8 min-h-[calc(100vh-4rem)]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center gap-8">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`font-semibold text-base pb-2 border-b-2 transition-colors ${
                    activeView === 'overview'
                      ? 'text-[#2D3748] border-[#2D3748]'
                      : 'text-[#A0AEC0] border-transparent hover:text-[#2D3748]'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('reports')}
                  className={`font-semibold text-base pb-2 border-b-2 transition-colors ${
                    activeView === 'reports'
                      ? 'text-[#2D3748] border-[#2D3748]'
                      : 'text-[#A0AEC0] border-transparent hover:text-[#2D3748]'
                  }`}
                >
                  Analytics & Reports
                </button>
              </nav>
            </div>

            {/* Right Side - Notifications & User Dropdown */}
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <UserDropdown onLogout={handleLogout} />
            </div>
          </div>

          {/* Main Dashboard Title */}
          {activeView === 'overview' && (
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-[#2D3748]">Main Dashboard</h1>
                <Link href="/events/new">
                  <Button className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-2xl px-6 font-medium shadow-lg shadow-teal-500/30">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>

          {/* Stats Cards Row */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            {/* Today's Events */}
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-50">
              <p className="text-sm text-[#A0AEC0] mb-2">Today&apos;s Events</p>
              <p className="text-4xl font-bold text-[#2D3748] mb-4">
                {events.filter(event => {
                  const today = new Date();
                  const eventDate = new Date(event.date);
                  return eventDate.getFullYear() === today.getFullYear() &&
                         eventDate.getMonth() === today.getMonth() &&
                         eventDate.getDate() === today.getDate();
                }).length}
              </p>
              <div className="flex items-center text-xs text-[#48BB78]">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Active</span>
              </div>
            </div>

            {/* Demographics Card (Yellow) */}
            <div className="bg-gradient-to-br from-[#FFD93D] to-[#F6B93B] rounded-3xl p-6 shadow-lg shadow-yellow-500/30">
              <p className="text-sm text-gray-700 mb-2">Total Guests</p>
              <p className="text-5xl font-bold text-gray-900">
                {events.reduce((sum, event) => sum + event.guest_count, 0)}
              </p>
            </div>

            {/* Promotional Card (Teal) */}
            <div className="bg-gradient-to-br from-[#2D7A89] to-[#1E5A68] rounded-3xl p-6 shadow-lg shadow-teal-900/30 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white mb-1">Check-ins</p>
                <p className="text-xs text-teal-100 mb-3">Real-time tracking</p>
                <p className="text-3xl font-bold text-white">
                  {events.reduce((sum, event) => sum + event.checked_in_count, 0)}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -right-8 top-0 w-24 h-24 bg-white/5 rounded-full"></div>
            </div>

            {/* Design Meetings Card */}
            <div className="bg-gradient-to-br from-[#1E5A68] to-[#0D3D47] rounded-3xl p-6 shadow-lg shadow-teal-900/40 flex flex-col justify-between">
              <div>
                <p className="text-sm text-teal-100 mb-1">Active</p>
                <p className="text-base font-semibold text-white mb-3">Events</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-900">
                  {(() => {
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0];
                    return events.filter(event => {
                      const eventDate = new Date(event.date);
                      const eventDateStr = eventDate.toISOString().split('T')[0];
                      return eventDateStr >= todayStr; // Today or future events
                    }).length;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights Chart Section */}
          {analyticsData && analyticsData.daily_breakdown.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              {/* Activity Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3748]">Activity This Month</h3>
                    <p className="text-sm text-[#A0AEC0]">Daily events, guests & check-ins</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#4FD1C5] hover:text-[#38B2AC] hover:bg-teal-50 rounded-xl"
                    onClick={() => setActiveView('reports')}
                  >
                    View Details →
                  </Button>
                </div>
                <AnalyticsAreaChart
                  data={analyticsData.daily_breakdown.map(d => ({
                    name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    'Events': d.events,
                    'Guests': d.guests,
                    'Check-ins': d.checkins,
                  }))}
                  dataKeys={[
                    { key: 'Events', name: 'Events', color: chartColors.quaternary },
                    { key: 'Guests', name: 'Guests', color: chartColors.secondary },
                    { key: 'Check-ins', name: 'Check-ins', color: chartColors.primary },
                  ]}
                  height={220}
                />
              </div>

              {/* Quick Stats Donut */}
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-50">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#2D3748]">Check-in Rate</h3>
                  <p className="text-sm text-[#A0AEC0]">This month's performance</p>
                </div>
                <div className="flex flex-col items-center">
                  <AnalyticsPieChart
                    data={[
                      { 
                        name: 'Checked In', 
                        value: analyticsData.totals.guests_checked_in,
                        color: chartColors.primary 
                      },
                      { 
                        name: 'Pending', 
                        value: Math.max(0, analyticsData.totals.guests_added - analyticsData.totals.guests_checked_in),
                        color: '#E2E8F0' 
                      },
                    ]}
                    height={180}
                    innerRadius={50}
                  />
                  <div className="mt-4 text-center">
                    <p className="text-3xl font-bold text-[#2D3748]">
                      {analyticsData.totals.guests_added > 0 
                        ? Math.round((analyticsData.totals.guests_checked_in / analyticsData.totals.guests_added) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-[#A0AEC0]">
                      {analyticsData.totals.guests_checked_in} of {analyticsData.totals.guests_added} guests
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events Section */}
          <div>
            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEventFilter('all')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    eventFilter === 'all'
                      ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({events.length})
                </button>
                <button
                  onClick={() => setEventFilter('active')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    eventFilter === 'active'
                      ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Active ({events.filter(e => getEventStatus(e.start_date || e.date, e.start_time || e.time, e.end_date, e.end_time).status === 'live').length})
                </button>
                <button
                  onClick={() => setEventFilter('upcoming')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    eventFilter === 'upcoming'
                      ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Upcoming ({events.filter(e => getEventStatus(e.start_date || e.date, e.start_time || e.time, e.end_date, e.end_time).status === 'upcoming').length})
                </button>
                <button
                  onClick={() => setEventFilter('past')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    eventFilter === 'past'
                      ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Past ({events.filter(e => getEventStatus(e.start_date || e.date, e.start_time || e.time, e.end_date, e.end_time).status === 'past').length})
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#A0AEC0]">
                  Showing {filteredEvents.length > 0 ? Math.min((currentPage - 1) * eventsPerPage + 1, filteredEvents.length) : 0}-{Math.min(currentPage * eventsPerPage, filteredEvents.length)} of {filteredEvents.length}
                </span>
                <Link href="/events" className="text-[#4FD1C5] font-medium text-sm hover:text-[#38B2AC] transition-colors">
                  View All →
                </Link>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 rounded-full bg-[#F7FAFC] mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-[#CBD5E0]" />
                </div>
                {events.length === 0 ? (
                  <>
                    <p className="text-xl font-semibold text-[#2D3748] mb-2">No events yet</p>
                    <p className="text-[#A0AEC0] mb-6">Create your first event to get started</p>
                    <Link href="/events/new">
                      <Button className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-2xl px-8 font-medium">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Event
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold text-[#2D3748] mb-2">
                      No {eventFilter === 'active' ? 'active' : eventFilter === 'upcoming' ? 'upcoming' : 'past'} events
                    </p>
                    <p className="text-[#A0AEC0] mb-6">
                      {eventFilter === 'active' 
                        ? 'No events are currently live.'
                        : eventFilter === 'upcoming'
                          ? 'No upcoming events scheduled.'
                          : 'You don\'t have any past events yet.'}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage).map((event, index) => {
                  const eventStatus = getEventStatus(
                    event.start_date || event.date, 
                    event.start_time || event.time,
                    event.end_date,
                    event.end_time
                  );
                  
                  return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-teal-200 overflow-hidden hover:-translate-y-1">
                      {/* Banner */}
                      <div className="relative h-28 overflow-hidden">
                        {event.banner ? (
                          <img
                            src={event.banner.startsWith('http') ? event.banner : `${process.env.NEXT_PUBLIC_API_URL}${event.banner}`}
                            alt={`${event.name} banner`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.parentElement as HTMLElement)?.classList.add('bg-gradient-to-br', 'from-gray-100', 'to-gray-200');
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          eventStatus.status === 'live' ? 'bg-teal-500 text-white' :
                          eventStatus.status === 'upcoming' ? 'bg-purple-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {eventStatus.label}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800 mb-1 truncate group-hover:text-teal-600 transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.time}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">
                              <Users className="h-3.5 w-3.5 inline mr-1" />
                              {event.guest_count}
                            </span>
                            <span className="text-teal-600">
                              <UserCheck className="h-3.5 w-3.5 inline mr-1" />
                              {event.checked_in_count}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-700">
                            {event.guest_count > 0 ? Math.round((event.checked_in_count / event.guest_count) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {filteredEvents.length > eventsPerPage && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-sm border border-gray-200'
                    }`}
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(filteredEvents.length / eventsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                            : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-sm border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEvents.length / eventsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredEvents.length / eventsPerPage)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      currentPage === Math.ceil(filteredEvents.length / eventsPerPage)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-sm border border-gray-200'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
              </>
            )}
          </div>
          </div>
          )}

          {/* Analytics & Reports View */}
          {activeView === 'reports' && (
            <div>
              {/* Header with Period Selector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-[#2D3748] mb-2">Analytics & Reports</h1>
                  <p className="text-[#A0AEC0]">
                    {analyticsData?.period ? (
                      <>
                        Showing data from{' '}
                        <span className="font-medium text-[#2D3748]">
                          {new Date(analyticsData.period.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {' '}to{' '}
                        <span className="font-medium text-[#2D3748]">
                          {new Date(analyticsData.period.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </>
                    ) : 'Loading...'}
                  </p>
                </div>

                {/* Period Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'current', label: 'This Month' },
                    { value: 'last_month', label: 'Last Month' },
                    { value: 'last_3_months', label: '3 Months' },
                    { value: 'last_6_months', label: '6 Months' },
                    { value: 'year_to_date', label: 'Year to Date' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAnalyticsPeriod(option.value)}
                      disabled={isLoadingAnalytics}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        analyticsPeriod === option.value
                          ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                      } ${isLoadingAnalytics ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FD1C5] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                  </div>
                </div>
              ) : analyticsData ? (
                <>
                  {/* Summary Stats Cards */}
                  <div className="grid gap-6 md:grid-cols-4 mb-8">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-purple-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm text-purple-100 font-medium">Events Created</p>
                      </div>
                      <p className="text-4xl font-bold text-white mb-1">{analyticsData.totals.events_created}</p>
                      <p className="text-xs text-purple-100 flex items-center gap-1">
                        {analyticsData.trends.events_change > 0 ? (
                          <><TrendingUp className="h-3 w-3" /> +{analyticsData.trends.events_change}%</>
                        ) : analyticsData.trends.events_change < 0 ? (
                          <><TrendingUp className="h-3 w-3 rotate-180" /> {analyticsData.trends.events_change}%</>
                        ) : 'No change'} vs previous period
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 shadow-lg shadow-blue-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm text-blue-100 font-medium">Guests Added</p>
                      </div>
                      <p className="text-4xl font-bold text-white mb-1">{analyticsData.totals.guests_added}</p>
                      <p className="text-xs text-blue-100 flex items-center gap-1">
                        {analyticsData.trends.guests_change > 0 ? (
                          <><TrendingUp className="h-3 w-3" /> +{analyticsData.trends.guests_change}%</>
                        ) : analyticsData.trends.guests_change < 0 ? (
                          <><TrendingUp className="h-3 w-3 rotate-180" /> {analyticsData.trends.guests_change}%</>
                        ) : 'No change'} vs previous period
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] rounded-3xl p-6 shadow-lg shadow-teal-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm text-teal-100 font-medium">Check-ins</p>
                      </div>
                      <p className="text-4xl font-bold text-white mb-1">{analyticsData.totals.guests_checked_in}</p>
                      <p className="text-xs text-teal-100 flex items-center gap-1">
                        {analyticsData.trends.checkins_change > 0 ? (
                          <><TrendingUp className="h-3 w-3" /> +{analyticsData.trends.checkins_change}%</>
                        ) : analyticsData.trends.checkins_change < 0 ? (
                          <><TrendingUp className="h-3 w-3 rotate-180" /> {analyticsData.trends.checkins_change}%</>
                        ) : 'No change'} vs previous period
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 shadow-lg shadow-orange-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm text-orange-100 font-medium">QR Generated</p>
                      </div>
                      <p className="text-4xl font-bold text-white mb-1">{analyticsData.totals.qr_codes_generated}</p>
                      <p className="text-xs text-orange-100">For guest check-ins</p>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid gap-6 lg:grid-cols-3 mb-8">
                    {/* Activity Trend Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#2D3748]">Activity Trend</h3>
                        <p className="text-sm text-[#A0AEC0]">Daily events, guests & check-ins</p>
                      </div>
                      {analyticsData.daily_breakdown.length > 0 ? (
                        <AnalyticsAreaChart
                          data={analyticsData.daily_breakdown.map(d => ({
                            name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            'Events': d.events,
                            'Guests': d.guests,
                            'Check-ins': d.checkins,
                          }))}
                          dataKeys={[
                            { key: 'Events', name: 'Events', color: chartColors.quaternary },
                            { key: 'Guests', name: 'Guests', color: chartColors.secondary },
                            { key: 'Check-ins', name: 'Check-ins', color: chartColors.primary },
                          ]}
                          height={280}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[280px] text-gray-400">
                          No activity data for this period
                        </div>
                      )}
                    </div>

                    {/* Check-in Rate Donut */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#2D3748]">Check-in Rate</h3>
                        <p className="text-sm text-[#A0AEC0]">Guest attendance</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <AnalyticsPieChart
                          data={[
                            { 
                              name: 'Checked In', 
                              value: analyticsData.totals.guests_checked_in,
                              color: chartColors.primary 
                            },
                            { 
                              name: 'Pending', 
                              value: Math.max(0, analyticsData.totals.guests_added - analyticsData.totals.guests_checked_in),
                              color: '#E2E8F0' 
                            },
                          ]}
                          height={180}
                          innerRadius={50}
                        />
                        <div className="mt-4 text-center">
                          <p className="text-3xl font-bold text-[#2D3748]">
                            {analyticsData.totals.guests_added > 0 
                              ? Math.round((analyticsData.totals.guests_checked_in / analyticsData.totals.guests_added) * 100)
                              : 0}%
                          </p>
                          <p className="text-sm text-[#A0AEC0]">
                            {analyticsData.totals.guests_checked_in} of {analyticsData.totals.guests_added} guests
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Performance Bar Chart */}
                  <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#2D3748]">Event Attendance</h3>
                        <p className="text-sm text-[#A0AEC0]">Guests vs check-ins by event</p>
                      </div>
                      {events.length > 0 ? (
                        <AnalyticsBarChart
                          data={events.slice(0, 6).map(event => ({
                            name: event.name.length > 12 ? event.name.substring(0, 12) + '...' : event.name,
                            'Guests': event.guest_count,
                            'Checked In': event.checked_in_count,
                          }))}
                          dataKeys={[
                            { key: 'Guests', name: 'Total Guests', color: chartColors.quaternary },
                            { key: 'Checked In', name: 'Checked In', color: chartColors.primary },
                          ]}
                          height={280}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[280px] text-gray-400">
                          No events to display
                        </div>
                      )}
                    </div>

                    {/* Current Stats */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#2D3748]">Current Overview</h3>
                        <p className="text-sm text-[#A0AEC0]">All-time statistics</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-gray-700 font-medium">Total Events</span>
                          </div>
                          <span className="text-2xl font-bold text-gray-900">{analyticsData.current_stats.total_events}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-gray-700 font-medium">Total Guests</span>
                          </div>
                          <span className="text-2xl font-bold text-gray-900">{analyticsData.current_stats.total_guests}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-gray-700 font-medium">Active Events</span>
                          </div>
                          <span className="text-2xl font-bold text-gray-900">{analyticsData.current_stats.active_events}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  {analyticsData.upcoming_events && analyticsData.upcoming_events.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-[#2D3748]">Upcoming Events</h3>
                          <p className="text-sm text-[#A0AEC0]">Next 30 days</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {analyticsData.upcoming_events.map((event: any) => (
                          <Link key={event.id} href={`/events/${event.id}`}>
                            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-teal-50 rounded-2xl transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold">
                                  {new Date(event.date).getDate()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">{event.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {event.venue}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{event.guest_count}</p>
                                <p className="text-xs text-gray-500">guests</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">No Analytics Data</p>
                  <p className="text-gray-500">Start creating events to see your analytics</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
