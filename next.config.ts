import type { NextConfig } from "next";

const basePath = process.env.VERCEL_ENV === "production"
  ? "/projects/hotel-operations/demo"
  : "";

const nextConfig: NextConfig = {
  basePath,
  // fetch() calls from the client don't get basePath prepended automatically
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
