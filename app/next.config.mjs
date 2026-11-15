import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/**
 * Situs ini adalah GitHub Pages *project site*, jadi build produksi selalu
 * berada di `/INERTIA`. BasePath ditentukan dari fase build (bukan env) supaya
 * `npm run build` tidak pernah menghasilkan aset tanpa prefix — termasuk saat
 * dipanggil dari WSL/git-bash yang tidak meneruskan env ke npm Windows.
 *
 * `next dev` tetap di root (`http://localhost:3000`).
 *
 * @type {(phase: string) => import('next').NextConfig}
 */
const buildConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const basePath = isDev ? "" : "/INERTIA";

  return {
    // Situs statis: data on-chain diambil langsung dari RPC di browser.
    output: "export",
    trailingSlash: true,
    basePath,
    assetPrefix: basePath || undefined,
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
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
};

export default buildConfig;
