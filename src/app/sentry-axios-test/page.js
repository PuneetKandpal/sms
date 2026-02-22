"use client";

import SentryAxiosTestComponent from "../components/SentryAxiosTestComponent";

export default function SentryAxiosTestPage() {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== "development") {
    return <div>This page is only available in development environment.</div>;
  }

  return (
    <div>
      <SentryAxiosTestComponent />
    </div>
  );
}
