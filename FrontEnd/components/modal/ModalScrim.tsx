'use client';

import { ReactNode } from 'react';

interface ModalScrimProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function ModalScrim({ isOpen, onClose, children }: ModalScrimProps) {
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
      {children}
    </div>
  );
}
