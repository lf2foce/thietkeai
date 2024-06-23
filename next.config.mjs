/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [{ hostname: "utfs.io" }],
      },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;
