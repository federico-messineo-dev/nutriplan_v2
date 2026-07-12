import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/provider";
import { LegacySWCleanup } from "@/components/legacy-sw-cleanup";
import { RootDiagnostic } from "@/components/root-diagnostic";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NutriPlan Pro",
  description: "Piattaforma AI per la gestione nutrizionale dei tuoi clienti",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-dvh antialiased dark`}
    >
      <body className="h-dvh overflow-hidden flex flex-col font-body">
        {/* Kill old service worker BEFORE React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: [
              'if ("serviceWorker" in navigator) {',
              "  navigator.serviceWorker.register('/sw.js').catch(function(){});",
              '  if ("caches" in window) {',
              "    caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k)})});",
              "  }",
              "}",
            ].join("\n"),
          }}
        />
        <LegacySWCleanup />
        <ThemeProvider>
          <RootDiagnostic />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
