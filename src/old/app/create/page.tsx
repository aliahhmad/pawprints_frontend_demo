'use client';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPetition } from "@/lib/demo-client";
import type { Petition } from "@/lib/types";

import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import BannerCreate from "../components/BannerCreate";
import SiteAlertModal from "../components/SiteAlertModal";
import FloatingActionsBar from "../components/FloatingActionsBar";
import './page.css';
import { PetitionForm } from "./PetitionForm";
import { useAuth } from "../hooks/useAuth";
  
export default function Create() {

    const { isLoggedIn } = useAuth();
    const params = useSearchParams();
    const draftId = params.get("draft");
    const [draft, setDraft] = useState<Petition | null>(null);
    const [draftError, setDraftError] = useState("");
    useEffect(() => {
      if (draftId) getPetition(Number(draftId)).then(setDraft).catch(() => setDraftError("This draft is unavailable."));
    }, [draftId]);

    if (!isLoggedIn) {
      return (
        <main className={`main`}>
          <NavBar/>
          <BannerCreate></BannerCreate>
            <div id="main-content" tabIndex={-1} className={`outercreate`}>
                  <h2>Please Log In</h2>
                  <p>You must be logged in to create a petition.</p>
            </div>
      <Footer/>

    </main>
      )
    }

    return (
    <main className={`main`}>
          <NavBar/>
          <BannerCreate></BannerCreate>
            <div id="main-content" tabIndex={-1} className={`outercreate`}>
                  <h2>Instructions</h2>
                  <p>Below, fill out each field and either save your changes as a draft, or publish your petition!</p>
                      
                  <h3>Petition Title</h3>
                  <p>Make sure your title is action-oriented and preferably a one-line statement that summarizes your petition.</p>
                      
                  <h3>Petition Description</h3>
                  <p>This is the explanation and reasoning behind your petition. Why should someone sign it? How will it improve the community?</p>
                      
                  <h3>Petition Tags</h3>
                  <p>Tags will help others understand what the petition is about.</p>

                  <h3>Please Remember</h3>
                  <p>If this petition is about another person, staff, or faculty member, talk to the <b>Ombuds</b> office instead.</p>

                  <h2>Your Petition</h2>
                <div className="form-container">
                  {draftId ? draftError ? <p role="alert">{draftError}</p> : draft ? <PetitionForm init_is_edit init_petition_id={draft.id} init_title={draft.title} init_tags={draft.tags?.map(tag => tag.id)} /> : <p>Loading draft…</p> : <PetitionForm />}
                </div>

            </div>
      <Footer/>
      <FloatingActionsBar>
        <SiteAlertModal />
      </FloatingActionsBar>
    </main>
    )
}
