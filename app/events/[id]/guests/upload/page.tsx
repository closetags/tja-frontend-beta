'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { getEventStatus } from '@/lib/utils';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Users, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

interface UploadResult {
  success_count: number;
  error_count: number;
  duplicate_count: number;
  errors: Array<{ row: number; message: string }>;
  duplicates: Array<{ row: number; name: string; reason: string }>;
}

export default function GuestUploadPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

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
            router.replace(`/events/${eventId}`);
          }
        }
      } catch (error) {
        console.error('Failed to check event:', error);
      }
    };
    checkEvent();
  }, [eventId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.request(
        `/events/${eventId}/guests/bulk-upload/`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        
        if (data.error_count === 0 && data.duplicate_count === 0) {
          setTimeout(() => {
            router.push(`/events/${eventId}`);
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to upload file');
      }
    } catch (error) {
      alert('An error occurred while uploading the file');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,email,phone\nJohn Doe,john@example.com,1234567890\nJane Smith,jane@example.com,0987654321';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4FD1C5]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/events/${eventId}`}>
            <Button 
              variant="ghost" 
              className="hover:bg-teal-50 rounded-2xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Event
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-teal-500/10 border border-white/50 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Header with icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#4FD1C5] to-[#38B2AC] flex items-center justify-center shadow-lg shadow-teal-500/30">
                <FileSpreadsheet className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Upload Guest List</h1>
                <p className="text-gray-600 mt-1">
                  Import guests from CSV file with automatic duplicate detection
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Download Template Card */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-6 border-2 border-teal-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md">
                    <Download className="h-6 w-6 text-[#4FD1C5]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">CSV Template</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download our template to ensure your CSV is formatted correctly. Required columns: <span className="font-semibold">name, email, phone</span> (at least email or phone required)
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={downloadTemplate}
                      className="bg-white hover:bg-teal-50 border-2 border-teal-200 hover:border-teal-300 rounded-2xl"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-100">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">Select CSV File</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose a CSV file containing your guest list
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-white file:text-[#4FD1C5] hover:file:bg-teal-50 file:cursor-pointer border-2 border-dashed border-purple-200 rounded-2xl p-4 bg-white cursor-pointer"
                      disabled={isUploading}
                    />
                    {file && (
                      <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Selected: {file.name}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C9A8E] text-white rounded-2xl py-6 text-base font-semibold shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    {isUploading ? 'Uploading...' : 'Upload Guest List'}
                  </Button>
                </div>
              </div>

              {/* Results Section */}
              {result && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className={`rounded-3xl p-6 border-2 ${
                    result.error_count === 0 && result.duplicate_count === 0
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : result.error_count > 0
                      ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                      : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">
                        {result.error_count === 0 && result.duplicate_count === 0 ? '✅' : 
                         result.error_count > 0 ? '❌' : '⚠️'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-4">Upload Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-2xl p-4 border border-green-100">
                            <p className="text-sm text-gray-600 mb-1">Successfully Added</p>
                            <p className="text-3xl font-bold text-green-600">
                              {result.success_count}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">guests</p>
                          </div>
                          
                          {result.duplicate_count > 0 && (
                            <div className="bg-white rounded-2xl p-4 border border-yellow-100">
                              <p className="text-sm text-gray-600 mb-1">Duplicates Found</p>
                              <p className="text-3xl font-bold text-yellow-600">
                                {result.duplicate_count}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">skipped</p>
                            </div>
                          )}
                          
                          {result.error_count > 0 && (
                            <div className="bg-white rounded-2xl p-4 border border-red-100">
                              <p className="text-sm text-gray-600 mb-1">Errors</p>
                              <p className="text-3xl font-bold text-red-600">
                                {result.error_count}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">failed</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicates Details */}
                  {result.duplicates.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-6 border-2 border-yellow-200">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <h3 className="font-bold text-gray-800">Duplicate Guests Detected</h3>
                      </div>
                      <div className="space-y-2 bg-white rounded-2xl p-4 max-h-64 overflow-y-auto">
                        {result.duplicates.map((dup, idx) => (
                          <div key={idx} className="text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0">
                            <span className="font-semibold text-yellow-700">Row {dup.row}:</span> {dup.name}
                            <span className="text-gray-500 ml-2">— {dup.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors Details */}
                  {result.errors.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-6 border-2 border-red-200">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <h3 className="font-bold text-gray-800">Errors Found</h3>
                      </div>
                      <div className="space-y-2 bg-white rounded-2xl p-4 max-h-64 overflow-y-auto">
                        {result.errors.map((err, idx) => (
                          <div key={idx} className="text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0">
                            <span className="font-semibold text-red-700">Row {err.row}:</span> {err.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {result.error_count === 0 && result.duplicate_count === 0 && (
                    <div className="text-center py-6">
                      <div className="inline-flex items-center gap-3 bg-white rounded-3xl px-8 py-4 shadow-lg border-2 border-green-200">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <p className="text-lg font-semibold text-gray-800">
                          All guests uploaded successfully! Redirecting...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
