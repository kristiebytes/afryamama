'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, firebaseDb } from '@/lib/firebaseClient';

interface MotherRow {
  id: string;
  name: string;
  age: string;
  phone: string;
  location: string;
  bloodGroup: string;
  status: string;
  edd: string;
}

function toAgeLabel(value: unknown): string {
  const asString = toLabel(value, '');
  if (!asString) return '-';

  const dob = new Date(asString);
  if (Number.isNaN(dob.getTime())) return '-';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : '-';
}

function toLabel(value: unknown, fallback = '-'): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

export default function MothersPage() {
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [eddFilter, setEddFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [mothers, setMothers] = useState<MotherRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMothers() {
      try {
        const mothersSnapshot = await getDocs(collection(firebaseDb, 'mothers'));
        const rows: MotherRow[] = mothersSnapshot.docs.map((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const firstName = toLabel(data.firstName ?? data.first_name, '');
          const lastName = toLabel(data.lastName ?? data.last_name, '');
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            id: docItem.id,
            name: fullName || toLabel(data.full_name ?? data.name, 'Unknown Mother'),
            age: toAgeLabel(data.dateOfBirth ?? data.dob),
            phone: toLabel(data.phone),
            location: toLabel(data.location ?? data.county),
            bloodGroup: toLabel(data.bloodGroup ?? data.blood_group),
            status: toLabel(data.status ?? data.maternalStatus ?? data.stage, 'UNKNOWN'),
            edd: toLabel(data.edd ?? data.expectedDeliveryDate ?? data.expected_delivery_date),
          };
        });

        if (isMounted) {
          setMothers(rows);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMothers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMothers = useMemo(() => {
    const nameTerm = nameFilter.trim().toLowerCase();
    const phoneTerm = phoneFilter.trim().toLowerCase();
    const statusTerm = statusFilter.trim().toLowerCase();
    const ageTerm = ageFilter.trim().toLowerCase();
    const locationTerm = locationFilter.trim().toLowerCase();
    const bloodGroupTerm = bloodGroupFilter.trim().toLowerCase();
    const eddTerm = eddFilter.trim().toLowerCase();

    if (!nameTerm && !phoneTerm && !statusTerm && !ageTerm && !locationTerm && !bloodGroupTerm && !eddTerm) {
      return mothers;
    }

    return mothers.filter((m) => {
      const nameMatches = !nameTerm || m.name.toLowerCase().includes(nameTerm);
      const phoneMatches = !phoneTerm || m.phone.toLowerCase().includes(phoneTerm);
      const statusMatches = !statusTerm || m.status.toLowerCase().includes(statusTerm);
      const ageMatches = !ageTerm || m.age.toLowerCase().includes(ageTerm);
      const locationMatches = !locationTerm || m.location.toLowerCase().includes(locationTerm);
      const bloodGroupMatches = !bloodGroupTerm || m.bloodGroup.toLowerCase().includes(bloodGroupTerm);
      const eddMatches = !eddTerm || m.edd.toLowerCase().includes(eddTerm);
      return (
        nameMatches && phoneMatches && statusMatches && ageMatches && locationMatches && bloodGroupMatches && eddMatches
      );
    });
  }, [
    mothers,
    nameFilter,
    phoneFilter,
    statusFilter,
    ageFilter,
    locationFilter,
    bloodGroupFilter,
    eddFilter,
  ]);

  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Mothers Registry</h1>
            <p className="page-subtitle">Manage patient directories, status updates, and emergency details.</p>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Registered Maternal Profiles ({filteredMothers.length})</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Blood Group</th>
                  <th>Maternal Status</th>
                  <th>Estimated Due Date</th>
                  <th>Actions</th>
                </tr>
                <tr className="table-filter-row">
                  <th>
                    <input className="table-filter-input" placeholder="Search name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
                  </th>
                  <th>
                    <input className="table-filter-input" placeholder="Age" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} />
                  </th>
                  <th>
                    <input className="table-filter-input" placeholder="Phone" value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value)} />
                  </th>
                  <th>
                    <input className="table-filter-input" placeholder="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
                  </th>
                  <th>
                    <input className="table-filter-input" placeholder="Blood group" value={bloodGroupFilter} onChange={(e) => setBloodGroupFilter(e.target.value)} />
                  </th>
                  <th>
                    <input className="table-filter-input" placeholder="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
                  </th>
                  <th>
                    <input className="table-filter-input" placeholder="EDD" value={eddFilter} onChange={(e) => setEddFilter(e.target.value)} />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>Loading mothers from Firestore...</td>
                  </tr>
                ) : filteredMothers.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No registered mothers found.</td>
                  </tr>
                ) : (
                  filteredMothers.map((mother) => (
                    <tr key={mother.id}>
                      <td className="table-cell-strong">{mother.name}</td>
                      <td>{mother.age}</td>
                      <td>{mother.phone}</td>
                      <td>{mother.location}</td>
                      <td>{mother.bloodGroup}</td>
                      <td>
                        <span className={`badge ${mother.status.toUpperCase().includes('PREG') ? 'badge-success' : 'badge-warning'}`}>
                          {mother.status}
                        </span>
                      </td>
                      <td>{mother.edd}</td>
                      <td>
                        <Link href={`/mothers/${mother.id}`} className="btn btn-secondary btn-compact">
                          View Details
                        </Link>
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
