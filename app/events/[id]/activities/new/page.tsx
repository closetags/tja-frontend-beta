'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { getEventStatus } from '@/lib/utils';
import { ArrowLeft, Star, Gift, Crown, Utensils, Presentation, Ticket } from 'lucide-react';

const ACTIVITY_TYPES = [
  { value: 'privilege', label: 'Privilege Access', description: 'VIP access, backstage, lounges, etc.' },
  { value: 'collection', label: 'Item Collection', description: 'Souvenirs, gifts, merchandise, etc.' },
];

const ICON_OPTIONS = [
  { name: 'gift', icon: Gift, label: 'Gift' },
  { name: 'star', icon: Star, label: 'Star' },
  { name: 'crown', icon: Crown, label: 'Crown' },
  { name: 'utensils', icon: Utensils, label: 'Dining' },
  { name: 'presentation', icon: Presentation, label: 'Presentation' },
  { name: 'ticket', icon: Ticket, label: 'Ticket' },
];

const COLOR_OPTIONS = [
  { value: '#4FD1C5', label: 'Teal', bg: 'bg-[#4FD1C5]' },
  { value: '#805AD5', label: 'Purple', bg: 'bg-[#805AD5]' },
  { value: '#FFD700', label: 'Gold', bg: 'bg-[#FFD700]' },
  { value: '#F56565', label: 'Red', bg: 'bg-[#F56565]' },
  { value: '#48BB78', label: 'Green', bg: 'bg-[#48BB78]' },
  { value: '#4299E1', label: 'Blue', bg: 'bg-[#4299E1]' },
  { value: '#ED8936', label: 'Orange', bg: 'bg-[#ED8936]' },
  { value: '#EC4899', label: 'Pink', bg: 'bg-[#EC4899]' },
];

export default function NewActivityPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activity_type: 'privilege' as 'privilege' | 'collection',
    icon: 'star',
    color: '#4FD1C5',
    requires_scan: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if event is past and redirect
  useEffect(() => {
    const checkEvent = async () => {
      try {
        const response = await apiClient.request(`/events/${eventId}/`);
        if (response.ok) {
          const event = await response.json();
          const eventDate = event.start_date || event.date;
          const eventTime = event.start_time || event.time || '00:00';
          const status = getEventStatus(eventDate, eventTime, event.end_date, event.end_time);
          if (status.status === 'past') {
            router.replace(`/events/${eventId}/activities`);
          }
        }
      } catch (error) {
        console.error('Failed to check event:', error);
      }
    };
    checkEvent();
  }, [eventId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.request(`/events/${eventId}/activities/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/events/${eventId}/activities`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create activity');
      }
    } catch (err) {
      console.error('Failed to create activity:', err);
      setError('An error occurred while creating the activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = ICON_OPTIONS.find(opt => opt.name === formData.icon)?.icon || Star;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto relative">
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

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Create New Activity</h1>
            <p className="text-gray-600">
              Set up a custom activity for your event. Guests assigned to this activity will need to scan their QR code for access.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Activity Name */}
            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium mb-2 block">
                Activity Name *
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VIP Lounge Access, Souvenir Collection"
                className="rounded-xl border-2 border-gray-200 focus:border-[#4FD1C5] h-12"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-gray-700 font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this activity provides access to..."
                className="rounded-xl border-2 border-gray-200 focus:border-[#4FD1C5] min-h-[100px]"
              />
            </div>

            {/* Activity Type */}
            <div>
              <Label className="text-gray-700 font-medium mb-3 block">Activity Type *</Label>
              <div className="grid grid-cols-2 gap-4">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, activity_type: type.value as any })}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      formData.activity_type === type.value
                        ? 'border-[#4FD1C5] bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800 mb-1">{type.label}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <Label className="text-gray-700 font-medium mb-3 block">Icon *</Label>
              <div className="grid grid-cols-6 gap-3">
                {ICON_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.name })}
                      className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 p-3 ${
                        formData.icon === option.name
                          ? 'border-[#4FD1C5] bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="h-6 w-6 text-gray-700" />
                      <span className="text-xs text-gray-600">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <Label className="text-gray-700 font-medium mb-3 block">Color *</Label>
              <div className="grid grid-cols-8 gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`aspect-square rounded-xl border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={color.label}
                  >
                    <div className={`w-full h-full rounded-lg ${color.bg}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
              <Label className="text-gray-700 font-medium mb-3 block">Preview</Label>
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: formData.color }}
                  >
                    <SelectedIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {formData.name || 'Activity Name'}
                    </h3>
                    {formData.description && (
                      <p className="text-gray-600">{formData.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name}
                className="flex-1 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8D] text-white rounded-2xl h-12 font-medium shadow-lg shadow-teal-500/30"
              >
                {isSubmitting ? 'Creating...' : 'Create Activity'}
              </Button>
              <Link href={`/events/${eventId}/activities`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl h-12 border-2 border-gray-200 hover:border-gray-300"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
