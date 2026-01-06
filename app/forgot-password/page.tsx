"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.request("/auth/password/forgot/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as any).error || "Failed to send reset code");
      }

      toast.success("Check your email for the verification code");
      setStep("verify");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.request("/auth/password/reset/", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as any).error || "Failed to reset password");
      }

      toast.success("Password reset successful! Please log in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4FD1C5]/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-300/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[40px] p-8 shadow-2xl shadow-teal-900/10">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              type="button"
              className="text-gray-600 hover:text-teal-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-[#4FD1C5]" />
              Secure Reset
            </div>
          </div>

          <div className="text-center my-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] shadow-lg shadow-teal-500/30">
              {step === "request" ? (
                <Mail className="h-8 w-8 text-white" />
              ) : (
                <Lock className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {step === "request" ? "Forgot your password?" : "Create a new password"}
              </h1>
              <p className="text-gray-600 mt-2">
                {step === "request"
                  ? "Enter your email and we'll send you a verification code."
                  : "Enter the code we sent you and set a new password."}
              </p>
            </div>
          </div>

          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity" />
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 h-14 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#4FD1C5] transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8E] text-white rounded-2xl font-semibold text-base shadow-lg shadow-teal-500/30 transition-all relative group overflow-hidden"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send verification code
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Verification code
                </Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  required
                  disabled={loading}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-12 h-14 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#4FD1C5] transition-all"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                  Confirm password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-12 h-14 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#4FD1C5] transition-all"
                      placeholder="Repeat your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8E] text-white rounded-2xl font-semibold text-base shadow-lg shadow-teal-500/30 transition-all relative group overflow-hidden"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Reset password
                    <Lock className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Ready to log in?{" "}
            <button className="text-[#4FD1C5] hover:text-[#38B2AC] font-semibold" onClick={() => router.push("/login")}>
              Return to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
