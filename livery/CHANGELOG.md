# Changelog

## [0.2.0](https://github.com/black-atom-industries/livery/compare/v0.1.0...v0.2.0) (2026-03-22)


### Features

* add AppHeader and AppFooter components ([143ef18](https://github.com/black-atom-industries/livery/commit/143ef18a4350dd25058d8ce3ad1caeed4055aa2a))
* add macOS/Linux system appearance toggle [DEV-291] ([#22](https://github.com/black-atom-industries/livery/issues/22)) ([187cb21](https://github.com/black-atom-industries/livery/commit/187cb2123239974990fbb3dda6a15b63974bd237))
* add MainLayout two-pane layout component ([c2e9e7e](https://github.com/black-atom-industries/livery/commit/c2e9e7ee91f989db11cb2e6950129c49d3d4188a))
* add progress state helper [DEV-296] ([6c68dff](https://github.com/black-atom-industries/livery/commit/6c68dff395728439a03df8c067c459bfdfd9d324))
* add ProgressBar component [DEV-296] ([954f45a](https://github.com/black-atom-industries/livery/commit/954f45a68703e1f57db3f04c8ffeaadd5b1e7dea))
* add statusline region with ProgressBar to root layout [DEV-296] ([e695262](https://github.com/black-atom-industries/livery/commit/e6952621625a96da39c32bb2bb458f12ed8feba0))
* add TanStack Router with file-based routing [DEV-295] ([beb6aa1](https://github.com/black-atom-industries/livery/commit/beb6aa1919b947f9ef89b51d5b005c56eab1f505))
* add TanStack Store for app state management [DEV-294] ([68c0247](https://github.com/black-atom-industries/livery/commit/68c024760e2f3654baf15e8ead9d8aa0345192fe))
* add tauri-specta for type-safe invoke calls [DEV-329] ([#23](https://github.com/black-atom-industries/livery/issues/23)) ([599d34d](https://github.com/black-atom-industries/livery/commit/599d34d1b46e6d0cb4a4babe836ba285e32c374e))
* add ThemeDetail component with name and appearance badge ([c6ae868](https://github.com/black-atom-industries/livery/commit/c6ae868a6056fbe757af1a2378677f08808faf0d))
* add ThemeList grouped component with selection highlight ([de36de9](https://github.com/black-atom-industries/livery/commit/de36de9d5174b9dac834a57fe74fcbd234a4d9a9))
* add ThemePicker container with keyboard navigation ([5ef7515](https://github.com/black-atom-industries/livery/commit/5ef7515fafeb28c11b34fac31b065f352cdb1208))
* auto-scroll selected theme into view on keyboard nav ([44b73ec](https://github.com/black-atom-industries/livery/commit/44b73ec0b755fd9041903b8f77996c5c9dbea9e5))
* **be:** implement Obsidian updater [DEV-330] ([#25](https://github.com/black-atom-industries/livery/issues/25)) ([2187165](https://github.com/black-atom-industries/livery/commit/2187165bfabb23a7b4ae1acc711107721dd4e843))
* consistent logging, duration tracking, and performance benchmark ([#26](https://github.com/black-atom-industries/livery/issues/26)) ([b9267e5](https://github.com/black-atom-industries/livery/commit/b9267e54bf473cb091bd8a72d4d8f2d64654dcb0))
* delta updater + appearance in UpdaterContext [DEV-290] ([#15](https://github.com/black-atom-industries/livery/issues/15)) ([780491e](https://github.com/black-atom-industries/livery/commit/780491ed4d3575d8e31bf3aef7cc73dce80ded55))
* file ops library + lazygit updater [DEV-317] ([#18](https://github.com/black-atom-industries/livery/issues/18)) ([68d8aff](https://github.com/black-atom-industries/livery/commit/68d8afff4bc76d3ad473f57cede498a9b8f54544))
* ghostty updater with Rust config backend [DEV-288, DEV-299] ([#11](https://github.com/black-atom-industries/livery/issues/11)) ([d9c21fd](https://github.com/black-atom-industries/livery/commit/d9c21fd80ca2ab609200c297017137c5a886d148))
* implement Zed updater with JSONC format-preserving editing [DEV-289] ([#24](https://github.com/black-atom-industries/livery/issues/24)) ([c75a3d7](https://github.com/black-atom-industries/livery/commit/c75a3d763e27e22a4bf7caecdf906f3782478b99))
* improve seperation of responsibilities [DEV-320] ([#17](https://github.com/black-atom-industries/livery/issues/17)) ([b6d0a7b](https://github.com/black-atom-industries/livery/commit/b6d0a7ba87dc1a24048c80f3f44b9b9f1ba2b33a))
* initial livery project scaffold ([35d04b6](https://github.com/black-atom-industries/livery/commit/35d04b64f9532631fcb3821f485424309ac8a6ae))
* migrate to @black-atom/core 0.3.0 ([4692f24](https://github.com/black-atom-industries/livery/commit/4692f24928feb7cf085569375d154272ed3d2f68))
* nvim updater + configurable pattern system [DEV-286] ([#13](https://github.com/black-atom-industries/livery/issues/13)) ([df790fc](https://github.com/black-atom-industries/livery/commit/df790fc8d071861579294a3f67a24085d7b14d48))
* pivot from Ink TUI to Tauri v2 desktop app ([#9](https://github.com/black-atom-industries/livery/issues/9)) ([c1fb18f](https://github.com/black-atom-industries/livery/commit/c1fb18fb1465fa033d7b614d87189d1a28b448d6))
* theme picker with Ink UI (pre-Tauri pivot) ([c31b5af](https://github.com/black-atom-industries/livery/commit/c31b5af884932ddf8e5b001f72392a6b90be5ac3))
* tmux updater + UpdaterContext refactor [DEV-287] ([#14](https://github.com/black-atom-industries/livery/issues/14)) ([cb7f63f](https://github.com/black-atom-industries/livery/commit/cb7f63f947ab17acef18943c70ea8e4ee2c65478))
* wire ThemePicker into App root container (DEV-275) ([4d0f93c](https://github.com/black-atom-industries/livery/commit/4d0f93c844a0252b0a55743ebdf7baabc21412a6))


### Bug Fixes

* add concurrency guard and match core review workflow pattern ([2cfb2c2](https://github.com/black-atom-industries/livery/commit/2cfb2c239e717c8d7da7f584b3f8874c660e5c8d))
* align Claude workflows with core repo setup ([c425205](https://github.com/black-atom-industries/livery/commit/c4252053b170404e68767a3e44eeb177851b932a))
* **be:** use yaml-edit fork with sequence indentation fix, remove workaround [DEV-325] ([1bfdc79](https://github.com/black-atom-industries/livery/commit/1bfdc794e0f190dfd12de5b5156a0cc3df2c94b4))
* **be:** use yaml-edit fork, remove sequence workaround [DEV-325] ([bf5ba9d](https://github.com/black-atom-industries/livery/commit/bf5ba9d38b6cff778d39ef16004486e1e54e2d77))
* canonicalize yaml path validation and fix enabledApps filter semantics ([#27](https://github.com/black-atom-industries/livery/issues/27)) ([1cec7ff](https://github.com/black-atom-industries/livery/commit/1cec7ff2a67dd0ea3b8665285b4fd73c2a8f6174))
* **fe:** pass queryClient to devtools panel to fix context error ([4062282](https://github.com/black-atom-industries/livery/commit/40622820093f09afed3ae09a6dd81d169a544c0d))
* grant pull-requests write permission for Claude review ([abbb066](https://github.com/black-atom-industries/livery/commit/abbb0669df62cd2abf6f18803936ca02719c427b))
* grant write permissions for interactive Claude workflow ([8bc7a1e](https://github.com/black-atom-industries/livery/commit/8bc7a1e0a7cd6b9c59681d5afb0b20d20444ef61))
* only swap review label on successful review ([b66f2ef](https://github.com/black-atom-industries/livery/commit/b66f2efb581d117ac7e6748379a582f3bbbd1ef8))
* review workflow triggers only on label, swaps to reviewed after ([f3e2a01](https://github.com/black-atom-industries/livery/commit/f3e2a017d5be934ccfdbd94895e9b2d68d445527))


### Documentation

* add Livery UI design language spec [DES-25, DES-26] ([26a4830](https://github.com/black-atom-industries/livery/commit/26a4830aaef0b04a0a3492afe6d4263c74406205))
* add theme picker UI design (DEV-275) ([bad9a9d](https://github.com/black-atom-industries/livery/commit/bad9a9d026f314d19e879bec71026f9f708ba501))
* add theme picker UI implementation plan (DEV-275) ([2034bf7](https://github.com/black-atom-industries/livery/commit/2034bf7331b5065328138f53f1ebea4df5df1b1b))
* **be:** update app integration steps for tauri-specta bindings ([da5d352](https://github.com/black-atom-industries/livery/commit/da5d3527bfb2d347d9dd8fca112436a29b2cedc2))
* restructure README with sections and links ([bbcacac](https://github.com/black-atom-industries/livery/commit/bbcacac9ae75bc69cbcf99d0714ac687526cacc6))
* split AGENTS.md and docs into scoped frontend/backend structure [DEV-324] ([#19](https://github.com/black-atom-industries/livery/issues/19)) ([c794695](https://github.com/black-atom-industries/livery/commit/c794695433dd7e7618cc23ebf192fd635a42e484))
* sync AGENTS.md to PR [#15](https://github.com/black-atom-industries/livery/issues/15), [#16](https://github.com/black-atom-industries/livery/issues/16), [#17](https://github.com/black-atom-industries/livery/issues/17) changes ([68ef388](https://github.com/black-atom-industries/livery/commit/68ef3884efe62701766317b312dc6fc80f0db599))


### CI

* add ci type to release-please config ([84a6642](https://github.com/black-atom-industries/livery/commit/84a6642e0dacfa9a8c54f06a0da9c3d2ccc1f2f8))
* sync Cargo.lock on release-please PR ([adfdd5d](https://github.com/black-atom-industries/livery/commit/adfdd5d83c6d021f267c928399d958bdb3c2089b))

## [0.0.3](https://github.com/black-atom-industries/livery/compare/v0.0.2...v0.0.3) (2026-02-24)

### Features

- pivot from Ink TUI to Tauri v2 desktop app
  ([#9](https://github.com/black-atom-industries/livery/issues/9))
  ([c1fb18f](https://github.com/black-atom-industries/livery/commit/c1fb18fb1465fa033d7b614d87189d1a28b448d6))
- theme picker with Ink UI (pre-Tauri pivot)
  ([c31b5af](https://github.com/black-atom-industries/livery/commit/c31b5af884932ddf8e5b001f72392a6b90be5ac3))

## [0.0.2](https://github.com/black-atom-industries/livery/compare/v0.0.1...v0.0.2) (2026-02-23)

### Features

- initial livery project scaffold
  ([35d04b6](https://github.com/black-atom-industries/livery/commit/35d04b64f9532631fcb3821f485424309ac8a6ae))
