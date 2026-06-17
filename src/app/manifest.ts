import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quire',
    short_name: 'Quire',
    description: 'Your ebook shelf, delivered.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#18181b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
