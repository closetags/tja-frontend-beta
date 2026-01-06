'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { getEventStatus } from '@/lib/utils';
import { getCountryOptionsWithCustomValue, getStateLabel, getStateOptions, getStateOptionsWithCustomValue } from '@/lib/locations';
import { TIMEZONE_OPTIONS, normalizeTimezone } from '@/lib/timezones';
import { ArrowLeft, Calendar, Clock, MapPin, Save, MessageSquare, Image as ImageIcon, Mail, Bell } from 'lucide-react';

const DEFAULT_UPDATE_ERROR = 'Failed to update event. Please review your changes and try again.';

const toReadableField = (field: string) =>
  field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatUpdateError = (errorData: unknown): string => {
  if (!errorData) {
    return DEFAULT_UPDATE_ERROR;
  }

  if (typeof errorData === 'string') {
    return errorData;
  }

  if (typeof errorData === 'object') {
    const data = errorData as Record<string, unknown>;

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    const fieldMessages = Object.entries(data)
      .map(([field, value]) => {
        if (!value) return null;
        if (Array.isArray(value)) {
          const combined = value.filter(Boolean).join(' ');
          return combined ? `${toReadableField(field)}: ${combined}` : null;
        }
        if (typeof value === 'string') {
          return `${toReadableField(field)}: ${value}`;
        }
        return null;
      })
      .filter((msg): msg is string => Boolean(msg));

    if (fieldMessages.length) {
      return fieldMessages.join(' ');
    }
  }

  return DEFAULT_UPDATE_ERROR;
};

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
  invitation_email_subject?: string;
  reminder_email_subject?: string;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Legacy fields
    date: '',
    time: '',
    venue: '',
    // New expanded date/time fields
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    timezone: '',
    // New expanded location fields
    country: '',
    state: '',
    city: '',
    address: '',
    zip_code: '',
    custom_message: '',
    invitation_email_subject: '',
    reminder_email_subject: '',
  });
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBanner, setExistingBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countryOptions = getCountryOptionsWithCustomValue(formData.country);
  const stateOptions = getStateOptions(formData.country);
  const displayedStateOptions = getStateOptionsWithCustomValue(formData.country, formData.state);
  const stateLabel = getStateLabel(formData.country);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchEvent();
  }, [eventId, router]);

  const fetchEvent = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}/`);
      if (response.ok) {
        const data = await response.json();
        
        // Check if event is past - redirect back to event details
        const eventDate = data.start_date || data.date;
        const eventTime = data.start_time || data.time || '00:00';
        const status = getEventStatus(eventDate, eventTime, data.end_date, data.end_time);
        if (status.status === 'past') {
          router.replace(`/events/${eventId}`);
          return;
        }
        
        setEvent(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          // Legacy fields
          date: data.date,
          time: data.time,
          venue: data.venue,
          // New expanded date/time fields
          start_date: data.start_date || '',
          start_time: data.start_time || '',
          end_date: data.end_date || '',
          end_time: data.end_time || '',
          timezone: normalizeTimezone(data.timezone) || '',
          // New expanded location fields
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          address: data.address || '',
          zip_code: data.zip_code || '',
          custom_message: data.custom_message || '',
          invitation_email_subject: data.invitation_email_subject || '',
          reminder_email_subject: data.reminder_email_subject || '',
        });
        setExistingBanner(data.banner);
      } else {
        setError('Failed to load event');
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
      setError('Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountrySelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const startDateForValidation = formData.start_date || formData.date;

    if (formData.end_date && startDateForValidation && formData.end_date < startDateForValidation) {
      setError('Event end date cannot be before the start date. Please choose a later end date.');
      return;
    }

    setIsSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);

      // Legacy fields (copy from new fields if new fields are filled)
      formDataToSend.append('date', formData.start_date || formData.date);
      formDataToSend.append('time', formData.start_time || formData.time);
      formDataToSend.append('venue', formData.venue);

      // New expanded date/time fields
      if (formData.start_date) formDataToSend.append('start_date', formData.start_date);
      if (formData.start_time) formDataToSend.append('start_time', formData.start_time);
      if (formData.end_date) formDataToSend.append('end_date', formData.end_date);
      if (formData.end_time) formDataToSend.append('end_time', formData.end_time);
      if (formData.timezone) formDataToSend.append('timezone', formData.timezone);

      // New expanded location fields
      if (formData.country) formDataToSend.append('country', formData.country);
      if (formData.state) formDataToSend.append('state', formData.state);
      if (formData.city) formDataToSend.append('city', formData.city);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.zip_code) formDataToSend.append('zip_code', formData.zip_code);

      formDataToSend.append('custom_message', formData.custom_message);
      formDataToSend.append('invitation_email_subject', formData.invitation_email_subject);
      formDataToSend.append('reminder_email_subject', formData.reminder_email_subject);

      if (banner) {
        formDataToSend.append('banner', banner);
      }

      const response = await apiClient.request(`/events/${eventId}/`, {
        method: 'PUT',
        body: formDataToSend,
        headers: {},
      });

      if (response.ok) {
        router.push(`/events/${eventId}`);
      } else {
        let errorMessage = DEFAULT_UPDATE_ERROR;
        try {
          const errorData = await response.json();
          errorMessage = formatUpdateError(errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      setError('We could not reach the server to update your event. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8]">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href={`/events/${eventId}`}>
          <Button
            variant="ghost"
            className="mb-6 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-2xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </Link>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2D3748]">Edit Event</h1>
              <p className="text-[#A0AEC0] mt-1">Update event details</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-[#2D3748] mb-2 block">
                Event Name *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                placeholder="e.g., Annual Company Gala"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-[#2D3748] mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 min-h-[120px]"
                placeholder="Add a description for your event..."
              />
            </div>

            {/* Start Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="start_date" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  Start Date *
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  value={formData.start_date || formData.date}
                  onChange={handleChange}
                  className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="start_time" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-500" />
                  Start Time *
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                  value={formData.start_time || formData.time}
                  onChange={handleChange}
                  className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>
            </div>

            {/* End Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="end_date" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  End Date
                  <span className="text-xs font-normal text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="end_time" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-500" />
                  End Time
                  <span className="text-xs font-normal text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="timezone" className="text-sm font-semibold text-[#2D3748] mb-2">
                Timezone
                <span className="text-xs font-normal text-gray-500 ml-2">(Optional)</span>
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({...formData, timezone: value})}
              >
                <SelectTrigger className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Venue Name */}
            <div>
              <Label htmlFor="venue" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-500" />
                Venue Name *
              </Label>
              <Input
                id="venue"
                name="venue"
                type="text"
                required
                value={formData.venue}
                onChange={handleChange}
                className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                placeholder="e.g., Grand Ballroom, Hilton Hotel"
              />
            </div>

            {/* Street Address */}
            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-[#2D3748] mb-2">
                Street Address
                <span className="text-xs font-normal text-gray-500 ml-2">(Optional)</span>
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                placeholder="e.g., 123 Main Street"
              />
            </div>

            {/* Country, State, City Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="country" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-500" />
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={handleCountrySelect}
                  disabled={isSaving}
                >
                  <SelectTrigger className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {countryOptions.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="state" className="text-sm font-semibold text-[#2D3748] mb-2">
                  {stateLabel}
                </Label>
                {stateOptions.length ? (
                  <Select
                    value={formData.state}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        state: value,
                      }))
                    }
                    disabled={isSaving || !formData.country}
                  >
                    <SelectTrigger className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder={`Select ${stateLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {displayedStateOptions.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="State or region"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-semibold text-[#2D3748] mb-2">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="City"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zip_code" className="text-sm font-semibold text-[#2D3748] mb-2">
                ZIP / Postal Code
              </Label>
              <Input
                id="zip_code"
                name="zip_code"
                type="text"
                value={formData.zip_code}
                onChange={handleChange}
                className="rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                placeholder="ZIP / Postal Code"
              />
            </div>

            {/* Event Banner */}
            <div>
              <Label htmlFor="banner" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-500" />
                Event Banner
                <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </Label>
              <div className="space-y-3">
                <Input
                  id="banner"
                  name="banner"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  disabled={isSaving}
                  className="rounded-2xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border border-gray-200 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {(bannerPreview || existingBanner) && (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200">
                    <img
                      src={
                        bannerPreview ||
                        (existingBanner?.startsWith('http')
                          ? existingBanner
                          : `${process.env.NEXT_PUBLIC_API_URL}${existingBanner}`)
                      }
                      alt="Banner preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        console.error('Failed to load banner preview');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBanner(null);
                        setBannerPreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Upload a banner image to display in invitation emails
                </p>
                <p className="text-xs text-gray-400">
                  Recommended: 1200x400px (3:1 ratio) • Max size: 5MB • Formats: JPG, PNG, WEBP
                </p>
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <Label htmlFor="custom_message" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                Custom Message for Guests
                <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </Label>
              <Textarea
                id="custom_message"
                name="custom_message"
                value={formData.custom_message}
                onChange={handleChange}
                className="rounded-2xl border-gray-200 focus:border-amber-500 focus:ring-amber-500 min-h-[100px]"
                placeholder='e.g., "Remember to check out before leaving. Missing this event may result in a $50 fine."'
              />
              <p className="text-xs text-gray-500 mt-2">
                This message will be included in all guest invitation emails
              </p>
            </div>

            {/* Email Subject Lines */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-[#2D3748] mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-500" />
                Email Subject Lines
                <span className="text-xs font-normal text-gray-500">(Optional - leave blank for defaults)</span>
              </h3>
              
              <div className="space-y-4">
                {/* Invitation Email Subject */}
                <div>
                  <Label htmlFor="invitation_email_subject" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-500" />
                    Invitation Email Subject
                  </Label>
                  <Input
                    id="invitation_email_subject"
                    name="invitation_email_subject"
                    type="text"
                    value={formData.invitation_email_subject}
                    onChange={handleChange}
                    className="rounded-2xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    placeholder={`Default: "You're Invited to ${formData.name || 'Event Name'}!"`}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subject line for invitation emails sent to guests
                  </p>
                </div>

                {/* Reminder Email Subject */}
                <div>
                  <Label htmlFor="reminder_email_subject" className="text-sm font-semibold text-[#2D3748] mb-2 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-orange-500" />
                    Reminder Email Subject
                  </Label>
                  <Input
                    id="reminder_email_subject"
                    name="reminder_email_subject"
                    type="text"
                    value={formData.reminder_email_subject}
                    onChange={handleChange}
                    className="rounded-2xl border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    placeholder={`Default: "Reminder: ${formData.name || 'Event Name'} is coming up!"`}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subject line for reminder emails sent to confirmed guests
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
              <Link href={`/events/${eventId}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl px-6"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-2xl px-8 font-medium shadow-lg shadow-teal-500/30"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
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
    </div>
  );
}
