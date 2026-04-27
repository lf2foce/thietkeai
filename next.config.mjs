/** @type {import('next').NextConfig} */

const nextConfig = {

    images: {
        dangerouslyAllowSVG: true,
        localPatterns: [
            { pathname: '/**' },
        ],
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
    
};

export default nextConfig;
