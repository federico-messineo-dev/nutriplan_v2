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
              // Diagnostic: check if JS chunks load and execute
              "window.__inlineRan = true;",
              "var rd = document.createElement('div');",
              "rd.id = 'js-diag';",
              "rd.style.cssText = 'position:fixed;top:24px;left:0;right:0;z-index:99998;background:#333;color:#fff;font-size:9px;font-family:monospace;padding:2px 6px;text-align:center;line-height:1.4;';",
              "rd.textContent = 'INLINE: OK';",
              "document.body.appendChild(rd);",
              "function checkJS(){",
              "  var el = document.getElementById('js-diag');",
              "  if(!el) return;",
              "  var chunks = document.querySelectorAll('script[src*=\"/_next/static/chunks/\"]');",
              "  var hasNextChunks = chunks.length > 0;",
              "  var chunksLoaded = true;",
              "  for(var i=0;i<chunks.length;i++){if(chunks[i].readyState&&chunks[i].readyState!=='complete'&&chunks[i].readyState!=='loaded'){chunksLoaded=false;break;}}",
              "  var all = document.querySelectorAll('*');",
              "  var hasReactFiber = false;",
              "  for(var i=0;i<all.length;i++){for(var k in all[i]){if(k.indexOf('__reactFiber')===0||k.indexOf('__reactProps')===0){hasReactFiber=true;break}}if(hasReactFiber)break}",
              "  var bodyKids = document.body ? document.body.children.length : -1;",
              "  el.textContent = '3s | chunks=' + hasNextChunks + '(' + chunks.length + ') | loaded=' + chunksLoaded + ' | fiber=' + hasReactFiber + ' | bodyKids=' + bodyKids;",
              "  el.style.background = hasReactFiber ? '#2e7d32' : hasNextChunks ? '#b8862f' : '#c84b31';",
              "}",
              "setTimeout(checkJS, 3000);",
              "setTimeout(checkJS, 8000);",
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
