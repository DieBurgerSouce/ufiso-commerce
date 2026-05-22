/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace-Packages mit TypeScript-Source werden von Next transpiliert.
  transpilePackages: ["@ufiso/shop-config"],
};

export default nextConfig;
