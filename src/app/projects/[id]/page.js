import { redirect } from "next/navigation";

export const metadata = {
  title: "Project",
  description: "Project root redirects to overview",
};

export default async function ProjectRootPage({ params }) {
  const { id } = await params; // ✅ await params before using it
  redirect(`/projects/${id}/overview`);
}
