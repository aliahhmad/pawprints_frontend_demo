import { Suspense } from "react";
import type { Metadata } from "next";
import CreatePetitionScreen from "@/components/create-petition-screen";

export const metadata: Metadata = {
  title: "Create a petition",
  description:
    "Share an idea for RIT. Save a draft or publish a campus petition.",
  robots: { index: false, follow: true },
};

export default function CreatePetitionPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="page-loading" role="status">
          Loading petition form…
        </main>
      }
    >
      <CreatePetitionScreen />
    </Suspense>
  );
}
