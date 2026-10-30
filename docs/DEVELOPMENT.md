# Developing the showcase

Work from `pawprints_frontend_demo`. This is the self-contained personal design showcase described in the [project README](../README.md).

## Local setup

Use Node.js 24 and npm:

```bash
npm ci --legacy-peer-deps
npm run dev -- --port 3001
```

Open [the welcome page](http://localhost:3001), [the redesigned listing](http://localhost:3001/petitions), or [the original site](http://localhost:3001/old). Both sites run on the same server.

No environment variables are required. [.env.example](../.env.example) documents this; a backend or RIT account is not needed.

## Making changes

- Edit redesigned routes in [src/app/(renewed)](<../src/app/(renewed)>) and their components in [src/components](../src/components).
- Original route wrappers live in [src/app/(original)](<../src/app/(original)>). Keep original presentation changes separate from the redesigned styles.
- Change example content in [src/data/demo.json](../src/data/demo.json). Reset sample data in the browser to see revised fixtures, or increment the file's `version` to replace older saved snapshots.
- Keep behavior shared through [demo-client.ts](../src/lib/demo-client.ts) and the [original local adapter](../src/old/local-fetch.ts).

The original site retains its own UI dependencies and Tailwind configuration. The copied source has scoped lint compatibility rules; those rules do not apply to redesigned or shared code.

## Checks and production preview

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start -- --port 3001
```

Run checks appropriate to the change. See [Verification](VERIFICATION.md) for recorded results and browser scenarios. Documentation-only changes need link and content checks.

## Common questions

- **My sample edits are missing:** browser storage is specific to the origin. Use the same hostname and port for both designs.
- **Fixture changes do not appear:** reset sample data on the redesigned profile; production also needs a rebuild.
- **An edit disappeared after switching websites:** save it as a draft before using the comparison toggle.
- **An image cannot be saved:** use a PNG, JPEG, WebP, or GIF under 1 MB. Browser storage also has a total size limit.
- **Someone cannot open my new petition on another browser:** locally created content is stored only in your browser. Put shared presentation examples in the JSON file.
