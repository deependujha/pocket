import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorker, ThemedToaster } from "@/components/shell/pwa";
import "./globals.css";
import { ThemeProvider } from "@/components/shell/theme-provider";

const geistSans = Geist( { variable: "--font-geist-sans", subsets: [ "latin" ] } );
const geistMono = Geist_Mono( { variable: "--font-geist-mono", subsets: [ "latin" ] } );

export const metadata: Metadata = {
    title: { default: "Pocket", template: "%s · Pocket" },
    description: "Your money, in one place. Emergency fund, goals, SIPs, loans: entered by you, stored in your own database.",
    icons: {
        icon: [
            { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: "/favicon/apple-touch-icon.png",
    },
    manifest: "/favicon/site.webmanifest",
    appleWebApp: { capable: true, title: "Pocket", statusBarStyle: "black-translucent" },
    formatDetection: { telephone: false },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
        { media: "(prefers-color-scheme: dark)", color: "#0e0d13" },
    ],
    userScalable: false,
    viewportFit: "cover",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout( { children }: Readonly<{ children: React.ReactNode }> ) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={ `${geistSans.variable} ${geistMono.variable} antialiased` }>
                <ThemeProvider>
                    { children }
                    <ThemedToaster />
                    <ServiceWorker />
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
