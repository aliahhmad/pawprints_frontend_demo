"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useId } from "react";
import { useAuth, useClientHydrated } from "@/components/auth-provider";
import Icon from "@/components/icon";

function WorkspaceSidebar({ segment }: { segment: string }) {
  const { user } = useAuth();
  const hydrated = useClientHydrated();
  const headingPrefix = useId();
  const committee = user?.roles?.some(
    (role) => role.name.toLowerCase() === "committee_member"
  );
  const current = (target: string) => hydrated && segment === target;

  return (
    <aside className="workspace-sidebar" aria-label="Workspace navigation">
      <div className="sidebar-sections">
        <section
          className="sidebar-section"
          aria-labelledby={`${headingPrefix}-campus`}
        >
          <h2
            className="eyebrow sidebar-eyebrow"
            id={`${headingPrefix}-campus`}
          >
            YOUR CAMPUS
          </h2>
          <nav aria-label="Campus">
            <Link
              className={`sidebar-link ${current("petitions") ? "active" : ""}`}
              href="/petitions"
              aria-current={current("petitions") ? "page" : undefined}
            >
              <Icon name="grid" size={17} />
              Petitions
              {current("petitions") && <span className="sidebar-current-dot" />}
            </Link>
            <Link
              className={`sidebar-link ${current("create") ? "active" : ""}`}
              href="/create"
              aria-current={current("create") ? "page" : undefined}
            >
              <Icon name="write" size={17} />
              Create a petition
              {current("create") && <span className="sidebar-current-dot" />}
            </Link>
          </nav>
        </section>
        <section
          className="sidebar-section"
          aria-labelledby={`${headingPrefix}-account`}
        >
          <h2
            className="eyebrow sidebar-eyebrow"
            id={`${headingPrefix}-account`}
          >
            MY ACCOUNT
          </h2>
          <nav aria-label="Account">
            <Link
              className={`sidebar-link ${current("profile") ? "active" : ""}`}
              href="/profile"
              aria-current={current("profile") ? "page" : undefined}
            >
              <Icon name="people" size={17} />
              My profile
              {current("profile") && <span className="sidebar-current-dot" />}
            </Link>
          </nav>
        </section>
        {committee && (
          <section
            className="sidebar-section"
            aria-labelledby={`${headingPrefix}-committee`}
          >
            <h2
              className="eyebrow sidebar-eyebrow"
              id={`${headingPrefix}-committee`}
            >
              COMMITTEE WORK
            </h2>
            <nav aria-label="Committee workspace">
              <Link className="sidebar-link" href="/profile#my-committees">
                <Icon name="check" size={17} />
                My committee
              </Link>
            </nav>
          </section>
        )}
      </div>
      <div className="sidebar-note">
        <span className="accent-dot" />
        <strong>
          Small ideas.
          <br />
          Shared possibilities.
        </strong>
        <p>A campus shaped by the people who call it home.</p>
        <a href="https://www.rit.edu/studentgovernment/">
          RIT Student Government
          <Icon name="arrow" size={13} />
        </a>
      </div>
    </aside>
  );
}

export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  if (!segment) return children;
  return <WorkspaceFrame segment={segment}>{children}</WorkspaceFrame>;
}

export function WorkspaceLoading() {
  return (
    <WorkspaceFrame segment="loading">
      <main id="main-content" className="page-loading" role="status">
        Loading your workspace…
      </main>
    </WorkspaceFrame>
  );
}

function WorkspaceFrame({
  segment,
  children,
}: {
  segment: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace">
      <WorkspaceSidebar segment={segment} />
      <div className="workspace-content">{children}</div>
    </div>
  );
}
