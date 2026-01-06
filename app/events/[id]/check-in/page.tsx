'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Camera, CheckCircle, XCircle, UserCheck, Sparkles } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScanResult {
  success: boolean;
  already_checked_in?: boolean;
  already_used?: boolean;
  guest: {
    id: number;
    name: string;
    email: string;
    phone: string;
    checked_in: boolean;
    checked_in_at?: string;
  };
}

export default function CheckInScannerPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [router, isScanning]);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        undefined
      );

      setIsScanning(true);
      setError('');
    } catch (err) {
      setError('Failed to start camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScan = async (decodedText: string) => {
    // Stop scanning temporarily to process result
    if (scannerRef.current) {
      await scannerRef.current.pause(true);
    }

    try {
      const response = await apiClient.request(`/events/${eventId}/check-in/`, {
        method: 'POST',
        body: JSON.stringify({ token: decodedText }),
      });

      if (response.ok) {
        const result: ScanResult = await response.json();
        setLastResult(result);
        setError('');

        // Resume scanning after 3 seconds
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid QR code');
        
        // Resume scanning after 2 seconds
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
        }, 2000);
      }
    } catch (err) {
      setError('Failed to verify QR code');
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative">
        {/* Back Button */}
        <Link 
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors mb-6 group"
        >
          <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm group-hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-medium">Back to Event</span>
        </Link>

        {/* Main Scanner Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-10 mb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Check-In Scanner</h1>
              <p className="text-gray-600 mt-1">Scan guest invitation QR codes to check them in</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Camera Control */}
            <div className="flex gap-4">
              {!isScanning ? (
                <Button 
                  onClick={startScanning} 
                  className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#319795] text-white font-semibold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Camera
                </Button>
              ) : (
                <Button 
                  onClick={stopScanning} 
                  className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-base shadow-lg shadow-red-500/30"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Stop Camera
                </Button>
              )}
            </div>

            {/* QR Scanner Area */}
            <div className="relative">
              <div
                id="qr-reader"
                className="w-full rounded-3xl overflow-hidden shadow-lg border-4 border-white"
                style={{ maxWidth: '100%' }}
              />
              {isScanning && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-teal-500 text-white rounded-full text-sm font-medium shadow-lg">
                  <Sparkles className="inline h-4 w-4 mr-1" />
                  Ready to scan
                </div>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-6 rounded-3xl bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Scan Failed</p>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Result */}
            {lastResult && (
              <div className={`p-6 rounded-3xl border-2 ${
                lastResult.already_checked_in 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    lastResult.already_checked_in 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}>
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-xl mb-3 ${
                      lastResult.already_checked_in ? 'text-yellow-900' : 'text-green-900'
                    }`}>
                      {lastResult.already_checked_in
                        ? '⚠️ Already Checked In'
                        : '✓ Check-In Successful!'}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold text-gray-800">{lastResult.guest.name}</span>
                      </div>
                      
                      {lastResult.guest.email && (
                        <p className="text-sm text-gray-700 pl-6">
                          📧 {lastResult.guest.email}
                        </p>
                      )}
                      
                      {lastResult.guest.phone && (
                        <p className="text-sm text-gray-700 pl-6">
                          📱 {lastResult.guest.phone}
                        </p>
                      )}
                      
                      {lastResult.already_checked_in && lastResult.guest.checked_in_at && (
                        <p className="text-sm text-gray-600 pl-6 mt-2">
                          ⏰ Previously checked in at: {new Date(lastResult.guest.checked_in_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white/50">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Quick Guide</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click &quot;Start Camera&quot; to begin scanning</li>
                <li>• Point the camera at the guest&apos;s invitation QR code</li>
                <li>• The system will automatically detect and verify the code</li>
                <li>• Check-in status will appear immediately after scanning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
