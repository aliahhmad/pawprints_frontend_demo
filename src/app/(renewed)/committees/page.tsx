import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/icon";
import {
  CommitteeSymbol,
  CommitteesIllustration,
} from "@/components/community-illustrations";
import { committeeGuide } from "@/lib/committee-guide";

export const metadata: Metadata = {
  title: "Student Government committees",
  description:
    "Explore six areas of Student Government committee work, from academics and accessibility to housing, dining, and well-being.",
};

export default function CommitteesPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1} className="workspace-page community-page">
        <section
          className="community-hero"
          aria-labelledby="committees-heading"
        >
          <div className="community-hero-copy">
            <span className="eyebrow">STUDENT GOVERNMENT COMMITTEES</span>
            <h1 id="committees-heading">
              Different perspectives.
              <br />
              <span>A shared campus.</span>
            </h1>
            <p>
              From the classroom to the places you call home, committees bring
              student concerns into conversations with the people who can help.
            </p>
            <div className="community-hero-actions">
              <a className="btn btn-primary" href="#committee-guide">
                Explore the committees <span aria-hidden="true">↓</span>
              </a>
              <Link className="community-text-link" href="/petitions">
                Browse petitions <Icon name="right" size={16} />
              </Link>
            </div>
          </div>
          <div className="community-hero-art">
            <CommitteesIllustration />
          </div>
        </section>

        <section
          className="committee-process"
          aria-labelledby="committee-process-heading"
        >
          <div className="committee-process-intro">
            <span className="eyebrow">FROM CONCERN TO CONVERSATION</span>
            <h2 id="committee-process-heading">
              Where petitions
              <br />
              meet people.
            </h2>
            <p>
              A committee assignment connects a petition to an area of Student
              Government’s work.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>An idea finds support.</h3>
                <p>
                  Students raise an issue and add their voices through
                  signatures.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>A committee takes it forward.</h3>
                <p>
                  When a petition is charged, its assigned committee can develop
                  updates with campus partners.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>The community follows along.</h3>
                <p>
                  Read published updates and official responses on the petition
                  itself.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section
          className="community-section committee-directory"
          id="committee-guide"
          aria-labelledby="directory-heading"
        >
          <div className="community-section-heading">
            <div>
              <span className="eyebrow">FIND THE AREA THAT FITS</span>
              <h2 id="directory-heading">Six areas. Everyday impact.</h2>
            </div>
            <p>
              Explore each committee’s focus and examples of the work described
              in the Pawprints committee guide.
            </p>
          </div>
          <div className="committee-guide-list">
            {committeeGuide.map((committee, index) => (
              <details
                className={`committee-guide-item committee-${committee.id}`}
                id={committee.id}
                name="committee-guide"
                key={committee.id}
              >
                <summary>
                  <h3>
                    <span className="committee-symbol">
                      <CommitteeSymbol kind={committee.id} />
                    </span>
                    <span className="committee-summary-text">
                      <span className="committee-guide-name">
                        {committee.name}
                      </span>
                      <span className="committee-guide-focus">
                        {committee.focus}
                      </span>
                    </span>
                    <span className="committee-guide-index">0{index + 1}</span>
                    <span className="committee-expand">
                      <Icon name="plus" size={20} />
                    </span>
                  </h3>
                </summary>
                <div className="committee-guide-body">
                  <p>{committee.description}</p>
                  {committee.sections.map((section, sectionIndex) => (
                    <div
                      className="committee-guide-section"
                      key={section.title || sectionIndex}
                    >
                      {section.title && <h4>{section.title}</h4>}
                      {section.description && <p>{section.description}</p>}
                      {!section.title && <h4>Examples of work</h4>}
                      <ul>
                        {section.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <p className="committee-directory-note">
            Looking for current contacts, meeting details, or ways to get
            involved?{" "}
            <a href="https://www.rit.edu/studentgovernment/">
              Visit RIT Student Government <Icon name="arrow" size={14} />
            </a>
          </p>
        </section>

        <section
          className="community-invitation"
          aria-labelledby="committee-invitation-heading"
        >
          <div>
            <span className="eyebrow">START WITH WHAT MATTERS TO YOU</span>
            <h2 id="committee-invitation-heading">Bring your perspective.</h2>
            <p>Support an existing idea, or start a petition of your own.</p>
          </div>
          <div className="community-invitation-actions">
            <Link className="btn btn-primary" href="/create">
              Create a petition <Icon name="right" />
            </Link>
            <Link className="community-text-link" href="/about">
              How Pawprints works
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
