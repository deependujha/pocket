import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    experimental: {
        // Keep recently visited screens in the client router cache so back/forward and
        // re-taps on the bottom nav are instant; server actions still refresh them.
        staleTimes: { dynamic: 60, static: 300 },
    },
    async headers() {
        return [ { source: "/sw.js", headers: [ { key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" } ] } ];
    },
};

export default nextConfig;
