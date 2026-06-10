"use client";

import Link from "next/link";
import { Banknote, Home, Menu, ShieldCheck, TrendingUp, WalletCards, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Startseite", icon: Home },
  { href: "/kredite", label: "Kredite", icon: Banknote },
  { href: "/versicherungen", label: "Versicherungen", icon: ShieldCheck },
  { href: "/einnahmen", label: "Einnahmen", icon: TrendingUp },
  { href: "/ausgaben", label: "Ausgaben", icon: WalletCards }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className={`app-shell ${isMobileMenuOpen ? "menu-open" : ""}`}>
      <header className="mobile-header">
        <Link className="mobile-brand" href="/" onClick={closeMobileMenu}>
          <span className="brand-mark">FM</span>
          <span>Finanzmanager</span>
        </Link>
        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Menu offnen"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      <button
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
        type="button"
        onClick={closeMobileMenu}
        aria-label="Menu schliessen"
        style={{
          opacity: isMobileMenuOpen ? 1 : undefined,
          pointerEvents: isMobileMenuOpen ? "auto" : undefined
        }}
      />

      <aside
        className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}
        aria-label="Hauptnavigation"
        style={{ transform: isMobileMenuOpen ? "translateX(0)" : undefined }}
      >
        <div className="sidebar-top">
          <Link className="brand" href="/">
            <span className="brand-mark">FM</span>
            <span>
              <strong>Finanzmanager</strong>
              <small>Privates Cockpit</small>
            </span>
          </Link>
          <button className="sidebar-close" type="button" onClick={closeMobileMenu} aria-label="Menu schliessen">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="nav-list" aria-label="Hauptnavigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} className="nav-item" key={item.href} onClick={closeMobileMenu}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
