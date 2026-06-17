'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function MothersPage() {
  const [search, setSearch] = useState('');
  
  const mothers = [
    { id: 'm-1', name: 'Amina Omondi', phone: '+254712345678', location: 'Nairobi', bloodGroup: 'O+', status: 'ACTIVE PREGNANCY', edd: '2026-10-22' },
    { id: 'm-2', name: 'Sarah Kamau', phone: '+254722889900', location: 'Kiambu', bloodGroup: 'A-', status: 'POSTNATAL', edd: 'Completed' },
    { id: 'm-3', name: 'Fatima Yusuf', phone: '+254733112233', location: 'Mombasa', bloodGroup: 'B+', status: 'ACTIVE PREGNANCY', edd: '2026-12-05' },
    { id: 'm-4', name: 'Grace Mutua', phone: '+254744556677', location: 'Machakos', bloodGroup: 'O-', status: 'ACTIVE PREGNANCY', edd: '2026-08-14' },
  ];

  const filteredMothers = mothers.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar currentPath="/mothers" role="DOCTOR" userName="Dr. Jane Mwangi" />
      
      <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Mothers Registry</h1>
            <p className="page-subtitle">Manage patient directories, status updates, and emergency details.</p>
          </div>
          <div>
            <button className="btn btn-primary">+ Register New Mother</button>
          </div>
        </div>

        <div className="content-card" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="search-mothers">Search Patients</label>
            <input 
              className="form-input"
              type="text" 
              id="search-mothers"
              placeholder="Search by name, phone number, location, etc..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Blood Group</th>
                  <th>Maternal Status</th>
                  <th>Estimated Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMothers.map((mother) => (
                  <tr key={mother.id}>
                    <td style={{ fontWeight: '600' }}>{mother.name}</td>
                    <td>{mother.phone}</td>
                    <td>{mother.location}</td>
                    <td>{mother.bloodGroup}</td>
                    <td>
                      <span className={`badge ${mother.status === 'ACTIVE PREGNANCY' ? 'badge-success' : 'badge-warning'}`}>
                        {mother.status}
                      </span>
                    </td>
                    <td>{mother.edd}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
