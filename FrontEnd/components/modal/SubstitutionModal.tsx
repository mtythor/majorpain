'use client';

import { useState } from 'react';
import ModalScrim from './ModalScrim';
import Button from '../ui/Button';

interface SubstitutionModalProps {
  isOpen: boolean;
  alternateGolferName: string;
  activeGolferNames: [string, string, string];
  onConfirm: (replacedGolferName: string) => void;
  onCancel: () => void;
}

export default function SubstitutionModal({
  isOpen,
  alternateGolferName,
  activeGolferNames,
  onConfirm,
  onCancel,
}: SubstitutionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleConfirm() {
    if (selected) {
      onConfirm(selected);
      setSelected(null);
    }
  }

  function handleCancel() {
    setSelected(null);
    onCancel();
  }

  return (
    <ModalScrim isOpen={isOpen} onClose={handleCancel}>
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
          width: 'min(409px, 90vw)',
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
            width: '100%',
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 800,
              fontSize: '16px',
              color: '#ffffff',
              margin: 0,
            }}
          >
            MAKE A SUBSTITUTION
          </p>
          <button
            onClick={handleCancel}
            style={{
              fontFamily: "'Font Awesome 7 Pro', sans-serif",
              fontWeight: 300,
              fontSize: '18px',
              lineHeight: 'normal',
              color: '#ffffff',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

          {/* IN section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <p
              style={{
                fontFamily: "var(--font-noto-sans), sans-serif",
                fontWeight: 400,
                fontSize: '14px',
                color: '#ffffff',
                textAlign: 'center',
                margin: 0,
              }}
            >
              IN:
            </p>
            <div
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-noto-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#ae9661',
                }}
              >
                {alternateGolferName}
              </span>
            </div>
          </div>

          {/* OUT section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <p
              style={{
                fontFamily: "var(--font-noto-sans), sans-serif",
                fontWeight: 400,
                fontSize: '14px',
                color: '#ffffff',
                textAlign: 'center',
                margin: 0,
              }}
            >
              OUT:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {activeGolferNames.map((name) => {
                const isSelected = selected === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelected(name)}
                    style={{
                      backgroundColor: isSelected ? '#2d5a1b' : '#1a1a1a',
                      border: isSelected ? '1px solid #2d5a1b' : '1px solid transparent',
                      borderRadius: '4px',
                      padding: '16px',
                      width: '100%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a2a2a';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1a1a1a';
                      }
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--font-noto-sans), sans-serif",
                        fontWeight: 700,
                        fontSize: '14px',
                        color: '#ffffff',
                      }}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Button Bar */}
        <div
          style={{
            borderTop: '1px solid #707070',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            width: '100%',
          }}
        >
          <Button variant="secondary" onClick={handleCancel} size="sm">
            CANCEL
          </Button>
          <Button variant="primary" onClick={handleConfirm} size="sm" disabled={!selected}>
            CONFIRM
          </Button>
        </div>
      </div>
    </ModalScrim>
  );
}
