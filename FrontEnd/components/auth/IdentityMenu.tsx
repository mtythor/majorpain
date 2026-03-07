'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useIsMobile } from '@/hooks/useMediaQuery';
import ProfilePicture from '@/components/ui/ProfilePicture';
import type { Player } from '@/lib/types';
import ChangePasswordModal from './ChangePasswordModal';

interface IdentityMenuProps {
  userProfile?: Player | null;
  compact?: boolean;
  /** Nav bar variant: small avatar + username for mobile footer */
  variant?: 'default' | 'nav';
}

const menuButtonStyle = {
  display: 'block' as const,
  width: '100%',
  padding: '14px 16px',
  textAlign: 'left' as const,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '16px',
  fontFamily: "'Open Sans', sans-serif",
};

export default function IdentityMenu({ userProfile, compact, variant = 'default' }: IdentityMenuProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { currentUser, logout, clearForcePasswordChange } = useAuth();
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open, isMobile]);

  const handleChangePasswordSuccess = () => {
    clearForcePasswordChange();
    setShowChangePassword(false);
  };

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  if (!userProfile || !currentUser) return null;

  const size = variant === 'nav' ? 22 : compact ? 32 : 36;

  const headerRow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 16,
        borderBottom: '1px solid #333',
      }}
    >
      <span style={{ color: '#888', fontSize: '11px' }}>
        LOGGED IN AS {currentUser.playerName.toUpperCase()}
      </span>
      <button
        onClick={() => setOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          margin: -8,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#ffffff',
        }}
        aria-label="Close menu"
      >
        <X size={24} />
      </button>
    </div>
  );

  const desktopHeader = (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #333',
        color: '#888',
        fontSize: '11px',
      }}
    >
      LOGGED IN AS {currentUser.playerName.toUpperCase()}
    </div>
  );

  const menuContent = (
    <>
      {currentUser.isAdmin && (
        <button
          onClick={() => closeAnd(() => router.push('/admin'))}
          style={menuButtonStyle}
        >
          Admin Settings
        </button>
      )}
      <button
        onClick={() => closeAnd(() => setShowChangePassword(true))}
        style={menuButtonStyle}
      >
        Change password
      </button>
      <button
        onClick={() => closeAnd(logout)}
        style={{ ...menuButtonStyle, color: '#ff6b6b' }}
      >
        Logout
      </button>
    </>
  );

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: variant === 'nav' ? 'center' : undefined,
          gap: variant === 'nav' ? 2 : 6,
          padding: variant === 'nav' ? '0 12px' : '4px 8px',
          minHeight: variant === 'nav' ? 52 : undefined,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          flexDirection: variant === 'nav' ? 'column' : 'row',
        }}
        aria-label="Account menu"
      >
        <ProfilePicture src={userProfile.imageUrl} alt={userProfile.name} size={size} />
        {(variant === 'nav' || !compact) && (
          <span
            style={{
              color: '#fff',
              fontSize: variant === 'nav' ? 10 : 12,
              fontWeight: variant === 'nav' ? 500 : 600,
              lineHeight: variant === 'nav' ? 1 : undefined,
              margin: variant === 'nav' ? 0 : undefined,
              maxWidth: variant === 'nav' ? 72 : 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentUser.playerName}
          </span>
        )}
      </button>

      {open && isMobile && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen(false)}
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 1100,
                  animation: 'identity-menu-backdrop-in 0.2s ease-out',
                }}
                aria-label="Close menu"
              />
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#262626',
                  borderRadius: '12px 12px 0 0',
                  boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  zIndex: 1101,
                  paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                  animation: 'identity-menu-slide-in 0.25s ease-out',
                }}
              >
                {headerRow}
                {menuContent}
              </div>
            </>,
            document.body
          )
        : open ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: '#262626',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            minWidth: '180px',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {desktopHeader}
          {menuContent}
        </div>
      ) : null}

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSuccess={handleChangePasswordSuccess}
        />
      )}
    </div>
  );
}
