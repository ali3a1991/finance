import type { MetadataRoute } from "next";

const APP_ICON_VERSION = "2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FyNest",
    short_name: "FyNest",
    description: "Finance Manager App",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1412",
    theme_color: "#0d7568",
    icons: [
      {
        src: `/icon-192.png?v=${APP_ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `/icon-512.png?v=${APP_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
