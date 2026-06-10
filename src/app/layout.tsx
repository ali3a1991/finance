import type { Metadata } from "next";
import "./globals.css";
import { ApiLoadingProvider } from "@/components/ApiLoadingProvider";
import { AppShell } from "@/components/AppShell";
import { LanguageProvider } from "@/components/LanguageProvider";

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
      var language = localStorage.getItem("finance-language");
      if (language === "de" || language === "en") {
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
      }
    } catch (error) {}
  `;

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <LanguageProvider>
          <ApiLoadingProvider>
            <AppShell>{children}</AppShell>
          </ApiLoadingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
