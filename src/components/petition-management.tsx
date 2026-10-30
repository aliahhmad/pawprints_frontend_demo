"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoError, createUpdate, deleteUpdate, editUpdate } from "@/lib/demo-client";
import {
  canEditDraft,
  hasRichContent,
  petitionAccess,
} from "@/lib/petition-access";
import type {
  Petition,
  PetitionTimeline,
  PetitionUpdate,
  UserProfile,
} from "@/lib/types";
import { formatDate } from "@/lib/petitions";
import RichContent from "@/components/rich-content";
import Modal from "@/components/modal";

const RichEditor = dynamic(() => import("@/components/rich-editor"), {
  ssr: false,
  loading: () => <p role="status">Preparing editor…</p>,
});
type Mode =
  | { kind: "draft" }
  | { kind: "edit" | "revise"; update: PetitionUpdate };
export type ComposerSnapshot = {
  mode: Mode;
  message: string;
  needsRefresh: boolean;
};

type Confirmation = {
  title: string;
  description: string;
  run: () => Promise<unknown>;
  success: string;
  preview?: string | null;
  clear?: boolean;
  danger?: boolean;
};

export default function PetitionManagement({
  petition,
  timeline,
  user,
  onReload,
  initialComposer,
  onComposerChange,
  onBusyChange,
}: {
  petition: Petition;
  timeline: PetitionTimeline;
  user: UserProfile;
  onReload: () => Promise<void>;
  initialComposer: ComposerSnapshot | null;
  onComposerChange: (snapshot: ComposerSnapshot) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const access = petitionAccess(user, petition);
  const [mode, setMode] = useState<Mode>(
    initialComposer?.mode || { kind: "draft" },
  );
  const [message, setMessage] = useState(initialComposer?.message || "");
  const [editorInitialValue, setEditorInitialValue] = useState(
    initialComposer?.message || "",
  );
  const [editorKey, setEditorKey] = useState(0);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(
    initialComposer?.needsRefresh
      ? "Check the latest timeline before making another change."
      : "",
  );
  const [needsRefresh, setNeedsRefresh] = useState(
    initialComposer?.needsRefresh || false,
  );
  const executing = useRef(false);
  const composer = useRef<HTMLElement>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const uploadState = useCallback(
    (value: boolean) => {
      setUploadBusy(value);
      onBusyChange(value);
    },
    [onBusyChange],
  );
  const locked = busy || uploadBusy || needsRefresh;
  const meaningful = hasRichContent(message) && message.length <= 40000;
  const current = mode.kind === "draft" ? null : mode.update;

  useEffect(() => {
    onComposerChange({ mode, message, needsRefresh });
  }, [mode, message, needsRefresh, onComposerChange]);

  function selectMode(next: Mode) {
    setMode(next);
    setMessage(
      next.kind === "edit" || next.kind === "revise"
        ? next.update.message || ""
        : "",
    );
    setEditorInitialValue(
      next.kind === "edit" || next.kind === "revise"
        ? next.update.message || ""
        : "",
    );
    setEditorKey((value) => value + 1);
    setError("");
    requestAnimationFrame(() =>
      composer.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }
  function clearEditor() {
    setMode({ kind: "draft" });
    setMessage("");
    setEditorInitialValue("");
    setEditorKey((value) => value + 1);
  }

  async function execute(action: Confirmation) {
    if (executing.current || needsRefresh) return;
    executing.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setFeedback("");
    try {
      await action.run();
      if (action.clear) clearEditor();
      setFeedback(action.success);
      setConfirmation(null);
      try {
        await onReload();
      } catch {
        setNeedsRefresh(true);
        setError(
          "The change was saved, but the updated timeline could not be loaded. Refresh it before making another change.",
        );
      }
    } catch (error) {
      setConfirmation(null);
      const uncertain =
        error instanceof DemoError &&
        (error.status === 0 || error.status >= 500);
      setError(
        uncertain
          ? "We couldn’t confirm the result. Your text is still here. Check the latest timeline before trying again."
          : error instanceof Error
            ? error.message
            : "The change could not be saved.",
      );
      if (uncertain) setNeedsRefresh(true);
    } finally {
      executing.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  function ask(action: Confirmation) {
    if (!locked) {
      setError("");
      setConfirmation(action);
    }
  }
  function saveDraft() {
    if (!meaningful || locked || !access.canCompose) return;
    void execute({
      title: "Save draft",
      description: "",
      run: () =>
        mode.kind === "edit"
          ? editUpdate(petition.id, mode.update, message)
          : createUpdate(
              petition.id,
              message,
              mode.kind === "revise" ? mode.update.id : null,
            ),
      success:
        mode.kind === "edit"
          ? "Your draft changes have been saved."
          : "Your update was submitted for review. It is not public yet.",
      clear: true,
    });
  }
  return (
    <div className="petition-management">
      <div className="management-heading">
        <div>
          <span className="eyebrow">WORKING TOGETHER</span>
          <h3>Review workspace</h3>
          <p>Drafts and review notes are visible only to the team.</p>
        </div>
        <span className="team-badge">Committee member</span>
      </div>
      {feedback && (
        <p className="alert alert-success" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          {needsRefresh && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mt-2"
              disabled={busy}
              onClick={async () => {
                if (executing.current) return;
                executing.current = true;
                setBusy(true);
                onBusyChange(true);
                try {
                  await onReload();
                  setNeedsRefresh(false);
                  setError("");
                  setFeedback(
                    "The timeline is up to date. Review the latest entries before submitting again.",
                  );
                } catch {
                  setError(
                    "The timeline is still unavailable. Your text has been retained.",
                  );
                } finally {
                  executing.current = false;
                  setBusy(false);
                  onBusyChange(false);
                }
              }}
            >
              Check latest timeline
            </button>
          )}
        </div>
      )}
      <div
        className="team-timeline"
        aria-label="Internal update and review history"
      >
        {timeline.petition_updates.length === 0 && (
          <p className="timeline-empty">
            No updates yet. Start with a draft for the assigned committee.
          </p>
        )}
        {timeline.petition_updates.map((entry) => (
          <article
            key={entry.update.id}
            className={`team-entry ${entry.is_response ? "official-response" : entry.update.is_draft ? "draft-entry" : "published-entry"}`}
          >
            <header>
              <div>
                <span className="entry-badge">
                  {entry.is_response
                    ? "Official response"
                    : entry.update.is_draft
                      ? "Draft · not public"
                      : "Published update"}
                </span>
                <span className="entry-id">#{entry.update.id}</span>
              </div>
              <span>
                {entry.update.author_id || "Student Government"} ·{" "}
                {formatDate(entry.update.created_at)}
              </span>
            </header>
            <RichContent content={entry.update.message} />
            {entry.update.approved_by && (
              <p className="update-attribution">
                Approved by {entry.update.approved_by}
              </p>
            )}
            {!entry.is_response && entry.update.is_draft && (
              <div className="entry-actions">
                {canEditDraft(user, entry.update) && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={locked}
                      onClick={() =>
                        selectMode({ kind: "edit", update: entry.update })
                      }
                    >
                      Edit draft #{entry.update.id}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={locked}
                      onClick={() =>
                        ask({
                          title: "Delete this draft?",
                          description:
                            "This permanently removes your unpublished draft and its review history. Published updates and responses are unchanged.",
                          preview: entry.update.message,
                          run: () => deleteUpdate(petition.id, entry.update.id),
                          success: "Your draft has been deleted.",
                          clear: current?.id === entry.update.id,
                          danger: true,
                        })
                      }
                    >
                      Delete draft #{entry.update.id}
                    </button>
                    {entry.review?.some((review) => !review.is_approved) &&
                      access.canCompose && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          disabled={locked}
                          onClick={() =>
                            selectMode({ kind: "revise", update: entry.update })
                          }
                        >
                          Revise as new draft
                        </button>
                      )}
                  </>
                )}
              </div>
            )}
            {!!entry.review?.length && (
              <div className="review-history">
                <h4>Review history</h4>
                {entry.review.map((review, index) => (
                  <section key={`${review.update_id}:${index}`}>
                    <span
                      className={`review-decision ${review.is_approved ? "approved" : "changes-requested"}`}
                    >
                      {review.is_approved ? "Approved" : "Changes requested"}
                    </span>
                    <RichContent content={review.message} />
                    <p className="update-attribution">
                      {review.reviewer_id} · {formatDate(review.created_at)}
                    </p>
                  </section>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {access.canCompose ? (
        <section
          className="update-composer"
          ref={composer}
          aria-labelledby="composer-heading"
        >
          <div className="composer-heading">
            <div>
              <h3 id="composer-heading">
                {mode.kind === "edit"
                  ? `Edit draft #${mode.update.id}`
                  : mode.kind === "revise"
                    ? `Revise draft #${mode.update.id}`
                    : "Write an update"}
              </h3>
              <p>Share progress with the team before it goes public.</p>
            </div>
            {mode.kind !== "draft" && (
              <button
                type="button"
                className="text-button"
                disabled={locked}
                onClick={clearEditor}
              >
                Cancel editing
              </button>
            )}
          </div>
          <RichEditor
            key={`${editorKey}:${mode.kind}`}
            initialValue={editorInitialValue}
            onChange={setMessage}
            onUploadBusy={uploadState}
            disabled={locked}
            label="Update message"
          />
          <p
            className={`editor-length ${message.length > 40000 ? "action-error" : ""}`}
          >
            {message.length.toLocaleString()} / 40,000 characters
          </p>
          <div className="composer-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={locked || !meaningful}
              onClick={saveDraft}
            >
              {busy
                ? "Saving…"
                : mode.kind === "edit"
                  ? "Save draft changes"
                  : "Submit update for review"}
            </button>
          </div>
        </section>
      ) : (
        <p className="membership-note">
          {petition.committee
            ? `Only members of ${petition.committee.name} can submit draft updates for this petition.`
            : "This petition does not have an assigned committee yet."}
        </p>
      )}

      {confirmation && (
        <Modal
          titleId="petition-confirm-title"
          onClose={() => {
            if (!busy) setConfirmation(null);
          }}
          className="confirmation-dialog"
          busy={busy}
        >
          <span className="eyebrow">REVIEW BEFORE CONTINUING</span>
          <h2 id="petition-confirm-title">{confirmation.title}</h2>
          <p>{confirmation.description}</p>
          {confirmation.preview && (
            <div className="confirmation-preview">
              <RichContent content={confirmation.preview} />
            </div>
          )}
          <div className="confirmation-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={busy}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${confirmation.danger ? "btn-danger" : "btn-primary"}`}
              disabled={busy}
              onClick={() => void execute(confirmation)}
            >
              {busy ? "Saving…" : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
