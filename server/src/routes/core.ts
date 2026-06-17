import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { 
  mockUsers, mockMothers, mockDoctors, mockChildren, mockPregnancies, 
  mockAppointments, mockMaternalRecords, mockGrowthRecords, mockImmunizations, 
  mockWellnessTips, mockNotifications 
} from '../mockData';
import { Role, AppointmentStatus, ImmunizationStatus, PregnancyStatus } from '@afryamama/types';

const router = Router();

// Secure all endpoints below with JWT Auth
router.use(authenticateToken as any);

// ==========================================
// USERS ROUTE
// ==========================================
router.get('/users', (req: AuthRequest, res: Response) => {
  return res.status(200).json(mockUsers);
});

router.get('/users/:id', (req: AuthRequest, res: Response) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json(user);
});

// ==========================================
// MOTHERS ROUTE
// ==========================================
router.get('/mothers', (req: AuthRequest, res: Response) => {
  return res.status(200).json(mockMothers);
});

router.get('/mothers/:id', (req: AuthRequest, res: Response) => {
  const mother = mockMothers.find(m => m.id === req.params.id);
  if (!mother) return res.status(404).json({ message: 'Mother not found' });
  return res.status(200).json(mother);
});

router.post('/mothers', (req: AuthRequest, res: Response) => {
  const newMother = {
    id: `m-${mockMothers.length + 1}`,
    userId: req.user?.id || 'u-mother-1',
    name: req.body.name,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    location: req.body.location,
    bloodGroup: req.body.bloodGroup,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockMothers.push(newMother);
  return res.status(201).json(newMother);
});

router.put('/mothers/:id', (req: AuthRequest, res: Response) => {
  const index = mockMothers.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Mother not found' });

  mockMothers[index] = {
    ...mockMothers[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  return res.status(200).json(mockMothers[index]);
});

// ==========================================
// DOCTORS ROUTE
// ==========================================
router.get('/doctors', (req: AuthRequest, res: Response) => {
  return res.status(200).json(mockDoctors);
});

router.get('/doctors/:id', (req: AuthRequest, res: Response) => {
  const doctor = mockDoctors.find(d => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  return res.status(200).json(doctor);
});

router.post('/doctors', (req: AuthRequest, res: Response) => {
  const newDoctor = {
    id: `d-${mockDoctors.length + 1}`,
    userId: req.user?.id || 'u-doctor-1',
    name: req.body.name,
    phone: req.body.phone,
    specialization: req.body.specialization,
    hospital: req.body.hospital,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockDoctors.push(newDoctor);
  return res.status(201).json(newDoctor);
});

router.put('/doctors/:id', (req: AuthRequest, res: Response) => {
  const index = mockDoctors.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Doctor not found' });

  mockDoctors[index] = {
    ...mockDoctors[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  return res.status(200).json(mockDoctors[index]);
});

// ==========================================
// CHILDREN ROUTE
// ==========================================
router.get('/children', (req: AuthRequest, res: Response) => {
  const motherId = req.query.motherId as string;
  if (motherId) {
    const filtered = mockChildren.filter(c => c.motherId === motherId);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockChildren);
});

router.get('/children/:id', (req: AuthRequest, res: Response) => {
  const child = mockChildren.find(c => c.id === req.params.id);
  if (!child) return res.status(404).json({ message: 'Child not found' });
  return res.status(200).json(child);
});

router.post('/children', (req: AuthRequest, res: Response) => {
  const newChild = {
    id: `c-${mockChildren.length + 1}`,
    motherId: req.body.motherId || 'm-1',
    name: req.body.name,
    dateOfBirth: req.body.dateOfBirth || new Date().toISOString(),
    gender: req.body.gender,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockChildren.push(newChild);
  return res.status(201).json(newChild);
});

// ==========================================
// PREGNANCIES ROUTE
// ==========================================
router.get('/pregnancies', (req: AuthRequest, res: Response) => {
  const motherId = req.query.motherId as string;
  if (motherId) {
    const filtered = mockPregnancies.filter(p => p.motherId === motherId);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockPregnancies);
});

router.get('/pregnancies/:id', (req: AuthRequest, res: Response) => {
  const pregnancy = mockPregnancies.find(p => p.id === req.params.id);
  if (!pregnancy) return res.status(404).json({ message: 'Pregnancy records not found' });
  return res.status(200).json(pregnancy);
});

router.post('/pregnancies', (req: AuthRequest, res: Response) => {
  const newPregnancy = {
    id: `p-${mockPregnancies.length + 1}`,
    motherId: req.body.motherId || 'm-1',
    startDate: req.body.startDate || new Date().toISOString(),
    estimatedDueDate: req.body.estimatedDueDate || new Date().toISOString(),
    status: (req.body.status || 'ACTIVE') as PregnancyStatus,
    notes: req.body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPregnancies.push(newPregnancy);
  return res.status(201).json(newPregnancy);
});

// ==========================================
// APPOINTMENTS ROUTE
// ==========================================
router.get('/appointments', (req: AuthRequest, res: Response) => {
  const { role, profileId } = req.query;
  if (role && profileId) {
    const filtered = mockAppointments.filter(a => {
      if (role === 'mother') return a.motherId === profileId;
      if (role === 'doctor') return a.doctorId === profileId;
      return true;
    });
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockAppointments);
});

router.get('/appointments/:id', (req: AuthRequest, res: Response) => {
  const appointment = mockAppointments.find(a => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  return res.status(200).json(appointment);
});

router.post('/appointments', (req: AuthRequest, res: Response) => {
  const newAppt = {
    id: `a-${mockAppointments.length + 1}`,
    motherId: req.body.motherId || 'm-1',
    doctorId: req.body.doctorId || 'd-1',
    dateTime: req.body.dateTime || new Date().toISOString(),
    reason: req.body.reason,
    status: (req.body.status || 'PENDING') as AppointmentStatus,
    notes: req.body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockAppointments.push(newAppt);

  // Trigger automated in-memory notification
  mockNotifications.push({
    id: `n-${mockNotifications.length + 1}`,
    userId: req.user?.id || 'u-mother-1',
    title: 'New Appointment Scheduled',
    message: `Your appointment for '${req.body.reason}' is scheduled for ${req.body.dateTime}.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json(newAppt);
});

router.patch('/appointments/:id/status', (req: AuthRequest, res: Response) => {
  const index = mockAppointments.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Appointment not found' });

  mockAppointments[index].status = req.body.status as AppointmentStatus;
  mockAppointments[index].updatedAt = new Date().toISOString();
  return res.status(200).json(mockAppointments[index]);
});

// ==========================================
// MATERNAL RECORDS ROUTE
// ==========================================
router.get('/maternal-records', (req: AuthRequest, res: Response) => {
  const pregnancyId = req.query.pregnancyId as string;
  if (pregnancyId) {
    const filtered = mockMaternalRecords.filter(mr => mr.pregnancyId === pregnancyId);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockMaternalRecords);
});

router.post('/maternal-records', (req: AuthRequest, res: Response) => {
  const newRecord = {
    id: `mr-${mockMaternalRecords.length + 1}`,
    pregnancyId: req.body.pregnancyId || 'p-1',
    weight: req.body.weight,
    bloodPressure: req.body.bloodPressure,
    heartRate: req.body.heartRate,
    checkupDate: req.body.checkupDate || new Date().toISOString(),
    clinicalNotes: req.body.clinicalNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockMaternalRecords.push(newRecord);
  return res.status(201).json(newRecord);
});

// ==========================================
// GROWTH RECORDS ROUTE
// ==========================================
router.get('/growth-records', (req: AuthRequest, res: Response) => {
  const childId = req.query.childId as string;
  if (childId) {
    const filtered = mockGrowthRecords.filter(gr => gr.childId === childId);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockGrowthRecords);
});

router.post('/growth-records', (req: AuthRequest, res: Response) => {
  const newRecord = {
    id: `gr-${mockGrowthRecords.length + 1}`,
    childId: req.body.childId || 'c-1',
    weight: req.body.weight,
    height: req.body.height,
    recordedDate: req.body.recordedDate || new Date().toISOString(),
    notes: req.body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockGrowthRecords.push(newRecord);
  return res.status(201).json(newRecord);
});

// ==========================================
// IMMUNIZATIONS ROUTE
// ==========================================
router.get('/immunizations', (req: AuthRequest, res: Response) => {
  const childId = req.query.childId as string;
  if (childId) {
    const filtered = mockImmunizations.filter(i => i.childId === childId);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockImmunizations);
});

router.put('/immunizations/:id', (req: AuthRequest, res: Response) => {
  const index = mockImmunizations.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Immunization record not found' });

  mockImmunizations[index] = {
    ...mockImmunizations[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  return res.status(200).json(mockImmunizations[index]);
});

// ==========================================
// WELLNESS TIPS ROUTE
// ==========================================
router.get('/wellness-tips', (req: AuthRequest, res: Response) => {
  const audience = req.query.audience as string;
  if (audience) {
    const filtered = mockWellnessTips.filter(wt => wt.targetAudience === audience || wt.targetAudience === 'ALL');
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockWellnessTips);
});

// ==========================================
// NOTIFICATIONS ROUTE
// ==========================================
router.get('/notifications', (req: AuthRequest, res: Response) => {
  const userId = req.query.userId as string;
  if (userId) {
    const filtered = mockNotifications.filter(n => n.userId === userId);
    return res.status(200).json(filtered);
  }
  return res.status(200).json(mockNotifications);
});

router.patch('/notifications/:id/read', (req: AuthRequest, res: Response) => {
  const index = mockNotifications.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Notification not found' });

  mockNotifications[index].read = true;
  return res.status(200).json(mockNotifications[index]);
});

export default router;
