import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Finanzmanager",
  description: "Modernes Dashboard fur private Finanzverwaltung"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `
    try {
      var theme = localStorage.getItem("finance-theme");
      if (theme === "dark" || theme === "light") {
        document.documentElement.dataset.theme = theme;
      }
    } catch (error) {}
  `;

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
