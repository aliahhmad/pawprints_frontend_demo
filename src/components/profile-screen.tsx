"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import PetitionDialog from "@/components/petition-dialog";
import PetitionTag from "@/components/petition-tag";
import Icon from "@/components/icon";
import { DemoError, getOwnPetitions, resetDemoData } from "@/lib/demo-client";
import {
  authorName,
  formatDate,
  parsePage,
  PETITION_STATUSES,
} from "@/lib/petitions";
import { validPetitionId } from "@/lib/petition-access";
import type { Petition, PetitionPage, UserProfile } from "@/lib/types";

type Filter = "all" | "published" | "drafts";
type Results =
  | { status: "loading" }
  | { status: "error"; message: string; expired: boolean }
  | { status: "ready"; data: PetitionPage };

function AccountCard({ user }: { user: UserProfile }) {
  const initials = `${user.first_name?.[0] || user.username[0]}${
    user.last_name?.[0] || ""
  }`.toUpperCase();
  return (
    <aside className="profile-account-column" aria-label="Your account">
      <section
        className="profile-account-card profile-layout-left"
        aria-labelledby="account-heading"
      >
        <div className="profile-identity">
          <span className="profile-avatar">{initials}</span>
          <h2 id="account-heading">{authorName(user)}</h2>
          <p>@{user.username}</p>
          {!!user.roles?.length && (
            <div className="profile-role-list" aria-label="Your roles">
              {user.roles.map((role) => (
                <span key={role.id}>{role.name.replaceAll("_", " ")}</span>
              ))}
            </div>
          )}
        </div>
        <dl className="profile-account-details">
          <div>
            <dt>First name</dt>
            <dd>{user.first_name || "Not provided"}</dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd>{user.last_name || "Not provided"}</dd>
          </div>
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>Example email</dt>
            <dd>{user.username}@example.com</dd>
          </div>
        </dl>
        <p className="profile-account-note">
          This is a fictional example account. Changes are saved in this browser.
        </p>
        <a className="btn btn-outline-secondary w-100" href="/auth/logout">
          Leave example account <Icon name="arrow" size={16} />
        </a>
        <Link className="btn btn-outline-secondary w-100 mt-2" href="/">
          Switch example account
        </Link>
        <button
          type="button"
          className="btn btn-outline-secondary w-100 mt-2"
          onClick={() => {
            if (window.confirm("Reset all sample petitions, signatures, and drafts in this browser?")) {
              resetDemoData();
              window.location.reload();
            }
          }}
        >
          Reset sample data
        </button>
      </section>
      {(!!user.committees?.length ||
        user.roles?.some(
          (role) => role.name.toLowerCase() === "committee_member"
        )) && (
        <section
          className="profile-committees-card"
          id="my-committees"
          aria-labelledby="profile-committees-heading"
        >
          <span className="eyebrow">YOUR CAMPUS WORK</span>
          <h2 id="profile-committees-heading">My committees</h2>
          <ul>
            {user.committees?.map((committee) => (
              <li key={committee.id}>
                <Icon name="people" size={17} />
                <span>{committee.name}</span>
              </li>
            ))}
          </ul>
          {!user.committees?.length && (
            <p className="profile-account-note">
              No committee memberships are listed for your account.
            </p>
          )}
          <Link href="/committees">
            Explore committee work <Icon name="right" size={15} />
          </Link>
        </section>
      )}
    </aside>
  );
}

