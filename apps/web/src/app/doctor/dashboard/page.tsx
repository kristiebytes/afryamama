'use client';

import React from 'react';
import Link from 'next/link';

export default function DoctorDashboard() {
  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Clinician Dashboard</h1>
            <p className="page-subtitle">Welcome back, Dr. Jane. Here is your clinic overview for today.</p>
          </div>
          <div>
            <button className="btn btn-primary">+ Register Mother</button>
          </div>
        </div>

        <div className="card-grid">
          <div className="stat-card">
            <span className="stat-title">Active Mothers</span>
            <div className="stat-value">1,248</div>
            <span className="stat-desc">
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>+12%</span> since last month
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Active Pregnancies</span>
            <div className="stat-value">342</div>
            <span className="stat-desc">
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>+5%</span> prenatal signups
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Today's Appointments</span>
            <div className="stat-value">14</div>
            <span className="stat-desc">
              <span style={{ color: 'var(--warning)', fontWeight: '600' }}>4 pending</span> confirmation
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Infants Monitored</span>
            <div className="stat-value">512</div>
            <span className="stat-desc">
              Growth and immunizations
            </span>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Upcoming Clinical Consultations</span>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View All</button>
          </div>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mother Name</th>
                  <th>Contact</th>
                  <th>Appointment Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Amina Omondi</td>
                  <td>+254 712 345678</td>
                  <td>10:00 AM</td>
                  <td>Routine Prenatal (Trimester 2)</td>
                  <td><span className="badge badge-warning">Pending</span></td>
                  <td>
                    <Link href="/records/anc/m-1" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Check-in
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Sarah Kamau</td>
                  <td>+254 722 889900</td>
                  <td>11:30 AM</td>
                  <td>Postnatal Checkup (6 Weeks)</td>
                  <td><span className="badge badge-success">Confirmed</span></td>
                  <td>
                    <Link href="/records/mother/m-1" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Open File
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Fatima Yusuf</td>
                  <td>+254 733 112233</td>
                  <td>02:00 PM</td>
                  <td>Infant Immunization</td>
                  <td><span className="badge badge-success">Confirmed</span></td>
                  <td>
                    <Link href="/records/child/m-1" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Open File
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
  );
}
