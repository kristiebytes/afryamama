'use client';

import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';

interface NotificationRow {
  id: string;
  category: 'Prenatal' | 'Postnatal';
  title: string;
  message: string;
  date: string;
}

export default function AdminNotificationsPage() {
  const [category, setCategory] = useState<'Prenatal' | 'Postnatal'>('Prenatal');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<NotificationRow[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      const snapshot = await getDocs(collection(firebaseDb, 'notifications'));
      const rows: NotificationRow[] = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          category: data.category === 'Postnatal' ? 'Postnatal' : 'Prenatal',
          title: data.title || 'Untitled',
          message: data.message || '',
          date: data.date || new Date().toISOString().slice(0, 10),
        };
      });
      setHistory(rows.reverse());
    }

    loadNotifications();
  }, []);

  const saveNotification = async () => {
    if (!title.trim() || !message.trim()) return;

    const nextPayload = {
      category,
      title: title.trim(),
      message: message.trim(),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(firebaseDb, 'notifications'), nextPayload);

    const next: NotificationRow = {
      id: ref.id,
      ...nextPayload,
    };

    setHistory((prev) => [next, ...prev]);
    setTitle('');
    setMessage('');
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(firebaseDb, 'notifications', id));
    setHistory((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">Create Wellness Notification</h1>
          <p className="page-subtitle">Integrated from your legacy notification workflow.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="form-group">
          <label className="form-label" htmlFor="notif-category">Notification Type</label>
          <select
            id="notif-category"
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'Prenatal' | 'Postnatal')}
          >
            <option value="Prenatal">Prenatal Wellness</option>
            <option value="Postnatal">Postnatal Wellness</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="notif-title">Title</label>
          <input
            id="notif-title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="notif-message">Wellness Message</label>
          <textarea
            id="notif-message"
            className="form-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write wellness tip"
            rows={4}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={saveNotification}>Save Notification</button>
          <button className="btn btn-secondary" onClick={saveNotification}>Send Notification</button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <span>History</span>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {history.map((n) => (
            <div key={n.id} style={{ borderLeft: '4px solid var(--primary)', padding: '14px 16px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <strong>{n.title}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.category} | {n.date}</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => deleteNotification(n.id)}>
                  Delete
                </button>
              </div>
              <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
