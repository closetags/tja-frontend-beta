'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Download, BarChart3, Users, Calendar, UserCheck, Sparkles, MapPin, Clock, TrendingUp, Activity } from 'lucide-react';

interface EventInfo {
  id: number;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
}

interface AttendanceStats {
  total_guests: number;
  checked_in: number;
  not_checked_in: number;
  attendance_rate: number;
}

interface SouvenirStats {
  collected: number;
  pending: number;
  collection_rate: number;
}

interface TimelineItem {
  time: string;
  guest_name: string;
  action: string;
}

interface ReportSummary {
  event: EventInfo;
  attendance: AttendanceStats;
  souvenirs: SouvenirStats;
  timeline: TimelineItem[];
}

interface AttendanceDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  checked_in: boolean;
  checked_in_at: string | null;
  souvenir_collected: boolean;
  souvenir_collected_at: string | null;
}

interface ActivitySummary {
  id: number;
  name: string;
  description: string;
  activity_type: string;
  is_primary: boolean;
  is_active: boolean;
  icon: string;
  color: string;
  assigned_count: number;
  accessed_count: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceDetail[]>([]);
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showActivityDetails, setShowActivityDetails] = useState(false);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchReports();
  }, [eventId, router]);

  const fetchReports = async () => {
    try {
      const [summaryResponse, detailsResponse, activitiesResponse] = await Promise.all([
        apiClient.request(`/events/${eventId}/reports/summary/`),
        apiClient.request(`/events/${eventId}/reports/attendance/`),
        apiClient.request(`/events/${eventId}/activities/`)
      ]);

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        setAttendanceDetails(detailsData);
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        if (Array.isArray(activitiesData)) {
          setActivities(activitiesData);
        } else if (Array.isArray(activitiesData?.results)) {
          setActivities(activitiesData.results);
        } else if (Array.isArray(activitiesData?.data)) {
          setActivities(activitiesData.data);
        } else {
          setActivities([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/reports/export-csv/`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${summary?.event.name}_report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to export CSV');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Report not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl" />
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
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-blue-900/10 p-10 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">{summary.event.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(summary.event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{summary.event.time}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{summary.event.venue}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleExportCSV}
              className="rounded-2xl bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#319795] text-white font-semibold shadow-lg shadow-teal-500/30 px-6"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 shadow-lg shadow-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-100">Total Guests</p>
            </div>
            <p className="text-5xl font-bold text-white mb-1">{summary.attendance.total_guests}</p>
            <p className="text-xs text-blue-100">Registered</p>
          </div>

          <div className="bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] rounded-3xl p-6 shadow-lg shadow-teal-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-teal-100">Checked In</p>
            </div>
            <p className="text-5xl font-bold text-white mb-1">{summary.attendance.checked_in}</p>
            <p className="text-xs text-teal-100">Attended</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 shadow-lg shadow-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-100">Attendance</p>
            </div>
            <p className="text-5xl font-bold text-white mb-1">{summary.attendance.attendance_rate}%</p>
            <p className="text-xs text-orange-100">Rate</p>
          </div>

          <button
            type="button"
            onClick={() => setShowActivityDetails(true)}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/30 text-left focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-indigo-100">Activities</p>
            </div>
            <p className="text-5xl font-bold text-white mb-1">{activities.length}</p>
            <p className="text-xs text-indigo-100">
              {activities.length === 1 ? 'Activity configured' : 'Activities configured'}
            </p>
          </button>
        </div>

        {/* Progress Bars */}
        <div className="grid gap-6 md:grid-cols-1 mb-6">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg shadow-gray-200/50 p-8 border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Attendance Progress</h3>
                <p className="text-sm text-gray-600">
                  {summary.attendance.checked_in} of {summary.attendance.total_guests} guests checked in
                </p>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-full transition-all"
                style={{ width: `${summary.attendance.attendance_rate}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {summary.attendance.not_checked_in} guests pending
            </p>
          </div>
        </div>

        {showActivityDetails && (
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-xl shadow-gray-200/50 p-10 mb-6 border border-white/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-xl">Activity Performance</h3>
                  <p className="text-sm text-gray-600">Assignments and completions per activity</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowActivityDetails(false)}
                className="rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all px-6"
              >
                Hide Activity Report
              </Button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No activities configured for this event yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F7FAFC] hover:bg-[#F7FAFC]">
                      <TableHead className="font-semibold text-gray-700">Activity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Type</TableHead>
                      <TableHead className="font-semibold text-gray-700">Assigned</TableHead>
                      <TableHead className="font-semibold text-gray-700">Completed</TableHead>
                      <TableHead className="font-semibold text-gray-700">Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => {
                      const completionRate =
                        activity.assigned_count === 0
                          ? 0
                          : Math.round((activity.accessed_count / activity.assigned_count) * 100);
                      return (
                        <TableRow key={activity.id} className="hover:bg-indigo-50/40 transition-colors">
                          <TableCell className="font-medium text-gray-800">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: activity.color || '#6366F1' }}
                              ></span>
                              {activity.name}
                              {activity.is_primary && (
                                <Badge className="bg-indigo-500 text-white rounded-lg">Primary</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 capitalize">{activity.activity_type.replace('_', ' ')}</TableCell>
                          <TableCell className="text-gray-700">{activity.assigned_count}</TableCell>
                          <TableCell className="text-gray-700">{activity.accessed_count}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {summary.timeline.length > 0 && (
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-xl shadow-gray-200/50 p-10 mb-6 border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-xl">Recent Check-Ins</h3>
                <p className="text-sm text-gray-600">Latest guest arrivals</p>
              </div>
            </div>
            <div className="space-y-3">
              {summary.timeline.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[#F7FAFC] hover:bg-teal-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800">{item.guest_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(item.time).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <Badge className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-xl px-4">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Checked In
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Guest List */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-xl shadow-gray-200/50 p-10 border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-xl">Detailed Guest List</h3>
                <p className="text-sm text-gray-600">Complete attendance records</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="rounded-2xl border-2 border-gray-200 hover:border-[#4FD1C5] hover:bg-teal-50 transition-all px-6"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {showDetails && (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7FAFC] hover:bg-[#F7FAFC]">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Check-In</TableHead>
                    <TableHead className="font-semibold text-gray-700">Souvenir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceDetails.map((guest) => (
                    <TableRow key={guest.id} className="hover:bg-teal-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-800">{guest.name}</TableCell>
                      <TableCell>
                        {guest.email && <div className="text-sm text-gray-700">{guest.email}</div>}
                        {guest.phone && <div className="text-sm text-gray-600">{guest.phone}</div>}
                      </TableCell>
                      <TableCell>
                        {guest.checked_in ? (
                          <div>
                            <Badge className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-xl mb-1">
                              Checked In
                            </Badge>
                            {guest.checked_in_at && (
                              <div className="text-xs text-gray-600">
                                {new Date(guest.checked_in_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="rounded-xl text-gray-600">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {guest.souvenir_collected ? (
                          <div>
                            <Badge className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl mb-1">
                              Collected
                            </Badge>
                            {guest.souvenir_collected_at && (
                              <div className="text-xs text-gray-600">
                                {new Date(guest.souvenir_collected_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="rounded-xl text-gray-600">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
