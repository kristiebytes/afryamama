'use client';

import React from 'react';
import Link from 'next/link';

interface SidebarProps {
  currentPath: string;
  role: 'DOCTOR' | 'ADMIN';
  userName?: string;
}

export default function Sidebar({ currentPath, role, userName = 'Dr. Jane Mwangi' }: SidebarProps) {
  const isDoctor = role === 'DOCTOR';
  const dashboardPath = isDoctor ? '/doctor/dashboard' : '/admin/dashboard';
  
  const menuItems = [
    { name: 'Dashboard', path: dashboardPath },
    { name: 'Mothers Registry', path: '/mothers' },
    { name: 'Appointments', path: '/appointments' },
    { name: 'Medical Records', path: '/records' },
    { name: 'Health Reports', path: '/reports' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo">A</div>
        <div className="brand-name">AfyaMama</div>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            const activeClass = isDoctor ? 'active' : 'active-admin';
            return (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  className={`menu-item ${isActive ? activeClass : ''}`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="user-profile-section">
        <div className="avatar">
          {userName.split(' ').pop()?.[0] || 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-role">{role}</span>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Link href="/" className="menu-item" style={{ padding: '8px 12px', fontSize: '13px', border: 'none', color: '#ef4444' }}>
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
