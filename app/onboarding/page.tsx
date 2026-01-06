"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { getCountryOptionsWithCustomValue, getStateLabel, getStateOptions, getStateOptionsWithCustomValue } from "@/lib/locations";
import { TIMEZONE_OPTIONS, normalizeTimezone } from "@/lib/timezones";

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Hospitality",
  "Manufacturing",
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

const FOCUS_INDUSTRY_OPTIONS = [
  "Weddings",
  "Concerts",
  "Corporate Events",
  "Festivals",
  "Sports",
  "Trade Shows",
  "Workshops",
  "Community Events",
  "Church Events",
  "Product Launches",
  "Graduations",
  "Non-Profit Fundraisers",
];

type ProfileResponse = {
  first_name: string;
  last_name: string;
  phone_number: string;
  avatar_url?: string;
  organization_name?: string;
  business_description?: string;
  business_industry?: string;
  focus_industries?: string[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  website_url?: string;
  has_website?: boolean;
  timezone?: string;
  onboarding_completed?: boolean;
};

const getDefaultTimezone = () => {
  try {
    const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return normalizeTimezone(guess) || "UTC";
  } catch {
    return "UTC";
  }
};

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    description: "",
    industry: "",
    focusIndustries: [] as string[],
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    websiteUrl: "",
    hasWebsite: true,
    timezone: getDefaultTimezone(),
  });
  const countryOptions = getCountryOptionsWithCustomValue(formData.country);
  const stateOptions = getStateOptions(formData.country);
  const displayedStateOptions = getStateOptionsWithCustomValue(formData.country, formData.state);
  const stateLabel = getStateLabel(formData.country);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.request("/auth/profile/");
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((payload as any).error || "Failed to load profile");
        }
        const data: ProfileResponse = payload as ProfileResponse;
        if (data.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
        setAvatarUrl(data.avatar_url || "");
        setFormData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          businessName: data.organization_name || "",
          description: data.business_description || "",
          industry: data.business_industry || "",
          focusIndustries: data.focus_industries || [],
          phoneNumber: data.phone_number || "",
          addressLine1: data.address_line1 || "",
          addressLine2: data.address_line2 || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zip_code || "",
          country: data.country || "",
          websiteUrl: data.website_url || "",
          hasWebsite: data.has_website !== false,
          timezone: normalizeTimezone(data.timezone) || getDefaultTimezone(),
        });
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        setError("Failed to load your profile. Please refresh or try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const initials = useMemo(() => {
    const first = formData.firstName?.[0] || "";
    const last = formData.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  }, [formData.firstName, formData.lastName]);

  const toggleFocusIndustry = (value: string) => {
    setError("");
    setFormData((prev) => {
      const exists = prev.focusIndustries.includes(value);
      return {
        ...prev,
        focusIndustries: exists
          ? prev.focusIndustries.filter((item) => item !== value)
          : [...prev.focusIndustries, value],
      };
    });
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const formDataAvatar = new FormData();
    formDataAvatar.append("avatar", file);

    try {
      setAvatarUploading(true);
      const response = await apiClient.request("/auth/profile/avatar/", {
        method: "POST",
        body: formDataAvatar,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as any).error || "Failed to upload avatar");
      }

      setAvatarUrl((payload as any).avatar_url || "");
      toast.success("Avatar updated");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: "",
    }));
    setError("");
  };

  const validate = () => {
    if (!formData.businessName.trim()) {
      setError("Please provide your business name.");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required.");
      return false;
    }
    if (!formData.industry) {
      setError("Select your primary industry.");
      return false;
    }
    if (!formData.addressLine1.trim() || !formData.country.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      setError("Please complete your address details.");
      return false;
    }
    if (formData.hasWebsite && !formData.websiteUrl.trim()) {
      setError("Please enter your website URL or indicate that you do not have a website.");
      return false;
    }
    if (!formData.focusIndustries.length) {
      setError("Select at least one focus industry.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please resolve the highlighted issues before continuing.");
      return;
    }

    setError("");
    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phoneNumber,
      organization_name: formData.businessName,
      business_description: formData.description,
      business_industry: formData.industry,
      focus_industries: formData.focusIndustries,
      address_line1: formData.addressLine1,
      address_line2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      country: formData.country.trim(),
      website_url: formData.hasWebsite ? formData.websiteUrl : "",
      has_website: formData.hasWebsite,
      timezone: formData.timezone,
      onboarding_completed: true,
    };

    try {
      setSubmitting(true);
      const response = await apiClient.request("/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to save onboarding data" }));
        throw new Error(data.error || "Failed to save onboarding data");
      }

      toast.success("Onboarding complete! Welcome to Smart Event Managers.");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding submission failed:", err);
      toast.error(err.message || "Failed to save your onboarding details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="text-gray-700 font-medium">Preparing your onboarding experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">Complete your onboarding</h1>
          <p className="text-gray-600">
            Tell us more about your organization so we can tailor the dashboard to your needs.
          </p>
        </div>

        <Card className="shadow-2xl backdrop-blur-xl bg-white/90 border border-white/50 rounded-[32px]">
          <CardHeader>
            <CardTitle>Organization profile</CardTitle>
            <CardDescription>Provide the details needed to activate your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-teal-100 shadow-lg">
                    <AvatarImage src={avatarUrl} alt={formData.businessName} />
                    <AvatarFallback className="bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] text-white text-2xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="font-semibold text-gray-800">Add your avatar</p>
                  <p className="text-sm text-gray-600">
                    Personalize your experience. Square images (PNG, JPG, GIF) up to 5MB.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                    <Button type="button" variant="outline" onClick={handleAvatarButtonClick} disabled={avatarUploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {avatarUploading ? "Uploading..." : "Upload Avatar"}
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business name *</Label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="My Events"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary industry *</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("industry", value)}
                    value={formData.industry}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your main industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Business description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Tell us about the experiences you create..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="font-semibold text-gray-900">Focus industries *</Label>
                  <p className="text-xs text-gray-500">Select all that apply to your organization.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FOCUS_INDUSTRY_OPTIONS.map((option) => {
                    const checked = formData.focusIndustries.includes(option);
                    return (
                      <label
                        key={option}
                        className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition hover:border-teal-300 ${
                          checked ? "border-teal-400 bg-teal-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleFocusIndustry(option)}
                        />
                        <span className="text-sm font-medium text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Phone number *</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone *</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => handleInputChange("timezone", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {TIMEZONE_OPTIONS.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-semibold text-gray-900">Business address *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-3">
                    <Label>Address line 1 *</Label>
                    <Input
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                      placeholder="123 Event Street"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Address line 2</Label>
                    <Input
                      value={formData.addressLine2}
                      onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                      placeholder="Suite, floor, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={handleCountryChange}
                      disabled={submitting}
                    >
                      <SelectTrigger className="rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
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
                    <Label>{stateLabel} *</Label>
                    {stateOptions.length ? (
                      <Select
                        value={formData.state}
                        onValueChange={(value) => handleInputChange("state", value)}
                        disabled={submitting || !formData.country}
                      >
                        <SelectTrigger className="rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
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
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        placeholder="State or region"
                        required
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Zip / Postal code *</Label>
                    <Input
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="Postal code"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                    placeholder="https://example.com"
                    disabled={!formData.hasWebsite}
                  />
                </div>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <Checkbox
                    checked={!formData.hasWebsite}
                    onCheckedChange={(checked) => {
                      const noWebsite = checked === true;
                      handleInputChange("hasWebsite", !noWebsite);
                      if (noWebsite) {
                        handleInputChange("websiteUrl", "");
                      }
                    }}
                  />
                  <span>I don’t have a website</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-t pt-6">
                <p className="text-sm text-gray-600">
                  By continuing you agree that the information provided is accurate and you acknowledge our Terms & Conditions and Privacy Policy.
                </p>
                <Button
                  type="submit"
                  className="h-12 px-8 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8E] text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/30"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Finish onboarding"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
