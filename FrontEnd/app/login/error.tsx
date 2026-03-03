'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Login page error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 800 }}>
        Login page error
      </h1>
      <p style={{ marginBottom: '24px', opacity: 0.9, maxWidth: '500px', textAlign: 'center' }}>
        {error.message}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#fdc71c',
            color: '#0f0f0f',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '12px 24px',
            backgroundColor: '#333',
            color: '#fdc71c',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
