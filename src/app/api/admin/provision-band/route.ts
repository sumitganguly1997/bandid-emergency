import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

function getAdminKey(): string {
  const key = process.env.ADMIN_KEY;
  if (!key || key === 'change-me-to-a-random-admin-key') {
    throw new Error('ADMIN_KEY environment variable must be set to a secure value');
  }
  return key;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = rateLimit(`admin:${ip}`, { maxAttempts: 3, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const { adminKey, bandId } = await req.json();
  if (adminKey !== getAdminKey()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = bandId || `BND-${Math.floor(100 + Math.random() * 900)}-${uuidv4().slice(0, 4).toUpperCase()}`;
  const secret = uuidv4();

  try {
    const db = await getDb();
    db.prepare('INSERT INTO provisioned_bands (band_id, secret) VALUES (?, ?)').run(id, secret);
    return NextResponse.json({ bandId: id, secret, qrPayload: JSON.stringify({ bandId: id, secret }) });
  } catch {
    return NextResponse.json({ error: 'Band ID already exists' }, { status: 409 });
  }
}
