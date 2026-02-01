import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { sanitizeString, validateBloodGroup } from '@/lib/validate';

interface ProfileRow {
  full_name: string;
  emergency_contact: string;
  city_country: string;
  blood_group: string;
  emergency_note: string;
  photo_url: string;
  full_name_public: number;
  emergency_contact_public: number;
  city_country_public: number;
  blood_group_public: number;
  emergency_note_public: number;
  updated_at: string;
}

interface BandRow {
  user_id: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const db = await getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE band_id = ?').get(bandId) as ProfileRow | undefined;

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const userId = getAuthUserId(req);
  const band = db.prepare('SELECT user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;
  const isOwner = userId && band && userId === band.user_id;

  if (isOwner) {
    return NextResponse.json(profile);
  }

  // Public view: only return public fields
  const publicProfile: Record<string, string> = { band_id: bandId };
  if (profile.full_name_public) publicProfile.full_name = profile.full_name;
  if (profile.emergency_contact_public) publicProfile.emergency_contact = profile.emergency_contact;
  if (profile.city_country_public) publicProfile.city_country = profile.city_country;
  if (profile.blood_group_public) publicProfile.blood_group = profile.blood_group;
  if (profile.emergency_note_public) publicProfile.emergency_note = profile.emergency_note;
  publicProfile.photo_url = profile.photo_url;
  publicProfile.updated_at = profile.updated_at;

  return NextResponse.json(publicProfile);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const userId = getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const band = db.prepare('SELECT user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;
  if (!band || band.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Sanitize and validate inputs
  const sanitized: Record<string, string | number> = {};

  if (body.full_name !== undefined) sanitized.full_name = sanitizeString(body.full_name, 100);
  if (body.emergency_contact !== undefined) sanitized.emergency_contact = sanitizeString(body.emergency_contact, 30);
  if (body.city_country !== undefined) sanitized.city_country = sanitizeString(body.city_country, 100);
  if (body.blood_group !== undefined) {
    const bg = String(body.blood_group);
    if (!validateBloodGroup(bg)) {
      return NextResponse.json({ error: 'Invalid blood group' }, { status: 400 });
    }
    sanitized.blood_group = bg;
  }
  if (body.emergency_note !== undefined) sanitized.emergency_note = sanitizeString(body.emergency_note, 500);

  // Boolean toggles
  const toggles = ['full_name_public', 'emergency_contact_public', 'city_country_public', 'blood_group_public', 'emergency_note_public'];
  for (const t of toggles) {
    if (body[t] !== undefined) sanitized[t] = body[t] ? 1 : 0;
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updates = Object.keys(sanitized).map(k => `${k} = ?`);
  const values = Object.values(sanitized);

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(bandId);

  db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE band_id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
