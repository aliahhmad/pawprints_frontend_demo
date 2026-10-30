# Original Pawprints 2 source

The original website is included in this personal design showcase to give the team a comparison with the redesigned experience. Its pages are mounted under `/old`.

This directory copies the non-admin pages, components, styles, UI controls, artwork, types, and helpers from `pawprints2/pawprints-frontend/src`. Original attribution is retained in [LICENSE](LICENSE), and file origins and hashes are recorded in [source-manifest.json](source-manifest.json).

## Layout and styling

The [original root layout](<../app/(original)/layout.tsx>) loads the original Tailwind/global styles, Inter font, and icons. The [redesigned root layout](<../app/(renewed)/layout.tsx>) loads Bootstrap and the redesigned styles. Navigation between layouts keeps the styles independent.

Component CSS and assets are copied byte-for-byte. The original global stylesheet removes the obsolete `@tailwind config` directive. The Tailwind theme is retained with scan paths adjusted to this directory. The Inter Latin font comes from the original project's existing local build.

## Local integration

- Link and navigation adapters prefix internal paths with `/old`.
- Calls named `fetch` import [local-fetch.ts](local-fetch.ts), which uses the shared [demo client](../lib/demo-client.ts) and performs no network requests.
- The auth adapter uses the same fictional accounts as the redesigned site. `/old/login` provides the account selector.
- Listings refresh browser-local changes after server rendering. Profile filters use the shared local collection, `/old/create?draft=ID` resumes a saved draft, and committee editing targets the selected update.
- Import namespaces, route configuration, and type annotations are adjusted for the current toolchain. Copied source retains scoped lint compatibility rules.

No admin pages or backend/S3 implementations are included. Save draft edits before using the comparison toggle; saved petitions, signatures, images, and accounts are shared on the same browser origin. See [local demo behavior](../../docs/LOCAL_DEMO.md).
