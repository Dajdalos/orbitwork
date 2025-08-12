import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config) {
    // Silence: "Critical dependency: the request of a dependency is an expression"
    // specifically from @supabase/realtime-js
    config.ignoreWarnings = [
      (warning: any) =>
        typeof warning.message === 'string' &&
        warning.message.includes('Critical dependency: the request of a dependency is an expression') &&
        /[\\/]@supabase[\\/]+realtime-js[\\/]/.test(warning.module?.resource ?? ''),
    ];
    return config;
  },
};

export default nextConfig;
