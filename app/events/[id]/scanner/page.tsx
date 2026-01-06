"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BrowserQRCodeReader } from '@zxing/browser';
import {
  Camera,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  AlertTriangle,
  QrCode,
  Gift,
  Star,
  Crown,
  Utensils,
  Presentation,
  Ticket,
  Mail,
  Phone,
  Check
} from 'lucide-react';
import apiClient from '@/lib/api';

interface Activity {
  id: number;
  name: string;
  description: string;
  activity_type: string;
  is_primary: boolean;
  icon: string;
  color: string;
}

interface Guest {
  id: number;
  salutation: string;
  name: string;
  display_name: string;
  party_size: number;
  email: string;
  phone: string;
}

interface AssignedActivity {
  activity: number;
  activity_name: string;
  activity_icon: string;
  activity_color: string;
  activity_type: string;
  is_primary: boolean;
  accessed: boolean;
  accessed_at: string | null;
}

interface VerificationResult {
  success: boolean;
  is_authorized: boolean;
  already_accessed: boolean;
  message: string;
  guest: Guest;
  activity: Activity;
  assigned_activities: AssignedActivity[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  gift: Gift,
  star: Star,
  crown: Crown,
  utensils: Utensils,
  presentation: Presentation,
  ticket: Ticket,
};

export default function ScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [isScanning, setIsScanning] = useState(false);
  const [scannedGuest, setScannedGuest] = useState<Guest | null>(null);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [assignedActivities, setAssignedActivities] = useState<AssignedActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    isAuthorized: boolean;
    alreadyAccessed?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Check if Media Devices API is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('Media Devices API not supported');
          setError('Camera access not supported. Please use HTTPS or a supported browser.');
          setSelectedDeviceId('default');
          return;
        }

        // First request permission to get proper device labels
        console.log('Requesting camera permission to enumerate devices...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately

        // Now enumerate devices with proper labels
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available cameras:', videoDevices);

        if (videoDevices.length > 0) {
          setCameraDevices(videoDevices);
          // Prefer back camera
          const backCamera = videoDevices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear')
          );
          const deviceId = backCamera?.deviceId || videoDevices[0].deviceId;
          console.log('Selected camera:', deviceId);
          setSelectedDeviceId(deviceId);
        } else {
          // Fallback: set a default device ID to allow starting
          console.log('No video devices found, using default');
          setSelectedDeviceId('default');
        }
      } catch (err: any) {
        console.error('Error getting cameras:', err);
        // If permission denied or error, still allow user to try with default camera
        console.log('Setting default camera due to error');
        setSelectedDeviceId('default');
        setError(`Camera access: ${err.message}. You can still try to start scanning.`);
      }
    };

    getDevices();
  }, []);

  const startScanning = async () => {
    if (!selectedDeviceId) {
      setError('No camera selected');
      return;
    }

    // Check if Media Devices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access not supported. Please ensure you are using HTTPS or a supported browser.');
      return;
    }

    console.log('Starting scanner with device:', selectedDeviceId);
    setError(null);

    try {
      // Use undefined for 'default' to let browser choose, otherwise use specific deviceId
      const deviceConstraint = selectedDeviceId === 'default'
        ? true
        : { deviceId: selectedDeviceId };

      // Request camera permissions first
      console.log('Requesting camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceConstraint
      });
      console.log('Camera permission granted');
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      console.log('Starting camera stream...');

      // Use undefined for decodeFromVideoDevice if 'default'
      const deviceIdForDecoding = selectedDeviceId === 'default' ? undefined : selectedDeviceId;

      await codeReader.decodeFromVideoDevice(
        deviceIdForDecoding,
        videoRef.current!,
        (result, error) => {
          if (result && !isProcessingRef.current) {
            console.log('QR code detected:', result.getText());
            // Prevent multiple scans of the same code
            isProcessingRef.current = true;
            // Stop scanning and handle the code
            handleQRScanned(result.getText());
          }
          if (error && !(error.name === 'NotFoundException')) {
            // Log non-"not found" errors for debugging
            console.warn('Scan error:', error);
          }
        }
      );

      console.log('Camera started successfully');
      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application. Please close other apps and try again.');
      } else {
        setError(`Failed to start camera: ${err.message || 'Please check permissions'}`);
      }
      codeReaderRef.current = null;
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner');

    // Stop the video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Clear the reader reference
    codeReaderRef.current = null;
    setIsScanning(false);
  };

  const handleQRScanned = async (token: string) => {
    console.log('=== handleQRScanned called with token:', token);
    setError(null);
    setVerificationResult(null);
    console.log('=== Resetting selectedActivity to null');
    setSelectedActivity(null);
    setScannedToken(token);

    // Pause scanning while processing
    stopScanning();

    try {
      console.log('Looking up QR token:', token);
      const response = await apiClient.request(`/qr/lookup/?token=${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if guest declined the invitation
        if (errorData.declined) {
          setScannedGuest(errorData.guest || null);
          setVerificationResult({
            success: false,
            message: errorData.message || 'Guest declined invitation',
            isAuthorized: false,
            alreadyAccessed: false
          });
          setTimeout(() => resumeScanning(), 4000);
          return;
        }
        
        setError(errorData.error || 'Invalid QR code');
        setTimeout(() => resumeScanning(), 3000);
        return;
      }

      const data = await response.json();
      setScannedGuest(data.guest);
      setAssignedActivities(data.assigned_activities || []);

    } catch (err) {
      console.error('Error looking up QR code:', err);
      setError('Failed to verify QR code. Please try again.');
      setTimeout(() => resumeScanning(), 3000);
    }
  };

  const resumeScanning = () => {
    setScannedGuest(null);
    setScannedToken(null);
    setAssignedActivities([]);
    setSelectedActivity(null);
    setVerificationResult(null);
    setError(null);
    isProcessingRef.current = false; // Reset the processing flag

    // Restart scanning
    if (selectedDeviceId) {
      startScanning();
    }
  };

  const verifyActivity = async () => {
    if (!selectedActivity || !scannedGuest || !scannedToken) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await apiClient.request('/qr/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: scannedToken,
          activity_id: selectedActivity,
          used_by: 'web_scanner'
        })
      });

      const result: VerificationResult = await response.json();

      // Build guest display name with salutation
      const guestDisplayName = result.guest.salutation 
        ? `${result.guest.salutation} ${result.guest.name}` 
        : result.guest.name;
      const partyInfo = result.guest.party_size > 1 ? ` (Party of ${result.guest.party_size})` : '';

      if (response.ok && result.success) {
        if (result.already_accessed) {
          // Already scanned - show warning
          setVerificationResult({
            success: true,
            message: `Already scanned! ${guestDisplayName}${partyInfo} has already accessed ${result.activity.name}`,
            isAuthorized: true,
            alreadyAccessed: true
          });
        } else {
          // First time access - show success
          setVerificationResult({
            success: true,
            message: `Access granted to ${result.activity.name}${partyInfo}`,
            isAuthorized: true,
            alreadyAccessed: false
          });
        }
      } else {
        setVerificationResult({
          success: false,
          message: result.message || 'Access denied',
          isAuthorized: result.is_authorized || false,
          alreadyAccessed: false
        });
      }

      setTimeout(() => resumeScanning(), 4000);

    } catch (err) {
      console.error('Error verifying activity:', err);
      setError('Failed to verify activity. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    console.log('selectedActivity changed to:', selectedActivity);
  }, [selectedActivity]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/events/${eventId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Activity Scanner</h1>
                  <p className="text-sm text-gray-500">Scan guest QR codes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Camera</h2>
                </div>
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    disabled={!selectedDeviceId}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Start Scanning
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Stop
                  </button>
                )}
              </div>

              {/* Camera Selector */}
              {cameraDevices.length > 1 && !isScanning && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Camera
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {cameraDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${cameraDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="relative">
              {!isScanning && !error && (
                <div className="h-96 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Click "Start Scanning" to begin</p>
                    <p className="text-sm text-gray-500 mt-2">Point camera at guest QR code</p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Cameras found: {cameraDevices.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="h-96 flex items-center justify-center bg-red-50">
                  <div className="text-center px-6">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <p className="text-red-800 font-semibold">{error}</p>
                  </div>
                </div>
              )}

              {/* Video element for camera feed */}
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  className={`w-full ${!isScanning ? 'hidden' : 'block'}`}
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />

                {/* QR Code Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative" style={{ width: '250px', height: '250px' }}>
                      {/* Corner borders */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-500"></div>

                      {/* Center guide lines */}
                      <div className="absolute inset-0 border-2 border-green-500 opacity-30"></div>
                    </div>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="p-4 bg-green-50 border-t border-green-200">
                  <p className="text-green-800 text-sm text-center font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Camera is active - Align QR code within the frame
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Guest Info & Activity Selection Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
              </div>
            </div>

            <div className="p-6">
              {!scannedGuest && !verificationResult && (
                <div className="text-center py-12">
                  <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Scan a QR code to view guest details</p>
                </div>
              )}

              {scannedGuest && !verificationResult && (
                <div className="space-y-6">
                  {/* Guest Details */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                    <h3 className="font-bold text-2xl text-gray-900 mb-2">
                      {scannedGuest.salutation ? `${scannedGuest.salutation} ${scannedGuest.name}` : scannedGuest.name}
                    </h3>
                    {scannedGuest.party_size > 1 && (
                      <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                        <Users className="h-4 w-4" />
                        Party of {scannedGuest.party_size}
                      </div>
                    )}
                    {scannedGuest.email && (
                      <p className="text-gray-600 text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {scannedGuest.email}
                      </p>
                    )}
                    {scannedGuest.phone && (
                      <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4" />
                        {scannedGuest.phone}
                      </p>
                    )}
                  </div>

                  {/* Activity Selection */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Select Activity to Verify</h4>

                    {assignedActivities.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          This guest is not assigned to any activities
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedActivities.map((activity) => (
                          <button
                            type="button"
                            key={activity.activity}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Activity selected:', activity.activity);
                              console.log('Current selectedActivity before:', selectedActivity);
                              setSelectedActivity(activity.activity);
                              console.log('setSelectedActivity called with:', activity.activity);
                            }}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              selectedActivity === activity.activity
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 hover:border-purple-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                  {(() => {
                                    const IconComponent = ICON_MAP[activity.activity_icon] || Star;
                                    return <IconComponent className="h-5 w-5 text-purple-600" />;
                                  })()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {activity.activity_name}
                                  </p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {activity.activity_type.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              {activity.accessed && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Accessed
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verify Button */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resumeScanning}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Verify button clicked, selectedActivity:', selectedActivity);
                        verifyActivity();
                      }}
                      disabled={!selectedActivity || isVerifying}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Access
                          {selectedActivity && <span className="text-xs ml-2">(ID: {selectedActivity})</span>}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Result */}
              {verificationResult && (
                <div className="text-center py-8">
                  {verificationResult.success && verificationResult.isAuthorized ? (
                    verificationResult.alreadyAccessed ? (
                      // Already scanned - orange warning
                      <div className="space-y-4">
                        <AlertTriangle className="h-20 w-20 text-amber-500 mx-auto" />
                        <h3 className="text-2xl font-bold text-amber-700">Already Scanned!</h3>
                        <p className="text-gray-600">{verificationResult.message}</p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                          <p className="text-amber-800 font-semibold">{scannedGuest?.name}</p>
                          <p className="text-amber-600 text-sm mt-1">
                            This QR code has already been used for this activity
                          </p>
                        </div>
                      </div>
                    ) : (
                      // First time - green success
                      <div className="space-y-4">
                        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                        <h3 className="text-2xl font-bold text-green-700">Access Granted!</h3>
                        <p className="text-gray-600">{verificationResult.message}</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="text-green-800 font-semibold">{scannedGuest?.name}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <XCircle className="h-20 w-20 text-red-500 mx-auto" />
                      <h3 className="text-2xl font-bold text-red-700">Access Denied</h3>
                      <p className="text-gray-600">{verificationResult.message}</p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                        <p className="text-red-800 font-semibold">{scannedGuest?.name}</p>
                        <p className="text-red-600 text-sm mt-1">
                          {verificationResult.isAuthorized
                            ? 'Already accessed this activity'
                            : 'Not authorized for this activity'}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-6">
                    Resuming scanner in a few seconds...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
