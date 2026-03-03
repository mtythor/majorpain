'use client';

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
}

export default function MobileLayoutWrapper({ children }: MobileLayoutWrapperProps) {
  return <div className="mobile-layout-wrapper">{children}</div>;
}
