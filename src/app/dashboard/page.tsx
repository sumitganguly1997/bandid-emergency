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

export default function DashboardPage() {
  const router = useRouter();
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlinkingBand, setUnlinkingBand] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);

  useEffect(() => {
    fetchBands();
  }, []);

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
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Bands</h1>
            <p className="text-slate-400 mt-1">Manage all your emergency ID bands</p>
          </div>
          <Link
            href="/register-band"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">Add Band</span>
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {bands.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-id-card text-2xl text-slate-400"></i>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No bands linked yet</h2>
            <p className="text-slate-400 mb-6">
              Register your first emergency ID band to get started
            </p>
            <Link
              href="/register-band"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <i className="fa-solid fa-plus"></i>
              Register a Band
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bands.map((band) => {
              const completeness = getProfileCompleteness(band);
              const isComplete = completeness === 100;

              return (
                <div
                  key={band.band_id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-id-badge text-blue-400"></i>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-mono font-bold text-white truncate">
                            {band.band_id}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {band.full_name || 'No name set'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-3">
                        {band.blood_group && (
                          <span className="flex items-center gap-1">
                            <i className="fa-solid fa-droplet text-red-400"></i>
                            {band.blood_group}
                          </span>
                        )}
                        {band.city_country && (
                          <span className="flex items-center gap-1">
                            <i className="fa-solid fa-location-dot text-green-400"></i>
                            {band.city_country}
                          </span>
                        )}
                        {band.emergency_contact && (
                          <span className="flex items-center gap-1">
                            <i className="fa-solid fa-phone text-yellow-400"></i>
                            {band.emergency_contact}
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Profile completeness</span>
                          <span className={isComplete ? 'text-green-400' : 'text-amber-400'}>
                            {completeness}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
                        className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        <i className="fa-solid fa-pen mr-2"></i>
                        Edit
                      </Link>
                      <Link
                        href={`/band/${band.band_id}`}
                        className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        <i className="fa-solid fa-eye mr-2"></i>
                        View
                      </Link>
                      <button
                        onClick={() => setConfirmUnlink(band.band_id)}
                        className="flex-1 sm:flex-none bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        <i className="fa-solid fa-link-slash mr-2"></i>
                        Unlink
                      </button>
                    </div>
                  </div>

                  {confirmUnlink === band.band_id && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <p className="text-amber-400 text-sm mb-3">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                        Are you sure? This will delete all profile data for this band.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUnlink(band.band_id)}
                          disabled={unlinkingBand === band.band_id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {unlinkingBand === band.band_id ? 'Unlinking...' : 'Yes, Unlink'}
                        </button>
                        <button
                          onClick={() => setConfirmUnlink(null)}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="text-slate-400 text-sm">
              <i className="fa-solid fa-circle-info mr-2"></i>
              Each band can have its own emergency profile with different information.
            </div>
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
