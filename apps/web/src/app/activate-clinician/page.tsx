'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type ActivationState = 'loading' | 'success' | 'error';

export default function ActivateClinicianPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [state, setState] = useState<ActivationState>('loading');
  const [message, setMessage] = useState('Activating your clinician account...');

  useEffect(() => {
    async function activate() {
      if (!token.trim()) {
        setState('error');
        setMessage('Activation token is missing from the link.');
        return;
      }

      try {
        const response = await fetch('/api/clinician-activation/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          setState('error');
          setMessage(payload.message || 'Could not activate this clinician account.');
          return;
        }

        setState('success');
        setMessage('Your clinician account is now active. You can sign in to AfyaMama.');
      } catch {
        setState('error');
        setMessage('Could not activate this clinician account. Please try again later.');
      }
    }

    activate();
  }, [token]);

  return (
    <main className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-header">
          <div className="brand-logo" style={{ margin: '0 auto 16px auto' }}>A</div>
          <h1 className="auth-title">Clinician Activation</h1>
          <p className="auth-subtitle">AfyaMama</p>
        </div>

        <p
          style={{
            color: state === 'success' ? 'var(--success)' : state === 'error' ? 'var(--danger)' : '#334155',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          {message}
        </p>

        {state !== 'loading' ? (
          <Link href="/" className="btn btn-primary" style={{ width: '100%', padding: '12px', textAlign: 'center' }}>
            Go to Sign In
          </Link>
        ) : null}
      </div>
    </main>
  );
}
