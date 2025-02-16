/** @type {import('next').NextConfig} */

const nextConfig = {

    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            { hostname: "utfs.io" },
            { hostname: 'replicate.delivery'},
            { hostname: 'fngzth1bskhfpctb.public.blob.vercel-storage.com' },
            {
                protocol: 'https',
                hostname: 'cdn.zapier.com',
                port: '',
                pathname: '/**',
                search: '',
            },
            
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
