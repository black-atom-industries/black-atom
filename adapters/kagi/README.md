# Black Atom for Kagi

> Brutalist color themes for Kagi Search by Black Atom Industries

## What is a Black Atom Adapter?

This directory is the **Kagi adapter** for Black Atom. Themes are defined once in
[`../../core/`](../../core/), and each adapter renders them for one platform through Eta
templates, keeping colors identical everywhere while leaving room for platform-specific tuning.

## How It Works

Every file in [`themes/`](themes/) is one complete Kagi custom CSS. It maps Black Atom colors onto
Kagi's own CSS variables and adds a brutalist layer on top: square corners, hard offset shadows,
thick rules between results, uppercase titles, and monospace fonts.

A file holds both appearances of a theme, for example `themes/minium/black-atom-minium-polymer.css` holds Polymer Light
and Polymer Dark, and `themes/default/black-atom-default-dimmed.css` holds Dimmed Light and Dimmed Dark. Kagi's
appearance setting picks between them: Light and Calm Blue show the light theme, Dark and Moon Dark
the dark one, and Auto follows the system color scheme. Themes that only come in dark, such as JPN
Murasaki, show their dark colors in every appearance.

Custom CSS reaches Kagi's search pages (All, Images, Videos, News, Podcasts, Quick Answer) and the
landing page. Maps and the settings pages keep Kagi's own styling.

## Installation

1. Copy a theme. With [livery](../../livery), pick one interactively or name it:

    ```bash
    livery adapter kagi
    livery adapter kagi black-atom-jpn-koyo
    ```

    Without livery, copy the file yourself:

    ```bash
    pbcopy < themes/jpn/black-atom-jpn-koyo.css
    ```

    Livery also asks for a preferred font, or takes `--font "<family>"`, and puts it first in both font stacks.

2. Open [Kagi's Custom CSS settings](https://kagi.com/settings/custom_css), turn on custom CSS,
   paste, and click **Save Changes**.

Append `?no_css` (or `&no_css`) to any Kagi URL to load a page without your custom CSS.

### Knobs

The `Knobs` block at the top of each file holds everything worth tweaking, once for both
appearances:

| Knob                       | Controls                               |
| -------------------------- | -------------------------------------- |
| `--ba-font`                | body text font stack                   |
| `--ba-font-heading`        | titles, tabs, section headers, dates   |
| `--ba-case`                | text case of titles, tabs, labels      |
| `--ba-border-width`        | rules between results and panel frames |
| `--ba-border-width-thin`   | pills, widgets, image frames           |
| `--ba-shadow-offset`       | hard shadow of search bar and panels   |
| `--ba-shadow-offset-small` | hard shadow of pills and widgets       |

Both font stacks prefer TX-02 or Berkeley Mono when either is installed. Without them, headings
use [Kode Mono](https://fonts.google.com/specimen/Kode+Mono) and body text uses
[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono), both from Google Fonts. The
browser downloads a Google font only when no installed font earlier in the stack matches.

## Available Themes

Every Black Atom theme ships here. [`catalog.ts`](../../core/src/themes/catalog.ts) lists the collections and their themes.

## Development

`npm run generate` from the repository root renders one color fragment per theme into
`fragments/`, then runs `scripts/postGenerate.ts`, which pairs light and dark fragments and writes
the finished files to `themes/`.

### Layout

```
.
├── LICENSE
├── README.md
├── black-atom-adapter.json
├── fragments/
│   ├── collection.template.css     # colors-only template for all collections
│   └── default/black-atom-default-dark.css
├── scripts/postGenerate.ts         # pairs light and dark fragments, writes themes/
├── styles/base.css                 # knobs and brutalist layer, shared by every theme
└── themes/
    ├── default/black-atom-default.css
    ├── default/black-atom-default-dimmed.css
    └── ...                         # one directory per collection
```

## License

MIT © Black Atom Industries
