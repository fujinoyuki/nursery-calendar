/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'tlmaupowcuasyusfvswz.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tlmaupowcuasyusfvswz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },
  // experimental: {
  //   serverActions: true, // Server Actionsは既にデフォルトで有効なので削除
  // },
};

module.exports = nextConfig; 