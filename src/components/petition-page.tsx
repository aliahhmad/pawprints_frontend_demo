"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { petitionReturnPath, validPetitionId } from "@/lib/petition-access";
import PetitionView from "@/components/petition-view";

export default function PetitionPage({ id }: { id: string }) {
  const params = useSearchParams();
  const back = petitionReturnPath(params.get("from"));
  return (
    <>
      <main
        id="main-content"
        tabIndex={-1}
        className="workspace-page petition-page"
      >
        <nav className="petition-breadcrumb" aria-label="Breadcrumb">
          <Link href={back}>
            {back.startsWith("/profile")
              ? "My PawPrints"
              : "Campus petitions"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">
            Petition #{validPetitionId(id) ? id : "unknown"}
          </span>
        </nav>
        {validPetitionId(id) ? (
          <div className="petition-page-panel">
            <PetitionView id={Number(id)} fullPage />
          </div>
        ) : (
          <section className="empty-state">
            <h1>Petition unavailable</h1>
            <p>This petition link is invalid.</p>
            <Link className="btn btn-outline-secondary" href={back}>
              Back to petitions
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
