"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Upload, User as UserIcon, Camera } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCountryOptionsWithCustomValue, getStateLabel, getStateOptions, getStateOptionsWithCustomValue } from "@/lib/locations";
import { TIMEZONE_OPTIONS, normalizeTimezone } from "@/lib/timezones";
import { COUNTRY_PHONE_CODES, formatPhoneNumber, parsePhoneNumber, combinePhoneNumber } from "@/lib/phone-codes";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  contact_person_name: string;
  organization_name: string;
  business_industry: string;
  business_description: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  timezone: string;
  website_url: string;
  avatar_url?: string;
}

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Hospitality",
  "Entertainment",
  "Real Estate",
  "Construction",
  "Consulting",
  "Marketing",
  "Media",
  "Non-Profit",
  "Government",
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();
  const { isLoading: isCheckingAccess } = useProtectedRoute();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    contact_person_name: "",
    organization_name: "",
    business_industry: "",
    business_description: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    timezone: normalizeTimezone("UTC") || "UTC",
    website_url: "",
    avatar_url: "",
  });
  const countryOptions = getCountryOptionsWithCustomValue(profile.country);
  const stateOptions = getStateOptions(profile.country);
  const displayedStateOptions = getStateOptionsWithCustomValue(profile.country, profile.state);
  const stateLabel = getStateLabel(profile.country);

  const industryOptions = useMemo(() => {
    if (!profile.business_industry) return INDUSTRIES;
    if (INDUSTRIES.includes(profile.business_industry)) return INDUSTRIES;
    return [...INDUSTRIES, profile.business_industry];
  }, [profile.business_industry]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request("/auth/profile/");
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      
      // Parse phone number to extract country code
      const parsedPhone = parsePhoneNumber(data.phone_number || "");
      setPhoneCountryCode(parsedPhone.countryCode);
      setPhoneNumber(formatPhoneNumber(parsedPhone.number));
      
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        contact_person_name: data.contact_person_name || "",
        organization_name: data.organization_name || "",
        business_industry: data.business_industry || "",
        business_description: data.business_description || "",
        address_line1: data.address_line1 || "",
        address_line2: data.address_line2 || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
        country: data.country || "",
          timezone: normalizeTimezone(data.timezone || "UTC") || "UTC",
        website_url: data.website_url || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    // For first_name and last_name, only allow alphabets and spaces
    if (field === "first_name" || field === "last_name") {
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
      setProfile((prev) => ({
        ...prev,
        [field]: sanitizedValue,
      }));
      return;
    }
    
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCountryChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      country: value,
      state: "",
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await apiClient.request("/auth/profile/avatar/", {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload avatar");
      }

      const data = await response.json();
      setProfile((prev) => ({
        ...prev,
        avatar_url: data.avatar_url,
      }));
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Combine phone country code and number before saving
      const combinedPhone = combinePhoneNumber(phoneCountryCode, phoneNumber);
      const profileData = {
        ...profile,
        phone_number: combinedPhone,
      };
      
      const response = await apiClient.request("/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = profile.first_name?.[0] || "";
    const last = profile.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  if (isCheckingAccess || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-gray-700 hover:text-teal-700 hover:bg-teal-50 transition-colors rounded-xl -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-teal-600 bg-clip-text text-transparent">
            Account Profile
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            Manage your personal and business information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <Card className="border-2 border-teal-200 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-teal-50/50 to-white border-b-2 border-teal-100">
            <CardTitle className="text-gray-900">Profile Picture</CardTitle>
            <CardDescription className="text-gray-600">
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-teal-200 shadow-lg">
                  <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-2xl font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-lg transition-all"
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium mb-2">
                  Click the camera icon to upload a new picture
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-2 border-teal-200 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-teal-50/50 to-white border-b-2 border-teal-100">
            <CardTitle className="text-gray-900">Personal Information</CardTitle>
            <CardDescription className="text-gray-600">
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-gray-700 font-semibold">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-gray-700 font-semibold">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-gray-700 font-semibold">
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                    <SelectTrigger className="w-[140px] border-2 border-teal-200 focus:border-teal-400 rounded-xl">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRY_PHONE_CODES.map((country, index) => (
                        <SelectItem key={`${country.code}-${country.country}-${index}`} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    className="flex-1 border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_name" className="text-gray-700 font-semibold">
                Job Title
              </Label>
              <Input
                id="contact_person_name"
                value={profile.contact_person_name}
                onChange={(e) => handleInputChange("contact_person_name", e.target.value)}
                className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                placeholder="e.g., Event Manager, Operations Director"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-2 border-teal-200 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-teal-50/50 to-white border-b-2 border-teal-100">
            <CardTitle className="text-gray-900">Business Information</CardTitle>
            <CardDescription className="text-gray-600">
              Provide details about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_name" className="text-gray-700 font-semibold">
                Business Name
              </Label>
              <Input
                id="organization_name"
                value={profile.organization_name}
                onChange={(e) => handleInputChange("organization_name", e.target.value)}
                className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                placeholder="Your company or organization name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_industry" className="text-gray-700 font-semibold">
                  Business Industry
                </Label>
                <Select
                  value={profile.business_industry}
                  onValueChange={(value) => handleInputChange("business_industry", value)}
                >
                  <SelectTrigger className="border-2 border-teal-200 focus:border-teal-400 rounded-xl">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url" className="text-gray-700 font-semibold">
                  Website URL
                </Label>
                <Input
                  id="website_url"
                  type="url"
                  value={profile.website_url}
                  onChange={(e) => handleInputChange("website_url", e.target.value)}
                  className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_description" className="text-gray-700 font-semibold">
                Business Description
              </Label>
              <Textarea
                id="business_description"
                value={profile.business_description}
                onChange={(e) => handleInputChange("business_description", e.target.value)}
                className="border-2 border-teal-200 focus:border-teal-400 rounded-xl min-h-[100px]"
                placeholder="Tell us about your business..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="border-2 border-teal-200 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-teal-50/50 to-white border-b-2 border-teal-100">
            <CardTitle className="text-gray-900">Business Address</CardTitle>
            <CardDescription className="text-gray-600">
              Your business location details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1" className="text-gray-700 font-semibold">
                Address Line 1
              </Label>
              <Input
                id="address_line1"
                value={profile.address_line1}
                onChange={(e) => handleInputChange("address_line1", e.target.value)}
                className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2" className="text-gray-700 font-semibold">
                Address Line 2
              </Label>
              <Input
                id="address_line2"
                value={profile.address_line2}
                onChange={(e) => handleInputChange("address_line2", e.target.value)}
                className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-gray-700 font-semibold">
                  Country
                </Label>
                <Select
                  value={profile.country}
                  onValueChange={handleCountryChange}
                  disabled={saving}
                >
                  <SelectTrigger className="border-2 border-teal-200 focus:border-teal-400 rounded-xl">
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
              <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-700 font-semibold">
                  {stateLabel}
                </Label>
                {stateOptions.length ? (
                  <Select
                    value={profile.state}
                    onValueChange={(value) => handleInputChange("state", value)}
                    disabled={saving || !profile.country}
                  >
                    <SelectTrigger className="border-2 border-teal-200 focus:border-teal-400 rounded-xl">
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
                    value={profile.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                    placeholder="State or region"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-gray-700 font-semibold">
                  City
                </Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-gray-700 font-semibold">
                  Zip / Postal Code
                </Label>
                <Input
                  id="zip_code"
                  value={profile.zip_code}
                  onChange={(e) => handleInputChange("zip_code", e.target.value)}
                  className="border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-2 border-teal-200 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-teal-50/50 to-white border-b-2 border-teal-100">
            <CardTitle className="text-gray-900">Regional Settings</CardTitle>
            <CardDescription className="text-gray-600">
              Configure your timezone preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-gray-700 font-semibold">
                Time Zone
              </Label>
              <Select
                value={profile.timezone}
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger className="border-2 border-teal-200 focus:border-teal-400 rounded-xl">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
