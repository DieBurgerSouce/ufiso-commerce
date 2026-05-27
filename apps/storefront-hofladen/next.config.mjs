/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace-Packages mit TypeScript-Source werden von Next transpiliert.
  transpilePackages: ["@ufiso/shop-config"],
  // Pino-Transports laufen in Worker-Threads, die Next's Bundler/Worker
  // nicht zuverlaessig findet. Identisch zur Tropfshop-Konfiguration —
  // gleicher Hintergrund ADR-012/013.
  serverExternalPackages: ["pino", "pino-pretty", "@logtail/pino"],
};

export default nextConfig;
