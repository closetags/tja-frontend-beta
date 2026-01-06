'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';
import { QrCode, Sparkles, Shield, Zap, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', { username, password: '***' });
      const loginData = await apiClient.login(username, password);
      console.log('Login successful, received data:', loginData);

      // Store user data for UI components
      localStorage.setItem('login_data', JSON.stringify(loginData.user));
      
      showSuccess('Welcome back!', `Logged in as ${loginData.user.username}`);
      console.log('Redirecting to /dashboard');
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      showError(err, 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4FD1C5]/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-300/10 rounded-full blur-3xl"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30"></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="space-y-8">
            {/* Logo & Brand */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl px-6 py-4 shadow-xl shadow-teal-900/10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] rounded-2xl blur-lg opacity-75"></div>
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <QrCode className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Smart Event Managers
                  </h1>
                  <p className="text-sm text-gray-600">Smart Event Management</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-bold leading-tight text-gray-800">
                  Welcome{' '}
                  <span className="bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] bg-clip-text text-transparent">
                    back
                  </span>
                </h2>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4">
              <div className="group bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 hover:bg-white/90 hover:shadow-xl shadow-teal-900/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">QR Code Check-ins</h3>
                </div>
              </div>

              <div className="group bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 hover:bg-white/90 hover:shadow-xl shadow-teal-900/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Real-time Analytics</h3>
                </div>
              </div>

              <div className="group bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 hover:bg-white/90 hover:shadow-xl shadow-teal-900/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Secure & Scalable</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[40px] p-8 shadow-2xl shadow-teal-900/10">
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] mb-4 shadow-lg shadow-teal-500/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Sign In</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username or Email
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity"></div>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 h-5 w-5 text-gray-400" />
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full pl-12 pr-4 h-14 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#4FD1C5] transition-all"
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-[#4FD1C5] hover:text-[#38B2AC]">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity"></div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full pl-12 pr-12 h-14 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#4FD1C5] transition-all"
                        placeholder="Enter your password"
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

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8E] text-white rounded-2xl font-semibold text-base shadow-lg shadow-teal-500/30 transition-all relative group overflow-hidden"
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>

                {/* Divider */}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
