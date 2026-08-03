import { PageHeader } from "@/components/PageHeader";
import { ProjectsManager } from "@/components/ProjectsManager";

export default function ProjectsPage() {
  return <div className="page-stack"><PageHeader page="projects" /><ProjectsManager /></div>;
}
