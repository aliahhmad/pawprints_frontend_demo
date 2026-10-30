"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import SiteNotice from "@/components/site-notice";
import Icon from "@/components/icon";
import {
  DemoError,
  getPetition,
  getPetitionDescription,
  getTags,
  savePetition,
} from "@/lib/demo-client";
import {
  hasRichContent,
  petitionReturnPath,
  validPetitionId,
} from "@/lib/petition-access";
import type { SavedPetition, Tag, UserProfile } from "@/lib/types";

const RichEditor = dynamic(() => import("@/components/rich-editor"), {
  ssr: false,
  loading: () => (
    <p className="create-editor-loading" role="status">
      Preparing your editor…
    </p>
  ),
});

type InitialValues = { title: string; description: string; tags: number[] };
const emptyValues: InitialValues = { title: "", description: "", tags: [] };

function DraftLoader({ id, user }: { id: number; user: UserProfile }) {
  const [state, setState] = useState<{
    values?: InitialValues;
    error?: string;
  }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const petition = await getPetition(id, controller.signal);
      if (petition.author?.username !== user.username || !petition.is_draft)
        throw new Error(
          "You can only edit your own unpublished petition drafts."
        );
      const content = await getPetitionDescription(id, controller.signal);
      if (!controller.signal.aborted)
        setState({
          values: {
            title: petition.title,
            description: content.petition_description || "",
            tags: petition.tags?.map((tag) => tag.id) || [],
          },
        });
    }
    load().catch((error) => {
      if (!controller.signal.aborted)
        setState({
          error:
            error instanceof Error
              ? error.message
              : "Unable to load this draft.",
        });
    });
    return () => controller.abort();
  }, [id, user.username, attempt]);
  if (state.error)
    return (
      <section className="create-status-panel" role="alert">
        <h2>Draft unavailable</h2>
        <p>{state.error}</p>
        <button
          className="btn btn-outline-secondary"
          onClick={() => {
            setState({});
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </button>{" "}
        <Link className="btn btn-primary" href="/create">
          Start a new petition
        </Link>
      </section>
    );
  if (!state.values)
    return (
      <section className="create-status-panel" role="status">
        Loading your draft…
      </section>
    );
  return <PetitionForm initial={state.values} draftId={id} />;
}

function PetitionForm({
  initial = emptyValues,
  draftId,
}: {
  initial?: InitialValues;
  draftId?: number;
}) {
  const params = useSearchParams();
  const from = petitionReturnPath(params.get("from"));
  const profilePath = from.startsWith("/profile") ? from : "/profile";
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [selected, setSelected] = useState<number[]>(initial.tags);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagState, setTagState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [tagAttempt, setTagAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [pending, setPending] = useState<"draft" | "publish" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState<SavedPetition | null>(null);
  const submitting = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    selected.join() !== initial.tags.join();
  const locked = pending !== null || uploading;

  useEffect(() => {
    const controller = new AbortController();
    getTags(controller.signal)
      .then((values) => {
        if (!controller.signal.aborted) {
          setTags(values);
          setTagState("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setTagState("error");
      });
    return () => controller.abort();
  }, [tagAttempt]);

  useEffect(() => {
    if ((!dirty && !locked) || saved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, locked, saved]);

  async function submit(isDraft: boolean) {
    if (submitting.current || uploading || uncertain || saved) return;
    const errors: typeof fieldErrors = {};
    if (title.trim().length < 3)
      errors.title = "Give your petition a title of at least 3 characters.";
    else if (title.trim().length > 80)
      errors.title = "Keep your title to 80 characters or fewer.";
    if (description.length < 10 || !hasRichContent(description))
      errors.description =
        "Add a description explaining the change you want to see.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus()
      );
      return;
    }
    submitting.current = true;
    setPending(isDraft ? "draft" : "publish");
    setError("");
    setExpired(false);
    try {
      const result = await savePetition(
        { title: title.trim(), description, tags: selected, is_draft: isDraft },
        draftId
      );
      if (
        !validPetitionId(String(result.id)) ||
        typeof result.is_draft !== "boolean"
      )
        throw new DemoError("We couldn’t confirm the saved petition.", 502);
      setSaved(result);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save your petition."
      );
      setExpired(error instanceof DemoError && error.status === 401);
      setUncertain(
        !(error instanceof DemoError) ||
          error.status === 0 ||
          error.status >= 500
      );
    } finally {
      submitting.current = false;
      setPending(null);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }

  if (saved)
    return (
      <section
        className="create-success create-status-panel"
        aria-labelledby="save-heading"
      >
        <span className="create-success-icon">
          <Icon name="check" size={26} />
        </span>
        <span className="eyebrow">
          {saved.is_draft ? "SAVED FOR LATER" : "YOUR IDEA IS LIVE"}
        </span>
        <h2
          id="save-heading"
          ref={(node) => {
            node?.focus();
          }}
          tabIndex={-1}
        >
          {saved.is_draft
            ? "Your draft is saved."
            : "Your petition is published."}
        </h2>
        <p>
          {saved.is_draft
            ? "Your petition is unpublished and isn’t open for signatures. Keep working on it here or find it in My PawPrints on your profile."
            : "Your petition is now in this browser’s demo listing. Your signature is already included."}
        </p>
        <div className="create-success-title">{saved.title}</div>
        <div className="create-success-actions">
          {saved.is_draft ? (
            <Link
              className="btn btn-primary"
              href={`/create?draft=${saved.id}${
                params.has("from")
                  ? `&from=${encodeURIComponent(profilePath)}`
                  : ""
              }`}
              onClick={() => {
                if (draftId === saved.id) setSaved(null);
              }}
            >
              Continue editing <Icon name="right" />
            </Link>
          ) : (
            <Link className="btn btn-primary" href={`/petitions/${saved.id}`}>
              View petition <Icon name="right" />
            </Link>
          )}
          <Link className="btn btn-outline-secondary" href={profilePath}>
            My PawPrints
          </Link>
        </div>
      </section>
    );

  const visibleTags = tags.filter((tag) =>
    `${tag.name} ${tag.description || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );
  const next = `/create${params.size ? `?${params}` : ""}`;

  return (
    <form
      className="create-form-panel form-container"
      ref={form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
      aria-busy={locked}
    >
      <div className="create-form-heading">
        <span className="eyebrow">
          {draftId
            ? `PETITION DRAFT #${draftId}`
            : "A BETTER CAMPUS STARTS HERE"}
        </span>
        <h2>Your petition</h2>
        <p>Tell the community what you’d like to change, and why.</p>
      </div>
      <fieldset className="create-fields" disabled={locked}>
        <legend className="visually-hidden">Petition details</legend>
        <div className="create-field">
          <div className="create-field-heading">
            <label htmlFor="petition-title">
              Petition title <span>Required</span>
            </label>
            <span id="title-count">{title.length}/80</span>
          </div>
          <p id="title-help">
            Start with the change you want to see. Keep it clear and specific.
          </p>
          <input
            id="petition-title"
            className={`form-control ${fieldErrors.title ? "is-invalid" : ""}`}
            placeholder="e.g. Keep the library open later during finals"
            value={title}
            maxLength={80}
            required
            aria-invalid={!!fieldErrors.title || undefined}
            aria-describedby={`title-help title-count${
              fieldErrors.title ? " title-error" : ""
            }`}
            onChange={(event) => {
              setTitle(event.target.value);
              setFieldErrors((value) => ({ ...value, title: undefined }));
            }}
          />
          {fieldErrors.title && (
            <p className="create-field-error" id="title-error" role="alert">
              {fieldErrors.title}
            </p>
          )}
        </div>
        <div className="create-field">
          <label className="create-field-label">
            Petition description <span>Required</span>
          </label>
          <p id="description-help">
            Explain the issue, your proposed solution, and how it will help the
            RIT community.
          </p>
          <RichEditor
            initialValue={description}
            label="Petition description"
            descriptionId={`description-help${
              fieldErrors.description ? " description-error" : ""
            }`}
            invalid={!!fieldErrors.description}
            placeholder="What should change? Why does it matter to students?"
            disabled={pending !== null}
            onUploadBusy={setUploading}
            onChange={(value) => {
              setDescription(value);
              setFieldErrors((errors) => ({
                ...errors,
                description: undefined,
              }));
            }}
          />
          {fieldErrors.description && (
            <p
              className="create-field-error"
              id="description-error"
              role="alert"
            >
              {fieldErrors.description}
            </p>
          )}
        </div>
        <div className="create-field">
          <label htmlFor="tag-search">
            Petition tags <span>Optional</span>
          </label>
          <p id="tag-help">
            Choose any tags that fit so students can find your petition.
          </p>
          {tagState === "loading" && <p role="status">Loading tags…</p>}
          {tagState === "error" && (
            <div className="create-tag-error" role="alert">
              We couldn’t load tags. You can still save or publish without them.{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setTagState("loading");
                  setTagAttempt((value) => value + 1);
                }}
              >
                Try again
              </button>
            </div>
          )}
          {selected.length > 0 && (
            <div className="create-selected-tags" aria-label="Selected tags">
              {selected.map((id) => (
                <button
                  type="button"
                  key={id}
                  aria-label={`Remove ${
                    tags.find((tag) => tag.id === id)?.name || `tag ${id}`
                  }`}
                  onClick={() =>
                    setSelected((values) =>
                      values.filter((value) => value !== id)
                    )
                  }
                >
                  {tags.find((tag) => tag.id === id)?.name || `Tag #${id}`}
                  <Icon name="close" size={13} />
                </button>
              ))}
            </div>
          )}
          {tagState === "ready" && (
            <>
              <div className="create-tag-search">
                <Icon name="search" size={17} />
                <input
                  id="tag-search"
                  className="form-control"
                  type="search"
                  placeholder="Search tags…"
                  value={search}
                  aria-describedby="tag-help"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <fieldset className="create-tag-options">
                <legend className="visually-hidden">Choose tags</legend>
                {visibleTags.map((tag) => (
                  <label
                    className={`create-tag-option ${
                      selected.includes(tag.id) ? "is-selected" : ""
                    }`}
                    key={tag.id}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.includes(tag.id)}
                      onChange={() =>
                        setSelected((values) =>
                          values.includes(tag.id)
                            ? values.filter((id) => id !== tag.id)
                            : [...values, tag.id]
                        )
                      }
                    />
                    <span>
                      <strong>{tag.name}</strong>
                      {tag.description && <small>{tag.description}</small>}
                    </span>
                  </label>
                ))}
                {visibleTags.length === 0 && (
                  <p className="create-tag-empty">
                    {tags.length
                      ? "No tags match your search."
                      : "No tags are available yet. You can continue without them."}
                  </p>
                )}
              </fieldset>
            </>
          )}
        </div>
      </fieldset>
      {error && (
        <div
          className="create-submit-error alert alert-danger"
          role="alert"
          tabIndex={-1}
          ref={feedback}
        >
          <p>
            {uncertain
              ? "We couldn’t confirm whether your petition was saved. Check My PawPrints before submitting again to avoid creating a duplicate."
              : error}
          </p>
          {uncertain && (
            <>
              <Link
                href={profilePath}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open My PawPrints in a new tab
              </Link>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setUncertain(false);
                  setError("");
                }}
              >
                I checked — allow retry
              </button>
            </>
          )}
          {expired && (
            <a
              href={`/?next=${encodeURIComponent(next)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign in again in a new tab, then retry here
            </a>
          )}
        </div>
      )}
      <div className="create-form-footer">
        <p>
          {uploading
            ? "Uploading your image…"
            : pending
            ? pending === "draft"
              ? "Saving your draft…"
              : "Publishing your petition…"
            : "Save a draft to come back later. Publish when you’re ready for signatures."}
        </p>
        <div className="create-form-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={locked || uncertain}
            onClick={() => void submit(true)}
          >
            {pending === "draft" ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={locked || uncertain}
          >
            {pending === "publish" ? "Publishing…" : "Publish petition"}
            <Icon name="right" size={17} />
          </button>
        </div>
        <span className="visually-hidden" role="status">
          {locked
            ? uploading
              ? "Uploading image. Please wait."
              : "Saving petition. Please wait."
            : ""}
        </span>
      </div>
    </form>
  );
}

export default function CreatePetitionScreen() {
  const params = useSearchParams();
  const draft = params.get("draft");
  const { user, loading, error, retry } = useAuth();
  const editing = draft !== null;
  return (
    <>
      <main id="main-content" tabIndex={-1} className="workspace-page create-page outercreate">
        <header className="create-page-heading">
          <span className="eyebrow">YOUR VOICE. OUR CAMPUS.</span>
          <h1>
            {editing ? "Give your idea its next chapter." : "Make your mark."}
          </h1>
          <p>
            {editing
              ? "Pick up where you left off. Your draft stays unpublished until you’re ready."
              : "Have an idea for a better RIT? Put it into words and bring your campus with you."}
          </p>
        </header>
        <div className="create-layout">
          <div className="create-main">
            {loading ? (
              <section className="create-status-panel" role="status">
                Checking your account…
              </section>
            ) : !user ? (
              <section className="create-status-panel">
                <span className="eyebrow">YOUR RIT COMMUNITY</span>
                <h2>
                  {error
                    ? "We couldn’t check your account."
                    : "Sign in to create a petition."}
                </h2>
                <p>
                  {error
                    ? "Try opening an example account again. An example account is required to save or publish locally."
                    : "Choose a fictional student account to share an idea, save a draft, and try publishing locally."}
                </p>
                {error ? (
                  <button className="btn btn-primary" onClick={retry}>
                    Try again
                  </button>
                ) : (
                  <Link
                    className="btn btn-primary"
                    href={`/?next=${encodeURIComponent(
                      editing && validPetitionId(draft!)
                        ? `/create?${params}`
                        : "/create"
                    )}`}
                  >
                    Choose an example account <Icon name="right" />
                  </Link>
                )}
              </section>
            ) : editing ? (
              validPetitionId(draft!) ? (
                <DraftLoader
                  key={draft + user.username}
                  id={Number(draft)}
                  user={user}
                />
              ) : (
                <section className="create-status-panel" role="alert">
                  <h2>Draft unavailable</h2>
                  <p>This draft link is invalid.</p>
                  <Link className="btn btn-primary" href="/create">
                    Start a new petition
                  </Link>
                </section>
              )
            ) : (
              <PetitionForm key={user.username} />
            )}
          </div>
          <aside
            className="create-guide"
            aria-labelledby="create-guide-heading"
          >
            <div className="create-guide-intro">
              <span className="create-guide-icon">
                <Icon name="write" size={23} />
              </span>
              <span className="eyebrow">A LITTLE GUIDANCE</span>
              <h2 id="create-guide-heading">An idea worth sharing.</h2>
              <p>
                You don’t need all the answers. Start with a clear change and
                the reason it matters.
              </p>
            </div>
            <ol>
              <li>
                <strong>Lead with the change.</strong>
                <p>Make your title an action-oriented, one-line summary.</p>
              </li>
              <li>
                <strong>Make your case.</strong>
                <p>
                  Explain what’s happening, what could be better, and why
                  someone should sign.
                </p>
              </li>
              <li>
                <strong>Help people find it.</strong>
                <p>Add relevant tags. You can choose more than one.</p>
              </li>
            </ol>
            <div className="create-guide-note">
              <strong>Please remember</strong>
              <p>
                If your petition concerns another person, staff, or faculty
                member, talk to the Ombuds office instead.
              </p>
            </div>
            <Link className="create-profile-link" href="/profile?filter=drafts">
              Find your drafts in My PawPrints <Icon name="arrow" size={15} />
            </Link>
          </aside>
        </div>
        <SiteNotice petitionOpen={false} />
      </main>
    </>
  );
}
