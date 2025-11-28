/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    // Pin Turbopack root to this workspace to avoid Next.js inferring the wrong root
    // and ensure tools like Tailwind pick up the config from this project directory.
    turbopack: {
      root: __dirname,
    },
  },
};

export default config;