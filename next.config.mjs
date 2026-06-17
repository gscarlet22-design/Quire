/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'standardebooks.org' },
      { protocol: 'https', hostname: 'www.gutenberg.org' },
      { protocol: 'http', hostname: 'www.gutenberg.org' },
    ],
  },
};

export default nextConfig;
