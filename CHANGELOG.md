# Changelog

## [0.12.0](https://github.com/black-atom-industries/black-atom/compare/v0.11.0...v0.12.0) (2026-11-27)


### ⚠ BREAKING CHANGES

* **minium:** black-atom-minium-polymer-dark and black-atom-minium-polymer-light are now black-atom-minium-sienna-dark and black-atom-minium-sienna-light. Update the theme key in livery, nvim, and any config that names it.
* the clay collection and its themes black-atom-clay-dark and black-atom-clay-light are gone from every adapter and from livery. Switch to black-atom-minium-polymer-dark or black-atom-minium-polymer-light.

### Features

* add a border color token for idle lines [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([9c2eb4f](https://github.com/black-atom-industries/black-atom/commit/9c2eb4f2ad1c00aaeaed3c6438ebd122fc884928))
* add a gutter_padding option for the dark gutter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([69279b4](https://github.com/black-atom-industries/black-atom/commit/69279b422d7b8dab5dcab77bc6f57a2015892624))
* add jpn Murasaki Light theme [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([4614926](https://github.com/black-atom-industries/black-atom/commit/46149263d7c16aa09a7baa0de8d4b2da23353062))
* add the AGAR collection, a khaki lab-label light theme ([b52b3c1](https://github.com/black-atom-industries/black-atom/commit/b52b3c1b81c828cb7baa69b9659ea97dfe3b12b1))
* add TR-1000 theme collection [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([223a026](https://github.com/black-atom-industries/black-atom/commit/223a026948f47293dd802f34bab5143d57c6bc29))
* **core:** report contrast of syntax and terminal colors [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([050f53f](https://github.com/black-atom-industries/black-atom/commit/050f53fef90243294c40b58a89ac5d5b9f2916e3))
* **core:** retune Minium Sienna's accents and light syntax [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([cf80217](https://github.com/black-atom-industries/black-atom/commit/cf80217498a63c65260121301eb7e6e64ba9a7b3))
* **core:** trace each theme color to the slots it comes from [#75](https://github.com/black-atom-industries/black-atom/issues/75) ([d1a816e](https://github.com/black-atom-industries/black-atom/commit/d1a816e314435a06094f526dafc3f8e987dac3e2))
* **ghostty:** take all 16 ANSI colors from the theme palette [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([da913b3](https://github.com/black-atom-industries/black-atom/commit/da913b3ef125e38433cbcb6c738f58daab41b089))
* give Terra's syntax one assignment across appearances and Fall plum keywords [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([329d694](https://github.com/black-atom-industries/black-atom/commit/329d69494d8ca9eaab52d6cd17929b7e134e6c41))
* **kagi:** invert the keyboard-selected result title [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([5d51a3d](https://github.com/black-atom-industries/black-atom/commit/5d51a3de78d35706618d0ee6b467a0d113473f19))
* **lazygit:** color lazygit's status keys with feedback tokens [#17](https://github.com/black-atom-industries/black-atom/issues/17) ([a9e699f](https://github.com/black-atom-industries/black-atom/commit/a9e699ff10c91111f1a9bfd1964c1df0c95d9438))
* **livery:** add the dark_gutter toggle to the Neovim settings [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([90b409f](https://github.com/black-atom-industries/black-atom/commit/90b409f2f0f3961cce66f93aac4bdc344802e471))
* **livery:** apply themes to Rex [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([93e34eb](https://github.com/black-atom-industries/black-atom/commit/93e34eb6a6964b1bf2c2bf704274034b82709a3c))
* **livery:** keep the active theme on setup --yes and add --theme [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([3027b56](https://github.com/black-atom-industries/black-atom/commit/3027b566cebefe12d099feadfd258589c14e3b77))
* **livery:** keep the app in sync with config.json [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([0cb3be1](https://github.com/black-atom-industries/black-atom/commit/0cb3be1889bee51b58570f8f40a7b05e507674c0))
* **livery:** name Rex themes after their labels [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([bc72bd5](https://github.com/black-atom-industries/black-atom/commit/bc72bd5619af7f0c376a09d03145f0a276b31def))
* **livery:** show when Neovim's own config overrides Livery [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([bfa138a](https://github.com/black-atom-industries/black-atom/commit/bfa138a9d5b25a396dc8c660c98f1f1586f91d17))
* **nvim:** add a dark_gutter option for a darker gutter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([b04b57a](https://github.com/black-atom-industries/black-atom/commit/b04b57aa51028441d1458cb32d1c84aafc371d3c))
* **nvim:** apply Livery's active theme at startup [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([95e5cd0](https://github.com/black-atom-industries/black-atom/commit/95e5cd0b95becd031855ce50aa94c19641ea9171))
* **nvim:** flatten options and pad the gutter automatically [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([7b0cd25](https://github.com/black-atom-industries/black-atom/commit/7b0cd25d10d530686e13c9b8010597e05bf97377))
* **nvim:** put radar.nvim's floats on the panel background [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([182a348](https://github.com/black-atom-industries/black-atom/commit/182a348b69171e8b50e974fd451d06646aadb663))
* **nvim:** read options from Livery's config.json [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([3329e39](https://github.com/black-atom-industries/black-atom/commit/3329e3989836b6b4953fbd9e4344d111676d8370))
* **nvim:** stop writing to Neovim's files from Livery [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([bbcc762](https://github.com/black-atom-industries/black-atom/commit/bbcc76267e201c7c71875586d0971226bdfb4321))
* **nvim:** style iter.nvim diffs and commit rows [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([3da4585](https://github.com/black-atom-industries/black-atom/commit/3da45856cc7194974ee2cd2524b8b926bbadf6c6))
* remove the clay collection [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([fb1199c](https://github.com/black-atom-industries/black-atom/commit/fb1199c08652686e48810c752a26e78639745993))
* retune Murasaki accents to lime and shift Viridian toward teal [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([291bb17](https://github.com/black-atom-industries/black-atom/commit/291bb179e80f894ebe3d650bc0bdcac3505a3567))
* rework Terra Spring as a moss meadow under a dusk sky [#75](https://github.com/black-atom-industries/black-atom/issues/75) ([6250119](https://github.com/black-atom-industries/black-atom/commit/625011928000720706e6c57d46783a5eb246e62d))
* turn Terra Fall's cyan into a pastel sage green [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([f678ef4](https://github.com/black-atom-industries/black-atom/commit/f678ef426871a872913e9dfe1ec398494ea1c898))
* warm up Terra Fall and color parameters with red [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([9d8eef7](https://github.com/black-atom-industries/black-atom/commit/9d8eef7075e1b0dda5571f6b9775d2aad3ccf42b))
* **website:** add a theme lab dev page [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([66292a4](https://github.com/black-atom-industries/black-atom/commit/66292a4dcba2423a1faa4fe14c409cd036423ec2))
* **website:** add every page with its content [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([6a1bf87](https://github.com/black-atom-industries/black-atom/commit/6a1bf8758e5749ce888e2200a41f441ff600ec44))
* **website:** add the generative soundscape engine [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([f4bb012](https://github.com/black-atom-industries/black-atom/commit/f4bb012594220cdc4b2a1111a344584d77527c93))
* **website:** add the live theme-coloured background layer [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([87a1953](https://github.com/black-atom-industries/black-atom/commit/87a1953498ddae35cc646bebcbffb95bf15aacdc))
* **website:** frame every page and centre the home hero [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([084003d](https://github.com/black-atom-industries/black-atom/commit/084003da835808ca32ce4289f7b37cb6e5a58aac))
* **website:** scaffold the website package and its tooling [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([683b75e](https://github.com/black-atom-industries/black-atom/commit/683b75ec26fbb4c4c90f8494bebfd359b6e79e69))
* **website:** show each theme with editor, diff and terminal previews [#75](https://github.com/black-atom-industries/black-atom/issues/75) ([15f4eeb](https://github.com/black-atom-industries/black-atom/commit/15f4eebe52b273c48ec24602f5e12f3480fc9658))
* **website:** show where each theme color comes from [#75](https://github.com/black-atom-industries/black-atom/issues/75) ([b32780d](https://github.com/black-atom-industries/black-atom/commit/b32780d35e00b4ffd4ccffd2b725ad269e1e359a))
* **website:** switch themes site-wide through the URL and storage [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([d36c8c7](https://github.com/black-atom-industries/black-atom/commit/d36c8c76aa353bd55063d8cd39f96dd2f131077e))
* **zed:** color diff hunks and the git gutter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([463c7bd](https://github.com/black-atom-industries/black-atom/commit/463c7bda615f8d9021131a695da1da264df2374c))


### Refactors

* **livery:** give every hotkey one owner [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([5f2ce81](https://github.com/black-atom-industries/black-atom/commit/5f2ce816e160f1daa25a549e18c844e7e8c9635e))
* **minium:** rename the polymer theme to sienna [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([36ee09b](https://github.com/black-atom-industries/black-atom/commit/36ee09b4755b70a5dc53101d83d909f4980916e4))
* **themes:** adjust polymer themes ([63334be](https://github.com/black-atom-industries/black-atom/commit/63334bedb927f3c5c2bcb9e1b48a904a6bf3576e))


### Bug Fixes

* **core:** give each default palette slot its own hue [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([a7122fb](https://github.com/black-atom-industries/black-atom/commit/a7122fbc9905b8275d4be3e3f27352462f4f62ba))
* **core:** give every minium accent its palette slot [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([f43d0f7](https://github.com/black-atom-industries/black-atom/commit/f43d0f7c0139ee7caa03439cb7f3639c43a9898d))
* **core:** make selection and the cursor line visible in JPN light [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([19cbdbe](https://github.com/black-atom-industries/black-atom/commit/19cbdbe921f9004d53926ce5907e3d3babffbe88))
* **core:** make the active background readable in light themes [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([a3668f2](https://github.com/black-atom-industries/black-atom/commit/a3668f2053902846a32a855e7b86e3ee66dedcf8))
* **core:** raise Terra Fall Light's amber and red contrast [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([7a9c46e](https://github.com/black-atom-industries/black-atom/commit/7a9c46e78e6cbeef9c33f2214f1978eba486cc15))
* **core:** raise text contrast in Minium dark and Viridian Light [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([f8fb51a](https://github.com/black-atom-industries/black-atom/commit/f8fb51ac8953835c2052b45d5b1d84253247fcdf))
* **core:** raise text contrast in the default, facility and mono themes [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([1b7c47c](https://github.com/black-atom-industries/black-atom/commit/1b7c47c0b406cdf4511461e90325ea17ab8820a5))
* **core:** raise text contrast in the jpn themes and rework Sanshoku Light [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([6f502aa](https://github.com/black-atom-industries/black-atom/commit/6f502aa91719ff591472cdc412a976a5669fd0d0))
* **core:** raise text contrast in the Minium light themes [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([b3a5559](https://github.com/black-atom-industries/black-atom/commit/b3a5559ff42778f02fc88798adae11614db0b6f2))
* **core:** raise text contrast in the terra themes and rework Spring [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([d35f2d9](https://github.com/black-atom-industries/black-atom/commit/d35f2d9a1df37f1fe6d3f854ad850557deeb89f3))
* **core:** refine the terra dark seasons [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([a64f599](https://github.com/black-atom-industries/black-atom/commit/a64f5994474f354705d68e80fa583d0cb08cb20e))
* **core:** widen palette shades in default, minium and mono [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([9be8485](https://github.com/black-atom-industries/black-atom/commit/9be848569e7c68b636ad4e7628a7fc64f283a3d8))
* **kagi:** give the search page room and fix crowded mobile layout [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([c41efd0](https://github.com/black-atom-industries/black-atom/commit/c41efd0e4316a1557262136ba870b2c29774d992))
* keep code on diff lines as readable as on the editor background [#75](https://github.com/black-atom-industries/black-atom/issues/75) ([67c2e65](https://github.com/black-atom-industries/black-atom/commit/67c2e65ab6e193afba0ccd9053f163f535061699))
* **livery:** fit the theme picker to the terminal height [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([e638620](https://github.com/black-atom-industries/black-atom/commit/e638620445c7d20e487a3d9dd5084eda338b6056))
* **livery:** keep lazygit's config valid when a theme adds keys [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([cd675c1](https://github.com/black-atom-industries/black-atom/commit/cd675c1e93574f2fabdacdb99a358b7181b33587))
* **livery:** let window managers tile the macOS window [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([d5f4a2b](https://github.com/black-atom-industries/black-atom/commit/d5f4a2b79e0f072fcbf81c80455baab9e43c8662))
* **livery:** let window managers tile the macOS window [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([6dbddcc](https://github.com/black-atom-industries/black-atom/commit/6dbddcc00bdbe35f5c67743fc56de1a812f2ed40))
* **livery:** make the whole choice chip clickable [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([95cbfe3](https://github.com/black-atom-industries/black-atom/commit/95cbfe311dcc60ea6f91aa9bad06395c21100bfc))
* **livery:** show repeated palette colors in theme list pips [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([db7817e](https://github.com/black-atom-industries/black-atom/commit/db7817ea1876027fe9371ca8badcff50a8ff3579))
* **livery:** skip unreachable live instances and target Obsidian vaults by ID [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([cbeb1c3](https://github.com/black-atom-industries/black-atom/commit/cbeb1c3034527089c6086a2abd6eed35a6d787a4))
* **livery:** sync a wired app's theme links on apply [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([b2821a7](https://github.com/black-atom-industries/black-atom/commit/b2821a75891271eded455e173d60500dab7a9859))
* **nvim:** color DiagnosticOk with the theme's positive tokens [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([7a68680](https://github.com/black-atom-industries/black-atom/commit/7a68680e15331936a037f4556e3feb7d64d7d5ef))
* **nvim:** give the iter drawer the panel background [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([e7a3b32](https://github.com/black-atom-industries/black-atom/commit/e7a3b32b7ae978e9e5844b8572b26d9be7f3aac8))
* respect each Neovim's theme and partial settings in config.json [#73](https://github.com/black-atom-industries/black-atom/issues/73) ([719611f](https://github.com/black-atom-industries/black-atom/commit/719611f89e030e74d57572f88a8aa5c8826acccc))
* **website:** address the final review [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([ea61b98](https://github.com/black-atom-industries/black-atom/commit/ea61b983a3a132704fdd74c7d9e70d2631c5007f))
* **website:** keep panels and text clear of the film grain [#75](https://github.com/black-atom-industries/black-atom/issues/75) ([1b4e6c3](https://github.com/black-atom-industries/black-atom/commit/1b4e6c37f0a513b6759f780599ef830be9180ea4))


### Documentation

* document the website package [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([799d0b2](https://github.com/black-atom-industries/black-atom/commit/799d0b2107042741d79ac23c5548e8f72f090223))
* move the color and adapter docs into docs/ [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([73cfcbc](https://github.com/black-atom-industries/black-atom/commit/73cfcbc5457358dd82c4db6d8ba7f07423effa17))
* name the theme lab and contrast pairs, sync the nvim plugin list [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([fc00721](https://github.com/black-atom-industries/black-atom/commit/fc00721e8fe9b05b2a03c907b38a0bc31f801cd0))
* **nvim:** link the plugin folder and move recipes into the README [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([5f9d746](https://github.com/black-atom-industries/black-atom/commit/5f9d7468ea0150d9bddcd221025d9b7d91b8331d))
* **nvim:** point the roadmap at issues labeled adapter:nvim [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([cff4f87](https://github.com/black-atom-industries/black-atom/commit/cff4f872e577ed9fe6c24b52e47853ca2dfc3b40))
* state the Node version the install is tested on [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([1f3d99a](https://github.com/black-atom-industries/black-atom/commit/1f3d99a6d4e85bf4c8bced0b1fc7830ce0b2338f))

## [0.11.0](https://github.com/black-atom-industries/black-atom/compare/v0.10.0...v0.11.0) (2026-10-15)

### Highlights

#### Claude Code

A new adapter generates a Claude Code custom theme for every Black Atom theme. Prompt rows, docked plugin panes, diffs,
and status text take the theme's own colors, so light themes lose the gray slab that Claude Code's ANSI themes paint from
the terminal palette. Livery writes the active theme to `themes/black-atom.json` in each Claude Code config folder, and
Claude Code picks up every switch while it runs. Select the theme once, in `/theme` or in `settings.json`:

```json
{
    "theme": "custom:black-atom"
}
```

Livery never writes `settings.json`, so a settings file tracked in a dotfiles repo never changes.

#### More than one config folder

`livery setup` finds every `~/.claude*` folder that holds a `settings.json`, so a second profile run with
`CLAUDE_CONFIG_DIR=~/.claude-work` gets themed too. It lists what it found for Claude Code and Obsidian, asks whether
the list is complete, and takes any missing folder by path. The settings page shows the same list with add and remove
for both apps. Setup and apply print one status per app, with the details in a Notes section below the list.

#### Refreshed themes

Facility moves toward slate, with less saturated mid tones. Minium Polymer gets warmer neutrals, and its keywords turn
orange.

#### Important fixes

The Herdr theme sets colors only. Facility themes used to change Herdr's sidebar layout as well.

### Features

* **claude-code:** add claude-code adapter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([3e22d87](https://github.com/black-atom-industries/black-atom/commit/3e22d87e42fba15523bf80d60fcc42813985797a))
* **core:** cool Facility toward slate and desaturate its mids [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([112b52d](https://github.com/black-atom-industries/black-atom/commit/112b52d2ed539f4ff3aba6a77ae7078796476192))
* **core:** warm Minium Polymer's neutrals and key keywords to orange [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([0faf8a1](https://github.com/black-atom-industries/black-atom/commit/0faf8a1864cf89c8a0a4a45b52b1605b966f3288))
* **livery:** apply claude-code themes to every config folder [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([775dc71](https://github.com/black-atom-industries/black-atom/commit/775dc7199ca86ab1f02267b45f86ebfa0775cc70))


### Bug Fixes

* **herdr:** limit the theme to colors [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([102f75a](https://github.com/black-atom-industries/black-atom/commit/102f75a368a9c623add29a8338294e0c828ff75a))
* report a launcher once when the search path repeats its directory [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([01ce68d](https://github.com/black-atom-industries/black-atom/commit/01ce68d837fb7c83219a8e07117472720981059c))

## [0.10.0](https://github.com/black-atom-industries/black-atom/compare/v0.9.0...v0.10.0) (2026-10-10)

### Highlights

#### Node instead of Deno

The Deno team joined Cloudflare, and Deno itself only gets bug fixes and security updates until October 2027
([announcement](https://deno.com/blog/cloudflare)). Black Atom now builds and generates on Node 24 with npm workspaces.
Building livery from a clone, generating themes, and working on an adapter need Node instead of Deno, and every task is
an npm script:

```sh
npm install
npm run install:macos   # build and install the app and the livery command
npm run generate        # regenerate every adapter's themes
```

Inside an adapter directory, `node ../../core/src/cli/index.ts generate` regenerates that adapter. Formatting, linting,
type checks, and tests run through oxfmt, ESLint, TypeScript, and Vitest
([#58](https://github.com/black-atom-industries/black-atom/issues/58)).

#### Kagi Search

A new adapter themes Kagi Search with one brutalist custom CSS per theme pair: square corners, hard offset shadows,
thick rules, uppercase titles, monospace fonts, and code blocks in the theme's syntax colors. Each file carries the light
and the dark variant and follows Kagi's appearance setting. Knobs for fonts, case, border widths, and shadow offsets sit
at the top of the file. Livery copies a theme to the clipboard, ready to paste into Kagi's custom CSS setting:

```sh
livery adapter kagi black-atom-jpn-koyo --font "JetBrains Mono"
```

Without a theme it opens a picker.

#### delta

delta gets a generated git config per theme with diff, line-number, and header colors, and `syntax-theme = ansi`. Livery
links the files into `~/.config/delta/themes/` and switches delta with the rest of your tools.

#### Refreshed themes

Minium Polymer takes its colors from Teenage Engineering hardware: neutral aluminium grays with the signature orange as
the main accent. JPN Sanshoku shares the JPN syntax and UI colors, with a full palette built from its amber, blue, and
vermilion. Default Light and Dimmed Light use more saturated accents and feedback colors, Dimmed Light has lighter
surfaces, the Default Dark and Dimmed Dark comments are brighter, and diff backgrounds use a subtler tint
([#54](https://github.com/black-atom-industries/black-atom/issues/54)).

#### Important fixes

tuicr highlights code with Black Atom syntax colors from a generated `.tmTheme`, where it used to fall back to its bundled
base16 theme. Livery links the `.tmTheme` next to each tuicr theme.

#### Upgrading from 0.9

delta switches through an include. In `~/.gitconfig.delta`, replace the `features` line and the `black-atom-dark` and
`black-atom-light` blocks with an include above your own `[delta]` section, then run `livery setup`:

```diff
-[delta]
-    features = black-atom-dark
+[include]
+    path = ~/.config/delta/themes/black-atom-default-dark.gitconfig
```

Run `livery setup` once more for tuicr as well; until then livery shows its setup as unlinked.

In an existing clone, delete the `node_modules` directories Deno created before the first `npm install`.

### ⚠ BREAKING CHANGES

* **livery:** delta switches themes through `path = <themes>/<themeKey>.gitconfig` under [include] in ~/.gitconfig.delta. The features line and the black-atom-dark/light blocks go unused.

### Features

* **core:** accept a list of templates per collection [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([d2a94b0](https://github.com/black-atom-industries/black-atom/commit/d2a94b0d5655791c5b066b803c0ff91a27cb0cdc))
* **core:** raise saturation and contrast in the default themes [#54](https://github.com/black-atom-industries/black-atom/issues/54) [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([bdc4750](https://github.com/black-atom-industries/black-atom/commit/bdc4750738a60fa5c9b64e3ddf0a0e2bc304637c))
* **delta:** add the delta adapter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([91f47ea](https://github.com/black-atom-industries/black-atom/commit/91f47eaa9e9ef700fb46bc0560188ce6e6f95b39))
* **kagi:** add Kagi Search adapter [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([0e5dde5](https://github.com/black-atom-industries/black-atom/commit/0e5dde5770e5dd1b211f4860870461033addbae5))
* keep theme creators inside each collection [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([acb56c6](https://github.com/black-atom-industries/black-atom/commit/acb56c636891d3832a3e745db1216f62e1ef0593))
* **livery:** copy Kagi themes with livery adapter kagi [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([9e6a90f](https://github.com/black-atom-industries/black-atom/commit/9e6a90fd1120fefd0970664ddf6edfcef61ccc72))
* **livery:** link delta themes and switch them through an include [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([c3a7cba](https://github.com/black-atom-industries/black-atom/commit/c3a7cba992fa2cbdbd891e63a9f368de3568c819))
* **livery:** show theme background and accents in list pips [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([66a686e](https://github.com/black-atom-industries/black-atom/commit/66a686e4a9c55475a3728eeab06e1e90aa6869d4))
* rebuild Minium Polymer from Teenage Engineering colors [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([f3a2a0b](https://github.com/black-atom-industries/black-atom/commit/f3a2a0bfc5430b0b157d9d60b3c6039194f8cffa))
* **tuicr:** use the panel background for the main surface [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([2ec3eea](https://github.com/black-atom-industries/black-atom/commit/2ec3eeae4438482a6734d5f9ade5339c3edb5f6b))


### Bug Fixes

* highlight tuicr code with Black Atom syntax colors [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([2b9d795](https://github.com/black-atom-industries/black-atom/commit/2b9d795e2f192b0f455847de088ad3bff308ada2))
* **kagi:** keep oxfmt off the base stylesheet [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([ec5fd53](https://github.com/black-atom-industries/black-atom/commit/ec5fd53f09849a1eb790ce86c2103acf1b5fc557))
* keep secrets out of the dev session state [#57](https://github.com/black-atom-industries/black-atom/issues/57) ([3319777](https://github.com/black-atom-industries/black-atom/commit/3319777d5a687bd751815b8cbb02ce6f99f4df09))
* **livery:** keep dev bridge connections blocking on macOS [#10](https://github.com/black-atom-industries/black-atom/issues/10) [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([373db41](https://github.com/black-atom-industries/black-atom/commit/373db41827f306d46c9660fb9232d727759ff46b))
* **livery:** list update notes below the apply results [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([8536149](https://github.com/black-atom-industries/black-atom/commit/85361497fe43fd900bdf7ccbc06c0e405f2844a7))
* **livery:** read adapter themes from the working tree in debug builds [#56](https://github.com/black-atom-industries/black-atom/issues/56) [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([3b83ca2](https://github.com/black-atom-industries/black-atom/commit/3b83ca2d5d5a76077601855e4c8c3aae4fbee7b9))


### Documentation

* prepare the 0.10.0 release [#22](https://github.com/black-atom-industries/black-atom/issues/22) ([ca8577e](https://github.com/black-atom-industries/black-atom/commit/ca8577ee123c5bc80a703a7d9861722329edccf4))
* split the README into install and usage black-atom-industries/livery[#68](https://github.com/black-atom-industries/black-atom/issues/68) ([23b3480](https://github.com/black-atom-industries/black-atom/commit/23b3480796fd1769e869fb6f0901653157e6eb81))

## 0.9.0 (2026-10-01)

### Highlights

#### Black Atom

Black Atom is a family of dark and light themes for developer tools: 32 themes in seven collections, each with its own
palette and mood. Every theme is defined once and rendered for each tool through an adapter, so the same colors show up
in the terminal, the editor, and the rest of the desktop.

#### Seven collections

`default`, `facility`, `terra`, `jpn`, `clay`, `minium`, and `mono`. A theme key names its collection and its
appearance, for example `black-atom-jpn-koyo-dark` or `black-atom-terra-spring-light`.

#### Eleven tools

Adapters for Ghostty, herdr, lazygit, niri, Neovim, Obsidian, tmux, tuicr, Waybar, WezTerm, and Zed. Each adapter's
generated theme files work on their own, so any tool can use Black Atom without livery.

#### Livery

Livery applies one theme across the tools it supports on a machine at once, from a desktop app or the `livery` command.
Run it without a theme to choose one from a fuzzy picker:

```sh
livery apply
```

Livery carries every theme in its binary, switches the macOS or GNOME appearance along with the apps, and remembers the
theme it last applied.
