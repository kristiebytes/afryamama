import { NextResponse } from 'next/server';
import { collection, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';
import { consumeClinicianActivationToken } from '@/lib/clinicianActivationStore';

type ActivateBody = {
  token?: string;
};

async function activateClinicianByEmail(email: string): Promise<boolean> {
  const collections = ['doctors', 'Doctors'];
  const emailFields = ['email', 'Email', 'userEmail', 'user_email'];

  for (const collectionName of collections) {
    for (const fieldName of emailFields) {
      const snapshot = await getDocs(
        query(collection(firebaseDb, collectionName), where(fieldName, '==', email), limit(1))
      );

      if (snapshot.empty) continue;

      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: 'Active',
        activatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return true;
    }
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActivateBody;
    const token = (body.token || '').trim();

    if (!token) {
      return NextResponse.json({ message: 'Activation token is required.' }, { status: 400 });
    }

    const consumed = consumeClinicianActivationToken(token);
    if (!consumed.ok) {
      return NextResponse.json({ message: 'Invalid or expired activation link.' }, { status: 401 });
    }

    const activated = await activateClinicianByEmail(consumed.email);
    if (!activated) {
      return NextResponse.json({ message: 'Clinician account not found for activation.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const details = error instanceof Error && error.message ? ` ${error.message}` : '';
    return NextResponse.json({ message: `Failed to activate clinician account.${details}` }, { status: 500 });
  }
}
