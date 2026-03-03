'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const isApiError = /fetch|Failed to fetch|Internal Server Error|500/i.test(error.message);

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
        Something went wrong
      </h1>
      <p style={{ marginBottom: '12px', opacity: 0.9, maxWidth: '500px', textAlign: 'center' }}>
        {error.message}
      </p>
      {isApiError && (
        <p
          style={{
            marginBottom: '24px',
            fontSize: '14px',
            opacity: 0.7,
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          If you&apos;re using the database API, ensure PostgreSQL is running and DATABASE_URL is
          correct. Otherwise, set <code style={{ background: '#333', padding: '2px 6px' }}>NEXT_PUBLIC_USE_API_CLIENT=false</code> in .env.local to use dummy data.
        </p>
      )}
      {!isApiError && error.digest && (
        <p style={{ marginBottom: '24px', fontSize: '12px', opacity: 0.6 }}>
          Digest: {error.digest}
        </p>
      )}
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
    </div>
  );
}
