'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState<'maternal' | 'child'>('maternal');

  return (
    <div className="dashboard-layout">
      <Sidebar currentPath="/records" role="DOCTOR" userName="Dr. Jane Mwangi" />
      
      <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Medical Records</h1>
            <p className="page-subtitle">Track pregnancy progressions, child development indices, and vaccine status.</p>
          </div>
          <div>
            <button className="btn btn-primary">+ Add New Record</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            className={`btn ${activeTab === 'maternal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('maternal')}
          >
            Maternal Health Records
          </button>
          <button 
            className={`btn ${activeTab === 'child' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('child')}
          >
            Child Development & Vaccines
          </button>
        </div>

        {activeTab === 'maternal' ? (
          <div className="content-card">
            <div className="card-header">
              <span>Antenatal Care (ANC) Progress Records</span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Pregnancy Term</th>
                    <th>Checkup Date</th>
                    <th>Weight (kg)</th>
                    <th>BP</th>
                    <th>Fetal Heart Rate</th>
                    <th>Clinical Observations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Amina Omondi</td>
                    <td>21 Weeks (Active)</td>
                    <td>2026-06-10</td>
                    <td>72.5</td>
                    <td>120/80</td>
                    <td>140 bpm</td>
                    <td>Fetal heartbeat steady. Recommended standard iron supplements.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Fatima Yusuf</td>
                    <td>14 Weeks (Active)</td>
                    <td>2026-06-12</td>
                    <td>68.2</td>
                    <td>115/75</td>
                    <td>145 bpm</td>
                    <td>Normal development. Folic acid compliance verified.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="content-card">
            <div className="card-header">
              <span>Pediatric Growth & Immunization Records</span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Mother</th>
                    <th>Date of Birth</th>
                    <th>Weight (kg)</th>
                    <th>Height (cm)</th>
                    <th>Recent Vaccine</th>
                    <th>Vaccine Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Baby Baraka</td>
                    <td>Amina Omondi</td>
                    <td>2025-10-01</td>
                    <td>8.2</td>
                    <td>68.0</td>
                    <td>OPV 1 (Polio)</td>
                    <td><span className="badge badge-success">Completed</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Baby Joy</td>
                    <td>Sarah Kamau</td>
                    <td>2026-03-12</td>
                    <td>5.8</td>
                    <td>59.0</td>
                    <td>Pentavalent 1</td>
                    <td><span className="badge badge-success">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
