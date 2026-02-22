import DynamicSectionPage from "../../../../components/DynamicSectionPage";
import { use } from "react";

export const metadata = {
  title: "Section",
  description: "Section for the project",
};

export default function SectionPage({ params }) {
  // Await the params using React's use() hook
  const resolvedParams = use(params);

  return (
    <DynamicSectionPage params={params} section={resolvedParams.section} />
  );
}
