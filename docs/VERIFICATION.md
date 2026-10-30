# Verification

This records checks for the personal Pawprints design showcase. The latest application verification was on **October 30, 2026**, after the original site was moved to directly copied `/old` routes.

## Recorded application checks

| Check | Recorded result |
| --- | --- |
| `npm test` | 35 passing tests across five test files. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, with scoped compatibility rules for copied original source. |
| `npm run build` | Passed with both route trees. |

Tests cover local data operations, filters and pagination, example sessions, draft ownership, signatures, committee privacy, images and storage failures, safe navigation, metadata, comparison routes, and the original local adapter.

## Recorded browser checks

Both designs were exercised against a production preview, with API/SAML and external HTTP requests blocked. The runs reported no such requests and no JavaScript page errors.

- Browsing, searching, sorting/filtering, petition details, and local account selection.
- Signing and removing signatures, closed petitions, and persisted data after reload.
- Rich-text creation, image attachments, draft saving/reopening, publication, and profile lists.
- Committee draft creation, editing, deletion, and exclusion from public timelines.
- Old/new route switching with matching petitions and shared saved data.
- Original About content, committee accordions, mobile layouts at 320px/390px, and admin-route 404 behavior.
- Sample-data reset and local login/logout flows in the redesigned site.

Browser checks use local sample data. They do not exercise an external backend or institutional account. The checked-in commands are listed in [Development](DEVELOPMENT.md).

For documentation-only edits, check local links and remove stale references. The application results above are a dated record, not a claim that builds and browser tests run for each documentation edit.
