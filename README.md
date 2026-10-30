# Pawprints Frontend Demo

I built Pawprints Frontend Demo as a personal project to show my team what we are capable of designing. Design was not our main focus, and I wanted to give the team a working example of the interfaces and user experiences we could create.

The project brings together a redesigned Pawprints experience and the original website for comparison. It gives the team something practical to explore, review, and discuss: layout, navigation, visual identity, responsive behavior, and complete user flows.

This is a self-contained showcase with fictional accounts and local sample data. No backend, database, institutional sign-in, or environment configuration is required.

## Run the showcase

Use Node.js 24 and npm from this folder:

```bash
npm ci --legacy-peer-deps
npm run dev -- --port 3001
```

Open [localhost:3001](http://localhost:3001) to choose an example account, or go straight to [the redesigned website](http://localhost:3001/petitions) or [the original website](http://localhost:3001/old).

## Compare the designs

The bottom **Old website / New website** toggle opens the corresponding page in the other design. Both use the same saved local data. Save form edits before switching; the toggle navigates between separate layouts.

| Original Pawprints 2 | Redesigned experience |
| --- | --- |
| `/old` | `/petitions` |
| `/old/create` | `/create` |
| `/old/profile` | `/profile` |
| `/old/about` | `/about` |
| `/old/committees` | `/committees` |
| `/old/review/:id` | `/petitions/:id` |

The original pages, components, styles, and artwork are copied from Pawprints 2 and retain their source attribution and license. The two designs have separate root layouts so their styles stay independent. See [original-source notes](src/old/README.md).

## Explore the demo

Choose **Alex Morgan · Student** or **Sam Rivera · Committee member** on the welcome page. The original website's LOGIN button opens its example-account selector at `/old/login`. Guest browsing is also available.

- Browse, search, sort, and filter sample petitions, then read their details and timelines.
- Sign or remove your signature from another student's open petition.
- Create a petition with rich text, tags, and a local image; save a draft, reopen it, and publish it into the demo.
- View your example profile, published petitions, and saved drafts.
- Use the committee account on petition #1 to explore team history and draft updates.
- Use **Reset sample data** on the redesigned profile to restore the examples.

All submissions and signatures stay local to the demo. Administrative dashboards and actions are excluded.

## Sample data

Edit [src/data/demo.json](src/data/demo.json) to change the examples. Browser changes persist on the same origin using localStorage; another browser or port has its own copy. Shared links do not transfer locally created content. If browser storage is unavailable, changes last for the open page.

See [local demo behavior](docs/LOCAL_DEMO.md) for accounts, persistence, attachments, and reset behavior.

## Documentation and checks

[Documentation index](docs/README.md) · [Development](docs/DEVELOPMENT.md) · [Architecture](docs/ARCHITECTURE.md) · [Verification](docs/VERIFICATION.md)

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start -- --port 3001
```

The project retains its [MIT license](LICENSE). The original Pawprints source attribution is preserved in [src/old/LICENSE](src/old/LICENSE).
