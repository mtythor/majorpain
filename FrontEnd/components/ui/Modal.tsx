'use client';

import { useEffect, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={className}
        style={{
          position: 'relative',
          backgroundColor: '#262626',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          alignItems: 'flex-start',
          overflow: 'hidden',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-noto-sans), sans-serif",
                fontWeight: 800,
                fontSize: '16px',
                color: '#ffffff',
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                fontFamily: "'Font Awesome 7 Pro', sans-serif",
                fontWeight: 300,
                fontSize: '18px',
                color: '#ffffff',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
