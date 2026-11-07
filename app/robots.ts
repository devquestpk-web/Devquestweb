import type { MetadataRoute } from "next";

const siteUrl = "https://www.devquestpk.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ads.txt"],
        disallow: ["/api/", "/portal/", "/admin", "/team", "/application-status"],
      },
      {
        userAgent: ["AdsBot-Google", "Mediapartners-Google"],
        allow: ["/", "/ads.txt"],
        disallow: ["/api/", "/portal/", "/admin", "/team", "/application-status"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
