import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

interface BandWithProfile {
  band_id: string;
  status: string;
  full_name: string | null;
  emergency_contact: string | null;
  city_country: string | null;
  blood_group: string | null;
  updated_at: string | null;
}

export async function GET(req: NextRequest) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const bands = db.prepare(`
    SELECT
      b.band_id,
      b.status,
      p.full_name,
      p.emergency_contact,
      p.city_country,
      p.blood_group,
      p.updated_at
    FROM bands b
    LEFT JOIN profiles p ON b.band_id = p.band_id
    WHERE b.user_id = ?
    ORDER BY b.band_id
  `).all(userId) as unknown as BandWithProfile[];

  return NextResponse.json({ bands });
}
