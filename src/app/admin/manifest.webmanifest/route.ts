export function GET() {
  return Response.json({
    id: "/admin", name: "9 Ilhas Admin", short_name: "9 Ilhas Admin", lang: "pt-PT",
    description: "Gestão da Perfumaria 9 Ilhas", start_url: "/admin", scope: "/admin",
    display: "standalone", background_color: "#f5f6f8", theme_color: "#151515",
    icons: [192,512].map(size => ({ src: `/admin-pwa/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "any maskable" })),
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
