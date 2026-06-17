'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function AdminDashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar currentPath="/admin/dashboard" role="ADMIN" userName="System Administrator" />
      
      <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Administrator Dashboard</h1>
            <p className="page-subtitle">System metrics, logs, and user management center.</p>
          </div>
          <div>
            <button className="btn btn-accent">+ Register Clinician</button>
          </div>
        </div>

        <div className="card-grid">
          <div className="stat-card secondary">
            <span className="stat-title">Registered Clinicians</span>
            <div className="stat-value">48</div>
            <span className="stat-desc">
              Obstetricians, Pediatricians, Nurses
            </span>
          </div>

          <div className="stat-card secondary">
            <span className="stat-title">Total Registered Users</span>
            <div className="stat-value">2,854</div>
            <span className="stat-desc">
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>+18%</span> growth this quarter
            </span>
          </div>

          <div className="stat-card secondary">
            <span className="stat-title">Dispatched Alerts</span>
            <div className="stat-value">12,490</div>
            <span className="stat-desc">
              SMS, Web Push, Wellness Tips
            </span>
          </div>

          <div className="stat-card secondary">
            <span className="stat-title">System Status</span>
            <div className="stat-value" style={{ color: 'var(--success)', background: 'none', WebkitTextFillColor: 'initial' }}>ONLINE</div>
            <span className="stat-desc">
              All REST nodes reporting healthy
            </span>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>System Users & Activity</span>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Audit Logs</button>
          </div>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email Address</th>
                  <th>Workspace Role</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>u-doctor-1</td>
                  <td>doctor@afryamama.org</td>
                  <td><span className="badge badge-success" style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>DOCTOR</span></td>
                  <td>2026-01-15</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Modify</button>
                  </td>
                </tr>
                <tr>
                  <td>u-mother-1</td>
                  <td>mother@afryamama.org</td>
                  <td><span className="badge badge-success" style={{ color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.2)', backgroundColor: 'rgba(236, 72, 153, 0.05)' }}>MOTHER</span></td>
                  <td>2026-02-20</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Modify</button>
                  </td>
                </tr>
                <tr>
                  <td>u-admin-1</td>
                  <td>admin@afryamama.org</td>
                  <td><span className="badge badge-success" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>ADMIN</span></td>
                  <td>2026-01-01</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Modify</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
