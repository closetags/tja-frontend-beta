'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';
import { getCountryOptionsWithCustomValue, getStateLabel, getStateOptions, getStateOptionsWithCustomValue } from '@/lib/locations';
import { TIMEZONE_OPTIONS } from '@/lib/timezones';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { ArrowLeft, Calendar, MapPin, Save, Sparkles, FileText, Clock, MessageSquare, Image as ImageIcon, Mail, Bell } from 'lucide-react';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const { isLoading: isCheckingAccess } = useProtectedRoute();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Legacy fields (still required for backward compatibility)
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
    // Email subject lines
    invitation_email_subject: '',
    reminder_email_subject: '',
  });
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const countryOptions = getCountryOptionsWithCustomValue(formData.country);
  const stateOptions = getStateOptions(formData.country);
  const displayedStateOptions = getStateOptionsWithCustomValue(formData.country, formData.state);
  const stateLabel = getStateLabel(formData.country);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCountrySelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: '',
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setError('Event end date cannot be before the start date. Please choose a later end date.');
      return;
    }

    setIsLoading(true);

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

      console.log('Sending event data:', Object.fromEntries(formDataToSend.entries()));
      
      const response = await apiClient.request('/events/', {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header - let browser set it with boundary
        headers: {},
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const event = await response.json();
        showSuccess('Event created successfully!', `"${event.name}" is ready for guests`);
        router.push(`/events/${event.id}`);
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        
        // Show toast error
        showError(errorData, 'Failed to create event');
        
        // Also set local error state for inline display
        let errorMessage = 'Failed to create event';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Exception creating event:', err);
      showError(err, 'Failed to create event');
      setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAccess) {
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

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors mb-6 group"
          >
            <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm group-hover:bg-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] shadow-lg shadow-teal-500/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Create New Event</h1>
              <p className="text-gray-600 mt-1">Design a memorable experience for your guests</p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-50">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                </div>
                Event Name
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter a memorable name"
                  required
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-teal-400 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event in detail..."
                disabled={isLoading}
                rows={5}
                className="rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 py-4 focus:ring-2 focus:ring-purple-400 transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Start Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="start_date" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  Start Date *
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-blue-400 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="start_time" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-50">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  Start Time *
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>
            </div>

            {/* End Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="end_date" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  End Date
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-blue-400 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="end_time" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-50">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  End Time
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-3">
              <Label htmlFor="timezone" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-50">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                Timezone
                <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({...formData, timezone: value})}
                disabled={isLoading}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-green-400 transition-all disabled:opacity-50">
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
            <div className="space-y-3">
              <Label htmlFor="venue" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-50">
                  <MapPin className="h-4 w-4 text-pink-600" />
                </div>
                Venue Name *
              </Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Grand Ballroom, Convention Center"
                required
                disabled={isLoading}
                className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50"
              />
            </div>

            {/* Address */}
            <div className="space-y-3">
              <Label htmlFor="address" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-50">
                  <MapPin className="h-4 w-4 text-pink-600" />
                </div>
                Street Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., 123 Main Street"
                disabled={isLoading}
                className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50"
              />
            </div>

            {/* Country, State, City Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="country" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-50">
                    <MapPin className="h-4 w-4 text-pink-600" />
                  </div>
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={handleCountrySelect}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50">
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

              <div className="space-y-3">
                <Label htmlFor="state" className="text-base font-semibold text-gray-700">
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
                    disabled={isLoading || !formData.country}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50">
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
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State or region"
                    disabled={isLoading}
                    className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="city" className="text-base font-semibold text-gray-700">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* ZIP Code */}
            <div className="space-y-3">
              <Label htmlFor="zip_code" className="text-base font-semibold text-gray-700">ZIP / Postal Code</Label>
              <Input
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="ZIP / Postal Code"
                disabled={isLoading}
                className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-pink-400 transition-all disabled:opacity-50"
              />
            </div>

            {/* Event Banner */}
            <div className="space-y-3">
              <Label htmlFor="banner" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50">
                  <ImageIcon className="h-4 w-4 text-indigo-600" />
                </div>
                Event Banner
                <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </Label>
              <div className="space-y-3">
                <Input
                  id="banner"
                  name="banner"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 focus:ring-2 focus:ring-indigo-400 transition-all disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border border-gray-200 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {bannerPreview && (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover"
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
                <p className="text-sm text-gray-500">
                  Upload a banner image to display in invitation emails
                </p>
                <p className="text-xs text-gray-400">
                  Recommended: 1200x400px (3:1 ratio) • Max size: 5MB • Formats: JPG, PNG, WEBP
                </p>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-3">
              <Label htmlFor="custom_message" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                </div>
                Custom Message for Guests
                <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </Label>
              <Textarea
                id="custom_message"
                name="custom_message"
                value={formData.custom_message}
                onChange={handleChange}
                placeholder='e.g., "Remember to check out before leaving. Missing this event may result in a $50 fine."'
                disabled={isLoading}
                rows={4}
                className="rounded-2xl bg-[#F7FAFC] border border-gray-200 text-base px-5 py-4 focus:ring-2 focus:ring-amber-400 transition-all resize-none disabled:opacity-50"
              />
              <p className="text-sm text-gray-500 mt-2">
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#319795] text-white font-semibold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Creating Event...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    <span>Create Event</span>
                  </div>
                )}
              </Button>
              
              <Link href="/dashboard" className="flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  className="h-14 px-8 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Helpful Tips Card */}
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white/50">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Quick Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Choose a clear, descriptive event name</li>
                <li>• Include all important details in the description</li>
                <li>• Double-check date and time for accuracy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
