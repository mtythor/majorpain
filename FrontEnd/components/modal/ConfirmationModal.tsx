'use client';

import { useEffect } from 'react';
import ModalScrim from './ModalScrim';
import Button from '../ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  golferName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  golferName,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  return (
    <ModalScrim isOpen={isOpen} onClose={onCancel}>
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#262626',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          alignItems: 'flex-start',
          overflow: 'hidden',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
          width: '409px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            textAlign: 'center',
            color: '#ffffff',
            width: '377px',
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 800,
              fontSize: '16px',
              position: 'relative',
              flexShrink: 0,
              color: '#ffffff',
            }}
          >
            CONFIRM SELECTION
          </p>
          <button
            onClick={onCancel}
            style={{
              fontFamily: "'Font Awesome 7 Pro', sans-serif",
              fontWeight: 300,
              fontSize: '18px',
              lineHeight: 'normal',
              fontStyle: 'normal',
              position: 'relative',
              flexShrink: 0,
              width: '16px',
              color: '#ffffff',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            fontFamily: "var(--font-noto-sans), sans-serif",
            lineHeight: '24px',
            position: 'relative',
            flexShrink: 0,
            fontSize: '14px',
            textAlign: 'center',
            color: '#ffffff',
            width: '100%',
          }}
        >
          <p
            style={{
              marginBottom: 0,
              fontWeight: 400,
            }}
          >
            Please confirm your draft selection:
          </p>
          <p
            style={{
              marginBottom: 0,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {golferName}
          </p>
        </div>

        {/* Button Bar */}
        <div
          style={{
            borderTop: '1px solid #707070',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            position: 'relative',
            flexShrink: 0,
            width: '377px',
          }}
        >
          <Button variant="secondary" onClick={onCancel} size="sm">
            CANCEL
          </Button>
          <Button variant="primary" onClick={onConfirm} size="sm">
            CONFIRM
          </Button>
        </div>
      </div>
    </ModalScrim>
  );
}
