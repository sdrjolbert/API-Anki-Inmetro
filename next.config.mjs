/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Expose-Headers",
            value: "Content-Disposition, X-Filename",
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Content-Disposition, X-Filename",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/api/rotas",
        permanent: true,
      },
      {
        source: "/api/apkg/",
        destination: "/api/apkg/import",
        permanent: true,
      },
      {
        source: "/api/deck/",
        destination: "/api/apkg/get-deck",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
