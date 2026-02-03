import type { NextConfig } from "next";

// Polyfill indexedDB for SSR (WalletConnect compatibility)
if (typeof globalThis.indexedDB === "undefined") {
  (globalThis as any).indexedDB = {
    open: () => ({} as any),
    deleteDatabase: () => ({} as any),
    databases: () => Promise.resolve([]),
    cmp: () => 0,
  };
}

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle indexedDB not available in server environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "idb": false,
      };
    }
    return config;
  },
};

export default nextConfig;
