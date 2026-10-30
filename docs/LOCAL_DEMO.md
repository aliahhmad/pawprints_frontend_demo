# Local demo behavior

The personal showcase uses fictional examples so the team can explore the designs and working flows without connecting any services.

## Example accounts

| Account | What to try |
| --- | --- |
| Alex Morgan · Student | Create petitions, save drafts, view a profile, and sign other students' open petitions. |
| Sam Rivera · Committee member | Explore committee history and create, edit, or delete draft updates on petition #1. |
| Guest | Browse and read public petitions and timelines. |

Use the redesigned welcome page or `/old/login` to choose an account. Leaving an example account returns to guest browsing. Administrative tools are excluded.

## Sample file

[demo.json](../src/data/demo.json) contains the shared starting content:

| Field | Purpose |
| --- | --- |
| `version` | Increment to replace older saved browser snapshots. |
| `accounts` | Selectable fictional accounts. |
| `petitions` | Public examples and owned unpublished drafts, including descriptions and assignments. |
| `timelines` | Published updates, sample responses, and committee drafts keyed by petition ID. |
| `tags`, `committees` | Sample catalogs and assignments. |
| `signatures` | Initially signed petition IDs by username, already included in petition totals. |
| `notice` | The example SG notice. |

The current file has 28 public petitions and three unpublished petition drafts. The redesigned listing uses 20-item pages; the original site retains its 40-item/infinite-scroll behavior. Petition #1 includes committee history and an editable draft.

## Saved browser changes

[demo-client.ts](../src/lib/demo-client.ts) stores changes under `pawprints-frontend-demo:v1` in localStorage. Both route trees share that data on the same browser origin. Signatures, saved petitions, drafts, selected accounts, and attachments survive reloads.

Changes stay in that browser and origin. Different hostnames, ports, or browsers have separate copies. Shared links preserve the destination but do not transfer local edits. If storage is disabled, the demo keeps changes in memory until a full page reload.

The comparison toggle navigates between matching routes. Save form changes before switching websites. The URL determines which design opens after reload.

## Editing and attachments

Publishing adds the author's signature and puts the petition in the local listing. Users can edit their own unpublished drafts. Committee update drafts remain outside the public timeline, and published updates stay unchanged.

Raster attachments are embedded as data URLs. PNG, JPEG, WebP, and GIF files up to 1 MB are accepted. A full-storage failure leaves the previously saved state intact. Server share metadata uses bundled public examples; browser-created petitions receive generic metadata.

## Resetting the examples

Use **Reset sample data** on the redesigned profile to restore the JSON examples. This resets local petitions, signatures, and drafts while retaining the selected example account.

After changing the JSON file, reset existing browser data to load the new content. Incrementing the file's `version` also replaces older snapshots. Production needs a rebuild to include changed fixtures.

The original components use [local-fetch.ts](../src/old/local-fetch.ts) as their local-data adapter. It performs no network IO. See [Architecture](ARCHITECTURE.md) and [original-source notes](../src/old/README.md) for the implementation.
