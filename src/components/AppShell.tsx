"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { useEffect, useRef } from "react";
import { useApiLoading } from "@/components/ApiLoadingProvider";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { contractItems, navItems, toolItems } from "@/lib/navigation";
import Image from "next/image";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isApiLoading = useApiLoading();
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  function isActivePath(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const hasActiveContract = contractItems.some((item) => isActivePath(item.href));
  const hasActiveTool = toolItems.some((item) => isActivePath(item.href));
  const mobileNavItems = navItems.filter((item) =>
    ["home", "monthlyPayments", "incomes", "expenses"].includes(item.labelKey)
  );
  const mobileBottomNavItems = [...mobileNavItems, { href: "/settings", labelKey: "settings", icon: Settings }];
  const accessLabel =
    user?.accessLevel === "owner"
      ? t("nav.owner")
      : user?.accessLevel === "readonly"
        ? t("nav.readonly")
        : user?.accessLevel === "readwrite"
          ? t("nav.readwrite")
          : "";
  const isAnonymousExchange = pathname === "/exchange" && !user;

  if (isAnonymousExchange) {
    return (
      <div className={`public-exchange-shell ${isApiLoading ? "api-loading-active" : ""}`}>
        <header className="public-exchange-header">
          <Link className="public-exchange-brand" href="/exchange">
            <Image src="/logo.svg" width={38} height={38} alt="FyNest Logo" className="brand-logo" />
            <strong>FyNest</strong>
          </Link>
        </header>
        <main ref={mainContentRef} className="public-exchange-main">{children}</main>
      </div>
    );
  }

  return (
    <div className={`app-shell ${isApiLoading ? "api-loading-active" : ""}`}>
      <header className="mobile-header">
        <Link className="mobile-brand" href="/">
          <Image src="/logo.svg" width={36} height={36} alt="FyNest Logo" className="brand-logo" />
          <span>{t("app.brand")}</span>
        </Link>
        <Link className="mobile-settings-button" href="/settings" aria-label={t("nav.settings")}>
          <Settings size={21} aria-hidden="true" />
        </Link>
      </header>

      <aside className="sidebar" aria-label={t("nav.main")}>
        <div className="sidebar-top">
          <Link className="brand" href="/">
            <Image src="/logo.svg" alt="FyNest Logo" width={44} height={44} className="brand-logo" />
            <span>
              <strong>FyNest</strong>
            </span>
          </Link>
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
          </div>
        ) : null}
      </aside>
      <main ref={mainContentRef} className="main-content">{children}</main>
      <nav className="mobile-bottom-nav" aria-label={t("nav.main")}>
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);

          return (
            <Link
              href={item.href}
              className={`mobile-bottom-nav-item ${isActive ? "active" : ""}`}
              key={item.href}
              aria-label={t(`nav.${item.labelKey}`)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={21} strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">{t(`nav.${item.labelKey}`)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
