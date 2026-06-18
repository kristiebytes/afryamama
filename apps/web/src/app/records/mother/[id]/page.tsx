"use client";

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';

interface MotherPncPageProps {
  params: Promise<{ id: string }>;
}

interface MotherPncRecord {
  motherName: string;
  motherId: string;
  dob: string;
  deliveryDate: string;
  gravidaPara: string;
  pncVisits: number;
  postpartumWeeks: number | null;
  notes: string;
}

const emptyRecord: MotherPncRecord = {
  motherName: 'Unknown Mother',
  motherId: '-',
  dob: '-',
  deliveryDate: '-',
  gravidaPara: '-',
  pncVisits: 0,
  postpartumWeeks: null,
  notes: 'No notes available.',
};

export default function MotherPncPage({ params }: MotherPncPageProps) {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MotherPncRecord>(emptyRecord);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const resolved = await params;
      if (!isMounted) return;

      const motherId = resolved.id;
      setId(motherId);

      try {
        const motherDoc = await getDoc(doc(firebaseDb, 'mothers', motherId));
        const maternalSnapshot = await getDocs(collection(firebaseDb, 'maternalRecords'));

        const maternalRows = maternalSnapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((row: any) => row.motherId === motherId || row.mother_id === motherId);

        const latest = (maternalRows[0] || {}) as Record<string, unknown>;
        const pncRows = maternalRows.filter((row: any) => {
          const type = String(row.recordType || row.type || '').toUpperCase();
          return type.includes('PNC') || type.includes('POSTNATAL');
        });

        let nextRecord = { ...emptyRecord, motherId };

        if (motherDoc.exists()) {
          const data = motherDoc.data();
          const deliveryDate = data.deliveryDate || data.lastDeliveryDate || '-';
          const postpartumWeeks = deliveryDate && deliveryDate !== '-'
            ? Math.max(0, Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24 * 7)))
            : null;

          nextRecord = {
            ...nextRecord,
            motherName: data.full_name || data.name || 'Unknown Mother',
            dob: data.dateOfBirth || data.dob || '-',
            deliveryDate,
            gravidaPara: data.gravidaPara || data.obstetricSummary || '-',
            postpartumWeeks,
          };
        }

        nextRecord = {
          ...nextRecord,
          pncVisits: pncRows.length,
          notes:
            String(latest.notes || latest.clinicalObservations || latest.plan || 'No notes available.'),
        };

        setRecord(nextRecord);
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
          <h1 className="page-title">Maternal PNC Record</h1>
          <p className="page-subtitle">Live Firestore maternal postnatal record view.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>Mother Overview</span>
        </div>
        {loading ? (
          <p>Loading maternal record...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Name: {record.motherName}</div>
            <div>ID: {id || record.motherId}</div>
            <div>DOB: {record.dob}</div>
            <div>Delivered: {record.deliveryDate}</div>
            <div>Obstetric Summary: {record.gravidaPara}</div>
            <div>PNC Visits: {record.pncVisits}</div>
          </div>
        )}
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>Visit Notes</span>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Postpartum period: {record.postpartumWeeks ?? '-'} weeks. {record.notes}
        </p>
      </div>
    </main>
  );
}
