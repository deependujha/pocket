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
    appleWebApp: {
        capable: true,
        title: "Pocket",
        // Not "black-translucent": on an installed app iOS then sizes the web view
        // screen-height minus the status bar, so the bottom edge can't be painted.
        // With "default" the view sits below the status bar and reaches the bottom.
        statusBarStyle: "default",
    },
    other: {
        // Next emits only `mobile-web-app-capable`; iOS honours the status bar style
        // only when the Apple-prefixed tag is present too.
        "apple-mobile-web-app-capable": "yes",
    },
    formatDetection: { telephone: false },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
        { media: "(prefers-color-scheme: dark)", color: "#0e0d13" },
    ],
    maximumScale: 1,
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
