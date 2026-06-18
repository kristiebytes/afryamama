'use client';

import React from 'react';

export default function ReportsPage() {
  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Health Reports & Analytics</h1>
            <p className="page-subtitle">Export clinical aggregates, track immunization coverages, and review birth outcomes.</p>
          </div>
          <div>
            <button className="btn btn-primary">Generate Custom Audit</button>
          </div>
        </div>

        <div className="card-grid">
          <div className="stat-card">
            <span className="stat-title">Immunization Coverage</span>
            <div className="stat-value">94.2%</div>
            <span className="stat-desc">
              National target: 90%
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Healthy Weight Births</span>
            <div className="stat-value">88.5%</div>
            <span className="stat-desc">
              Birth weight &gt;= 2.5kg
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Completed ANC Packages</span>
            <div className="stat-value">72.1%</div>
            <span className="stat-desc">
              4+ prenatal consultations
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">High Risk Referrals</span>
            <div className="stat-value">12</div>
            <span className="stat-desc">
              Currently monitored
            </span>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Downloadable Audits & Registers</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Reporting Window</th>
                  <th>Generated Date</th>
                  <th>File Size</th>
                  <th>Format</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Antenatal Care Attendance Register</td>
                  <td>May 1 - May 31, 2026</td>
                  <td>2026-06-01</td>
                  <td>142 KB</td>
                  <td><span className="badge badge-success" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>CSV</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Download</button>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Infant Vaccination Coverage Report</td>
                  <td>Jan 1 - May 31, 2026</td>
                  <td>2026-06-02</td>
                  <td>284 KB</td>
                  <td><span className="badge badge-success" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>CSV</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Download</button>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Maternal Health Indicator Audit (WHO Standards)</td>
                  <td>Q1 2026</td>
                  <td>2026-04-10</td>
                  <td>1.2 MB</td>
                  <td><span className="badge badge-success" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>PDF</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Download</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
  );
}
