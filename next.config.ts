import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These headers allow FFmpeg's SharedArrayBuffer to run in the browser
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
