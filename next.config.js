/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@arellan-hnos-core-ecosystem/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Cabeceras de seguridad solo en rutas de la app: los assets
        // inmutables de _next/static y _next/image quedan excluidos para no
        // generar cabeceras redundantes en recursos estaticos.
        // Nota: x-xss-protection se omite a proposito (header obsoleto;
        // declararlo es lo que Edge marca como redundante).
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
