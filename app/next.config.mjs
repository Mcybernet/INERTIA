/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? "/INERTIA" : "";

const nextConfig = {
  // Situs statis: data on-chain diambil langsung dari RPC di browser.
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      buffer: "buffer",
    };
    return config;
  },
};

export default nextConfig;
