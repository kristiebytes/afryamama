import {
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithCustomToken,
	signInWithEmailAndPassword,
	signOut,
	updateProfile,
	type User,
} from 'firebase/auth';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { firebaseAuth, firebaseDb } from './firebaseClient';

function uniqueUrls(values: string[]): string[] {
	const seen = new Set<string>();
	const ordered: string[] = [];

	for (const value of values) {
		const normalized = value.trim().replace(/\/$/, '');
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		ordered.push(normalized);
	}

	return ordered;
}

function inferMetroHost(): string {
	try {
		const expoHostUri =
			typeof Constants?.expoConfig?.hostUri === 'string'
				? Constants.expoConfig.hostUri
				: '';
		if (expoHostUri.trim()) {
			const host = expoHostUri.split(':')[0]?.trim() || '';
			if (host && host !== 'localhost' && host !== '127.0.0.1') {
				return host;
			}
		}

		const scriptURL =
			typeof NativeModules?.SourceCode?.scriptURL === 'string'
				? NativeModules.SourceCode.scriptURL
				: '';

		if (!scriptURL) return '';

		const match = scriptURL.match(/^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+)(?::\d+)?/i);
		if (!match?.[1]) return '';

		const host = match[1].trim();
		if (!host || host === 'localhost' || host === '127.0.0.1') return '';
		return host;
	} catch {
		return '';
	}
}

function getApiBaseUrls(): string[] {
	const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
	const metroHost = inferMetroHost();
	const isPhysicalDevice = Boolean(Constants?.isDevice);

	return uniqueUrls([
		configured,
		metroHost ? `http://${metroHost}:5055` : '',
		Platform.OS === 'android' ? 'http://10.0.2.2:5055' : '',
		isPhysicalDevice ? '' : 'http://localhost:5055',
	]);
}

async function postJsonWithTimeout(
	url: string,
	body: unknown,
	timeoutMs: number
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeoutId);
	}
}

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

function getMotherDocId(email: string): string {
	return normalizeEmail(email).replace(/[^a-z0-9]/gi, '_');
}

function formatMotherCode(sequence: number): string {
	return `M${String(sequence).padStart(3, '0')}`;
}

async function loadMotherDocByEmail(email: string) {
	const normalizedEmail = normalizeEmail(email);
	const docId = getMotherDocId(normalizedEmail);

	const directDoc = await getDoc(doc(firebaseDb, 'mothers', docId));
	if (directDoc.exists()) {
		return directDoc.data() as Record<string, unknown>;
	}

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
	}

	return null;
}

async function ensureMotherProfileForUser(user: User): Promise<void> {
	const email = normalizeEmail(user.email);
	if (!email) return;

	const docId = getMotherDocId(email);
	const motherDocRef = doc(firebaseDb, 'mothers', docId);
	const motherDoc = await getDoc(motherDocRef);

	if (motherDoc.exists()) {
		const existing = motherDoc.data() as Record<string, unknown>;
		await setDoc(
			motherDocRef,
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
	const motherCode = formatMotherCode(Math.floor(Date.now() / 1000));

	await setDoc(
		motherDocRef,
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

async function safeEnsureMotherProfileForUser(user: User): Promise<void> {
	try {
		await ensureMotherProfileForUser(user);
	} catch (error) {
		console.warn('Mother profile bootstrap failed:', error);
	}
}

export async function loginWithFirebase(email: string, password: string) {
	const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
	await safeEnsureMotherProfileForUser(credential.user);
	return credential;
}

export async function loginWithFirebasePin(email: string, pin: string) {
	const normalizedEmail = email.trim().toLowerCase();
	const normalizedPin = pin.trim();

	if (!normalizedEmail) {
		throw new Error('Email is required for PIN login.');
	}

	if (!/^\d{4}$/.test(normalizedPin)) {
		throw new Error('PIN must be exactly 4 digits.');
	}

	const baseUrls = getApiBaseUrls();
	const attempted: string[] = [];
	let lastNetworkError: string | null = null;

	for (const baseUrl of baseUrls) {
		attempted.push(baseUrl);

		try {
			const response = await postJsonWithTimeout(
				`${baseUrl}/api/auth/mother-pin-login`,
				{ email: normalizedEmail, pin: normalizedPin },
				4500
			);

			const payload = (await response.json().catch(() => ({}))) as {
				customToken?: string;
				message?: string;
			};

			if (!response.ok || !payload.customToken) {
				throw new Error(payload.message || 'PIN login failed.');
			}

			const credential = await signInWithCustomToken(firebaseAuth, payload.customToken);
			void safeEnsureMotherProfileForUser(credential.user);
			return credential;
		} catch (error) {
			// If backend replied with an auth/business error, show it directly.
			if (
				error instanceof Error &&
				error.name !== 'AbortError' &&
				!/Network request failed/i.test(error.message)
			) {
				throw error;
			}

			lastNetworkError =
				error instanceof Error && error.name === 'AbortError'
					? `Timed out at ${baseUrl}`
					: `Unreachable at ${baseUrl}`;
		}
	}

	throw new Error(
		`PIN login timed out. Start backend with npm run dev:server and ensure device can reach one of: ${attempted.join(', ')}. Last check: ${lastNetworkError || 'network unavailable'}.`
	);
}

export async function signUpMotherWithFirebase(fullName: string, email: string, password: string) {
	const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
	const displayName = fullName.trim();
	if (displayName) {
		await updateProfile(credential.user, { displayName });
	}
	await safeEnsureMotherProfileForUser(credential.user);

	return credential;
}

export async function sendMotherPasswordReset(email: string) {
	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail) {
		throw new Error('Please enter your email address first.');
	}

	await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
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
