import path from "node:path";
import type { NextConfig } from "next";
const monorepoRoot = path.resolve(process.cwd(), "../..");
const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: "/distributor",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@salesx-ai/api-client","@salesx-ai/api-contracts","@salesx-ai/auth-client","@salesx-ai/design-system","@salesx-ai/design-tokens","@salesx-ai/permissions","@salesx-ai/shared-types","motion"],
  images: { remotePatterns: [{ protocol: "https", hostname: "picsum.photos", port: "", pathname: "/**" }] }
};
export default nextConfig;
