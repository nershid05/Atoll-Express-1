import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  noIndex?: boolean;
}

const SITE_NAME = "Yoosufspeed Ferry Service";
const SITE_URL = "https://yoosuf.mv";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export function SEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  keywords,
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // Core meta
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);
    if (noIndex) setMeta("robots", "noindex, nofollow");

    // Canonical
    if (canonical) setLink("canonical", canonical);

    // Open Graph
    setMeta("og:title", `${title} | ${SITE_NAME}`, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    if (canonical) setMeta("og:url", canonical, "property");

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", `${title} | ${SITE_NAME}`);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage);
  }, [title, description, canonical, ogImage, ogType, keywords, noIndex]);

  return null;
}
