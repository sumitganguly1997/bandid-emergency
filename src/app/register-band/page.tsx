'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterBandPage() {
  const [bandId, setBandId] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'claimed' | 'invalid' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedBandId, setScannedBandId] = useState('');
  const router = useRouter();

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedId = bandId.trim().toUpperCase();
    const trimmedSecret = secret.trim();

    if (!trimmedId || !trimmedSecret) {
      setErrorMsg('Please enter both Band ID and Secret Code.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatus('idle');

    try {
      const res = await fetch('/api/bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ bandId: trimmedId, secret: trimmedSecret }),
      });
      const data = await res.json();

      if (res.ok) {
        setScannedBandId(trimmedId);
        setStatus('success');
        localStorage.setItem('activeBandId', trimmedId);
        setTimeout(() => router.push('/edit-profile'), 2000);
      } else if (res.status === 401) {
        router.push('/signup');
      } else if (res.status === 409) {
        setStatus('claimed');
        setErrorMsg('This band is already registered to another account.');
      } else if (res.status === 403) {
        setStatus('invalid');
        setErrorMsg('Incorrect secret code. Please check and try again.');
      } else if (res.status === 404) {
        setStatus('invalid');
        setErrorMsg(data.error || 'This Band ID is not recognized. Make sure you entered it correctly.');
      } else if (res.status === 429) {
        setStatus('error');
        setErrorMsg('Too many attempts. Please wait a moment and try again.');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <i className="fa-solid fa-arrow-left text-gray-600"></i>
        </button>
        <h1 className="text-lg font-semibold">Activate Your Band</h1>
        <span className="ml-auto text-sm text-gray-400">Step 2 of 3</span>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Instructions */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-id-card text-indigo-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Your Band Details</h2>
          <p className="text-gray-500 text-sm">Find the Band ID and Secret Code printed on the inside of your wristband or on the packaging card.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Band ID</label>
            <input
              type="text"
              value={bandId}
              onChange={e => { setBandId(e.target.value.toUpperCase()); setStatus('idle'); setErrorMsg(''); }}
              placeholder="e.g. BAND-0001"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-lg tracking-wider focus:border-indigo-500 focus:outline-none transition uppercase text-center"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Secret Code</label>
            <input
              type="text"
              value={secret}
              onChange={e => { setSecret(e.target.value); setStatus('idle'); setErrorMsg(''); }}
              placeholder="Enter secret from your band"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-center"
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">This is the unique code included with your wristband for verification.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Activating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check-circle"></i>
                Activate Band
              </>
            )}
          </button>
        </form>

        {/* Status feedback */}
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-check text-green-600 text-xl"></i>
            </div>
            <p className="font-semibold text-green-800">Band Activated!</p>
            <p className="text-sm text-green-600 mt-1">
              <span className="font-mono">{scannedBandId}</span> is now linked to your account.
            </p>
            <p className="text-xs text-green-500 mt-2">Redirecting to profile setup...</p>
          </div>
        )}

        {status === 'claimed' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-triangle-exclamation text-yellow-600 text-xl"></i>
            </div>
            <p className="font-semibold text-yellow-800">Already Claimed</p>
            <p className="text-sm text-yellow-600">{errorMsg}</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-circle-xmark text-red-600 text-xl"></i>
            </div>
            <p className="font-semibold text-red-800">Not Recognized</p>
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {status === 'error' && errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Help text */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
          <i className="fa-solid fa-circle-info text-gray-400 mt-0.5"></i>
          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-600 mb-1">Where do I find these?</p>
            <p>Your Band ID (e.g. BAND-0001) and Secret Code are printed on the inside of your wristband and on the card in your packaging.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
