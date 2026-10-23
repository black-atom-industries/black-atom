# Website

[black-atom.industries](https://black-atom.industries) presents the studio and its three products. The
source is the `website/` package, a TanStack Start app on React. Component, background and sound
details for contributors are in [`website/AGENTS.md`](../website/AGENTS.md).

## Products and routes

The studio is the home page. Its products are Black Atom (themes), iter.nvim and radar.nvim. Livery is
Black Atom's app, with its own page and its own entry in the product data. It sits under Black Atom because people meet the themes first and Livery is how
they wear them everywhere.

| Route                       | Page                                 |
| --------------------------- | ------------------------------------ |
| `/`                         | Studio                               |
| `/black-atom`               | Black Atom                           |
| `/black-atom/themes/$theme` | One theme, documented                |
| `/black-atom/livery`        | Livery                               |
| `/iter`, `/radar`           | iter.nvim, radar.nvim                |
| `/changelog`                | Releases and commits of all products |
| `/about`                    | About                                |
| `/impressum`, `/privacy`    | Legal                                |

About, Impressum and Privacy carry visible `[placeholders]` for personal and legal facts until the
owner fills them in.

Install methods are data per product. A method not yet released shows as a disabled "soon" tab and
becomes usable when its `isSoon` flag goes. Livery lists "from source" and the announced methods this way.

## Theme

The theme is global. Precedence: the `?theme=` URL param, then the stored choice, then a default of
`black-atom-default-dark` or `black-atom-default-light` by system preference. Keys in the URL are short
(the key without `black-atom-`). The default dark theme drops the param, so the common URL stays clean,
and a shared link opens in the sender's theme. The choice is stored in `localStorage` under `ba-theme`.

A script in the document head applies the resolved theme before first paint, so a stored or light
theme never flashes dark. For the same reason routes render on the server per request.

Theme pages document a theme in the visitor's current theme. Their previews render in the documented
theme, and "Use site-wide" applies it.

The site reads themes from `@black-atom/core`, the way Livery does, and holds no second copy of theme
data, so it cannot drift from core.

## Live data

Changelogs read from the GitHub API through server functions. Releases come first, with the curated
Highlights; commits come second, filtered by path per product. Black Atom releases group their
Highlights under `#### Themes`, `#### Livery` and `#### Core`, and each product page shows its own
group plus ungrouped items.

A successful response is cached on the CDN with `s-maxage=60, stale-while-revalidate=600`. A response
that holds any failed feed gets `s-maxage=60` only, so a fallback never outlives GitHub's recovery by
more than a minute. A failure reaches the page as a value and renders an inline fallback instead of an
error page.

`GITHUB_TOKEN` is optional locally and required in production. Unauthenticated requests share GitHub's
limit of 60 per hour. On Vercel the egress IPs are shared with other sites, and `/changelog` makes 8
calls per uncached render, so without a token the fallback shows often.

## Background

One background layer lives in the root layout and changes state per route while the content swaps on
top. One renderer runs at a time.

| State     | Routes                                          | Scene                  |
| --------- | ----------------------------------------------- | ---------------------- |
| `full`    | `/`, `/black-atom`, `/black-atom/livery`        | The black hole         |
| `receded` | theme pages, changelog, about, legal, not found | The black hole, dimmed |
| `iter`    | `/iter`                                         | The review loop        |
| `radar`   | `/radar`                                        | The sweep              |

The scene takes its colors from the current theme. `prefers-reduced-motion` draws a still frame.
Where no renderer can start, the page keeps the plain theme background.

## Sound

Sound is off by default. A visitor switches it on in the dock; the choice, volume and settings are
remembered, and a remembered "on" starts on the first click or key press because browsers allow audio
only after a gesture. Sound plays on the black-hole states. The engine runs on Tone.js and loads only
when sound starts, so a visitor who never switches it on downloads none of it. Soundscapes plug into
the engine; the shipped one is organic, a drone and bed with a vinyl layer, a camera-motion layer and an
optional heartbeat, driven by the scene's events.

## Fonts and analytics

Kode Mono and Chakra Petch are self-hosted. Loading Google Fonts from Google's CDN is a GDPR risk in
Germany.

The site uses Vercel Web Analytics. It is cookieless and needs no consent banner.

## Releases

The website is not a released artifact. It deploys from `main` on every push, and release-please
excludes `website/` (`exclude-paths: ["website"]` in
[`.github/release-please-config.json`](../.github/release-please-config.json)), so a site change never
bumps the Black Atom version or lands in its changelog. See [Releases](releases.md).
