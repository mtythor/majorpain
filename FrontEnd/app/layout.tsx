import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { openSans, notoSans } from "@/lib/fonts";
import FontAwesomeLoader from "@/components/layout/FontAwesomeLoader";
import MobileFooterNav from "@/components/layout/MobileFooterNav";
import MobileLayoutWrapper from "@/components/layout/MobileLayoutWrapper";
import ViewportHeightProvider from "@/components/layout/ViewportHeightProvider";

export const metadata: Metadata = {
  title: "Major Pain Fantasy Golf",
  description: "Major Pain Fantasy Golf - Draft and manage your fantasy golf team",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} ${notoSans.variable}`}>
      <body className={openSans.className} style={{ backgroundColor: '#0f0f0f' }}>
        <FontAwesomeLoader />
        <ViewportHeightProvider />
        <MobileLayoutWrapper>
          <AuthProvider>
            <div className="mobile-layout-main">
              {children}
            </div>
            <Suspense fallback={null}>
              <MobileFooterNav />
            </Suspense>
          </AuthProvider>
        </MobileLayoutWrapper>
      </body>
    </html>
  );
}
