'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProfileData {
  full_name: string;
  emergency_contact: string;
  city_country: string;
  blood_group: string;
  emergency_note: string;
  full_name_public: boolean;
  emergency_contact_public: boolean;
  city_country_public: boolean;
  blood_group_public: boolean;
  emergency_note_public: boolean;
}

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    emergency_contact: '',
    city_country: '',
    blood_group: 'O+',
    emergency_note: '',
    full_name_public: true,
    emergency_contact_public: true,
    city_country_public: false,
    blood_group_public: true,
    emergency_note_public: true,
  });

  const [bandId, setBandId] = useState<string | null>(null);

  useEffect(() => {
    // Get band ID from URL query param first, then fall back to localStorage
    const urlBandId = searchParams.get('band');
    const id = urlBandId || localStorage.getItem('activeBandId');
    setBandId(id);

    // Store in localStorage for consistency
    if (urlBandId) {
      localStorage.setItem('activeBandId', urlBandId);
    }

    if (!id) return;

    fetch(`/api/profile/${id}`, { credentials: 'same-origin' })
      .then(async r => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Please log in again.' : 'Failed to load profile.');
        return r.json();
      })
      .then(data => {
        setProfile({
          full_name: data.full_name || '',
          emergency_contact: data.emergency_contact || '',
          city_country: data.city_country || '',
          blood_group: data.blood_group || 'O+',
          emergency_note: data.emergency_note || '',
          full_name_public: !!data.full_name_public,
          emergency_contact_public: !!data.emergency_contact_public,
          city_country_public: !!data.city_country_public,
          blood_group_public: !!data.blood_group_public,
          emergency_note_public: !!data.emergency_note_public,
        });
      })
      .catch(err => setLoadError(err.message));
  }, [searchParams]);

  async function handleSave() {
    if (!bandId) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const body = {
        full_name: profile.full_name,
        emergency_contact: profile.emergency_contact,
        city_country: profile.city_country,
        blood_group: profile.blood_group,
        emergency_note: profile.emergency_note,
        full_name_public: profile.full_name_public ? 1 : 0,
        emergency_contact_public: profile.emergency_contact_public ? 1 : 0,
        city_country_public: profile.city_country_public ? 1 : 0,
        blood_group_public: profile.blood_group_public ? 1 : 0,
        emergency_note_public: profile.emergency_note_public ? 1 : 0,
      };
      const res = await fetch(`/api/profile/${bandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          router.push('/signup');
          return;
        }
        throw new Error(data.error || 'Failed to save profile.');
      }

      setSaveSuccess(true);
      setTimeout(() => router.push(`/band/${bandId}`), 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <div
        onClick={() => onChange(!checked)}
        className={`toggle-switch ${checked ? 'active' : ''}`}
      />
    );
  }

  const fields: { key: keyof ProfileData; publicKey: keyof ProfileData; label: string; icon: string; type?: string; maxLen: number }[] = [
    { key: 'full_name', publicKey: 'full_name_public', label: 'Full Name', icon: 'fa-user', maxLen: 100 },
    { key: 'emergency_contact', publicKey: 'emergency_contact_public', label: 'Emergency Contact', icon: 'fa-phone', type: 'tel', maxLen: 30 },
    { key: 'city_country', publicKey: 'city_country_public', label: 'City / Country', icon: 'fa-location-dot', maxLen: 100 },
    { key: 'blood_group', publicKey: 'blood_group_public', label: 'Blood Group', icon: 'fa-droplet', maxLen: 3 },
    { key: 'emergency_note', publicKey: 'emergency_note_public', label: 'Emergency Note', icon: 'fa-notes-medical', maxLen: 500 },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.push('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <i className="fa-solid fa-arrow-left text-gray-600"></i>
        </button>
        <div>
          <h1 className="text-lg font-semibold">Edit Details</h1>
          {bandId && (
            <p className="text-xs text-gray-400 font-mono">{bandId}</p>
          )}
        </div>
        <button onClick={() => setShowPreview(true)} className="ml-auto w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <i className="fa-solid fa-eye text-indigo-500"></i>
        </button>
      </header>

      {loadError && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {/* Profile photo */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-user text-indigo-400 text-3xl"></i>
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow">
            <i className="fa-solid fa-camera text-xs"></i>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Configure what responders see in an emergency</p>
      </div>

      {/* Fields */}
      <div className="px-6 space-y-5">
        {fields.map(field => {
          const isPublic = profile[field.publicKey] as boolean;
          return (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium flex items-center gap-2 ${isPublic ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <i className={`fa-solid ${field.icon}`}></i>
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{isPublic ? 'Public' : 'Private'}</span>
                  <Toggle
                    checked={isPublic}
                    onChange={v => setProfile(p => ({ ...p, [field.publicKey]: v }))}
                  />
                </div>
              </div>
              {field.key === 'blood_group' ? (
                <select
                  value={profile.blood_group}
                  onChange={e => setProfile(p => ({ ...p, blood_group: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              ) : field.key === 'emergency_note' ? (
                <textarea
                  value={profile.emergency_note}
                  onChange={e => setProfile(p => ({ ...p, emergency_note: e.target.value }))}
                  placeholder="e.g. Penicillin allergy. If found unconscious, call emergency contact."
                  rows={3}
                  maxLength={field.maxLen}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={profile[field.key] as string}
                  onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.label}
                  maxLength={field.maxLen}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {saveError && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-600">
              Profile saved! Redirecting...
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                <span className="font-semibold text-red-700">EMERGENCY INFO</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{profile.full_name || 'Name not set'}</h3>
              {profile.emergency_contact_public && profile.emergency_contact && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <i className="fa-solid fa-phone text-red-500 w-5"></i>
                  <span>{profile.emergency_contact}</span>
                </div>
              )}
              {profile.blood_group_public && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <i className="fa-solid fa-droplet text-red-500 w-5"></i>
                  <span>Blood: {profile.blood_group}</span>
                </div>
              )}
              {profile.emergency_note_public && profile.emergency_note && (
                <div className="flex items-center gap-2 text-sm">
                  <i className="fa-solid fa-notes-medical text-red-500 w-5"></i>
                  <span>{profile.emergency_note}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-indigo-500 text-2xl"></i>
      </div>
    }>
      <EditProfileContent />
    </Suspense>
  );
}
