import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/provider";
import { MotionProvider } from "@/components/motion/provider"; 
import { LegacySWCleanup } from "@/components/legacy-sw-cleanup";

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
  viewportFit: "cover",
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
        {/* Kill old service worker before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: [
              `if ("serviceWorker" in navigator) {`,
              `  navigator.serviceWorker.getRegistrations().then(function(regs){`,
              `    return Promise.all(regs.map(function(r){return r.unregister()}));`,
              `  }).then(function(){`,
              `    if ("caches" in window) {`,
              `      return caches.keys().then(function(keys){return Promise.all(keys.map(function(k){return caches.delete(k)}))});`,
              `    }`,
              `  }).then(function(){`,
              `    navigator.serviceWorker.register('/sw.js').catch(function(){});`,
              `  });`,
              `}`,
            ].join("\n"),
          }}
        />
        <LegacySWCleanup />
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
