"use client";

import Link from "next/link";
import { Banknote, Home, Menu, Settings, ShieldCheck, TrendingUp, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { useApiLoading } from "@/components/ApiLoadingProvider";
import { useLanguage } from "@/components/LanguageProvider";

const navItems = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/kredite", labelKey: "loans", icon: Banknote },
  { href: "/versicherungen", labelKey: "insurances", icon: ShieldCheck },
  { href: "/einnahmen", labelKey: "incomes", icon: TrendingUp },
  { href: "/ausgaben", labelKey: "expenses", icon: WalletCards },
  { href: "/einstellungen", labelKey: "settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const isApiLoading = useApiLoading();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className={`app-shell ${isMobileMenuOpen ? "menu-open" : ""} ${isApiLoading ? "api-loading-active" : ""}`}>
      <header className="mobile-header">
        <Link className="mobile-brand" href="/" onClick={closeMobileMenu}>
          <span className="brand-mark">FM</span>
          <span>{t("app.brand")}</span>
        </Link>
        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label={t("nav.openMenu")}
          aria-expanded={isMobileMenuOpen}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      <button
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
        type="button"
        onClick={closeMobileMenu}
        aria-label={t("nav.closeMenu")}
        style={{
          opacity: isMobileMenuOpen ? 1 : undefined,
          pointerEvents: isMobileMenuOpen ? "auto" : undefined
        }}
      />

      <aside
        className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}
        aria-label={t("nav.main")}
        style={{ transform: isMobileMenuOpen ? "translateX(0)" : undefined }}
      >
        <div className="sidebar-top">
          <Link className="brand" href="/">
            <span className="brand-mark">FM</span>
            <span>
              <strong>Finanzmanager</strong>
              <small>{t("app.cockpit")}</small>
            </span>
          </Link>
          <button className="sidebar-close" type="button" onClick={closeMobileMenu} aria-label={t("nav.closeMenu")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="nav-list" aria-label={t("nav.main")}>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} className="nav-item" key={item.href} onClick={closeMobileMenu}>
                <Icon size={18} aria-hidden="true" />
                <span>{t(`nav.${item.labelKey}`)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
