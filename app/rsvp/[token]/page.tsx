'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Loader2, PartyPopper, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RSVPData {
  guest: {
    id: number;
    name: string;
    email: string;
    status: string;
    status_display: string;
  };
  event: {
    id: number;
    name: string;
    description: string;
    date: string;
    time: string;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
    venue: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  already_responded: boolean;
}

export default function RSVPPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const autoResponse = searchParams.get('response');

  const [rsvpData, setRsvpData] = useState<RSVPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [hasResponded, setHasResponded] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    fetchRSVPData();
  }, [token]);

  useEffect(() => {
    // Auto-submit if response parameter is provided and data is loaded
    if (rsvpData && autoResponse && !hasResponded && !rsvpData.already_responded) {
      if (autoResponse === 'accept' || autoResponse === 'decline') {
        handleResponse(autoResponse);
      }
    }
  }, [rsvpData, autoResponse, hasResponded]);

  const fetchRSVPData = async () => {
    try {
      const response = await fetch(`${API_URL}/rsvp/${token}/`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This RSVP link is invalid or has expired.');
        } else {
          setError('Failed to load invitation details.');
        }
        return;
      }

      const data = await response.json();
      setRsvpData(data);
      
      if (data.already_responded) {
        setHasResponded(true);
        setResponseMessage(
          data.guest.status === 'invitation_accepted' 
            ? `You've already confirmed your attendance. We look forward to seeing you!`
            : data.guest.status === 'checked_in'
            ? `You've already attended this event. Thank you for coming!`
            : `You've already declined this invitation.`
        );
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (response: 'accept' | 'decline') => {
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/rsvp/${token}/respond/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });

      const data = await res.json();

      if (res.ok) {
        setHasResponded(true);
        setResponseMessage(data.message);
        if (rsvpData) {
          setRsvpData({
            ...rsvpData,
            guest: {
              ...rsvpData.guest,
              status: data.guest.status,
              status_display: data.guest.status_display,
            },
            already_responded: true,
          });
        }
      } else {
        setError(data.error || 'Failed to submit response.');
      }
    } catch (err) {
      setError('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!rsvpData) return null;

  const { guest, event } = rsvpData;
  const eventDate = event.start_date || event.date;
  const eventTime = event.start_time || event.time;

  // Format location
  const locationParts = [event.venue, event.address, event.city, event.state, event.country]
    .filter(Boolean);
  const location = locationParts.join(', ') || 'Location TBA';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-4 md:p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <PartyPopper className="h-12 w-12 text-white/90 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">You're Invited!</h1>
              <p className="text-purple-100 text-lg">{event.name}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Greeting */}
            <div className="text-center mb-8">
              <p className="text-2xl font-semibold text-gray-800">
                Dear {guest.name},
              </p>
              {event.description && (
                <p className="text-gray-600 mt-3 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {/* Event Details */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-teal-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                Event Details
              </h2>
              
              <div className="space-y-4">
                {eventDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(eventDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {eventTime && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Clock className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-800">{eventTime}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Section */}
            {hasResponded || rsvpData.already_responded ? (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl ${
                  guest.status === 'invitation_accepted' || guest.status === 'checked_in'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {guest.status === 'invitation_accepted' || guest.status === 'checked_in' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{guest.status_display}</span>
                </div>
                <p className="text-gray-600 mt-4">{responseMessage}</p>
                
                {guest.status === 'invitation_accepted' && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-2xl">
                    <Heart className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-purple-700 font-medium">We can't wait to see you!</p>
                    <p className="text-purple-600 text-sm mt-1">
                      Remember to bring your QR code for check-in
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-gray-600 mb-6">
                  Will you be joining us?
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => handleResponse('accept')}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg shadow-green-500/30 transition-all hover:scale-105"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    Yes, I'll Attend
                  </Button>
                  
                  <Button
                    onClick={() => handleResponse('decline')}
                    disabled={isSubmitting}
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600 px-8 py-6 rounded-2xl text-lg font-semibold transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    Sorry, Can't Make It
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-sm text-gray-500">
              Powered by <span className="font-semibold text-teal-600">Smart Event Managers</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
