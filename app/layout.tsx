import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { srLocalization } from "@/lib/clerk-localization";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { SSOCallbackHashRedirect } from "@/components/SSOCallbackHashRedirect";
import { CookieConsent } from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "podeli - Podeli sa komšijama. Živi pametnije.",
  description:
    "Lokalna platforma za deljenje i iznajmljivanje stvari u Beogradu. Ne kupuj ono što ćeš koristiti jednom. Podeli sa nekim ko već ima. Samo u Beogradu.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={srLocalization}>
      <html lang="sr">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <SSOCallbackHashRedirect />
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
          <CookieConsent />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
