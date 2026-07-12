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
        {/* Kill old service worker BEFORE React hydrates — SEQUENCED to avoid race conditions */}
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
              // Diagnostic banner
              `var d=document.getElementById('js-diag')||document.createElement('div');`,
              `d.id='js-diag';d.style.cssText='position:fixed;top:24px;left:0;right:0;z-index:99998;background:#333;color:#fff;font-size:9px;font-family:monospace;padding:2px 6px;text-align:center;line-height:1.4;pointer-events:none;';`,
              `d.textContent='SEQ: OK';document.body.appendChild(d);`,
              `function ck(){`,
              `  var e=document.getElementById('js-diag');if(!e)return;`,
              `  var n=typeof window.__NEXT_REGISTER_PAGE!=='undefined';`,
              `  var f=false;var a=document.querySelectorAll('*');`,
              `  for(var i=0;i<a.length;i++){for(var k in a[i]){if(k.indexOf('__reactFiber')===0){f=true;break}}if(f)break}`,
              `  e.textContent='SW=CLEARED | reg='+n+' | fiber='+f;`,
              `  e.style.background=f?'#2e7d32':n?'#b8862f':'#c84b31';`,
              `}`,
              `setTimeout(ck,3000);setTimeout(ck,8000);`,
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
