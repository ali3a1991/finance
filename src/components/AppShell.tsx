import Link from "next/link";
import { Banknote, Home, ReceiptText, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";

const navItems = [
  { href: "/", label: "Startseite", icon: Home },
  { href: "/kredite", label: "Kredite", icon: Banknote },
  { href: "/versicherungen", label: "Versicherungen", icon: ShieldCheck },
  { href: "/einnahmen", label: "Einnahmen", icon: TrendingUp },
  { href: "/ausgaben", label: "Ausgaben", icon: WalletCards },
  { href: "/ausgaben/erfassung", label: "Erfassung", icon: ReceiptText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">FM</span>
          <span>
            <strong>Finanzmanager</strong>
            <small>Privates Cockpit</small>
          </span>
        </Link>
        <nav className="nav-list" aria-label="Hauptnavigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} className="nav-item" key={item.href}>
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
