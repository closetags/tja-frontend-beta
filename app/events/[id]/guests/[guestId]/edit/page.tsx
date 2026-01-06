'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { getEventStatus } from '@/lib/utils';
import { ArrowLeft, Save, Mail, Phone, User, Users } from 'lucide-react';

export default function EditGuestPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const guestId = params.guestId as string;

  const [formData, setFormData] = useState({
    salutation: '',
    name: '',
    email: '',
    phone: '',
    party_size: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if event is past first
    const checkEventAndFetchGuest = async () => {
      try {
        const eventResponse = await apiClient.request(`/events/${eventId}/`);
        if (eventResponse.ok) {
          const event = await eventResponse.json();
          const eventDate = event.start_date || event.date;
          const eventTime = event.start_time || event.time || '00:00';
          const status = getEventStatus(eventDate, eventTime, event.end_date, event.end_time);
          if (status.status === 'past') {
            router.replace(`/events/${eventId}`);
            return;
          }
        }
        // If event is not past, fetch guest
        fetchGuest();
      } catch (error) {
        console.error('Failed to check event:', error);
        fetchGuest(); // Still try to fetch guest if event check fails
      }
    };

    checkEventAndFetchGuest();
  }, [eventId, guestId, router]);

  const fetchGuest = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/guests/${guestId}/`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          salutation: data.salutation || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          party_size: data.party_size || 1,
        });
      } else {
        setError('Failed to load guest data');
      }
    } catch (error) {
      console.error('Failed to fetch guest:', error);
      setError('An error occurred while loading guest data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'party_size' ? parseInt(e.target.value) || 1 : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least email or phone is provided
    if (!formData.email && !formData.phone) {
      setError('Please provide at least an email or phone number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.request(`/events/${eventId}/guests/${guestId}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Success - redirect back to event page
        router.push(`/events/${eventId}`);
      } else {
        const errorData = await response.json();

        // Handle validation errors
        if (errorData.email) {
          setError(`Email: ${errorData.email}`);
        } else if (errorData.phone) {
          setError(`Phone: ${errorData.phone}`);
        } else if (errorData.non_field_errors) {
          setError(errorData.non_field_errors[0]);
        } else {
          setError(errorData.message || 'Failed to update guest');
        }
      }
    } catch (error) {
      console.error('Failed to update guest:', error);
      setError('An error occurred while updating the guest');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4FD1C5]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/events/${eventId}`}>
            <Button
              variant="ghost"
              className="hover:bg-teal-50 rounded-2xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Event
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto max-w-2xl px-4 py-12">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-teal-500/10 border border-white/50 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Header with icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center shadow-lg shadow-teal-500/30">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Edit Guest</h1>
                <p className="text-gray-600 mt-1">
                  Update guest information
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">❌</div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Error</h3>
                    <p className="text-sm text-gray-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Salutation and Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Salutation Field */}
                <div className="space-y-2">
                  <Label htmlFor="salutation" className="text-gray-700 font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-[#4FD1C5]" />
                    Title
                  </Label>
                  <select
                    id="salutation"
                    name="salutation"
                    value={formData.salutation}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-2 border-gray-200 focus:border-[#4FD1C5] focus:ring-[#4FD1C5] h-12 px-4 text-base bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="">None</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                    <option value="Mr & Mrs">Mr & Mrs</option>
                    <option value="Dr & Mrs">Dr & Mrs</option>
                    <option value="Dr & Dr">Dr & Dr</option>
                    <option value="The">The (Family)</option>
                  </select>
                </div>

                {/* Name Field */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name" className="text-gray-700 font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-[#4FD1C5]" />
                    Full Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter guest's full name"
                    required
                    className="rounded-2xl border-2 border-gray-200 focus:border-[#4FD1C5] focus:ring-[#4FD1C5] h-12 px-4 text-base"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Party Size Field */}
              <div className="space-y-2">
                <Label htmlFor="party_size" className="text-gray-700 font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#4FD1C5]" />
                  Party Size
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="party_size"
                    name="party_size"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.party_size}
                    onChange={handleChange}
                    className="w-24 rounded-2xl border-2 border-gray-200 focus:border-[#4FD1C5] focus:ring-[#4FD1C5] h-12 px-4 text-base text-center"
                    disabled={isSubmitting}
                  />
                  <span className="text-gray-600 text-sm">
                    {formData.party_size === 1 ? 'Single guest' : `${formData.party_size} guests on this invitation`}
                  </span>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#4FD1C5]" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="guest@example.com"
                  className="rounded-2xl border-2 border-gray-200 focus:border-[#4FD1C5] focus:ring-[#4FD1C5] h-12 px-4 text-base"
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#4FD1C5]" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="rounded-2xl border-2 border-gray-200 focus:border-[#4FD1C5] focus:ring-[#4FD1C5] h-12 px-4 text-base"
                  disabled={isSubmitting}
                />
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-3xl p-6 border-2 border-teal-100">
                <div className="flex items-start gap-3">
                  <div className="text-xl">ℹ️</div>
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Note:</span> At least one contact method (email or phone) is required.
                    </p>
                    {formData.salutation && formData.name && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Preview:</span> Email will be addressed to <span className="text-[#4FD1C5] font-semibold">&quot;{formData.salutation} {formData.name}&quot;</span>
                        {formData.party_size > 1 && <span> (Party of {formData.party_size})</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/events/${eventId}`)}
                  className="flex-1 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 h-12"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || (!formData.email && !formData.phone)}
                  className="flex-1 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8E] text-white rounded-2xl h-12 font-semibold shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
