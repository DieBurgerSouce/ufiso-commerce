/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace-Packages mit TypeScript-Source werden von Next transpiliert.
  transpilePackages: ["@ufiso/shop-config"],
  // Pino-Transports laufen in Worker-Threads, die Next's Bundler/Worker
  // nicht zuverlaessig findet (`Cannot find module ...lib/worker.js` beim
  // Static-Prerender). `serverExternalPackages` weist Next an, diese
  // Pakete zur Runtime aus node_modules zu laden statt zu bundlen.
  // Siehe ADR-012 (Logging-Stack).
  serverExternalPackages: ["pino", "pino-pretty", "@logtail/pino"],
};

export default nextConfig;
