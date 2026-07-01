import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_MOTHER_EMAIL_KEY = 'afryamama:last-mother-email';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getRememberedMotherEmail(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_MOTHER_EMAIL_KEY);
    if (!value) return null;

    const normalized = normalizeEmail(value);
    return normalized || null;
  } catch {
    return null;
  }
}

export async function rememberMotherEmail(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  await AsyncStorage.setItem(LAST_MOTHER_EMAIL_KEY, normalized);
}

export async function forgetRememberedMotherEmail(): Promise<void> {
  await AsyncStorage.removeItem(LAST_MOTHER_EMAIL_KEY);
}
