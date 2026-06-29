import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { mockUsers, mockMothers, mockDoctors } from '../mockData';
import { Role } from '@afryamama/types';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '../firebaseAdmin';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-afryamama-key-change-me-in-production';

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getMotherDocId(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9]/gi, '_');
}

// POST /api/auth/mother-pin-login
router.post('/mother-pin-login', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const pin = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });
    }

    const adminDb = getFirebaseAdminDb();
    const adminAuth = getFirebaseAdminAuth();
    const motherDocId = getMotherDocId(email);

    const motherDoc = await adminDb.collection('mothers').doc(motherDocId).get();
    if (!motherDoc.exists) {
      return res.status(404).json({ message: 'Mother account not found.' });
    }

    const motherData = (motherDoc.data() || {}) as Record<string, unknown>;
    const storedPinRaw =
      (typeof motherData.loginPin === 'string' ? motherData.loginPin : '') ||
      (typeof motherData.lockscreenPin === 'string' ? motherData.lockscreenPin : '');
    const storedPin = storedPinRaw.trim();

    if (!storedPin || storedPin !== pin) {
      return res.status(401).json({ message: 'Invalid PIN.' });
    }

    const user = await adminAuth.getUserByEmail(email);
    const token = await adminAuth.createCustomToken(user.uid, { loginMethod: 'pin' });

    return res.status(200).json({ customToken: token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PIN login failed.';
    return res.status(500).json({ message });
  }
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Find user in mock db
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: 'User not found. Try mother@afryamama.org or doctor@afryamama.org' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Retrieve matching profile
  let profile = undefined;
  if (user.role === 'MOTHER') {
    profile = mockMothers.find(m => m.userId === user.id);
  } else if (user.role === 'DOCTOR') {
    profile = mockDoctors.find(d => d.userId === user.id);
  }

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    profile
  });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { email, password, role, name, phone, dateOfBirth, location, bloodGroup, specialization, hospital } = req.body;

  if (!email || !role || !name) {
    return res.status(400).json({ message: 'Email, role, and name are required' });
  }

  const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create new user in-memory (mock store)
  const userId = `u-${role.toLowerCase()}-${mockUsers.length + 1}`;
  const newUser = {
    id: userId,
    email,
    role: role as Role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockUsers.push(newUser);

  let newProfile: any = null;

  if (role === 'MOTHER') {
    newProfile = {
      id: `m-${mockMothers.length + 1}`,
      userId,
      name,
      phone,
      dateOfBirth,
      location,
      bloodGroup,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockMothers.push(newProfile);
  } else if (role === 'DOCTOR') {
    newProfile = {
      id: `d-${mockDoctors.length + 1}`,
      userId,
      name,
      phone,
      specialization,
      hospital,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockDoctors.push(newProfile);
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.status(201).json({
    token,
    user: newUser,
    profile: newProfile || undefined
  });
});

export default router;
