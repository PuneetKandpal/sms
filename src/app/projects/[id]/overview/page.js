import ProjectOverviewPage from "../../../components/ProjectOverviewPage";

export const metadata = {
  title: "Overview Dashboard | SMS | Project insights and analytics",
  description:
    "SMS - AI-powered platform for intelligent business growth and strategic insights",
};

export default async function OverviewPage({ params }) {
  const { id } = await params; // ✅ await params before using it

  console.log("OverviewPage id------->", id);

  return <ProjectOverviewPage id={id} />;
}
