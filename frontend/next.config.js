// Configuration Next.js 14 avec PWA (Service Worker offline)
// Optimisé pour connexions 3G lentes au Mali

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // désactivé en dev pour éviter les conflits
  runtimeCaching: [
    {
      // Cache les pages Next.js
      urlPattern: /^https:\/\/soro\.vercel\.app\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'soro-pages',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      // Cache les images Cloudinary
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'soro-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Cache les appels API (produits, prix, météo)
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'soro-api',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 }, // 1h
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // AVIF en premier : meilleure compression (~50% vs WebP) sur navigateurs modernes
    formats: ['image/avif', 'image/webp'],
    // Tailles générées pour mobile (petits écrans Mali) — évite de servir des images 2×
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache images optimisées 30 jours (images statiques ne changent pas)
    minimumCacheTTL: 60 * 60 * 24 * 30,

  },
  // Compression maximale pour réseaux lents
  compress: true,
  // Variables d'env exposées au client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = withPWA(nextConfig);
