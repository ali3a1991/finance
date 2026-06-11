import type { Metadata } from "next";
import "./globals.css";
import { ApiLoadingProvider } from "@/components/ApiLoadingProvider";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "FyNest",
  description: "Modernes Dashboard für private Finanzverwaltung"
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
        <RegisterSW />

        <LanguageProvider>
          <ApiLoadingProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </ApiLoadingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
