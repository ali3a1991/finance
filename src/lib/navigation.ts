import {
  Banknote,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Gauge,
  Home,
  LineChart,
  PiggyBank,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  BanknoteArrowUp,
  BanknoteArrowDown,
  type LucideIcon
} from "lucide-react";

export type PageKey =
  | "home"
  | "monthlyPayments"
  | "loans"
  | "insurances"
  | "incomes"
  | "expenses"
  | "projects"
  | "shoppingList"
  | "savings"
  | "investments"
  | "exchange"
  | "contractsGeneral"
  | "settings";

export const navItems = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/monthly-payments", labelKey: "monthlyPayments", icon: Gauge },
  { href: "/incomes", labelKey: "incomes", icon: BanknoteArrowDown },
  { href: "/expenses", labelKey: "expenses", icon: BanknoteArrowUp },
  { href: "/savings", labelKey: "savings", icon: PiggyBank },
  { href: "/investments", labelKey: "investments", icon: LineChart }
] as const;

export const toolItems = [
  { href: "/shopping-list", labelKey: "shoppingList", icon: ShoppingBasket },
  { href: "/exchange", labelKey: "exchange", icon: CircleDollarSign },
  { href: "/projects", labelKey: "projects", icon: FolderKanban }
] as const;

export const contractItems = [
  { href: "/contracts/insurances", labelKey: "insurances", icon: ShieldCheck },
  { href: "/contracts/credits", labelKey: "loans", icon: Banknote },
  { href: "/contracts/general", labelKey: "general", icon: FileText }
] as const;

export const pageIcons: Record<PageKey, LucideIcon> = {
  home: Home,
  monthlyPayments: Gauge,
  loans: Banknote,
  insurances: ShieldCheck,
  incomes: BanknoteArrowDown,
  expenses: BanknoteArrowUp,
  projects: FolderKanban,
  shoppingList: ShoppingBasket,
  savings: PiggyBank,
  investments: LineChart,
  exchange: CircleDollarSign,
  contractsGeneral: FileText,
  settings: Settings
};
