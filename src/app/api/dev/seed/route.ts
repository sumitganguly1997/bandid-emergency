import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const DEV_USER = {
  email: 'dev@bandid.test',
  password: 'DevMode123',
};

const SEED_BANDS = [
  {
    bandId: 'BAND-0001',
    secret: 'dev-secret-0001',
    profile: {
      full_name: 'Alice Johnson',
      emergency_contact: '+1-555-0101',
      city_country: 'San Francisco, USA',
      blood_group: 'A+',
      emergency_note: 'Allergic to penicillin. Takes daily insulin.',
      full_name_public: 1,
      emergency_contact_public: 1,
      city_country_public: 1,
      blood_group_public: 1,
      emergency_note_public: 1,
    },
  },
  {
    bandId: 'BAND-0002',
    secret: 'dev-secret-0002',
    profile: {
      full_name: 'Bob Martinez',
      emergency_contact: '+44-20-7946-0958',
      city_country: 'London, UK',
      blood_group: 'O-',
      emergency_note: 'Epilepsy. Emergency meds in left pocket.',
      full_name_public: 1,
      emergency_contact_public: 1,
      city_country_public: 0,
      blood_group_public: 1,
      emergency_note_public: 1,
    },
  },
  {
    bandId: 'BAND-0003',
    secret: 'dev-secret-0003',
    profile: {
      full_name: 'Chloe Tanaka',
      emergency_contact: '+81-90-1234-5678',
      city_country: 'Tokyo, Japan',
      blood_group: 'B+',
      emergency_note: 'Asthma. Carries inhaler.',
      full_name_public: 1,
      emergency_contact_public: 1,
      city_country_public: 1,
      blood_group_public: 1,
      emergency_note_public: 0,
    },
  },
];

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return NextResponse.json({ error: 'Dev mode is not enabled' }, { status: 403 });
  }

  try {
    // 1. Create or get dev user
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(DEV_USER.email) as { id: string } | undefined;
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = uuid();
      const hash = await bcrypt.hash(DEV_USER.password, 12);
      db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)').run(userId, DEV_USER.email, hash);
    }

    // 2. Provision bands and create profiles
    for (const seed of SEED_BANDS) {
      const existing = db.prepare('SELECT band_id FROM provisioned_bands WHERE band_id = ?').get(seed.bandId);
      if (existing) continue;

      // Provision the band
      db.prepare('INSERT INTO provisioned_bands (band_id, secret) VALUES (?, ?)').run(seed.bandId, seed.secret);

      // Activate the band for the dev user
      db.prepare('INSERT INTO bands (id, band_id, user_id, status) VALUES (?, ?, ?, ?)').run(uuid(), seed.bandId, userId, 'active');

      // Create the profile
      const p = seed.profile;
      db.prepare(`INSERT INTO profiles (id, band_id, full_name, emergency_contact, city_country, blood_group, emergency_note, full_name_public, emergency_contact_public, city_country_public, blood_group_public, emergency_note_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        uuid(), seed.bandId, p.full_name, p.emergency_contact, p.city_country, p.blood_group, p.emergency_note,
        p.full_name_public, p.emergency_contact_public, p.city_country_public, p.blood_group_public, p.emergency_note_public
      );
    }

    // 3. Create auth token and set cookie
    const token = createToken(userId);
    const response = NextResponse.json({
      success: true,
      userId,
      email: DEV_USER.email,
      bands: SEED_BANDS.map(b => b.bandId),
    });
    setAuthCookie(response, token);

    return response;
  } catch (err) {
    console.error('Dev seed error:', err);
    return NextResponse.json({ error: 'Seed failed', detail: String(err) }, { status: 500 });
  }
}
