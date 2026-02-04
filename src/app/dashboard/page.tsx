'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Band {
  band_id: string;
  status: string;
  full_name: string | null;
  emergency_contact: string | null;
  city_country: string | null;
  blood_group: string | null;
  updated_at: string | null;
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlinkingBand, setUnlinkingBand] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchBands();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {
      // Silently fail - user info is not critical
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('userId');
      localStorage.removeItem('activeBandId');
      router.push('/');
    } catch {
      setError('Failed to log out');
      setLoggingOut(false);
    }
  }

  async function fetchBands() {
    try {
      const res = await fetch('/api/user/bands');
      if (res.status === 401) {
        router.push('/signup');
        return;
      }
      const data = await res.json();
      if (data.bands) {
        setBands(data.bands);
      }
    } catch {
      setError('Failed to load bands');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink(bandId: string) {
    setUnlinkingBand(bandId);
    try {
      const res = await fetch(`/api/user/bands/${bandId}`, { method: 'DELETE' });
      if (res.ok) {
        setBands(bands.filter(b => b.band_id !== bandId));
        setConfirmUnlink(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to unlink band');
      }
    } catch {
      setError('Network error');
    } finally {
      setUnlinkingBand(null);
    }
  }

  function getProfileCompleteness(band: Band): number {
    let filled = 0;
    if (band.full_name) filled++;
    if (band.emergency_contact) filled++;
    if (band.city_country) filled++;
    if (band.blood_group) filled++;
    return Math.round((filled / 4) * 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-indigo-500 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h1 className="text-lg font-semibold">My Account</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">
            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-500 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="text-lg font-semibold">My Account</h1>
              {user && (
                <p className="text-sm text-indigo-200">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {loggingOut ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-right-from-bracket"></i>
            )}
            <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">My Bands</h2>
        <Link
          href="/register-band"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          <span className="hidden sm:inline">Add Band</span>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {bands.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-id-card text-indigo-500 text-3xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No bands linked yet</h2>
            <p className="text-gray-500 mb-6">
              Register your first emergency ID band to get started
            </p>
            <Link
              href="/register-band"
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              <i className="fa-solid fa-plus"></i>
              Register a Band
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bands.map((band) => {
              const completeness = getProfileCompleteness(band);
              const isComplete = completeness === 100;

              return (
                <div
                  key={band.band_id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-id-badge text-indigo-500"></i>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-mono font-bold text-gray-900 truncate">
                            {band.band_id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {band.full_name || 'No name set'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-3">
                        {band.blood_group && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg">
                            <i className="fa-solid fa-droplet"></i>
                            {band.blood_group}
                          </span>
                        )}
                        {band.city_country && (
                          <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg">
                            <i className="fa-solid fa-location-dot"></i>
                            {band.city_country}
                          </span>
                        )}
                        {band.emergency_contact && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                            <i className="fa-solid fa-phone"></i>
                            {band.emergency_contact}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Profile completeness</span>
                          <span className={isComplete ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                            {completeness}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isComplete ? 'bg-green-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <Link
                        href={`/edit-profile?band=${band.band_id}`}
                        className="flex-1 sm:flex-none bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition text-center"
                      >
                        <i className="fa-solid fa-pen mr-2"></i>
                        Edit
                      </Link>
                      <Link
                        href={`/band/${band.band_id}`}
                        className="flex-1 sm:flex-none border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition text-center"
                      >
                        <i className="fa-solid fa-eye mr-2"></i>
                        View
                      </Link>
                      <button
                        onClick={() => setConfirmUnlink(band.band_id)}
                        className="flex-1 sm:flex-none border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition text-center"
                      >
                        <i className="fa-solid fa-link-slash mr-2"></i>
                        Unlink
                      </button>
                    </div>
                  </div>

                  {confirmUnlink === band.band_id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-amber-600 text-sm mb-3">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                        Are you sure? This will delete all profile data for this band.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUnlink(band.band_id)}
                          disabled={unlinkingBand === band.band_id}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                        >
                          {unlinkingBand === band.band_id ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                              Unlinking...
                            </>
                          ) : 'Yes, Unlink'}
                        </button>
                        <button
                          onClick={() => setConfirmUnlink(null)}
                          className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
            <i className="fa-solid fa-circle-info text-gray-400 mt-0.5"></i>
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-600 mb-1">Multiple bands</p>
              <p>Each band can have its own emergency profile with different information. Great for family members or different activities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
