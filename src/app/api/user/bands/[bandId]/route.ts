import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

interface BandRow {
  id: string;
  user_id: string;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const userId = getAuthUserId(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();

  // Check ownership
  const band = db.prepare('SELECT id, user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 });
  }
  if (band.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete profile and band link (band becomes available for re-registration)
  db.prepare('DELETE FROM profiles WHERE band_id = ?').run(bandId);
  db.prepare('DELETE FROM bands WHERE band_id = ?').run(bandId);

  return NextResponse.json({ success: true, message: 'Band unlinked successfully' });
}
