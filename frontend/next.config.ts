import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Point Turbopack at the frontend directory so it doesn't look for a
  // package-lock.json outside the workspace (avoids the "ignored package-lock"
  // warning when the repo root is above this folder).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
