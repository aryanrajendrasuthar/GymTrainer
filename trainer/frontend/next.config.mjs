/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "wger.de" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Google profile pictures (OAuth sign-in)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // img: self, data URIs, wger, youtube thumbnails, google avatars
              "img-src 'self' data: blob: https://wger.de https://img.youtube.com https://lh3.googleusercontent.com",
              // connect: supabase (auth + storage), backend API
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co${apiUrl ? ` ${apiUrl}` : ""}${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
              "font-src 'self' data:",
              // frame: youtube (regular + privacy-enhanced nocookie domain)
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
