"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth, useClientHydrated } from "@/components/auth-provider";
import Icon from "@/components/icon";

export default function SiteHeader() {
  const segment = useSelectedLayoutSegment();
  return <HeaderContent segment={segment} />;
}

export function HeaderFallback() {
  return <HeaderContent segment="loading" />;
}

function HeaderContent({ segment }: { segment: string | null }) {
  const menuId = useId();
  const { user, loading } = useAuth();
  const hydrated = useClientHydrated();
  const pathname = segment ? `/${segment}` : "/";
  const activePathname = hydrated ? pathname : "";
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const expanded = expandedRoute === pathname;
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const resize = () =>
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${element.getBoundingClientRect().height}px`
      );
    const observer = new ResizeObserver(resize);
    resize();
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const name = user?.first_name || user?.username;
  const initials = user
    ? `${user.first_name?.[0] || user.username[0]}${
        user.last_name?.[0] || ""
      }`.toUpperCase()
    : "";

  return (
    <header className="site-header" ref={header}>
      <nav className="header-inner" aria-label="Main navigation">
        <div className="header-identity">
          <Link
            className="brand"
            href="/"
            aria-label="Pawprints home — RIT Student Government"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brand-lockup"
              src="/branding/pawprints-rit-lockup.svg"
              width="236"
              height="56"
              alt=""
            />
          </Link>
          <span className="demo-label">Local demo</span>
        </div>
        <button
          className="btn btn-outline-secondary menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={expanded}
          aria-controls={menuId}
          onClick={() => setExpandedRoute(expanded ? null : pathname)}
        >
          <Icon name="menu" />
        </button>
        <div
          className={`header-links ${expanded ? "is-open" : ""}`}
          id={menuId}
          onClick={() => setExpandedRoute(null)}
        >
          <Link
            href="/petitions"
            className={activePathname === "/petitions" ? "nav-current" : ""}
            aria-current={
              activePathname === "/petitions" ? "page" : undefined
            }
          >
            Browse petitions
          </Link>
          <Link
            href="/about"
            className={activePathname === "/about" ? "nav-current" : ""}
            aria-current={activePathname === "/about" ? "page" : undefined}
          >
            About
          </Link>
          <Link
            href="/committees"
            className={
              activePathname === "/committees" ? "nav-current" : ""
            }
            aria-current={
              activePathname === "/committees" ? "page" : undefined
            }
          >
            Committees
          </Link>
          <a
            href="https://www.rit.edu/studentgovernment/"
            className="sg-header-link"
          >
            Student Government <Icon name="arrow" size={13} />
          </a>
          <div className="header-account">
            {user ? (
              <>
                <Link
                  className="account-link"
                  href="/profile"
                  aria-current={
                    activePathname === "/profile" ? "page" : undefined
                  }
                  aria-label={`My profile: ${name}`}
                >
                  <span className="avatar">{initials}</span>
                  <span>{name}</span>
                </Link>
                <a
                  className="btn btn-outline-secondary btn-sm"
                  href="/auth/logout"
                >
                  Sign out
                </a>
              </>
            ) : loading ? (
              <span className="small text-secondary" role="status">
                Checking session…
              </span>
            ) : (
              <Link className="btn btn-primary btn-sm" href="/">
                Sign in <Icon name="arrow" size={15} />
              </Link>
            )}
          </div>
        </div>
      </nav>
      {segment && (
        <nav
          className="workspace-quick-nav"
          aria-label="Workspace shortcuts"
        >
          <Link
            href="/petitions"
            aria-current={
              activePathname === "/petitions" ? "page" : undefined
            }
            onClick={() => setExpandedRoute(null)}
          >
            <Icon name="grid" size={16} />
            Petitions
          </Link>
          <Link
            href="/create"
            aria-current={activePathname === "/create" ? "page" : undefined}
            onClick={() => setExpandedRoute(null)}
          >
            <Icon name="write" size={16} />
            Create a petition
          </Link>
          <Link
            href="/profile"
            aria-current={
              activePathname === "/profile" ? "page" : undefined
            }
            onClick={() => setExpandedRoute(null)}
          >
            <Icon name="people" size={16} />
            My profile
          </Link>
        </nav>
      )}
    </header>
  );
}
