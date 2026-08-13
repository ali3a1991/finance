"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Gauge,
  Home,
  Menu,
  PiggyBank,
  ShoppingBasket,
  Settings,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApiLoading } from "@/components/ApiLoadingProvider";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { APP_VERSION } from "@/lib/appVersion";
import Image from "next/image";

const navItems = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/monthly-payments", labelKey: "monthlyPayments", icon: Gauge },
  { href: "/incomes", labelKey: "incomes", icon: TrendingUp },
  { href: "/expenses", labelKey: "expenses", icon: WalletCards },
  { href: "/savings", labelKey: "savings", icon: PiggyBank },
  { href: "/investments", labelKey: "investments", icon: TrendingUp }
];

const toolItems = [
  { href: "/shopping-list", labelKey: "shoppingList", icon: ShoppingBasket },
  { href: "/exchange", labelKey: "exchange", icon: CircleDollarSign },
  { href: "/projects", labelKey: "projects", icon: FolderKanban }
];

const contractItems = [
  { href: "/contracts/insurances", labelKey: "insurances", icon: ShieldCheck },
  { href: "/contracts/credits", labelKey: "loans", icon: Banknote },
  { href: "/contracts/general", labelKey: "general", icon: FileText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const isApiLoading = useApiLoading();
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const scrollY = window.scrollY;
    const previousStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previousStyles.overflow;
      document.body.style.position = previousStyles.position;
      document.body.style.top = previousStyles.top;
      document.body.style.width = previousStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

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
  const hasActiveTool = toolItems.some((item) => isActivePath(item.href));
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
          <Image src="/logo.png" width={36} height={36}  alt="FyNest Logo" className="brand-logo" />
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
            <Image src="/logo.png" alt="FyNest Logo" width={44} height={44} className="brand-logo" />
            <span>
              <strong>FyNest</strong>
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
            <div className={`nav-group-label ${hasActiveTool ? "active" : ""}`}>
              <span>{t("nav.tools")}</span>
            </div>
            <div className="nav-sublist">
              {toolItems.map((item) => {
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
                    <Icon size={16} aria-hidden="true" />
                    <span>{t(`nav.${item.labelKey}`)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="nav-group">
            <div className={`nav-group-label ${hasActiveContract ? "active" : ""}`}>
              <span>{t("nav.contracts")}</span>
            </div>
            <div className="nav-sublist">
              {contractItems.map((item) => {
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
                    <Icon size={16} aria-hidden="true" />
                    <span>{t(`nav.${item.labelKey}`)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        {user ? (
          <div className="sidebar-footer">
            <Link
              href="/settings"
              className={`nav-item ${isActivePath("/settings") ? "active" : ""}`}
              onClick={closeMobileMenu}
              aria-current={isActivePath("/settings") ? "page" : undefined}
            >
              <Settings size={18} aria-hidden="true" />
              <span>{t("nav.settings")}</span>
            </Link>
            <div className="sidebar-user" aria-label={t("nav.signedInAs")}>
              <span>{t("nav.signedInAs")}</span>
              <strong>{user.username}</strong>
              <small>{accessLabel}</small>
            </div>
            {/*<div className="sidebar-version" aria-label={t("nav.version")}>
              <span>{t("nav.version")}</span>
              <strong>v{APP_VERSION}</strong>
              <small>{t("nav.initialVersion")}</small>
            </div>*/}
          </div>
        ) : null}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
