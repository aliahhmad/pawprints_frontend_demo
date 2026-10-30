"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PetitionTag from "@/components/petition-tag";
import {
  DemoError,
  changeSignature,
  getPetition,
  getSigningState,
  getTimeline,
} from "@/lib/demo-client";
import type { Petition, PetitionTimeline, SigningState } from "@/lib/types";
import {
  authorName,
  formatDate,
  PETITION_STATUSES,
  SIGNATURE_GOAL,
  safeReturnPath,
} from "@/lib/petitions";
import { useAuth } from "@/components/auth-provider";
import { petitionAccess } from "@/lib/petition-access";
import PetitionManagement, {
  type ComposerSnapshot,
} from "@/components/petition-management";
import type { UserProfile } from "@/lib/types";
import Icon from "@/components/icon";
import RichContent from "@/components/rich-content";

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      petition: Petition;
      timeline: PetitionTimeline;
      internal: boolean;
      workspaceError: string;
    };

async function readPetition(
  id: number,
  internal: boolean,
  signal?: AbortSignal,
): Promise<Extract<DetailState, { status: "ready" }>> {
  let workspaceError = "";
  const timelineTask = getTimeline(id, signal, internal).catch(
    async (error) => {
      if (internal && error instanceof DemoError && error.status === 403) {
        workspaceError =
          "Your account cannot access this petition’s review workspace. The public timeline is shown below.";
        return getTimeline(id, signal);
      }
      throw error;
    },
  );
  const [petition, timeline] = await Promise.all([
    getPetition(id, signal),
    timelineTask,
  ]);
  return { status: "ready", petition, timeline, internal, workspaceError };
}

