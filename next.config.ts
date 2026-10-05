import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    // Routes from the v1 prototype, kept so old links still land somewhere sensible.
    return [
      { source: "/login", destination: "/demo", permanent: true },
      { source: "/register", destination: "/demo", permanent: true },
      { source: "/dashboard", destination: "/customer", permanent: true },
      { source: "/loan/:path*", destination: "/customer/apply", permanent: true },
      { source: "/onboarding", destination: "/customer", permanent: true },
      { source: "/customer/dashboard", destination: "/customer", permanent: true },
      { source: "/bank/:path*", destination: "/lender", permanent: true },
      { source: "/admin/:path*", destination: "/platform", permanent: true },
      { source: "/how-it-works", destination: "/#how", permanent: true },
    ]
  },
}

export default nextConfig
