'use client';

import { useState, FormEvent } from 'react';
import Logo from '@/components/ui/Logo';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Stripe from '@/components/ui/Stripe';
import { useAuth, getLandingBackgroundImage } from '@/lib/auth-context';
import { useApiData } from '@/lib/use-api-data';

export default function LoginPage() {
  const isMobile = useIsMobile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  useApiData();
  const backgroundImage = getLandingBackgroundImage();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const normalizedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedUsername || !trimmedPassword) {
      setError('Username and password required');
      setSubmitting(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, password: trimmedPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid username or password');
        setSubmitting(false);
        return;
      }

      login(
        {
          playerId: data.playerId,
          playerName: data.playerName,
          username: data.username ?? normalizedUsername,
          isAdmin: data.isAdmin ?? false,
          isSuperAdmin: data.isSuperAdmin ?? false,
          forcePasswordChange: data.forcePasswordChange ?? false,
        },
        data.token
      );
      // Redirect is handled by auth context's login()
    } catch {
      setError('Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        minHeight: '100dvh',
        width: '100%',
        overflowX: 'hidden',
        backgroundColor: '#0f0f0f',
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Background Image - position:fixed to fill viewport in PWA (avoids 100vh gaps) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <img
          src={backgroundImage}
          alt=""
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/Masters.jpg';
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Header - stripes + logo, matches Header layout on other pages */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '10px',
          width: '100%',
          padding: 0,
          zIndex: 10,
          overflow: 'visible',
        }}
      >
        {/* Stripes - from screen edges toward logo (both mobile and desktop) */}
        {(() => {
          const logoHalfWidth = isMobile ? 70 : 116;
          const stripeGap = 4;
          const stripeTop = isMobile ? 47 : 73;
          const stripeWidth = `calc(50% - ${logoHalfWidth}px - ${stripeGap}px)`;
          return (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: stripeTop,
                  width: stripeWidth,
                  overflow: 'hidden',
                  zIndex: 1,
                }}
              >
                <Stripe width="100%" compact={isMobile} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: stripeTop,
                  width: stripeWidth,
                  overflow: 'hidden',
                  zIndex: 1,
                }}
              >
                <Stripe width="100%" compact={isMobile} />
              </div>
            </>
          );
        })()}
        {/* Logo centered on top of stripes */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          <Logo
            size={isMobile ? { width: 140, height: 97 } : { width: 232, height: 160 }}
          />
        </div>
      </div>

      {/* Login Modal */}
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#262626',
          borderRadius: '20px',
          boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'center',
          left: isMobile ? '50%' : '50%',
          overflow: 'hidden',
          padding: isMobile ? '24px 16px' : '32px',
          top: isMobile ? '180px' : '289px',
          transform: 'translateX(-50%)',
          width: isMobile ? 'calc(100% - 32px)' : '600px',
          maxWidth: isMobile ? '400px' : undefined,
          zIndex: 5,
          boxSizing: 'border-box',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            placeholder="Username"
            autoComplete="username"
            disabled={submitting}
            style={{
              backgroundColor: '#141414',
              border: 'none',
              color: '#fff',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              fontSize: '18px',
              height: '60px',
              lineHeight: 'normal',
              padding: '0 24px',
              width: '100%',
            }}
            onFocus={(e) => {
              e.target.style.outline = 'none';
            }}
          />
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="PASSWORD"
            autoComplete="current-password"
            disabled={submitting}
            style={{
              backgroundColor: '#141414',
              border: 'none',
              color: '#fff',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              fontSize: '18px',
              height: '60px',
              lineHeight: 'normal',
              padding: '0 24px',
              textTransform: 'uppercase',
              width: '100%',
            }}
            onFocus={(e) => {
              e.target.style.outline = 'none';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit(e as unknown as FormEvent);
            }}
          />
          {error && (
            <div style={{ color: '#ff6b6b', fontSize: '14px', textAlign: 'center', width: '100%' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="login-button"
            disabled={submitting}
            style={{
              backgroundColor: '#222',
              border: '1px solid #ffc61c',
              borderRadius: '4px',
              color: '#fdc71c',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 800,
              fontSize: '12px',
              height: '48px',
              lineHeight: 'normal',
              padding: '8px',
              textAlign: 'center',
              textTransform: 'uppercase',
              width: '200px',
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseDown={(e) => {
              if (!submitting) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <p style={{ margin: 0 }}>{submitting ? 'LOGGING IN...' : 'LOG IN'}</p>
          </button>
        </form>
      </div>
    </div>
  );
}
