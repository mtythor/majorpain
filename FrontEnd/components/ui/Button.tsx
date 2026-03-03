import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    position: 'relative',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    fontFamily: "'Open Sans', sans-serif",
    fontWeight: variant === 'primary' ? 800 : 700,
    fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
    lineHeight: 'normal',
    textAlign: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#222',
      border: '1px solid #ffc61c',
      color: '#fdc71c',
    },
    secondary: {
      backgroundColor: '#222',
      border: '1px solid #707070',
      color: '#ffffff',
    },
    ghost: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#3fa2ff',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...baseStyles, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
}
