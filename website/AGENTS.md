# Website

The black-atom.industries site: a TanStack Start app that reads theme data from `@black-atom/core`.
Product structure, routes and the reasons behind them live in [`docs/website.md`](../docs/website.md).

Repo-wide instructions live in [`AGENTS.md`](../AGENTS.md); every term is defined in
[`GLOSSARY.md`](../GLOSSARY.md). Name things with those words. Language and component conventions come
from the `nbr-repo-conventions` skill. The stricter lint rules (no `as`, no `!`, `#/` over `../`) apply
to `website/**` only.

No Google Fonts, and no other third-party font or script host. Kode Mono and Chakra Petch are
self-hosted through `@fontsource` in `src/styles/fonts.css`.

## Generated files

- `src/routeTree.gen.ts`: the TanStack Router plugin writes it. Never edit it.
- `storybook-static/`, `.vercel/`, `e2e/test-results/`: build output.

## Structure

- `routes/`: route components own data, state and orchestration. The route is the container. Files
  prefixed `-` are route-local helpers, not routes.
- `components/`: dumb. Props in, UI out, no data fetching, no store access. One folder each with
  `index.ts`, the component, a CSS Module and a story. Variants are CVA classes from the CSS Module.
  A component sets no outer margin; the parent spaces it through `stack`, `page-grid` or
  `reading-column`.
- `partials/`: compositions of components for one purpose (site header, product page, dock). A
  partial has no CSS Module and no styling of its own; it arranges components and passes props.
- `content/`: site copy and product data as typed objects. Install methods are data in
  `content/products/`; a method with `isSoon` shows as a disabled tab. Livery has its own entry.
- `hooks/`, `stores/`, `lib/`: hooks, TanStack Store slices (`theme`, `sound`; client state only) and
  pure logic.
- `server/`, `api/`: GitHub server functions, response schemas and the hooks that read them.
- `background/`, `audio/`: the background layer and the sound engine, below.
- `dev/`: development-only pages (`/dev/sound`), added in code and absent from the production build.
- `styles/`: `tokens.css` and `global.css`. Chrome gets color, type, spacing and motion from `--ba-*`
  custom properties and nothing else.

Tests sit next to the code: `foo.ts` gets `foo.test.ts`.

## Theme

`useTheme()` resolves the theme: `?theme=` (short key without the `black-atom-` prefix), then the
stored key (`ba-theme`), then a default by system preference. `setTheme` stores the key and drops the
param for the default theme. `themeToCustomProperties` turns a theme into the `--ba-*` variables on
`<html>`. `routes/-theme-script.ts` applies them before first paint and mirrors
`resolveThemeKey` in `lib/theme-precedence.ts`; change both together. Routes stay SSR per request,
because a prerendered route would flash on `?theme=`.

## Background layer

One `BackgroundLayer` sits in the root layout. `lib/route-background-state.ts` maps a pathname to a
state: `full`, `receded`, `iter` or `radar`. A new route is `receded` unless the map says otherwise.

- `controller.ts` runs one renderer at a time and lazy-loads it. States `full` and `receded` share the
  black hole and ease between each other; a switch to or from `iter` or `radar` disposes the old
  renderer first. A renderer that fails to start stays off for the session.
- A renderer implements `BackgroundRenderer` in `types.ts`: `start`, `setState`, `setTheme`, `sing`,
  `pulse`, `pause`, `resume`, `dispose`, and an `events` stream of `SceneEvent`s (`absorb`,
  `proximity`, `camera`).
- `handle.ts` is the seam to the rest of the app. `background.events` and the `sing`/`pulse` calls stay
  valid while renderers come and go. Import it; never import a renderer or the controller from outside
  `background/`.
- `three` is pinned. Keep it out of the server bundle: it loads only inside an effect.

## Sound

`audio/engine.ts` owns the Tone.js context, the master chain (mix bus, limiter, soft clip) and the
shared reverb. Tone loads only when sound starts. A `Soundscape` (`audio/soundscape.ts`) is the
pluggable part:

- `id`: the soundscape's name.
- `params`: a zod object holding every tunable value with its default.
- `layers`: the layer ids. `mute(layers)` silences the given set; an empty set plays all.
- `build(ctx)` wires voices into `ctx.bus` and `ctx.reverb`; `ctx.visual.sing/pulse` send notes and
  kicks back to the scene.
- `onScene(event)` reacts to scene events; `setTheme(root)` takes the pitch root from
  `themeRoot(key, appearance)`; `setParams`, `dispose`.

`audio/soundscapes/organic/` is the shipped soundscape. A new one implements `Soundscape` and takes
the engine's place in `soundEngine`; nothing else changes. Sound is off by default, stored under
`ba-sound`, and plays only on black-hole states. A remembered "on" starts on the first click or key
press, since browsers block audio before one. `/dev/sound` (dev server only) tunes params and mutes
layers. Offline renders cover loudness in `*.browser.test.ts` (`npm run verify:audio`).

## Live data

Server functions in `server/github.ts` are the only code that talks to GitHub. They return
`{ ok, body }` or `{ ok: false, error }` as values, so an outage renders a fallback instead of an error
boundary. Success sets `Cache-Control: s-maxage=60, stale-while-revalidate=600`; any failure in the
response sets `s-maxage=60`. `GITHUB_TOKEN` is used when set. Only repos and paths from
`content/products/` are accepted. `GITHUB_API_URL` replaces the API host; the e2e suite points it at a
local stub.

## Storybook

`npm run storybook` (port 6006) serves every component and partial story. The toolbar switches the
theme across the whole catalog; the decorator sets the same `--ba-*` variables as the site. The a11y
addon runs with `test: "error"`, so a violation fails the story. Docs pages come from `tags:
["autodocs"]` and paint their story surfaces from `--ba-bg`. A new component ships with its story.

## Verify

Scripts are in `package.json`. Before finishing, run `npm run verify:tests` and `npm run verify:stories`
here; the root `npm run verify` also builds the site and runs knip and `verify:audio`.

`test:e2e` runs Playwright against a production build on port 4319 with `GITHUB_TOKEN` empty and
`GITHUB_API_URL` on `e2e/github-stub.ts`. The stub serves `src/api/github/fixtures/` and answers
commits on `livery/` with a rate-limit error, so one feed always shows the failure state.