const ignoreCount = () => {};
type Props = {
  id: number;
  onCountChange?: (id: number, count: number) => void;
  onPetitionChange?: (petition: Petition) => void;
  fullPage?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export default function PetitionView(props: Props) {
  const { user, loading } = useAuth();
  if (loading) {
    const Heading = props.fullPage ? "h1" : "h2";
    return (
      <div className="dialog-loading">
        <Heading id="petition-dialog-title">Loading petition</Heading>
        <p role="status">Checking your session…</p>
      </div>
    );
  }
  return (
    <PetitionContent
      key={`${props.id}:${user?.username || "guest"}:${user?.roles?.map((role) => role.name).join(",") || ""}`}
      {...props}
      user={user}
    />
  );
}

function PetitionContent({
  id,
  onCountChange = ignoreCount,
  onPetitionChange,
  fullPage = false,
  onBusyChange,
  user,
}: Props & { user: UserProfile | null }) {
  const access = petitionAccess(user);
  const [preview, setPreview] = useState(false);
  const internal = access.reviewer && !preview;
  const [composerSnapshot, setComposerSnapshot] =
    useState<ComposerSnapshot | null>(null);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const working = useCallback(
    (value: boolean) => {
      setWorkspaceBusy(value);
      onBusyChange?.(value);
    },
    [onBusyChange],
  );
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [signing, setSigning] = useState<SigningState | null>(null);
  const [eligibilityError, setEligibilityError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const submitting = useRef(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    const next = await readPetition(id, internal);
    setState(next);
    onPetitionChange?.(next.petition);
  }, [id, internal, onPetitionChange]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    readPetition(id, internal, controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) {
          setState(next);
          onPetitionChange?.(next.petition);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof DemoError && error.status === 404
                ? "This petition is no longer available."
                : "We couldn’t load this petition. Please try again.",
          });
      });
    getSigningState(id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setSigning(value);
          setEligibilityError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setEligibilityError(true);
      });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [id, internal, attempt, onPetitionChange]);

  async function toggleSignature() {
    if (
      submitting.current ||
      !signing ||
      !["ready", "signed"].includes(signing)
    )
      return;
    submitting.current = true;
    setBusy(true);
    setActionError("");
    setFeedback("");
    try {
      const result = await changeSignature(id, signing === "signed");
      onCountChange(id, result.total_signatures);
      if (!mounted.current) return;
      setSigning(result.signed ? "signed" : "ready");
      setState((previous) =>
        previous.status === "ready"
          ? {
              ...previous,
              petition: {
                ...previous.petition,
                total_signatures: result.total_signatures,
              },
            }
          : previous,
      );
      setFeedback(
        result.signed
          ? "Your signature has been added. Thanks for making your voice heard."
          : "Your signature has been removed.",
      );
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof DemoError && error.status === 401) {
        setSigning("guest");
        setActionError("Your session has expired. Sign in to continue.");
      } else {
        setActionError(
          "We couldn’t confirm that change. Checking your signature before you try again…",
        );
        // A failed connection can follow a committed change. Reconcile before allowing another mutation.
        try {
          const [current, petition] = await Promise.all([
            getSigningState(id),
            getPetition(id),
          ]);
          onCountChange(id, petition.total_signatures ?? 0);
          if (!mounted.current) return;
          setSigning(current);
          setState((previous) =>
            previous.status === "ready" ? { ...previous, petition } : previous,
          );
          setActionError(
            "Your signature status is up to date. You can try again if needed.",
          );
        } catch {
          if (!mounted.current) return;
          setSigning(null);
          setEligibilityError(true);
          setActionError(
            "We couldn’t confirm your signature status. Check it again before making another change.",
          );
        }
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function share() {
    if (state.status !== "ready") return;
    const url = `${window.location.origin}/petitions/${id}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: state.petition.title,
          text: "Make your voice heard on Pawprints.",
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied to clipboard.");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setShareMessage(`Copy this link: ${url}`);
    }
  }

  const petition = state.status === "ready" ? state.petition : null;
  const explicitlyClosed = petition?.status === 2 || petition?.has_response;
  const closed = signing === "closed" || explicitlyClosed;
  const count = petition?.total_signatures ?? 0;
  const signInHref = `/?next=${encodeURIComponent(typeof window !== "undefined" ? safeReturnPath(window.location.pathname + window.location.search) : fullPage ? `/petitions/${id}` : `/petitions?petition=${id}`)}`;
  const Heading = fullPage ? "h1" : "h2";
  const ready = state.status === "ready" && state.internal === internal;

  return (
    <div className={`petition-view ${fullPage ? "is-full-page" : ""}`}>
      {(state.status === "loading" || (state.status === "ready" && !ready)) && (
        <div className="dialog-loading">
          <Heading id="petition-dialog-title">Loading petition</Heading>
          <p role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Getting the full story…
          </p>
        </div>
      )}
      {state.status === "error" && (
        <div className="dialog-loading">
          <Heading id="petition-dialog-title">Petition unavailable</Heading>
          <p role="alert">{state.message}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {state.status === "ready" && ready && (
        <>
          <div className="petition-dialog-heading">
            <span className="eyebrow">CAMPUS PETITION #{id}</span>
            <Heading id="petition-dialog-title">
              {state.petition.title.replace(/&amp;/g, "&")}
            </Heading>
            <div className="petition-heading-details">
              <p>
                Started by {authorName(state.petition.author)}{" "}
                <span aria-hidden="true">·</span>{" "}
                {formatDate(state.petition.created_at)}
              </p>
              {!!state.petition.tags?.length && (
                <div
                  className="petition-tags petition-heading-tags"
                  role="group"
                  aria-label="Petition tags"
                >
                  {state.petition.tags.map((tag) => (
                    <PetitionTag key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
            <div className="petition-view-tools">
              <span className={`status-badge status-${state.petition.status}`}>
                {state.petition.status === null
                  ? "Unknown status"
                  : PETITION_STATUSES[state.petition.status] ||
                    "Unknown status"}
              </span>
              {state.petition.is_draft && (
                <span className="entry-badge">Draft petition</span>
              )}
              {state.petition.committee && (
                <span className="committee-label">
                  Assigned to {state.petition.committee.name}
                </span>
              )}
              {access.reviewer && (
                <div
                  className="view-mode"
                  role="group"
                  aria-label="Petition view"
                >
                  <button
                    type="button"
                    aria-pressed={!preview}
                    disabled={workspaceBusy}
                    onClick={() => setPreview(false)}
                  >
                    Team workspace
                  </button>
                  <button
                    type="button"
                    aria-pressed={preview}
                    disabled={workspaceBusy}
                    onClick={() => setPreview(true)}
                  >
                    Public view
                  </button>
                </div>
              )}
              {!fullPage && (
                <Link
                  className="open-petition-page"
                  href={`/petitions/${id}?from=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search.replace(/([?&])petition=\d+&?/, "$1").replace(/[?&]$/, "") : "/petitions")}`}
                >
                  Open full page <Icon name="arrow" size={14} />
                </Link>
              )}
            </div>
          </div>
          <div className="petition-dialog-grid">
            <div className="petition-dialog-body">
              <section>
                <h3>The idea</h3>
                <RichContent content={state.timeline.petition_description} />
              </section>
              {state.workspaceError && (
                <div
                  className="alert alert-warning workspace-access-warning"
                  role="alert"
                >
                  {state.workspaceError}{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    Check access again
                  </button>
                </div>
              )}
              {internal && !state.workspaceError && user ? (
                <PetitionManagement
                  petition={state.petition}
                  timeline={state.timeline}
                  user={user}
                  onReload={reload}
                  initialComposer={composerSnapshot}
                  onComposerChange={setComposerSnapshot}
                  onBusyChange={working}
                />
              ) : (
                <section
                  className="public-timeline"
                  aria-labelledby="public-timeline-heading"
                >
                  <div className="timeline-heading">
                    <h3 id="public-timeline-heading">
                      Updates from Student Government
                    </h3>
                    <span>
                      {state.timeline.petition_updates.length}{" "}
                      {state.timeline.petition_updates.length === 1
                        ? "update"
                        : "updates"}
                    </span>
                  </div>
                  {state.timeline.petition_updates.length === 0 && (
                    <p className="timeline-empty">
                      No official updates yet. Check back to follow this
                      petition’s progress.
                    </p>
                  )}
                  {state.timeline.petition_updates.map(
                    ({ is_response, update }) => (
                      <section
                        className={`timeline-update ${is_response ? "official-response" : ""}`}
                        key={update.id}
                      >
                        <span className="eyebrow">
                          {is_response
                            ? "OFFICIAL RESPONSE"
                            : "PETITION UPDATE"}
                        </span>
                        <RichContent content={update.message} />
                        <p className="update-attribution">
                          {update.author_id || "Student Government"} ·{" "}
                          {formatDate(update.created_at)}
                        </p>
                      </section>
                    ),
                  )}
                </section>
              )}
            </div>
            <aside className="petition-facts" aria-label="Petition information">
              <div className="signature-total">
                <strong>{count.toLocaleString()}</strong>
                <span>of {SIGNATURE_GOAL} signatures</span>
              </div>
              <progress
                className="signature-progress"
                value={Math.min(count, SIGNATURE_GOAL)}
                max={SIGNATURE_GOAL}
                aria-label={`${count} of ${SIGNATURE_GOAL} signatures`}
              />
              <p className="small text-secondary">
                {count >= SIGNATURE_GOAL
                  ? "This petition has reached the signature threshold."
                  : `${SIGNATURE_GOAL - count} more signatures to reach the threshold.`}
              </p>
              {actionError && (
                <p className="action-error" role="alert">
                  {actionError}
                </p>
              )}
              {eligibilityError ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setEligibilityError(false);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Check signature status
                </button>
              ) : closed ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  disabled
                >
                  Signing closed
                </button>
              ) : signing === "own" ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    disabled
                  >
                    Your petition
                  </button>
                  <p className="small text-secondary mt-2">
                    {state.petition.is_draft
                      ? "You created this draft. Signatures open after publication."
                      : "Your signature is included as the author."}
                  </p>
                </>
              ) : signing === "guest" ? (
                <Link className="btn btn-primary w-100" href={signInHref}>
                  Sign in to sign <Icon name="arrow" size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  className={`btn ${signing === "signed" ? "btn-outline-secondary" : "btn-primary"} w-100`}
                  onClick={toggleSignature}
                  disabled={busy || signing === null}
                >
                  {busy
                    ? "Saving…"
                    : signing === null
                      ? "Checking signature…"
                      : signing === "signed"
                        ? "Remove my signature"
                        : "Sign this petition"}
                  {signing === "ready" && !busy && (
                    <Icon name="write" size={16} />
                  )}
                </button>
              )}
              {signing === "signed" && (
                <p className="signed-label">
                  <Icon name="check" size={15} /> You signed this petition
                </p>
              )}
              {feedback && (
                <p className="small mt-3" role="status">
                  {feedback}
                </p>
              )}
              <dl className="facts-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    {state.petition.status !== null
                      ? PETITION_STATUSES[state.petition.status] ||
                        "Unknown status"
                      : "Unknown status"}
                  </dd>
                </div>
                <div>
                  <dt>Assigned committee</dt>
                  <dd>
                    {state.petition.committeeUnavailable ? (
                      <>
                        Could not load.{" "}
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setAttempt((value) => value + 1)}
                        >
                          Retry
                        </button>
                      </>
                    ) : state.petition.committee?.name || "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDate(state.petition.created_at)}</dd>
                </div>
                <div>
                  <dt>Expires</dt>
                  <dd>{formatDate(state.petition.expires)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="btn btn-outline-secondary w-100 mt-3"
                onClick={share}
              >
                <Icon name="link" size={16} /> Share petition
              </button>
              {shareMessage && (
                <p className="small mt-2 share-message" role="status">
                  {shareMessage}
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
