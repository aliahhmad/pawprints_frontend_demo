import { Suspense } from "react";
import type { Metadata } from "next";
import ProfileScreen from "@/components/profile-screen";

export const metadata: Metadata = {
  title: "My profile",
  description: "Your Pawprints account, published petitions, and saved drafts.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="page-loading" role="status">
          Loading your profile…
        </main>
      }
    >
      <ProfileScreen />
    </Suspense>
  );
}
