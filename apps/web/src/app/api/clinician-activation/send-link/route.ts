import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';
import {
  canSendNewActivationLink,
  createClinicianActivationToken,
  saveClinicianActivationToken,
} from '@/lib/clinicianActivationStore';

type SendActivationLinkBody = {
  email?: string;
};

function parsePort(value: string | undefined): number {
  const parsed = Number(value || '587');
  return Number.isFinite(parsed) ? parsed : 587;
}

async function clinicianExists(email: string): Promise<boolean> {
  const collections = ['doctors', 'Doctors'];
  const emailFields = ['email', 'Email', 'userEmail', 'user_email'];

  for (const collectionName of collections) {
    for (const fieldName of emailFields) {
      const snapshot = await getDocs(
        query(collection(firebaseDb, collectionName), where(fieldName, '==', email), limit(1))
      );
      if (!snapshot.empty) return true;
    }
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendActivationLinkBody;
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    const exists = await clinicianExists(email);
    if (!exists) {
      return NextResponse.json({ message: 'Clinician email not found.' }, { status: 404 });
    }

    if (!canSendNewActivationLink(email)) {
      return NextResponse.json(
        { message: 'Please wait at least 30 seconds before requesting another activation link.' },
        { status: 429 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return NextResponse.json(
        {
          message:
            'Email service is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in apps/web/.env.local.',
        },
        { status: 500 }
      );
    }

    const token = createClinicianActivationToken();
    saveClinicianActivationToken(email, token);

    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    const activationLink = `${baseUrl}/activate-clinician?token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parsePort(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'AfyaMama clinician account activation',
      text: `Welcome to AfyaMama. Activate your clinician account using this link: ${activationLink}. The link expires in 24 hours.`,
      html: `<p>Welcome to AfyaMama.</p><p>Activate your clinician account by clicking <a href="${activationLink}">this activation link</a>.</p><p>This link expires in 24 hours.</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const details = error instanceof Error && error.message ? ` ${error.message}` : '';
    return NextResponse.json({ message: `Failed to send activation link.${details}` }, { status: 500 });
  }
}
