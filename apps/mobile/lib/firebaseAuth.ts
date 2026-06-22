import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from 'firebase/auth';
import {
	collection,
	doc,
	getDocs,
	limit,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from './firebaseClient';

export interface MotherProfile {
	displayName: string;
	pregnancyWeek: number | null;
	nextAppointmentText: string | null;
}

function normalizeEmail(value: unknown): string {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function readText(value: unknown, fallback = ''): string {
	if (typeof value === 'string' && value.trim()) return value.trim();
	if (typeof value === 'number') return String(value);
	return fallback;
}

function nameFromEmail(email: string): string {
	const prefix = email.split('@')[0] || 'Mother';
	return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function readNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return null;
}

function readDateText(value: unknown): string | null {
	if (typeof value === 'string' && value.trim()) return value;

	if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
		try {
			const date = (value as { toDate: () => Date }).toDate();
			return date.toLocaleDateString();
		} catch {
			return null;
		}
	}

	return null;
}

function getMotherEmail(data: Record<string, unknown>): string {
	return normalizeEmail(data.email ?? data.Email ?? data.userEmail ?? data.user_email);
}

function parseMotherCodeNumber(code: string): number {
	const match = code.trim().toUpperCase().match(/^M(\d+)$/);
	if (!match) return 0;
	return Number.parseInt(match[1], 10) || 0;
}

function formatMotherCode(sequence: number): string {
	return `M${String(sequence).padStart(3, '0')}`;
}

async function getNextMotherCode(): Promise<string> {
	try {
		const snapshots = await Promise.all([
			getDocs(collection(firebaseDb, 'mothers')),
			getDocs(collection(firebaseDb, 'Mothers')),
		]);

		const docs = snapshots.flatMap((snapshot) => snapshot.docs);
		const maxSequence = docs.reduce((maxValue, item) => {
			const data = item.data() as Record<string, unknown>;
			const code = readText(data.motherCode || data.code || data.mother_code, '');
			const parsed = parseMotherCodeNumber(code);
			return parsed > maxValue ? parsed : maxValue;
		}, 0);

		return formatMotherCode(maxSequence + 1);
	} catch {
		return formatMotherCode(Math.floor(Date.now() / 1000));
	}
}

async function loadMotherDocByEmail(email: string) {
	const normalizedEmail = normalizeEmail(email);
	const emailFields = ['email', 'Email', 'userEmail', 'user_email'];
	const collections = ['mothers', 'Mothers'];
	const candidateEmails = [email.trim(), normalizedEmail].filter(Boolean);

	for (const collectionName of collections) {
		for (const fieldName of emailFields) {
			for (const candidateEmail of candidateEmails) {
				const snapshot = await getDocs(
					query(collection(firebaseDb, collectionName), where(fieldName, '==', candidateEmail), limit(1))
				);

				if (!snapshot.empty) {
					return snapshot.docs[0].data() as Record<string, unknown>;
				}
			}
		}

		const fullSnapshot = await getDocs(collection(firebaseDb, collectionName));
		const matchedDoc = fullSnapshot.docs.find((item) => {
			const data = item.data() as Record<string, unknown>;
			return getMotherEmail(data) === normalizedEmail;
		});

		if (matchedDoc) {
			return matchedDoc.data() as Record<string, unknown>;
		}
	}

	return null;
}

async function ensureMotherProfileForUser(user: User): Promise<void> {
	const email = normalizeEmail(user.email);
	if (!email) return;

	const existing = await loadMotherDocByEmail(email);
	const docId = email.replace(/[^a-z0-9]/gi, '_');

	if (existing) {
		await setDoc(
			doc(firebaseDb, 'mothers', docId),
			{
				email,
				motherCode: readText(existing.motherCode || existing.code || existing.mother_code, ''),
				lastLoginAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{ merge: true }
		);
		return;
	}

	const displayName = user.displayName?.trim() || nameFromEmail(email);
	const motherCode = await getNextMotherCode();

	await setDoc(
		doc(firebaseDb, 'mothers', docId),
		{
			email,
			motherCode,
			fullName: displayName,
			firstName: displayName.split(' ')[0] || displayName,
			lastName: displayName.split(' ').slice(1).join(' '),
			stage: 'PRENATAL',
			pregnancyWeek: null,
			nextAppointment: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			lastLoginAt: new Date().toISOString(),
		},
		{ merge: true }
	);
}

export async function loginWithFirebase(email: string, password: string) {
	const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
	await ensureMotherProfileForUser(credential.user);
	return credential;
}

export async function signUpMotherWithFirebase(email: string, password: string) {
	const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
	await ensureMotherProfileForUser(credential.user);
	return credential;
}

export async function logoutFromFirebase() {
	return signOut(firebaseAuth);
}

export async function loadMotherProfile(user: User): Promise<MotherProfile> {
	const email = user.email?.trim().toLowerCase() || '';

	if (!email) {
		return {
			displayName: 'Mother',
			pregnancyWeek: null,
			nextAppointmentText: null,
		};
	}

	const data = await loadMotherDocByEmail(email);

	if (!data) {
		await ensureMotherProfileForUser(user);
		return {
			displayName: user.displayName || nameFromEmail(email),
			pregnancyWeek: null,
			nextAppointmentText: null,
		};
	}

	const firstName = (data.firstName || data.first_name || '').toString();
	const lastName = (data.lastName || data.last_name || '').toString();
	const fullName = `${firstName} ${lastName}`.trim();

	return {
		displayName: fullName || (data.fullName || data.full_name || data.name || nameFromEmail(email)).toString(),
		pregnancyWeek: readNumber(data.pregnancyWeek ?? data.week ?? data.currentWeek),
		nextAppointmentText: readDateText(data.nextAppointment ?? data.next_appointment ?? data.appointmentDate),
	};
}
