/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace-Packages mit TypeScript-Source werden von Next transpiliert.
  transpilePackages: ["@ufiso/shop-config"],
  // Pino-Transports laufen in Worker-Threads, die Next's Bundler/Worker
  // nicht zuverlaessig findet (`Cannot find module ...lib/worker.js` beim
  // Static-Prerender). `serverExternalPackages` weist Next an, diese
  // Pakete zur Runtime aus node_modules zu laden statt zu bundlen.
  // `outputFileTracingIncludes` ergaenzt das fuer Vercel-Lambdas: ohne
  // diesen Eintrag fehlt `@logtail/pino` im serverlessen Bundle und der
  // Pino-Transport-Worker wirft zur Runtime
  // "unable to determine transport target for @logtail/pino" (Sprint 9).
  // Siehe ADR-012 (Logging-Stack).
  serverExternalPackages: ["pino", "pino-pretty", "@logtail/pino"],
  outputFileTracingIncludes: {
    "/api/log-client-error": [
      "../../node_modules/@logtail/**",
      "../../node_modules/pino/**",
      "../../node_modules/pino-abstract-transport/**",
      "../../node_modules/thread-stream/**",
      "../../node_modules/pino-worker/**",
    ],
  },
};

export default nextConfig;
