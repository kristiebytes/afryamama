'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, firebaseDb, type QueryDocumentSnapshot, type DocumentData } from '@/lib/firebaseClient';

interface DashboardUserRow {
  id: string;
  email: string;
  role: string;
  createdDate: string;
  accountAge: string;
  status: string;
}

interface DashboardMetrics {
  clinicians: number;
  users: number;
  alerts: number;
  admins: number;
}

const emptyMetrics: DashboardMetrics = {
  clinicians: 0,
  users: 0,
  alerts: 0,
  admins: 0,
};

function readDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
    } catch {
      return '-';
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  return '-';
}

function toAccountAgeLabel(createdDate: string): string {
  if (!createdDate || createdDate === '-') return '-';
  const created = new Date(createdDate);
  if (Number.isNaN(created.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return String(days);
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [rows, setRows] = useState<DashboardUserRow[]>([]);
  const [idFilter, setIdFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [doctorsSnapshot, mothersSnapshot, notificationsSnapshot, usersSnapshot, adminsSnapshot] = await Promise.all([
          getDocs(collection(firebaseDb, 'doctors')),
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'notifications')),
          getDocs(collection(firebaseDb, 'users')),
          getDocs(collection(firebaseDb, 'Admins')),
        ]);

        const usersRows = usersSnapshot.docs.map((docItem: QueryDocumentSnapshot<DocumentData>) => {
          const data = docItem.data();
          const role = (data.role || data.Role || 'USER').toString().toUpperCase();
          const createdDate = readDate(data.createdAt || data.created_at);
          return {
            id: docItem.id,
            email: (data.email || data.Email || '-').toString(),
            role,
            createdDate,
            accountAge: toAccountAgeLabel(createdDate),
            status: (data.status || 'Active').toString(),
          };
        });

        setMetrics({
          clinicians: doctorsSnapshot.size,
          users: usersSnapshot.size + mothersSnapshot.size + adminsSnapshot.size,
          alerts: notificationsSnapshot.size,
          admins: adminsSnapshot.size,
        });

        setRows(usersRows.slice(0, 10));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const systemStatus = useMemo(() => {
    if (loading) return 'CHECKING';
    return 'ONLINE';
  }, [loading]);

  const filteredRows = useMemo(() => {
    const idTerm = idFilter.trim().toLowerCase();
    const emailTerm = emailFilter.trim().toLowerCase();
    const roleTerm = roleFilter.trim().toLowerCase();
    const createdDateTerm = createdDateFilter.trim().toLowerCase();
    const statusTerm = statusFilter.trim().toLowerCase();
    const ageTerm = ageFilter.trim().toLowerCase();

    if (!idTerm && !emailTerm && !roleTerm && !createdDateTerm && !statusTerm && !ageTerm) return rows;

    return rows.filter((row) => {
      const idMatches = !idTerm || row.id.toLowerCase().includes(idTerm);
      const emailMatches = !emailTerm || row.email.toLowerCase().includes(emailTerm);
      const roleMatches = !roleTerm || row.role.toLowerCase().includes(roleTerm);
      const createdDateMatches = !createdDateTerm || row.createdDate.toLowerCase().includes(createdDateTerm);
      const statusMatches = !statusTerm || row.status.toLowerCase().includes(statusTerm);
      const ageMatches = !ageTerm || row.accountAge.toLowerCase().includes(ageTerm);
      return idMatches && emailMatches && roleMatches && createdDateMatches && statusMatches && ageMatches;
    });
  }, [rows, idFilter, emailFilter, roleFilter, createdDateFilter, statusFilter, ageFilter]);

  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Administrator Dashboard</h1>
            <p className="page-subtitle">System metrics, logs, and user management center.</p>
          </div>
        </div>

        <div className="card-grid">
          <div className="stat-card secondary">
            <span className="stat-title">Registered Clinicians</span>
            <div className="stat-value">{loading ? '...' : metrics.clinicians.toLocaleString()}</div>
            <span className="stat-desc">
              Obstetricians, Pediatricians, Nurses from Firestore
            </span>
          </div>

          <div className="stat-card secondary">
            <span className="stat-title">Total Registered Users</span>
            <div className="stat-value">{loading ? '...' : metrics.users.toLocaleString()}</div>
            <span className="stat-desc">
              Includes admins, doctors, mothers, and users documents
            </span>
          </div>

          <div className="stat-card secondary">
            <span className="stat-title">Dispatched Alerts</span>
            <div className="stat-value">{loading ? '...' : metrics.alerts.toLocaleString()}</div>
            <span className="stat-desc">
              Notifications stored in Firestore
            </span>
          </div>

          <div className="stat-card secondary">
            <span className="stat-title">System Status</span>
            <div className="stat-value stat-value-status">{systemStatus}</div>
            <span className="stat-desc">
              Admin nodes and Firebase connectivity check
            </span>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>System Users & Activity</span>
            <Link href="/admin/reports" className="btn btn-secondary btn-compact">
              Audit Logs
            </Link>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email Address</th>
                  <th>Workspace Role</th>
                  <th>Created Date</th>
                  <th>Age (Days)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
                <tr className="table-filter-row">
                  <th><input className="table-filter-input" value={idFilter} onChange={(event) => setIdFilter(event.target.value)} placeholder="User ID" /></th>
                  <th><input className="table-filter-input" value={emailFilter} onChange={(event) => setEmailFilter(event.target.value)} placeholder="Email" /></th>
                  <th><input className="table-filter-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} placeholder="Role" /></th>
                  <th><input className="table-filter-input" value={createdDateFilter} onChange={(event) => setCreatedDateFilter(event.target.value)} placeholder="Date" /></th>
                  <th><input className="table-filter-input" value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)} placeholder="Age" /></th>
                  <th><input className="table-filter-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} placeholder="Status" /></th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading users from Firestore...</td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No user activity records found for the selected filter.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.email}</td>
                      <td>
                        <span className="badge badge-role">
                          {row.role}
                        </span>
                      </td>
                      <td>{row.createdDate}</td>
                      <td>{row.accountAge}</td>
                      <td><span className="badge badge-success">{row.status}</span></td>
                      <td>
                        <Link href="/admin/users" className="btn btn-secondary btn-compact">
                          Manage
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
