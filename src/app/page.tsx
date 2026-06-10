import { HomeDashboard } from "@/components/HomeDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  return (
    <div className="page-stack">
      <PageHeader page="home" />

      <HomeDashboard />
    </div>
  );
}
