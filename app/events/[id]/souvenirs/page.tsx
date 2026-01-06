'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Download, Mail, Gift, QrCode, Sparkles, Package } from 'lucide-react';

interface SouvenirStats {
  total_guests: number;
  souvenirs_collected: number;
  souvenirs_pending: number;
  collection_rate: number;
}

interface Event {
  id: number;
  name: string;
  date: string;
  venue: string;
}

export default function SouvenirStatsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<SouvenirStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState<{
    sent_count: number;
    failed_count: number;
    errors: { guest_name: string; error: string }[];
  } | null>(null);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [eventId, router]);

  const fetchData = async () => {
    try {
      const [eventResponse, statsResponse] = await Promise.all([
        apiClient.request(`/events/${eventId}/`),
        apiClient.request(`/events/${eventId}/souvenir-stats/`)
      ]);

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEvent(eventData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistribute = async () => {
    if (!confirm('Send souvenir QR codes to all guests with email addresses?')) {
      return;
    }

    setIsDistributing(true);
    setDistributionResult(null);

    try {
      const response = await apiClient.request(
        `/events/${eventId}/guests/distribute-souvenirs/`,
        {
          method: 'POST',
          body: JSON.stringify({})
        }
      );

      if (response.ok) {
        const result = await response.json();
        setDistributionResult(result);
      } else {
        alert('Failed to distribute souvenir codes');
      }
    } catch (error) {
      alert('An error occurred while distributing codes');
    } finally {
      setIsDistributing(false);
    }
  };

  const handleDownloadQR = async (type: 'invitation' | 'souvenir' | 'all') => {
    try {
      const response = await apiClient.request(
        `/events/${eventId}/download-qr-codes/?type=${type}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event?.name}_${type}_qr_codes.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to download QR codes');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative">
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

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-purple-900/10 p-10 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{event.name}</h1>
              <p className="text-gray-600 mt-1">Souvenir Collection Statistics</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Total Guests</p>
            </div>
            <p className="text-4xl font-bold text-gray-800">{stats.total_guests}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center shadow-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Collected</p>
            </div>
            <p className="text-4xl font-bold text-[#4FD1C5]">
              {stats.souvenirs_collected}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Pending</p>
            </div>
            <p className="text-4xl font-bold text-orange-600">
              {stats.souvenirs_pending}
            </p>
          </div>
        </div>

        {/* Collection Rate Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-purple-900/10 p-10 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Collection Rate</h2>
              <p className="text-gray-600">Percentage of guests who collected their souvenirs</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-full transition-all"
                style={{ width: `${stats.collection_rate}%` }}
              />
            </div>
            <p className="text-5xl font-bold text-center bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] bg-clip-text text-transparent">
              {stats.collection_rate}%
            </p>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10 mb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Actions</h2>
              <p className="text-gray-600">Distribute souvenir QR codes and download files</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Button
              onClick={handleDistribute}
              disabled={isDistributing}
              className="h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30"
            >
              <Mail className="mr-2 h-5 w-5" />
              {isDistributing ? 'Sending...' : 'Send to All Guests'}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDownloadQR('souvenir')}
              className="h-14 rounded-2xl border-2 border-gray-200 hover:border-[#4FD1C5] hover:bg-teal-50 transition-all"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Souvenir QRs
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDownloadQR('invitation')}
              className="h-14 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Invitation QRs
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDownloadQR('all')}
              className="h-14 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <Download className="mr-2 h-5 w-5" />
              Download All QRs
            </Button>

            <Link href={`/events/${eventId}/souvenirs/scan`}>
              <Button 
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Scan Souvenirs
              </Button>
            </Link>
          </div>

          {/* Distribution Result */}
          {distributionResult && (
            <div className="p-6 rounded-3xl bg-green-50 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900 mb-3">Distribution Complete</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-800">✓ Sent: <span className="font-semibold">{distributionResult.sent_count}</span></p>
                    {distributionResult.failed_count > 0 && (
                      <>
                        <p className="text-red-600">
                          ✗ Failed: <span className="font-semibold">{distributionResult.failed_count}</span>
                        </p>
                        {distributionResult.errors.length > 0 && (
                          <div className="mt-3 p-4 bg-red-100 rounded-2xl">
                            <p className="font-semibold text-red-900 mb-2">Errors:</p>
                            {distributionResult.errors.map((err: { guest_name: string; error: string }, idx: number) => (
                              <p key={idx} className="text-red-700">
                                • {err.guest_name}: {err.error}
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
