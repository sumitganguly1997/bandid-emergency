import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

interface ProvisionedRow {
  band_id: string;
  secret: string;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`band:${ip}`, { maxAttempts: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const { bandId, secret } = await req.json();
    if (!bandId || !secret || typeof bandId !== 'string' || typeof secret !== 'string') {
      return NextResponse.json({ error: 'Band ID and secret required' }, { status: 400 });
    }

    const provisioned = db.prepare('SELECT band_id, secret FROM provisioned_bands WHERE band_id = ?').get(bandId) as ProvisionedRow | undefined;
    if (!provisioned) {
      return NextResponse.json({ error: 'This band ID is not recognized. Only official bands can be registered.' }, { status: 404 });
    }
    if (provisioned.secret !== secret) {
      return NextResponse.json({ error: 'Invalid QR code. Please scan the band again.' }, { status: 403 });
    }

    const existing = db.prepare('SELECT id FROM bands WHERE band_id = ?').get(bandId);
    if (existing) {
      return NextResponse.json({ error: 'Band already claimed' }, { status: 409 });
    }

    const id = uuidv4();
    const profileId = uuidv4();

    db.prepare('INSERT INTO bands (id, band_id, user_id) VALUES (?, ?, ?)').run(id, bandId, userId);
    db.prepare('INSERT INTO profiles (id, band_id) VALUES (?, ?)').run(profileId, bandId);

    return NextResponse.json({ success: true, bandId });
  } catch (error) {
    console.error('Band registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
