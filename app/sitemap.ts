import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const lastModified = new Date("2026-11-19T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteUrl("/register"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: siteUrl("/login"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
