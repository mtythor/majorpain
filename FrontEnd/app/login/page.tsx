'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { login } = useAuth();
  useApiData(); // Load tournaments so we can show the landing page's background
  const backgroundImage = getLandingBackgroundImage();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Temporary login: TEST / TEST
    if (username.trim().toUpperCase() === 'TEST' && password.trim().toUpperCase() === 'TEST') {
      login();
      // Redirect will be handled by auth context's login function
    } else {
      setError('Invalid username or password. Use TEST / TEST to login.');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        backgroundColor: '#0f0f0f',
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Background Image - use img to avoid Next.js Image optimization issues with missing files */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
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

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          gap: '9px',
          alignItems: 'flex-start',
          justifyContent: isMobile ? 'center' : 'space-between',
          left: 0,
          top: '10px',
          width: '100%',
          padding: 0,
          zIndex: 10,
        }}
      >
        {!isMobile && (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '97px',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                paddingTop: '8px',
                flex: '1 1 0',
                minWidth: '595px',
                maxWidth: 'calc(50% - 120px)',
              }}
            >
              <Stripe />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                flexShrink: 0,
              }}
            >
              <Logo />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '97px',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                paddingTop: '8px',
                flex: '1 1 0',
                minWidth: '595px',
                maxWidth: 'calc(50% - 120px)',
              }}
            >
              <Stripe />
            </div>
          </>
        )}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Logo size={{ width: 152, height: Math.round(152 * (160 / 232)) }} />
          </div>
        )}
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
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
            style={{
              backgroundColor: '#222',
              border: '1px solid #ffc61c',
              borderRadius: '4px',
              color: '#fdc71c',
              cursor: 'pointer',
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
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <p style={{ margin: 0 }}>LOG IN</p>
          </button>
        </form>
      </div>
    </div>
  );
}
