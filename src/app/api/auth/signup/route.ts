import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/validate';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`signup:${ip}`, { maxAttempts: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { email, password } = await req.json();

    const emailErr = validateEmail(email);
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

    const passErr = validatePassword(password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    const db = await getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);
    db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)').run(id, normalizedEmail, hashedPassword);

    const token = createToken(id);
    const response = NextResponse.json({ userId: id });
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
