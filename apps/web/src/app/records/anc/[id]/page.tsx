"use client";

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';

interface AncDetailsPageProps {
  params: Promise<{ id: string }>;
}

interface MotherInfo {
  name: string;
  phone: string;
  gestation: string;
  expectedDelivery: string;
}

interface AncVisitRow {
  id: string;
  contact: string;
  date: string;
  bp: string;
  fhr: string;
  notes: string;
}

export default function AncDetailsPage({ params }: AncDetailsPageProps) {
  const [motherId, setMotherId] = useState('');
  const [loading, setLoading] = useState(true);
  const [mother, setMother] = useState<MotherInfo>({
    name: 'Unknown Mother',
    phone: '-',
    gestation: '-',
    expectedDelivery: '-',
  });
  const [visits, setVisits] = useState<AncVisitRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const resolved = await params;
      if (!isMounted) return;

      const id = resolved.id;
      setMotherId(id);

      try {
        const motherDoc = await getDoc(doc(firebaseDb, 'mothers', id));
        if (motherDoc.exists()) {
          const data = motherDoc.data();
          setMother({
            name: data.full_name || data.name || 'Unknown Mother',
            phone: data.phone || '-',
            gestation: data.gestation || data.gestationWeeks ? `${data.gestation || data.gestationWeeks} weeks` : '-',
            expectedDelivery: data.expectedDeliveryDate || data.edd || '-',
          });
        }

        const appointmentsSnapshot = await getDocs(collection(firebaseDb, 'appointments'));
        const appointmentRows: AncVisitRow[] = appointmentsSnapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item: any) => (item.motherId || item.mother_id) === id)
          .map((item: any) => ({
            id: item.id,
            contact: item.contactNo || item.contact || 'ANC Contact',
            date: item.date || '-',
            bp: item.bp || item.bloodPressure || '-',
            fhr: item.fhr ? `${item.fhr} bpm` : item.fetalHeartRate ? `${item.fetalHeartRate} bpm` : '-',
            notes: item.notes || item.reason || 'No notes recorded.',
          }));

        setVisits(appointmentRows);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">ANC Visit Details</h1>
          <p className="page-subtitle">Live Firestore maternal appointment details.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>Mother Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>Mother ID: {motherId}</div>
          <div>Name: {mother.name}</div>
          <div>Gestation: {mother.gestation}</div>
          <div>Phone: {mother.phone}</div>
          <div>Expected Delivery: {mother.expectedDelivery}</div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>Antenatal Contacts</span>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Date</th>
                <th>BP</th>
                <th>FHR</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading ANC visits...</td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={5}>No ANC records found for this mother.</td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id}>
                    <td>{visit.contact}</td>
                    <td>{visit.date}</td>
                    <td>{visit.bp}</td>
                    <td>{visit.fhr}</td>
                    <td>{visit.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