function OwnedPetitions({
  user,
  page,
  filter,
  selected,
  navigate,
}: {
  user: UserProfile;
  page: number;
  filter: Filter;
  selected: string | null;
  navigate: (values: {
    page?: number;
    filter?: Filter;
    petition?: number | null;
  }) => void;
}) {
  const [state, setState] = useState<Results>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getOwnPetitions(page, filter, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "ready", data });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "We couldn’t load your petitions.",
            expired: error instanceof DemoError && error.status === 401,
          });
      });
    return () => controller.abort();
  }, [page, filter, user.username, attempt]);

  const refresh = () => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  };
  const updatePetition = useCallback(
    (petition: Petition) =>
      setState((previous) =>
        previous.status === "ready"
          ? {
              ...previous,
              data: {
                ...previous.data,
                petitions: previous.data.petitions.map((item) =>
                  item.id === petition.id ? petition : item
                ),
              },
            }
          : previous
      ),
    []
  );
  const updateCount = useCallback(
    (id: number, count: number) =>
      setState((previous) =>
        previous.status === "ready"
          ? {
              ...previous,
              data: {
                ...previous.data,
                petitions: previous.data.petitions.map((item) =>
                  item.id === id ? { ...item, total_signatures: count } : item
                ),
              },
            }
          : previous
      ),
    []
  );
  const selectedId =
    selected && validPetitionId(selected) ? Number(selected) : null;
  const back = new URLSearchParams();
  if (filter !== "all") back.set("filter", filter);
  if (page > 1) back.set("page", String(page));
  const returnPath = `/profile${back.size ? `?${back}` : ""}`;
  const href = (petition: Petition) =>
    petition.is_draft
      ? `/create?draft=${petition.id}&from=${encodeURIComponent(returnPath)}`
      : `${returnPath}${back.size ? "&" : "?"}petition=${petition.id}`;

  return (
    <section
      className="profile-petitions-panel"
      aria-labelledby="my-petitions-heading"
      aria-busy={state.status === "loading"}
    >
      <div className="profile-petitions-heading">
        <div>
          <span className="eyebrow">IDEAS YOU’VE STARTED</span>
          <h2 id="my-petitions-heading">My PawPrints</h2>
          <p>Pick up a draft or follow the petitions you’ve shared.</p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          disabled={state.status === "loading"}
          onClick={refresh}
        >
          <Icon name="refresh" size={15} />
          Refresh
        </button>
      </div>
      <div className="profile-petitions-toolbar">
        <div
          className="profile-filters"
          role="group"
          aria-label="Filter your petitions"
        >
          {(
            [
              ["all", "All"],
              ["published", "Published"],
              ["drafts", "Drafts"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              aria-pressed={filter === value}
              key={value}
              onClick={() =>
                navigate({ filter: value, page: 1, petition: null })
              }
            >
              {label}
            </button>
          ))}
        </div>
        <p role="status">
          {state.status === "ready"
            ? `${state.data.page_info.total_items.toLocaleString()} ${
                filter === "drafts"
                  ? state.data.page_info.total_items === 1
                    ? "draft"
                    : "drafts"
                  : state.data.page_info.total_items === 1
                  ? "petition"
                  : "petitions"
              }`
            : state.status === "loading"
            ? "Loading your ideas…"
            : "Unable to load"}
        </p>
      </div>
      {state.status === "loading" && (
        <div className="profile-list-state" role="status">
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />{" "}
          Loading your petitions…
        </div>
      )}
      {state.status === "error" && (
        <div className="profile-list-state" role="alert">
          <h3>Let’s try that again.</h3>
          <p>{state.message}</p>
          {state.expired ? (
            <Link
              className="btn btn-primary"
              href={`/?next=${encodeURIComponent(returnPath)}`}
            >
              Sign in again <Icon name="right" />
            </Link>
          ) : (
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={refresh}
            >
              Try again
            </button>
          )}
        </div>
      )}
      {state.status === "ready" && (
        <>
          {state.data.petitions.length ? (
            <div
              className="profile-table-scroll"
              role="region"
              aria-label="Your petition details"
              tabIndex={0}
            >
              <table className="profile-petition-table">
                <caption className="visually-hidden">
                  Your {filter === "all" ? "draft and published" : filter}{" "}
                  petitions
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Petition</th>
                    <th scope="col">Created</th>
                    <th scope="col">Expires</th>
                    <th scope="col">Signatures</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.petitions.map((petition) => (
                    <tr key={petition.id}>
                      <th scope="row">
                        <div className="profile-petition-state">
                          <span
                            className={
                              petition.is_draft
                                ? "profile-draft-badge"
                                : "profile-published-badge"
                            }
                          >
                            {petition.is_draft ? "Draft" : "Published"}
                          </span>
                          {!petition.is_draft && (
                            <span
                              className={`status-badge status-${petition.status}`}
                            >
                              {petition.status === null
                                ? "Unknown status"
                                : PETITION_STATUSES[petition.status] ||
                                  "Unknown status"}
                            </span>
                          )}
                        </div>
                        <Link
                          className="profile-petition-title"
                          href={href(petition)}
                        >
                          {petition.title.replace(/&amp;/g, "&")}
                        </Link>
                        {!!petition.tags?.length && (
                          <div className="petition-tags">
                            {petition.tags.map((tag) => (
                              <PetitionTag key={tag.id} tag={tag} />
                            ))}
                          </div>
                        )}
                      </th>
                      <td>{formatDate(petition.created_at)}</td>
                      <td>
                        <span
                          title={
                            petition.is_draft
                              ? "The expiry date resets when this draft is published."
                              : undefined
                          }
                        >
                          {formatDate(petition.expires)}
                        </span>
                      </td>
                      <td>
                        <span className="profile-signatures">
                          {(petition.total_signatures || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="btn btn-outline-secondary btn-sm profile-petition-action"
                          href={href(petition)}
                          aria-label={`${
                            petition.is_draft ? "Edit draft" : "View details"
                          }: ${petition.title}`}
                        >
                          {petition.is_draft ? "Edit draft" : "View details"}
                          <Icon
                            name={petition.is_draft ? "write" : "right"}
                            size={14}
                          />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="profile-list-state profile-empty">
              <span className="empty-icon">
                <Icon name={filter === "drafts" ? "write" : "grid"} size={28} />
              </span>
              <h3>
                {page > 1
                  ? "No petitions on this page."
                  : filter === "drafts"
                  ? "Your next idea starts here."
                  : filter === "published"
                  ? "No published petitions yet."
                  : "Your first idea is waiting."}
              </h3>
              <p>
                {page > 1
                  ? "Return to the first page to find your petitions."
                  : filter === "drafts"
                  ? "Save a draft when inspiration strikes, and come back when you’re ready."
                  : filter === "published"
                  ? "Keep working on a draft, or start something new for your campus."
                  : "Create a petition to share a change you’d like to see at RIT."}
              </p>
              {page > 1 ? (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => navigate({ page: 1, petition: null })}
                >
                  Go to first page
                </button>
              ) : (
                <Link className="btn btn-primary" href="/create">
                  Create a petition <Icon name="plus" size={16} />
                </Link>
              )}
            </div>
          )}
          {state.data.page_info.total_items > 0 && (
            <div className="profile-pagination">
              <p>
                {state.data.petitions.length
                  ? `Showing ${(page - 1) * 10 + 1}–${
                      (page - 1) * 10 + state.data.petitions.length
                    } of ${state.data.page_info.total_items}`
                  : `${state.data.page_info.total_items} results`}
              </p>
              <nav
                className="petition-pagination"
                aria-label="Your petition pages"
              >
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => navigate({ page: page - 1, petition: null })}
                >
                  Previous
                </button>
                <span role="status">
                  Page {page} of {state.data.page_info.total_pages}
                </span>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  disabled={page >= state.data.page_info.total_pages}
                  onClick={() => navigate({ page: page + 1, petition: null })}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      {selected !== null && !selectedId && (
        <div className="alert alert-warning m-3" role="alert">
          This petition link is invalid.{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => navigate({ petition: null })}
          >
            Dismiss
          </button>
        </div>
      )}
      {selectedId && (
        <PetitionDialog
          id={selectedId}
          onClose={() => navigate({ petition: null })}
          onCountChange={updateCount}
          onPetitionChange={updatePetition}
        />
      )}
    </section>
  );
}

export default function ProfileScreen() {
  const { user, loading, error, retry } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const rawFilter = params.get("filter");
  const filter: Filter =
    rawFilter === "published" || rawFilter === "drafts" ? rawFilter : "all";
  const page = parsePage(params.get("page"));
  const selected = params.get("petition");
  const navigate = useCallback(
    (values: { page?: number; filter?: Filter; petition?: number | null }) => {
      const next = new URLSearchParams(window.location.search);
      if (values.filter !== undefined) {
        if (values.filter === "all") next.delete("filter");
        else next.set("filter", values.filter);
      }
      if (values.page !== undefined) {
        if (values.page === 1) next.delete("page");
        else next.set("page", String(values.page));
      }
      if (values.petition !== undefined) {
        if (values.petition === null) next.delete("petition");
        else next.set("petition", String(values.petition));
      }
      router.push(`/profile${next.size ? `?${next}` : ""}`, {
        scroll: values.petition === undefined,
      });
    },
    [router]
  );
  return (
    <>
      <main id="main-content" tabIndex={-1} className="workspace-page profile-page profile-page-outer">
        <header className="profile-page-heading">
          <div>
            <span className="eyebrow">YOUR VOICE. YOUR IDEAS.</span>
            <h1>My profile</h1>
            <p>Your corner of Pawprints. Keep your next idea moving.</p>
          </div>
          {user && (
            <Link className="btn btn-primary" href="/create">
              <Icon name="plus" size={18} />
              Create a petition
            </Link>
          )}
        </header>
        {loading ? (
          <section className="profile-gate" role="status">
            Checking your account…
          </section>
        ) : user ? (
          <div className="profile-layout">
            <AccountCard user={user} />
            <OwnedPetitions
              key={`${user.username}:${filter}:${page}`}
              user={user}
              page={page}
              filter={filter}
              selected={selected}
              navigate={navigate}
            />
          </div>
        ) : (
          <section className="profile-gate">
            <span className="empty-icon">
              <Icon name="people" size={28} />
            </span>
            <h2>
              {error
                ? "We couldn’t check your account."
                : "Your ideas have a home here."}
            </h2>
            <p>
              {error
                ? "Check your connection and try again to load your profile."
                : "Choose an example account to see its sample petitions and continue saved drafts."}
            </p>
            {error ? (
              <button className="btn btn-primary" onClick={retry}>
                Try again
              </button>
            ) : (
              <Link
                className="btn btn-primary"
                href={`/?next=${encodeURIComponent(
                  `/profile${params.size ? `?${params}` : ""}`
                )}`}
              >
                Choose an example account <Icon name="right" />
              </Link>
            )}
          </section>
        )}
      </main>
    </>
  );
}
