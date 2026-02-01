'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [bandInput, setBandInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleViewDetails() {
    if (!bandInput.trim()) {
      setError('Please enter a band number');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/bands/${encodeURIComponent(bandInput.trim().toUpperCase())}`);
      if (res.ok) {
        router.push(`/band/${encodeURIComponent(bandInput.trim().toUpperCase())}`);
      } else {
        setError('Band not found. Register below to create a new profile.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-500 text-white px-6 py-4 flex items-center gap-3">
        <i className="fa-solid fa-shield-halved text-2xl"></i>
        <span className="text-xl font-bold">BandID</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-qrcode text-indigo-500 text-3xl"></i>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Enter Your Band Number</h1>
        <p className="text-gray-500 mb-8 text-center">Look up an existing band or register a new one</p>

        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <input
              type="text"
              value={bandInput}
              onChange={e => { setBandInput(e.target.value.toUpperCase()); setError(''); }}
              placeholder="e.g. BAND-8829"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center font-mono text-lg tracking-wider focus:border-indigo-500 focus:outline-none transition uppercase"
            />
            <i className="fa-solid fa-qrcode absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'View Details'}
          </button>
        </div>

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

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-400">
        BandID - Smart Wearable Identification
      </footer>
    </div>
  );
}
