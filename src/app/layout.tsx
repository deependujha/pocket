import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";
import { OAuthProviderWrapper } from "@/components/oauth-provider/oauth-provider-wrapper";


const geistSans = Geist( {
  variable: "--font-geist-sans",
  subsets: [ "latin" ],
} );

const geistMono = Geist_Mono( {
  variable: "--font-geist-mono",
  subsets: [ "latin" ],
} );

export const metadata: Metadata = {
  title: "Pocket",
  description:
    "A private, offline-first expense tracker for daily use. No accounts, no ads — your data stays in your pocket.",
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
};


export default function RootLayout( {
  children,
}: Readonly<{
  children: React.ReactNode;
}> ) {
  return (
    <html lang="en">
      <body
        className={ `${geistSans.variable} ${geistMono.variable} antialiased` }
      >
        <OAuthProviderWrapper>
          { children }
        </OAuthProviderWrapper>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
