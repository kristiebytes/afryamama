'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, firebaseDb } from '@/lib/firebaseClient';

type Series = {
  name: string;
  color: string;
  values: number[];
};

type ChartModel = {
  id: string;
  title: string;
  subtitle: string;
  labels: string[];
  series: Series[];
};

function asLabel(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function inferType(data: Record<string, unknown>): 'ANC' | 'PNC' | 'OTHER' {
  const txt = asLabel(data.type ?? data.appointmentType ?? data.visitType ?? data.recordType, '').toUpperCase();
  if (txt.includes('ANC') || txt.includes('ANTENATAL')) return 'ANC';
  if (txt.includes('PNC') || txt.includes('POSTNATAL')) return 'PNC';
  return 'OTHER';
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toMonthLabel(key: string): string {
  const [yearText, monthText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString([], { month: 'short', year: '2-digit' });
}

function getRecentMonthKeys(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return monthKey(d);
  });
}

function emptyCounts(keys: string[]): Record<string, number> {
  return keys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

function LineChart({ chart }: { chart: ChartModel }) {
  const width = 760;
  const height = 240;
  const paddingX = 44;
  const paddingY = 22;
  const maxValue = Math.max(1, ...chart.series.flatMap((line) => line.values));

  const toPoint = (index: number, value: number) => {
    const xSpan = width - paddingX * 2;
    const ySpan = height - paddingY * 2;
    const x = paddingX + (xSpan * index) / Math.max(chart.labels.length - 1, 1);
    const y = height - paddingY - (value / maxValue) * ySpan;
    return `${x},${y}`;
  };

  return (
    <div className="content-card" key={chart.id}>
      <div className="card-header" style={{ marginBottom: 8 }}>
        <span>{chart.title}</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>{chart.subtitle}</p>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={chart.title}>
        {Array.from({ length: 5 }, (_, i) => {
          const y = paddingY + ((height - paddingY * 2) * i) / 4;
          return (
            <line
              key={`grid-${chart.id}-${i}`}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="rgba(148, 163, 184, 0.25)"
              strokeDasharray="4 4"
            />
          );
        })}

        {chart.series.map((line) => (
          <polyline
            key={`${chart.id}-${line.name}`}
            fill="none"
            stroke={line.color}
            strokeWidth="3"
            points={line.values.map((value, index) => toPoint(index, value)).join(' ')}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {chart.labels.map((label, index) => {
          const xSpan = width - paddingX * 2;
          const x = paddingX + (xSpan * index) / Math.max(chart.labels.length - 1, 1);
          return (
            <text key={`${chart.id}-${label}`} x={x} y={height - 4} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
              {label}
            </text>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
        {chart.series.map((line) => (
          <div key={`${chart.id}-legend-${line.name}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: line.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{line.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [charts, setCharts] = useState<ChartModel[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const [mothersSnapshot, childrenSnapshot, immunizationSnapshot, maternalSnapshot, appointmentsSnapshot, pregnanciesSnapshot, ancSnapshot] =
          await Promise.all([
            getDocs(collection(firebaseDb, 'mothers')),
            getDocs(collection(firebaseDb, 'children')),
            getDocs(collection(firebaseDb, 'immunizations')),
            getDocs(collection(firebaseDb, 'maternalRecords')),
            getDocs(collection(firebaseDb, 'appointments')),
            getDocs(collection(firebaseDb, 'pregnancies')),
            getDocs(collection(firebaseDb, 'anc_records')),
          ]);

        const keys = getRecentMonthKeys(6);
        const labels = keys.map(toMonthLabel);

        const ancCounts = emptyCounts(keys);
        const pncCounts = emptyCounts(keys);
        const motherCounts = emptyCounts(keys);
        const childCounts = emptyCounts(keys);
        const appointmentCounts = emptyCounts(keys);
        const notificationCounts = emptyCounts(keys);
        const immunizationCounts = emptyCounts(keys);
        const highRiskCounts = emptyCounts(keys);

        const pushCount = (bucket: Record<string, number>, dateValue: unknown) => {
          const d = asDate(dateValue);
          if (!d) return;
          const key = monthKey(d);
          if (key in bucket) bucket[key] += 1;
        };

        mothersSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          pushCount(motherCounts, data.createdAt ?? data.created_at ?? data.date);
        });

        childrenSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          pushCount(childCounts, data.createdAt ?? data.created_at ?? data.date ?? data.birthDate);
        });

        immunizationSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const status = asLabel(data.status, '').toLowerCase();
          if (status === 'completed' || status === 'done' || status === 'given') {
            pushCount(immunizationCounts, data.givenDate ?? data.date ?? data.createdAt);
          }
        });

        maternalSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const type = inferType(data);
          if (type === 'ANC') {
            pushCount(ancCounts, data.checkupDate ?? data.visitDate ?? data.date ?? data.recordedDate);
          }
          if (type === 'PNC') {
            pushCount(pncCounts, data.checkupDate ?? data.visitDate ?? data.date ?? data.recordedDate);
          }
        });

        ancSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          pushCount(ancCounts, data.date ?? data.createdAt ?? data.created_at ?? data.checkupDate);
        });

        appointmentsSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const type = inferType(data);
          if (type === 'ANC') {
            pushCount(ancCounts, data.dateTime ?? data.appointmentTime ?? data.date);
          }
          if (type === 'PNC') {
            pushCount(pncCounts, data.dateTime ?? data.appointmentTime ?? data.date);
          }
          pushCount(appointmentCounts, data.dateTime ?? data.appointmentTime ?? data.date);
        });

        const highRiskReferrals = pregnanciesSnapshot.docs.filter((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const risk = asLabel(data.riskLevel ?? data.risk ?? data.status, '').toLowerCase();
          const referral = asLabel(data.referralStatus ?? data.referral, '').toLowerCase();
          return risk.includes('high') || referral.includes('referred');
        });

        pregnanciesSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const risk = asLabel(data.riskLevel ?? data.risk ?? data.status, '').toLowerCase();
          const referral = asLabel(data.referralStatus ?? data.referral, '').toLowerCase();
          if (risk.includes('high') || referral.includes('referred')) {
            pushCount(highRiskCounts, data.createdAt ?? data.updatedAt ?? data.date);
          }
        });

        const notificationsSnapshot = await getDocs(collection(firebaseDb, 'notifications'));
        notificationsSnapshot.docs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          pushCount(notificationCounts, data.sentAt ?? data.createdAt ?? data.date);
        });

        const chartsData: ChartModel[] = [
          {
            id: 'care-visits',
            title: 'Maternal Care Visits Trend',
            subtitle: 'Monthly ANC and PNC records and appointments.',
            labels,
            series: [
              { name: 'ANC', color: '#2563eb', values: keys.map((key) => ancCounts[key]) },
              { name: 'PNC', color: '#db2777', values: keys.map((key) => pncCounts[key]) },
            ],
          },
          {
            id: 'registrations',
            title: 'Mother & Child Registration Trend',
            subtitle: 'Monthly registrations for mothers and children.',
            labels,
            series: [
              { name: 'Mothers', color: '#7c3aed', values: keys.map((key) => motherCounts[key]) },
              { name: 'Children', color: '#0891b2', values: keys.map((key) => childCounts[key]) },
            ],
          },
          {
            id: 'operations',
            title: 'Operational Activity Trend',
            subtitle: 'Appointments and notifications sent over time.',
            labels,
            series: [
              { name: 'Appointments', color: '#ea580c', values: keys.map((key) => appointmentCounts[key]) },
              { name: 'Notifications', color: '#16a34a', values: keys.map((key) => notificationCounts[key]) },
            ],
          },
          {
            id: 'outcomes',
            title: 'Clinical Outcomes Trend',
            subtitle: `High-risk referrals total: ${highRiskReferrals}. Completed immunizations are shown monthly.`,
            labels,
            series: [
              { name: 'Completed Immunizations', color: '#0d9488', values: keys.map((key) => immunizationCounts[key]) },
              { name: 'High-Risk Referrals', color: '#dc2626', values: keys.map((key) => highRiskCounts[key]) },
            ],
          },
        ];

        if (isMounted) {
          setCharts(chartsData);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const chartViews = useMemo(() => charts.map((chart) => <LineChart key={chart.id} chart={chart} />), [charts]);

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">Health Reports & Analytics</h1>
          <p className="page-subtitle">All report outputs are shown as line graphs, including ANC and PNC trends.</p>
        </div>
      </div>

      {loading ? <div className="content-card">Loading report analytics from Firestore...</div> : chartViews}
    </main>
  );
}
