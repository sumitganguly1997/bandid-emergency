import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit

interface ProfileRow {
  pdf_data: string | null;
  pdf_filename: string | null;
  pdf_public: number;
}

interface BandRow {
  user_id: string;
}

// GET - Download PDF (public if pdf_public is set, or if owner)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const userId = getAuthUserId(req);
  const db = await getDb();

  // Get profile with PDF data
  const profile = db.prepare(
    'SELECT pdf_data, pdf_filename, pdf_public FROM profiles WHERE band_id = ?'
  ).get(bandId) as ProfileRow | undefined;

  if (!profile || !profile.pdf_data) {
    return NextResponse.json({ error: 'No PDF found' }, { status: 404 });
  }

  // Check if PDF is public or user is owner
  if (!profile.pdf_public) {
    const band = db.prepare('SELECT user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;
    if (!band || band.user_id !== userId) {
      return NextResponse.json({ error: 'PDF is private' }, { status: 403 });
    }
  }

  // Return PDF data as base64 JSON (for simplicity)
  return NextResponse.json({
    filename: profile.pdf_filename,
    data: profile.pdf_data,
  });
}

// POST - Upload PDF (owner only)
export async function POST(
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
  const band = db.prepare('SELECT user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 });
  }
  if (band.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { filename, data, isPublic } = body;

    if (!filename || !data) {
      return NextResponse.json({ error: 'Missing filename or data' }, { status: 400 });
    }

    // Check file size (base64 is ~33% larger than original)
    const estimatedSize = (data.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 });
    }

    // Validate it's a PDF by checking the base64 header
    if (!data.startsWith('JVBERi') && !data.includes('data:application/pdf')) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF files are allowed.' }, { status: 400 });
    }

    // Update profile with PDF
    db.prepare(`
      UPDATE profiles
      SET pdf_data = ?, pdf_filename = ?, pdf_public = ?, updated_at = CURRENT_TIMESTAMP
      WHERE band_id = ?
    `).run(data, filename, isPublic ? 1 : 0, bandId);

    return NextResponse.json({ success: true, message: 'PDF uploaded successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
  }
}

// DELETE - Remove PDF (owner only)
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
  const band = db.prepare('SELECT user_id FROM bands WHERE band_id = ?').get(bandId) as BandRow | undefined;
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 });
  }
  if (band.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  db.prepare(`
    UPDATE profiles
    SET pdf_data = '', pdf_filename = '', updated_at = CURRENT_TIMESTAMP
    WHERE band_id = ?
  `).run(bandId);

  return NextResponse.json({ success: true, message: 'PDF removed successfully' });
}
