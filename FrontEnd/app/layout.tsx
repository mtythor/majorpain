import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { openSans, notoSans } from "@/lib/fonts";
import FontAwesomeLoader from "@/components/layout/FontAwesomeLoader";
import MobileFooterNav from "@/components/layout/MobileFooterNav";

export const metadata: Metadata = {
  title: "Major Pain Fantasy Golf",
  description: "Major Pain Fantasy Golf - Draft and manage your fantasy golf team",
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
        <AuthProvider>
          {children}
          <MobileFooterNav />
        </AuthProvider>
      </body>
    </html>
  );
}
