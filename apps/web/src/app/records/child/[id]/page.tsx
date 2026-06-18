"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';

interface ChildRecordPageProps {
  params: Promise<{ id: string }>;
}

interface ChildSummary {
  childName: string;
  motherName: string;
  dob: string;
  sex: string;
  birthWeight: string;
  ageWeeks: number | null;
  ageMonths: number | null;
  childId: string;
}

interface ImmunizationRow {
  id: string;
  vaccine: string;
  schedule: string;
  status: 'Done' | 'Due' | 'Overdue';
}

const emptySummary: ChildSummary = {
  childName: 'Unknown Child',
  motherName: '-',
  dob: '-',
  sex: '-',
  birthWeight: '-',
  ageWeeks: null,
  ageMonths: null,
  childId: '-',
};

export default function ChildRecordPage({ params }: ChildRecordPageProps) {
  const [motherId, setMotherId] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ChildSummary>(emptySummary);
  const [immunizations, setImmunizations] = useState<ImmunizationRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const resolved = await params;
      if (!isMounted) return;

      const id = resolved.id;
      setMotherId(id);

      try {
        const [mothersSnapshot, childrenSnapshot, immunizationSnapshot] = await Promise.all([
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'children')),
          getDocs(collection(firebaseDb, 'immunizations')),
        ]);

        const motherDoc = mothersSnapshot.docs.find((item) => item.id === id);
        const motherName = motherDoc?.data().full_name || motherDoc?.data().name || '-';

        const childDoc = childrenSnapshot.docs.find((item) => {
          const data = item.data();
          return data.motherId === id || data.mother_id === id;
        });

        if (childDoc) {
          const child = childDoc.data();
          const dob = child.dateOfBirth || child.dob || '-';
          const ageInWeeks = dob !== '-'
            ? Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 7)))
            : null;

          setSummary({
            childName: child.name || 'Unknown Child',
            motherName,
            dob,
            sex: child.gender || child.sex || '-',
            birthWeight: child.birthWeight ? `${child.birthWeight} kg` : '-',
            ageWeeks: ageInWeeks,
            ageMonths: ageInWeeks === null ? null : Math.floor(ageInWeeks / 4),
            childId: childDoc.id,
          });

          const rows: ImmunizationRow[] = immunizationSnapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .filter((row: any) => row.childId === childDoc.id || row.child_id === childDoc.id)
            .map((row: any) => ({
              id: row.id,
              vaccine: row.vaccine || row.vaccineName || 'Unknown Vaccine',
              schedule: row.schedule || row.dose || '-',
              status: row.status === 'Done' || row.status === 'Overdue' ? row.status : 'Due',
            }));

          setImmunizations(rows);
        } else {
          setSummary((prev) => ({ ...prev, motherName }));
        }
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
          <h1 className="page-title">Child Record</h1>
          <p className="page-subtitle">Live Firestore child follow-up view.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>Child Summary</span>
        </div>
        {loading ? (
          <p>Loading child record...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Name: {summary.childName}</div>
            <div>Mother: {summary.motherName}</div>
            <div>Mother ID: {motherId}</div>
            <div>DOB: {summary.dob}</div>
            <div>Sex: {summary.sex}</div>
            <div>Birth Weight: {summary.birthWeight}</div>
            <div>
              Age: {summary.ageWeeks ?? '-'} weeks ({summary.ageMonths ?? '-'} months)
            </div>
          </div>
        )}
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>Immunization Status</span>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vaccine</th>
                <th>Schedule</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>Loading immunizations...</td>
                </tr>
              ) : immunizations.length === 0 ? (
                <tr>
                  <td colSpan={3}>No immunization records found.</td>
                </tr>
              ) : (
                immunizations.map((row) => (
                  <tr key={row.id}>
                    <td>{row.vaccine}</td>
                    <td>{row.schedule}</td>
                    <td>
                      <span className={`badge ${row.status === 'Done' ? 'badge-success' : row.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}`}>
                        {row.status}
                      </span>
                    </td>
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
