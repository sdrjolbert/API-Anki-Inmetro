/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/api/hello-world",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
