'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [bandInput, setBandInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleViewDetails() {
    const id = bandInput.trim().toUpperCase();
    if (!id) {
      setError('Please enter a band number');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Check if band has a registered profile
      const res = await fetch(`/api/profile/${encodeURIComponent(id)}`, {
        credentials: 'same-origin',
      });
      if (res.ok) {
        router.push(`/band/${encodeURIComponent(id)}`);
      } else if (res.status === 404) {
        setError('This band has not been registered yet. If you own this band, create an account below to set it up.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-500 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-shield-halved text-2xl"></i>
          <span className="text-xl font-bold">BandID</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <i className="fa-solid fa-user"></i>
          <span className="hidden sm:inline">My Account</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-id-card text-indigo-500 text-3xl"></i>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Enter Your Band Number</h1>
        <p className="text-gray-500 mb-8 text-center">Look up an existing band or register a new one</p>

        <form
          onSubmit={e => { e.preventDefault(); handleViewDetails(); }}
          className="w-full max-w-sm space-y-4"
        >
          <div className="relative">
            <input
              type="text"
              value={bandInput}
              onChange={e => { setBandInput(e.target.value.toUpperCase()); setError(''); }}
              placeholder="e.g. BAND-0001"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center font-mono text-lg tracking-wider focus:border-indigo-500 focus:outline-none transition uppercase"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'View Details'}
          </button>
        </form>

        <div className="mt-12 w-full max-w-sm">
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-500 mb-4">New band owner?</p>
            <button
              onClick={() => router.push('/signup')}
              className="w-full border-2 border-indigo-500 text-indigo-500 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition"
            >
              Create Account & Register
            </button>
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 text-center text-xs text-gray-400">
        BandID - Smart Wearable Identification
      </footer>
    </div>
  );
}
