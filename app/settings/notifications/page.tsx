/**
 * Notification Settings Page
 * Manage notification preferences and channels
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Calendar,
  Users,
  Activity,
  UserPlus,
  CreditCard,
  Info,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationCategory {
  id: string;
  label: string;
  icon: any;
  description: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { isLoading: isCheckingAccess } = useProtectedRoute();
  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'event',
      label: 'Event Management',
      icon: Calendar,
      description: 'Notifications about event creation, updates, and reminders',
      inApp: true,
      email: true,
      sms: false,
      push: true,
    },
    {
      id: 'guest',
      label: 'Guest Management',
      icon: Users,
      description: 'Guest additions, check-ins, and invitation status',
      inApp: true,
      email: true,
      sms: false,
      push: true,
    },
    {
      id: 'activity',
      label: 'Activity & Access',
      icon: Activity,
      description: 'Real-time activity access and completion updates',
      inApp: true,
      email: false,
      sms: false,
      push: true,
    },
    {
      id: 'system',
      label: 'System Notifications',
      icon: Info,
      description: 'Security alerts, data exports, and system updates',
      inApp: true,
      email: true,
      sms: false,
      push: false,
    },
  ]);

  const toggleChannel = (categoryId: string, channel: 'inApp' | 'email' | 'sms' | 'push') => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [channel]: !cat[channel] } : cat
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Implement actual API call to save preferences
      // await apiClient.request('/notifications/preferences/', {
      //   method: 'POST',
      //   body: JSON.stringify(categories),
      // });

      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FD1C5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Notification Settings</h1>
              </div>
              <p className="text-gray-600 ml-15">
                Choose how and when you want to receive notifications
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-xl px-6"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Customize Your Notification Experience
              </h3>
              <p className="text-sm text-blue-700">
                Control which notifications you receive through different channels. In-app notifications
                are always enabled for important alerts. Email and push notifications can be customized
                per category.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Channels Legend */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Channels</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5F3] flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#4FD1C5]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">In-App</p>
                <p className="text-xs text-gray-500">Dashboard alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="text-xs text-gray-500">Email notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">SMS</p>
                <p className="text-xs text-gray-500">
                  Text messages <Badge variant="secondary" className="ml-1 text-xs">Coming Soon</Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Push</p>
                <p className="text-xs text-gray-500">Mobile app alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        <div className="space-y-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F5F3] flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-[#4FD1C5]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{category.label}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pl-16">
                  {/* In-App */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#4FD1C5]" />
                      <Label htmlFor={`${category.id}-inApp`} className="text-sm font-medium">
                        In-App
                      </Label>
                    </div>
                    <Switch
                      id={`${category.id}-inApp`}
                      checked={category.inApp}
                      onCheckedChange={() => toggleChannel(category.id, 'inApp')}
                      className="data-[state=checked]:bg-[#4FD1C5]"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <Label htmlFor={`${category.id}-email`} className="text-sm font-medium">
                        Email
                      </Label>
                    </div>
                    <Switch
                      id={`${category.id}-email`}
                      checked={category.email}
                      onCheckedChange={() => toggleChannel(category.id, 'email')}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {/* SMS */}
                  <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <Label htmlFor={`${category.id}-sms`} className="text-sm font-medium">
                        SMS
                      </Label>
                    </div>
                    <Switch
                      id={`${category.id}-sms`}
                      checked={category.sms}
                      disabled
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>

                  {/* Push */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-purple-600" />
                      <Label htmlFor={`${category.id}-push`} className="text-sm font-medium">
                        Push
                      </Label>
                    </div>
                    <Switch
                      id={`${category.id}-push`}
                      checked={category.push}
                      onCheckedChange={() => toggleChannel(category.id, 'push')}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white rounded-2xl px-8"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Save All Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
