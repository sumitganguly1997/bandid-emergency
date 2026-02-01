import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface BandRow {
  band_id: string;
  status: string;
  user_id: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const db = await getDb();
  const band = db.prepare('SELECT band_id, status, user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;

  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 });
  }

  return NextResponse.json({ bandId: band.band_id, status: band.status });
}
