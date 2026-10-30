"use client";


import Link from "next/link";
import PetitionTag from "@/components/petition-tag";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPetitions, getTags } from "@/lib/demo-client";
import type { Petition, Tag } from "@/lib/types";
import {
  authorName,
  formatDate,
  parseFilters,
  parsePage,
  PETITIONS_PER_PAGE,
  PETITION_STATUSES,
  SIGNATURE_GOAL,
  SORT_OPTIONS,
  type PetitionFilters,
} from "@/lib/petitions";
import { useAuth } from "@/components/auth-provider";
import SiteNotice from "@/components/site-notice";
import Icon from "@/components/icon";
import PetitionDialog from "@/components/petition-dialog";
import CampusBanner from "@/components/campus-banner";

function Filters({
  filters,
  update,
}: {
  filters: PetitionFilters;
  update: (values: Partial<PetitionFilters>) => void;
}) {
  const [input, setInput] = useState({
    source: filters.query,
    value: filters.query,
  });
  const value = input.source === filters.query ? input.value : filters.query;
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagError, setTagError] = useState(false);
  const [tagLoading, setTagLoading] = useState(true);
  const [tagAttempt, setTagAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getTags(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setTags(data);
          setTagError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setTagError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTagLoading(false);
      });
    return () => controller.abort();
  }, [tagAttempt]);

  useEffect(() => {
    if (value === filters.query) return;
    const timer = setTimeout(() => update({ query: value }), 700);
    return () => clearTimeout(timer);
  }, [value, filters.query, update]);

  const filtered = !!(
    filters.query ||
    filters.tag ||
    filters.status ||
    filters.sort
  );
  return (
    <section
      className="filter-panel petition-controls"
      aria-label="Search, filter, and sort petitions"
    >
      <form
        className="filter-top-row"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update({ query: value });
        }}
      >
        <div className="search-field">
          <label htmlFor="petition-search">Find an idea</label>
          <div className="search-input-wrap">
            <Icon name="search" size={19} />
            <input
              id="petition-search"
              type="search"
              className="form-control"
              placeholder="Search petitions…"
              value={value}
              maxLength={500}
              onChange={(event) =>
                setInput({ source: filters.query, value: event.target.value })
              }
            />
            <button type="submit" className="btn btn-outline-secondary">
              Search
            </button>
          </div>
        </div>
        <div className="tag-field">
          <label htmlFor="petition-tag">Tag</label>
          <select
            id="petition-tag"
            className="form-select"
            value={filters.tag}
            disabled={tagLoading || tagError}
            onChange={(event) => {
              setInput({ source: "", value: "" });
              update({ tag: event.target.value, query: "" });
            }}
          >
            <option value="">
              {tagLoading
                ? "Loading tags…"
                : tagError
                ? "Tags unavailable"
                : "All tags"}
            </option>
            {filters.tag &&
              !tags.some((tag) => String(tag.id) === filters.tag) && (
                <option value={filters.tag}>Tag #{filters.tag}</option>
              )}
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sort-field">
          <label htmlFor="petition-sort">Sort by</label>
          <select
            id="petition-sort"
            className="form-select"
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </form>
      {tagError && (
        <p className="small text-secondary mt-2 mb-0" role="status">
          Tags couldn’t be loaded.{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setTagLoading(true);
              setTagAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </p>
      )}
      <div className="filter-bottom-row petition-controls-options">
        <div
          className="status-filters statusButton"
          role="group"
          aria-label="Filter by petition status"
        >
          <span className="filter-caption">STATUS</span>
          <button
            type="button"
            aria-pressed={!filters.status}
            className={!filters.status ? "selected" : ""}
            onClick={() => update({ status: "" })}
          >
            All petitions
          </button>
          {PETITION_STATUSES.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={filters.status === String(index)}
              className={filters.status === String(index) ? "selected" : ""}
              onClick={() =>
                update({
                  status: filters.status === String(index) ? "" : String(index),
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
        {filtered && (
          <button
            className="clear-filters text-button"
            type="button"
            onClick={() => {
              setInput({ source: "", value: "" });
              update({ query: "", status: "", tag: "", sort: "" });
            }}
          >
            <Icon name="close" size={13} /> Clear filters
          </button>
        )}
      </div>
    </section>
  );
}

function PetitionItem({
  petition,
  href,
}: {
  petition: Petition;
  href: string;
}) {
  const count = petition.total_signatures ?? 0;
  const status =
    petition.status === null
      ? "Unknown status"
      : PETITION_STATUSES[petition.status] || "Unknown status";
  const remaining = Math.max(0, SIGNATURE_GOAL - count);
  return (
    <li>
      <article className="petition-card">
        <div className="petition-card-main">
          <div className="petition-card-labels">
            <span className={`status-badge status-${petition.status}`}>
              <span className="status-dot" />
              {status}
            </span>
            {petition.committee && (
              <span className="committee-label">
                Assigned to {petition.committee.name}
              </span>
            )}
            {petition.committeeUnavailable && (
              <span className="committee-label">Committee unavailable</span>
            )}
          </div>
          <h2>
            <Link href={href} scroll={false}>
              {petition.title.replace(/&amp;/g, "&")}
              <Icon name="arrow" size={19} />
            </Link>
          </h2>
          <p className="petition-meta">
            By {authorName(petition.author)}
            <span aria-hidden="true">·</span>
            {petition.created_at &&
            formatDate(petition.created_at) !== "Not available" ? (
              <time dateTime={petition.created_at}>
                {formatDate(petition.created_at)}
              </time>
            ) : (
              "Date unavailable"
            )}
          </p>
          {!!petition.tags?.length && (
            <div className="petition-tags">
              {petition.tags.map((tag) => (
                <PetitionTag key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
        <div className="petition-card-support">
          <div className="card-signatures">
            <Icon name="people" size={18} />
            <strong>{count.toLocaleString()}</strong>
            <span>{count === 1 ? "signature" : "signatures"}</span>
          </div>
          <progress
            className={`signature-progress ${
              petition.status === 2 ? "is-responded" : ""
            }`}
            value={Math.min(count, SIGNATURE_GOAL)}
            max={SIGNATURE_GOAL}
            aria-label={`${count} of ${SIGNATURE_GOAL} signatures`}
          />
          <span className="signature-caption">
            {remaining
              ? `${remaining} to reach ${SIGNATURE_GOAL}`
              : "Signature threshold reached"}
          </span>
        </div>
      </article>
    </li>
  );
}

type ResultsState = {
  petitions: Petition[];
  page: number;
  total: number;
  pages: number;
  loading: boolean;
  error: string;
};

function Results({
  filters,
  page,
  selected,
  petitionHref,
  closePetition,
  changePage,
}: {
  filters: PetitionFilters;
  page: number;
  selected: string | null;
  petitionHref: (id: number) => string;
  closePetition: () => void;
  changePage: (page: number) => void;
}) {
  const [state, setState] = useState<ResultsState>({
    petitions: [],
    page: 0,
    total: 0,
    pages: 0,
    loading: true,
    error: "",
  });
  const [attempt, setAttempt] = useState(0);
  const { query, status, tag, sort } = filters;

  useEffect(() => {
    const abort = new AbortController();
    getPetitions({ query, status, tag, sort }, page, abort.signal)
      .then((data) => {
        if (!abort.signal.aborted)
          setState({
            petitions: data.petitions,
            page,
            total: data.page_info.total_items,
            pages: data.page_info.total_pages,
            loading: false,
            error: "",
          });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setState((previous) => ({
            ...previous,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "We couldn’t load petitions.",
          }));
      });
    return () => abort.abort();
  }, [query, status, tag, sort, page, attempt]);

  const updateCount = useCallback(
    (id: number, count: number) =>
      setState((previous) => ({
        ...previous,
        petitions: previous.petitions.map((petition) =>
          petition.id === id
            ? { ...petition, total_signatures: count }
            : petition
        ),
      })),
    []
  );
  const updatePetition = useCallback(
    (petition: Petition) =>
      setState((previous) => ({
        ...previous,
        petitions: previous.petitions.map((item) =>
          item.id === petition.id ? petition : item
        ),
      })),
    []
  );
  const id =
    selected &&
    /^[1-9]\d*$/.test(selected) &&
    Number.isSafeInteger(Number(selected)) &&
    Number(selected) <= 2147483647
      ? Number(selected)
      : null;

  return (
    <section
      className="results-section"
      aria-label="Petition results"
      aria-busy={state.loading}
    >
      <div className="results-toolbar">
        <p role="status">
          {state.page ? (
            <>
              <strong>{state.total.toLocaleString()}</strong>{" "}
              {state.total === 1 ? "petition" : "petitions"}
              {query && <> matching “{query}”</>}
            </>
          ) : (
            "Finding campus ideas…"
          )}
        </p>
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          disabled={state.loading}
          onClick={() => {
            setState((previous) => ({ ...previous, loading: true, error: "" }));
            setAttempt((value) => value + 1);
          }}
        >
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </div>
      {state.petitions.length > 0 && (
        <ul className="petition-list">
          {state.petitions.map((petition) => (
            <PetitionItem
              petition={petition}
              href={petitionHref(petition.id)}
              key={petition.id}
            />
          ))}
        </ul>
      )}
      {state.loading && (
        <div className="results-loading" role="status">
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          Loading petitions…
        </div>
      )}
      {state.error && (
        <div className="results-error" role="alert">
          <h2 className="h5">Let’s try that again.</h2>
          <p>{state.error}</p>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => {
              setState((previous) => ({
                ...previous,
                loading: true,
                error: "",
              }));
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {!state.loading && !state.error && state.petitions.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="search" size={30} />
          </span>
          <h2>
            {page > 1
              ? "No petitions on this page."
              : query || tag || status
              ? "No petitions found."
              : "The next idea could be yours."}
          </h2>
          <p>
            {page > 1
              ? "Return to the first page to see the available petitions."
              : query || tag || status
              ? "Try another search or clear your filters to see more campus ideas."
              : "There are no published petitions yet. Start a conversation about a change you’d like to see."}
          </p>
          {page > 1 ? (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => changePage(1)}
            >
              Go to first page
            </button>
          ) : query || tag || status ? (
            <Link className="btn btn-outline-secondary" href="/petitions">
              Clear filters
            </Link>
          ) : (
            <Link className="btn btn-primary" href="/create">
              Create a petition <Icon name="plus" size={16} />
            </Link>
          )}
        </div>
      )}
      {state.page > 0 && state.petitions.length > 0 && (
        <div className="results-bottom">
          <p>
            Showing {((page - 1) * PETITIONS_PER_PAGE + 1).toLocaleString()}–
            {(
              (page - 1) * PETITIONS_PER_PAGE +
              state.petitions.length
            ).toLocaleString()}{" "}
            of {state.total.toLocaleString()} petitions
          </p>
          <nav className="petition-pagination" aria-label="Petition pages">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={state.loading || page <= 1}
              onClick={() => changePage(page - 1)}
            >
              Previous
            </button>
            <span role="status" aria-live="polite">
              Page {page} of {state.pages}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={state.loading || page >= state.pages}
              onClick={() => changePage(page + 1)}
            >
              Next
            </button>
          </nav>
        </div>
      )}
      {selected !== null &&
        (id ? (
          <PetitionDialog
            key={id}
            id={id}
            onClose={closePetition}
            onCountChange={updateCount}
            onPetitionChange={updatePetition}
          />
        ) : (
          <div className="alert alert-danger" role="alert">
            That petition link is invalid.{" "}
            <button className="text-button" onClick={closePetition}>
              Dismiss
            </button>
          </div>
        ))}
    </section>
  );
}

export default function PetitionsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { error, retry } = useAuth();
  const filters = parseFilters(params);
  const page = parsePage(params.get("page"));
  const selected = params.get("petition");
  const update = useCallback(
    (values: Partial<PetitionFilters>) => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(values).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      next.delete("page");
      next.delete("petition");
      router.replace(`/petitions${next.size ? `?${next}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );
  const changePage = (page: number) => {
    const next = new URLSearchParams(window.location.search);
    if (page === 1) next.delete("page");
    else next.set("page", String(page));
    next.delete("petition");
    router.push(`/petitions${next.size ? `?${next}` : ""}`);
  };
  const petitionHref = (id: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("petition", String(id));
    return `/petitions?${next}`;
  };
  const closePetition = () => {
    const next = new URLSearchParams(window.location.search);
    next.delete("petition");
    router.push(`/petitions${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  return (
    <>
      <main id="main-content" tabIndex={-1} className="workspace-page workspace-main">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">A LITTLE SUPPORT GOES A LONG WAY</span>
            <h1>
              Your campus.
              <br className="mobile-heading-break" /> Your ideas.
            </h1>
            <p>Find a cause. Add your voice. Make a difference at RIT.</p>
          </div>
          <Link className="btn btn-primary" href="/create">
            <Icon name="plus" size={18} />
            Create a petition
          </Link>
        </div>
        <section className="campus-intro" aria-label="How Pawprints works">
          <div>
            <span className="eyebrow">MAKE YOUR MARK</span>
            <h2>Change starts with a conversation.</h2>
            <p>
              Create and sign petitions. Follow official responses from Student
              Government.
            </p>
            <Link href="/about">
              How Pawprints works <Icon name="right" size={16} />
            </Link>
          </div>
          <CampusBanner />
        </section>
        {error && (
          <p className="account-warning" role="status">
            {error}{" "}
            <button type="button" className="text-button" onClick={retry}>
              Check again
            </button>
          </p>
        )}
        <Filters filters={filters} update={update} />
        <Results
          key={JSON.stringify([filters, page])}
          filters={filters}
          page={page}
          changePage={changePage}
          selected={selected}
          petitionHref={petitionHref}
          closePetition={closePetition}
        />
        <SiteNotice petitionOpen={selected !== null} />
      </main>
    </>
  );
}
