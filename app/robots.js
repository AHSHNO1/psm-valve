export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"]
      }
    ],
    sitemap: "https://psmvalve.com/sitemap.xml",
    host: "https://psmvalve.com"
  };
}
