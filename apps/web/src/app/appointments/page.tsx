'use client';

import React, { useState } from 'react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([
    { id: 'a-1', name: 'Amina Omondi', reason: 'Routine prenatal checkup', time: '2026-06-25 at 10:00 AM', status: 'PENDING' },
    { id: 'a-2', name: 'Sarah Kamau', reason: 'Postnatal Checkup (6 Weeks)', time: '2026-06-17 at 11:30 AM', status: 'CONFIRMED' },
    { id: 'a-3', name: 'Fatima Yusuf', reason: 'Infant Immunization', time: '2026-06-17 at 02:00 PM', status: 'CONFIRMED' },
  ]);

  const handleStatusChange = (id: string, nextStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    setAppointments(prev => 
      prev.map(appt => appt.id === id ? { ...appt, status: nextStatus } : appt)
    );
  };

  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Appointments Scheduler</h1>
            <p className="page-subtitle">Schedule clinical consultations, track antenatal care (ANC) visits, and infant checkups.</p>
          </div>
          <div>
            <button className="btn btn-primary">+ Schedule Consultation</button>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Consultation Schedule</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Reason for Consultation</th>
                  <th>Scheduled Date & Time</th>
                  <th>Status</th>
                  <th>Control Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: '600' }}>{appt.name}</td>
                    <td>{appt.reason}</td>
                    <td>{appt.time}</td>
                    <td>
                      <span className={`badge ${
                        appt.status === 'CONFIRMED' ? 'badge-success' : 
                        appt.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {appt.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)' }}
                            onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                        >
                          Mark Completed
                        </button>
                      )}
                      {appt.status === 'COMPLETED' && (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No Action Required</span>
                      )}
                      {appt.status === 'CANCELLED' && (
                        <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  );
}
