"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, FileText, Home, Menu, Settings, ShieldCheck, TrendingUp, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { useApiLoading } from "@/components/ApiLoadingProvider";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

const navItems = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/einnahmen", labelKey: "incomes", icon: TrendingUp },
  { href: "/ausgaben", labelKey: "expenses", icon: WalletCards },
  { href: "/investitionen", labelKey: "investments", icon: TrendingUp }
];

const contractItems = [
  { href: "/versicherungen", labelKey: "insurances", icon: ShieldCheck },
  { href: "/kredite", labelKey: "loans", icon: Banknote },
  { href: "/vertraege/allgemein", labelKey: "general", icon: FileText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const isApiLoading = useApiLoading();
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function isActivePath(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const hasActiveContract = contractItems.some((item) => isActivePath(item.href));
  const accessLabel =
    user?.accessLevel === "owner"
      ? t("nav.owner")
      : user?.accessLevel === "readonly"
        ? t("nav.readonly")
        : user?.accessLevel === "readwrite"
          ? t("nav.readwrite")
          : "";

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
              <strong>FyNest</strong>
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
            const isActive = isActivePath(item.href);

            return (
              <Link
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                key={item.href}
                onClick={closeMobileMenu}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{t(`nav.${item.labelKey}`)}</span>
              </Link>
            );
          })}
          <div className="nav-group">
            <div className={`nav-group-label ${hasActiveContract ? "active" : ""}`}>
              <FileText size={18} aria-hidden="true" />
              <span>{t("nav.contracts")}</span>
            </div>
            <div className="nav-sublist">
              {contractItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);

                return (
                  <Link
                    href={item.href}
                    className={`nav-subitem ${isActive ? "active" : ""}`}
                    key={item.href}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{t(`nav.${item.labelKey}`)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <Link
            href="/einstellungen"
            className={`nav-item ${isActivePath("/einstellungen") ? "active" : ""}`}
            onClick={closeMobileMenu}
            aria-current={isActivePath("/einstellungen") ? "page" : undefined}
          >
            <Settings size={18} aria-hidden="true" />
            <span>{t("nav.settings")}</span>
          </Link>
        </nav>
        {user ? (
          <div className="sidebar-user" aria-label={t("nav.signedInAs")}>
            <span>{t("nav.signedInAs")}</span>
            <strong>{user.username}</strong>
            <small>{accessLabel}</small>
          </div>
        ) : null}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
