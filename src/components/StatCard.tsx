import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}
