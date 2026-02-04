'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface PublicProfile {
  band_id?: string;
  full_name?: string;
  emergency_contact?: string;
  city_country?: string;
  blood_group?: string;
  emergency_note?: string;
  photo_url?: string;
  pdf_filename?: string;
  has_pdf?: boolean;
  updated_at?: string;
}

export default function PublicViewPage({ params }: { params: Promise<{ bandId: string }> }) {
  const { bandId } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'not_found' | 'network' | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const router = useRouter();

  async function handlePdfDownload() {
    if (!profile?.has_pdf) return;
    setPdfLoading(true);

    try {
      const res = await fetch(`/api/profile/${bandId}/pdf`, { credentials: 'same-origin' });
      if (!res.ok) {
        alert('Unable to download PDF');
        return;
      }
      const data = await res.json();

      // Create blob from base64 and trigger download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    fetch(`/api/profile/${bandId}`, { credentials: 'same-origin' })
      .then(r => {
        if (r.status === 404) { setErrorType('not_found'); return null; }
        if (!r.ok) { setErrorType('network'); return null; }
        return r.json();
      })
      .then(data => { if (data) setProfile(data); })
      .catch(() => setErrorType('network'))
      .finally(() => setLoading(false));
  }, [bandId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-indigo-500 text-2xl"></i>
      </div>
    );
  }

  if (errorType === 'network') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-wifi text-yellow-500 text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="text-gray-500 mb-6">Unable to load band details. Please check your connection.</p>
        <button onClick={() => window.location.reload()} className="text-indigo-500 font-medium">Try Again</button>
      </div>
    );
  }

  if (errorType === 'not_found' || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-xmark text-red-500 text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold mb-2">Band Not Found</h2>
        <p className="text-gray-500 mb-6">This band ID doesn&apos;t have a registered profile.</p>
        <button onClick={() => router.push('/')} className="text-indigo-500 font-medium">Return Home</button>
      </div>
    );
  }

  const hasAnyInfo = profile.full_name || profile.emergency_contact || profile.blood_group || profile.city_country || profile.emergency_note || profile.has_pdf;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="bg-indigo-500 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-shield-halved text-xl"></i>
          <span className="font-bold">BandID</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <i className="fa-solid fa-user"></i>
          <span className="hidden sm:inline">My Account</span>
        </button>
      </header>

      {/* Band info */}
      <div className="bg-indigo-500 text-white px-6 pb-8 text-center">
        <span className="inline-block bg-white/20 text-xs font-medium px-3 py-1 rounded-full mb-3">
          <i className="fa-solid fa-circle-check mr-1"></i>Verified Band ID
        </span>
        <h1 className="text-2xl font-bold font-mono tracking-wider">#{bandId}</h1>
        {profile.updated_at && (
          <p className="text-indigo-200 text-xs mt-2">Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
        )}
      </div>

      {/* Profile card */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {hasAnyInfo ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-user text-indigo-400 text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile.full_name || 'Unknown'}</h2>
                  <span className="text-xs text-gray-400">Band Owner</span>
                </div>
              </div>

              <div className="space-y-4">
                {profile.emergency_contact && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-phone text-red-500"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Emergency Contact</p>
                      <p className="font-medium">{profile.emergency_contact}</p>
                    </div>
                  </div>
                )}

                {profile.blood_group && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-droplet text-green-500"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Blood Group</p>
                      <p className="font-medium">{profile.blood_group}</p>
                    </div>
                  </div>
                )}

                {profile.city_country && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-location-dot text-blue-500"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="font-medium">{profile.city_country}</p>
                    </div>
                  </div>
                )}

                {profile.emergency_note && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1"><i className="fa-solid fa-notes-medical mr-1"></i>Owner&apos;s Note</p>
                    <p className="text-sm text-gray-700">{profile.emergency_note}</p>
                  </div>
                )}

                {profile.has_pdf && (
                  <button
                    onClick={handlePdfDownload}
                    disabled={pdfLoading}
                    className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      {pdfLoading ? (
                        <i className="fa-solid fa-spinner fa-spin text-purple-500"></i>
                      ) : (
                        <i className="fa-solid fa-file-pdf text-purple-500"></i>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-400">Medical Document</p>
                      <p className="font-medium text-purple-700">
                        {pdfLoading ? 'Downloading...' : profile.pdf_filename || 'Download PDF'}
                      </p>
                    </div>
                    <i className="fa-solid fa-download text-purple-400 ml-auto"></i>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-eye-slash text-gray-400 text-xl"></i>
              </div>
              <p className="font-medium text-gray-700">No public information</p>
              <p className="text-sm text-gray-400 mt-1">The owner has set all profile details to private.</p>
            </div>
          )}
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-6 mt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-1">Safety Notice</p>
            <p>This information was voluntarily shared by the wearer. If this person needs help, please use the emergency contact button below.</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-md mx-auto flex gap-3">
          {profile.emergency_contact ? (
            <a
              href={`tel:${profile.emergency_contact.replace(/[^+\d]/g, '')}`}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <i className="fa-solid fa-phone"></i>
              Call Now
            </a>
          ) : (
            <div className="flex-1 text-center text-sm text-gray-400 py-3">
              No contact information available
            </div>
          )}
          <button onClick={() => router.push('/')} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <i className="fa-solid fa-house"></i>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
