import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Finanzmanager",
  description: "Modernes Dashboard fur private Finanzverwaltung"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
