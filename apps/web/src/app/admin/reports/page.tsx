'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';

interface ReportTemplate {
  title: string;
  items: string[];
}

export default function AdminReportsPage() {
  const [selected, setSelected] = useState<ReportTemplate | null>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [mothersSnapshot, childrenSnapshot, ancSnapshot, appointmentsSnapshot, notificationsSnapshot] = await Promise.all([
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'children')),
          getDocs(collection(firebaseDb, 'anc_records')),
          getDocs(collection(firebaseDb, 'appointments')),
          getDocs(collection(firebaseDb, 'notifications')),
        ]);

        const templates: ReportTemplate[] = [
          {
            title: 'Maternal Health',
            items: [
              `Total mothers registered: ${mothersSnapshot.size}`,
              `ANC records available: ${ancSnapshot.size}`,
            ],
          },
          {
            title: 'Child Health',
            items: [
              `Total children registered: ${childrenSnapshot.size}`,
              `Linked mother records: ${Math.min(childrenSnapshot.size, mothersSnapshot.size)}`,
            ],
          },
          {
            title: 'Appointments',
            items: [
              `Total appointments: ${appointmentsSnapshot.size}`,
              `Automated reminders sent: ${notificationsSnapshot.size}`,
            ],
          },
        ];

        setReportTemplates(templates);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">System Reports</h1>
          <p className="page-subtitle">Integrated from your legacy report cards and detail flow.</p>
        </div>
      </div>

      {!selected ? (
        <div className="card-grid">
          {loading ? <p>Loading reports from Firestore...</p> : null}

          {!loading && reportTemplates.length === 0 ? (
            <p>No report datasets found in Firestore yet.</p>
          ) : null}

          {!loading
            ? reportTemplates.map((report) => (
                <button
                  key={report.title}
                  className="content-card"
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setSelected(report)}
                >
                  <h3 style={{ marginBottom: '8px' }}>{report.title}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Open detailed indicators</p>
                </button>
              ))
            : null}
        </div>
      ) : (
        <div className="content-card">
          <button className="btn btn-secondary" onClick={() => setSelected(null)} style={{ marginBottom: '16px' }}>
            Back
          </button>

          <h2 style={{ marginBottom: '14px' }}>{selected.title} Report</h2>
          <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)' }}>
            {selected.items.map((item) => (
              <li key={item} style={{ marginBottom: '6px' }}>{item}</li>
            ))}
          </ul>

          <button className="btn btn-primary" style={{ marginTop: '20px' }}>
            Download Full PDF Report
          </button>
        </div>
      )}
    </main>
  );
}
