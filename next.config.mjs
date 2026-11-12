/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("node:sqlite", "pdf-parse");
    }
    return config;
  },
};

export default nextConfig;
