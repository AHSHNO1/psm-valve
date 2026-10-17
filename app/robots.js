export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"]
      }
    ],
    sitemap: "https://www.psmvalve.com/sitemap.xml",
    host: "https://www.psmvalve.com"
  };
}
