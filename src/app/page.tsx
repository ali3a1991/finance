import { HomeDashboard } from "@/components/HomeDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  return (
    <div className="page-stack home-page-stack">
      <PageHeader page="home" />

      <HomeDashboard />
    </div>
  );
}
