import AsyncStorage from '@react-native-async-storage/async-storage';

export type MoodTag = 'CALM' | 'TIRED' | 'HAPPY' | 'ANXIOUS';
export type SymptomTag = 'NONE' | 'NAUSEA' | 'BACK_PAIN' | 'HEADACHE' | 'SWELLING';

interface DailyCheckin {
  dateKey: string;
  mood: MoodTag;
  symptom: SymptomTag;
  updatedAt: string;
}

interface ExperienceState {
  checkins: Record<string, DailyCheckin>;
}

const DEFAULT_STATE: ExperienceState = {
  checkins: {},
};

function buildStorageKey(email: string): string {
  return `afryamama:mood-checkin:${email.trim().toLowerCase()}`;
}

function getDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readState(email: string): Promise<ExperienceState> {
  const key = buildStorageKey(email);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as ExperienceState;
    if (!parsed || typeof parsed !== 'object' || !parsed.checkins) {
      return DEFAULT_STATE;
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

async function writeState(email: string, state: ExperienceState): Promise<void> {
  const key = buildStorageKey(email);
  await AsyncStorage.setItem(key, JSON.stringify(state));
}

export async function getTodayCheckin(email: string): Promise<DailyCheckin | null> {
  const state = await readState(email);
  const dateKey = getDateKey();
  return state.checkins[dateKey] || null;
}

export async function saveTodayCheckin(
  email: string,
  mood: MoodTag,
  symptom: SymptomTag
): Promise<DailyCheckin> {
  const state = await readState(email);
  const dateKey = getDateKey();

  const checkin: DailyCheckin = {
    dateKey,
    mood,
    symptom,
    updatedAt: new Date().toISOString(),
  };

  state.checkins[dateKey] = checkin;
  await writeState(email, state);
  return checkin;
}

export async function getMoodStreakDays(email: string): Promise<number> {
  const state = await readState(email);
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const dateKey = getDateKey(date);
    if (state.checkins[dateKey]) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
