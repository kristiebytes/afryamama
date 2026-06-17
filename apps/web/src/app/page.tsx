'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('doctor@afryamama.org');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<'DOCTOR' | 'ADMIN'>('DOCTOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole: 'DOCTOR' | 'ADMIN') => {
    setRole(selectedRole);
    if (selectedRole === 'DOCTOR') {
      setEmail('doctor@afryamama.org');
    } else {
      setEmail('admin@afryamama.org');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate login redirect
    setTimeout(() => {
      setLoading(false);
      if (role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    }, 800);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo" style={{ margin: '0 auto 16px auto' }}>A</div>
          <h1 className="auth-title">Welcome to AfyaMama</h1>
          <p className="auth-subtitle">Clinical & Administrative Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <span className="form-label">Select Workspace Role</span>
            <div className="role-selector">
              <div 
                className={`role-option ${role === 'DOCTOR' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('DOCTOR')}
              >
                Doctor Portal
              </div>
              <div 
                className={`role-option ${role === 'ADMIN' ? 'active-admin' : ''}`}
                onClick={() => handleRoleSelect('ADMIN')}
              >
                Admin Portal
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <input 
              className="form-input"
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Security Password</label>
            <input 
              className="form-input"
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', margin: '-10px 0 16px 0', textAlign: 'left' }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            className={`btn ${role === 'DOCTOR' ? 'btn-primary' : 'btn-accent'}`}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : `Enter ${role === 'DOCTOR' ? 'Clinician' : 'Admin'} Workspace`}
          </button>
        </form>
      </div>
    </div>
  );
}
