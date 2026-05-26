/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace-Packages mit TypeScript-Source werden von Next transpiliert.
  transpilePackages: ["@ufiso/shop-config"],
  // Pino-Transports laufen in Worker-Threads, die Next's Bundler/Worker
  // nicht zuverlaessig findet (`Cannot find module ...lib/worker.js` beim
  // Static-Prerender). `serverExternalPackages` weist Next an, diese
  // Pakete zur Runtime aus node_modules zu laden statt zu bundlen.
  // ⚠ Sprint 9: Auf Vercel-Lambda findet der Pino-Worker `@logtail/pino`
  // strukturell nicht (worker-thread-Modul-Resolution arbeitet
  // unabhaengig vom Lambda-Bundle). `outputFileTracingIncludes` reicht
  // nicht. Daher schaltet `lib/logger.ts` den BetterStack-Pino-Target auf
  // Vercel ab — Transport laeuft per Vercel-Log-Drain auf stdout-JSON.
  // Lokal/Hetzner bleibt der direkte Pino-Pfad. Siehe ADR-012/013.
  serverExternalPackages: ["pino", "pino-pretty", "@logtail/pino"],
};

export default nextConfig;
