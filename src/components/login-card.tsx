"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { demoAccounts, signInDemo } from "@/lib/demo-client";
import { useAuth } from "@/components/auth-provider";
import Icon from "@/components/icon";
import { HomeIllustration } from "@/components/community-illustrations";
import { safeReturnPath } from "@/lib/petitions";

export default function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, retry, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountChoice, setAccountChoice] = useState<string | null>(null);
  const selectedAccount = accountChoice ?? user?.username ?? demoAccounts[0].username;
  const next = safeReturnPath(params.get("next"));

  useEffect(() => {
    // Keep existing shared petition links working in the demo.
    if (params.has("petition")) {
      router.replace(`/petitions?${params.toString()}`);
      return;
    }
    if (
      params.has("login_error") ||
      params.has("non_student") ||
      params.has("session")
    ) {
      const clean = new URLSearchParams(params.toString());
      ["login_error", "non_student", "session"].forEach((key) =>
        clean.delete(key),
      );
      router.replace(clean.size ? `/?${clean}` : "/", { scroll: false });
    }
  }, [params, router]);

  async function signIn() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      signInDemo(selectedAccount);
      retry();
      router.push(next);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <section className="auth-frame" aria-labelledby="login-heading">
      <div className="auth-story">
        <span className="eyebrow">PAWPRINTS / RIT STUDENT GOVERNMENT</span>
        <div className="auth-story-message">
          <div className="auth-story-art">
            <HomeIllustration />
          </div>
          <h2>
            A small idea.
            <br />A better campus.
          </h2>
          <p>
            The next change at RIT could start with you.
            <br />
            Make your voice part of it.
          </p>
        </div>
        <div className="story-community">
          <span className="accent-dot" /> By students. For our campus.
        </div>
      </div>
      <div className="auth-content">
        <span className="eyebrow">YOUR VOICE BELONGS HERE</span>
        <h1 id="login-heading">Make your mark.</h1>
        <p className="auth-intro">
          One campus. Plenty of possibilities.
          <br />
          Sign in to help shape what comes next.
        </p>
        <div className="auth-benefits">
          <div>
            <span className="benefit-icon">
              <Icon name="write" />
            </span>
            <div>
              <strong>Start a conversation</strong>
              <p>Bring an idea for a better RIT to the community.</p>
            </div>
          </div>
          <div>
            <span className="benefit-icon">
              <Icon name="people" />
            </span>
            <div>
              <strong>Stand behind an idea</strong>
              <p>Add your signature to the changes you care about.</p>
            </div>
          </div>
          <div>
            <span className="benefit-icon">
              <Icon name="check" />
            </span>
            <div>
              <strong>Follow the progress</strong>
              <p>Read updates and official responses from SG.</p>
            </div>
          </div>
        </div>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}{" "}
            <a href="https://www.rit.edu/studentgovernment/">Contact SG</a>
          </div>
        )}
        <label className="demo-account-label" htmlFor="demo-account">Example account</label>
        <select
          id="demo-account"
          className="form-select mb-3"
          value={selectedAccount}
          onChange={(event) => setAccountChoice(event.target.value)}
          disabled={pending || loading}
        >
          {demoAccounts.map((account) => (
            <option key={account.username} value={account.username}>
              {account.first_name} {account.last_name} · {account.roles?.some(role => role.name === "committee_member") ? "Committee member" : "Student"}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary auth-submit"
          onClick={signIn}
          disabled={pending || loading}
        >
          {pending ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />{" "}
              Opening your example account…
            </>
          ) : (
            <>
              {user?.username === selectedAccount
                ? `Continue as ${user.first_name || user.username}`
                : "Try this example account"}
              <Icon name="right" />
            </>
          )}
        </button>
        {pending && (
          <p className="visually-hidden" role="status">
            Opening the demo. Please wait.
          </p>
        )}
        <p className="sso-note">
          Fictional accounts and sample data. No RIT sign-in or backend is needed.
        </p>
        <div className="auth-browse">
          <span>Just looking around?</span>
          <Link href="/petitions">
            Browse petitions <Icon name="right" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
