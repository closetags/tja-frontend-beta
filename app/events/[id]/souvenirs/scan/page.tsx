'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Camera, CheckCircle, XCircle, Gift } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScanResult {
  success: boolean;
  already_used?: boolean;
  guest: {
    id: number;
    name: string;
    email: string;
    phone: string;
    souvenir_collected: boolean;
  };
}

export default function SouvenirScannerPage() {
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
    if (scannerRef.current) {
      await scannerRef.current.pause(true);
    }

    try {
      const response = await apiClient.request('/qr/verify/', {
        method: 'POST',
        body: JSON.stringify({
          token: decodedText,
          qr_type: 'souvenir',
          used_by: 'web_admin'
        }),
      });

      if (response.ok) {
        const result: ScanResult = await response.json();
        setLastResult(result);
        setError('');

        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid QR code');
        
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
        }, 2000);
      }
    } catch (err) {
      console.error('QR verification error:', err);
      setError('Failed to verify QR code');
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/events/${eventId}/souvenirs`}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Souvenir Stats
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-purple-600" />
              <CardTitle>Souvenir Scanner</CardTitle>
            </div>
            <CardDescription>
              Scan guest souvenir QR codes to mark as collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isScanning ? (
                <Button onClick={startScanning} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="w-full">
                  Stop Camera
                </Button>
              )}

              <div
                id="qr-reader"
                className="w-full rounded-lg overflow-hidden"
                style={{ maxWidth: '100%' }}
              />

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {lastResult && (
                <Alert className={lastResult.already_used ? 'border-yellow-500' : 'border-green-500'}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">
                        {lastResult.already_used
                          ? 'Already Collected'
                          : 'Souvenir Collected Successfully!'}
                      </p>
                      <p>Guest: {lastResult.guest.name}</p>
                      {lastResult.guest.email && <p>Email: {lastResult.guest.email}</p>}
                      {lastResult.guest.phone && <p>Phone: {lastResult.guest.phone}</p>}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
