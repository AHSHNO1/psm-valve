import { getProjects } from "@/lib/content";
import ProjectsClient from "@/components/admin/ProjectsClient";

export default function AdminProjectsPage() {
  const items = getProjects();
  return <ProjectsClient initial={items} />;
}
