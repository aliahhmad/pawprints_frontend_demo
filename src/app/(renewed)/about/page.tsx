import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/icon";
import { AboutIllustration } from "@/components/community-illustrations";
import { SIGNATURE_GOAL } from "@/lib/petitions";

export const metadata: Metadata = {
  title: "About Pawprints",
  description:
    "Learn how Pawprints connects student ideas with RIT Student Government, explore its history, and read the moderation policy.",
};

export default function AboutPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1} className="workspace-page community-page">
        <section className="community-hero" aria-labelledby="about-heading">
          <div className="community-hero-copy">
            <span className="eyebrow">ABOUT PAWPRINTS</span>
            <h1 id="about-heading">
              Small ideas.
              <br />
              <span>Shared possibilities.</span>
            </h1>
            <p>
              A better campus starts with the people who call it home. Pawprints
              gives your ideas a place to grow, gather support, and reach RIT
              Student Government.
            </p>
            <div className="community-hero-actions">
              <Link className="btn btn-primary" href="/petitions">
                Find your cause <Icon name="right" />
              </Link>
              <a className="community-text-link" href="#how-it-works">
                See how it works <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="community-hero-art">
            <AboutIllustration />
          </div>
        </section>

        <section
          className="community-section"
          id="how-it-works"
          aria-labelledby="how-heading"
        >
          <div className="community-section-heading">
            <div>
              <span className="eyebrow">FROM AN IDEA TO A CONVERSATION</span>
              <h2 id="how-heading">Make your voice part of the change.</h2>
            </div>
            <p>A few thoughtful words can bring a community together.</p>
          </div>
          <div className="about-steps">
            <article>
              <span className="about-step-icon">
                <Icon name="search" size={27} />
              </span>
              <span className="eyebrow">01 / DISCOVER</span>
              <h3>Start with what matters.</h3>
              <p>
                Search before you write. If someone has already raised your
                idea, add your signature to that petition and help build support
                in one place.
              </p>
              <Link href="/petitions">
                Explore petitions <Icon name="right" size={15} />
              </Link>
            </article>
            <article>
              <span className="about-step-icon">
                <Icon name="write" size={27} />
              </span>
              <span className="eyebrow">02 / PUT IT INTO WORDS</span>
              <h3>Make a clear case.</h3>
              <p>
                Explain the change you want and why it would help RIT. Use clear
                spelling and grammar so others can find it, and read the{" "}
                <a href="#moderation-policy">moderation policy</a> before
                publishing.
              </p>
              <Link href="/create">
                Create a petition <Icon name="right" size={15} />
              </Link>
            </article>
            <article>
              <span className="about-step-icon">
                <Icon name="people" size={27} />
              </span>
              <span className="eyebrow">03 / BRING PEOPLE WITH YOU</span>
              <h3>Let the idea travel.</h3>
              <p>
                Share your petition with classmates, friends, and your
                communities. Follow its progress and read updates and official
                responses from Student Government.
              </p>
              <Link href="/committees">
                Meet the committees <Icon name="right" size={15} />
              </Link>
            </article>
          </div>
          <div className="about-milestone">
            <div className="about-milestone-number">
              <strong>{SIGNATURE_GOAL}</strong>
              <span>signatures</span>
            </div>
            <div>
              <h3>A shared support milestone.</h3>
              <p>
                Pawprints tracks progress toward {SIGNATURE_GOAL} signatures.
                Student Government can respond before that milestone; reaching
                it does not promise an immediate response.
              </p>
            </div>
            <div className="about-expiry-note">
              <strong>Keep an eye on the dates.</strong>
              <p>
                Each petition shows its expiry date. Expired petitions can still
                be found through search.
              </p>
            </div>
          </div>
        </section>

        <section
          className="community-section about-history"
          aria-labelledby="history-heading"
        >
          <div className="about-history-intro">
            <span className="eyebrow">STUDENT-LED, FROM THE START</span>
            <h2 id="history-heading">
              Built by students.
              <br />
              For the next idea.
            </h2>
            <p>
              Pawprints began with a simple ambition: give the RIT community a
              place to raise important issues and make student voices easier to
              hear.
            </p>
            <a
              className="community-text-link"
              href="https://github.com/ritstudentgovernment/PawPrints"
            >
              Explore the open-source project <Icon name="arrow" size={16} />
            </a>
          </div>
          <ol className="about-history-timeline">
            <li>
              <span className="eyebrow">2014–2015 / THE FIRST STEP</span>
              <h3>A new space for student voices.</h3>
              <p>
                Student Government President Ashley Carrington and Vice
                President Tyler Pierce set out to improve student engagement
                through a petition site, creating a place for the RIT community
                to discuss important issues.
              </p>
            </li>
            <li>
              <span className="eyebrow">A DECADE LATER / BUILDING AGAIN</span>
              <h3>A stronger foundation.</h3>
              <p>
                Director of Technology Services Luke McEwen began a complete
                rebuild to improve stability and make Pawprints easier to extend
                with new features.
              </p>
            </li>
            <li>
              <span className="eyebrow">2026 / ROOM TO GROW</span>
              <h3>Keeping the conversation going.</h3>
              <p>
                Director of Technology Services Alexander Kilroy completed that
                rebuild, laying the groundwork for the platform’s next chapter.
              </p>
            </li>
          </ol>
        </section>

        <section
          className="community-section about-policy"
          id="moderation-policy"
          aria-labelledby="policy-heading"
        >
          <div className="community-section-heading">
            <div>
              <span className="eyebrow">A THOUGHTFUL COMMUNITY</span>
              <h2 id="policy-heading">Moderation policy</h2>
            </div>
            <p>
              Make room for a constructive conversation. Exercise good judgment
              and treat the people behind every idea with respect.
            </p>
          </div>
          <div className="about-policy-grid">
            <article>
              <span className="about-policy-index">01</span>
              <h3>Follow RIT’s code.</h3>
              <p>
                Use of Pawprints falls under the{" "}
                <a href="https://www.rit.edu/computerconduct/">
                  RIT Code of Conduct for Computer and Network Use
                </a>
                .
              </p>
            </article>
            <article>
              <span className="about-policy-index">02</span>
              <h3>Keep the space respectful.</h3>
              <p>
                Do not create an intimidating, hostile, or abusive environment.
                Obscene, defamatory, threatening, and harassing petitions
                violate the expectations of this community.
              </p>
            </article>
            <article>
              <span className="about-policy-index">03</span>
              <h3>One person. One signature.</h3>
              <p>
                Sign using only your primary RIT account. Having access to
                multiple accounts does not mean you may sign the same petition
                more than once.
              </p>
            </article>
            <article>
              <span className="about-policy-index">04</span>
              <h3>Understand moderation.</h3>
              <p>
                Student Government reserves the right to edit or remove
                petitions that violate the Code of Conduct. The examples here
                are not an exhaustive list of violations.
              </p>
            </article>
          </div>
        </section>

        <section
          className="community-invitation"
          aria-labelledby="about-invitation-heading"
        >
          <div>
            <span className="eyebrow">YOUR VOICE. OUR CAMPUS.</span>
            <h2 id="about-invitation-heading">What would you change?</h2>
            <p>
              Find an idea you believe in, or give your own a place to start.
            </p>
          </div>
          <Link className="btn btn-primary" href="/petitions">
            Browse petitions <Icon name="right" />
          </Link>
        </section>
      </main>
    </>
  );
}
