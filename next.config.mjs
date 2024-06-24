/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: "utfs.io" },
            { hostname: 'replicate.delivery'},
            { hostname: 'fngzth1bskhfpctb.public.blob.vercel-storage.com' }
        ],
      },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;
