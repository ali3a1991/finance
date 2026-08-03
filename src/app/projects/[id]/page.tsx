import { ProjectDetailManager } from "@/components/ProjectsManager";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="page-stack"><ProjectDetailManager projectId={id} /></div>;
}
