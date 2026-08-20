# Changelog

## [0.6.0](https://github.com/nikbrunner/black-atom/compare/v0.5.0...v0.6.0) (2026-08-20)


### Features

* **core:** per-collection output dir; waybar and herdr emit themes/&lt;collection&gt;/ black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([013b0eb](https://github.com/nikbrunner/black-atom/commit/013b0eb28244e46372abfa2db8fb714d029ba1fb))
* **herdr:** add sidebar highlight colors ([deafd23](https://github.com/nikbrunner/black-atom/commit/deafd230ef09eb1deb90ddc6e94c78772dbdcf99))
* **herdr:** sidebar row layouts in the managed block black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([2c80a6e](https://github.com/nikbrunner/black-atom/commit/2c80a6ed6847114ceda26800a0a87143c84b8096))
* **livery:** Capability enum pins CLI and GUI parity black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([fe1fe73](https://github.com/nikbrunner/black-atom/commit/fe1fe73b407c51270e4a874a2c667359540ff3fb))
* **livery:** discover Obsidian config folders during setup black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([fa10a6a](https://github.com/nikbrunner/black-atom/commit/fa10a6a5b8a57971f4bb1d3105a31da73cc8b389))
* **livery:** livery apply without a theme opens the picker black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([796031d](https://github.com/nikbrunner/black-atom/commit/796031d3830f48440673d71bf427f606a1d510bd))
* **livery:** livery CLI and the Neovim settings page black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([acaa807](https://github.com/nikbrunner/black-atom/commit/acaa807adff9edbf21f0d53e1aa470348e7eeebd))
* **livery:** themes ship in the binary and unpack under XDG data; config under XDG config black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([63aa4e0](https://github.com/nikbrunner/black-atom/commit/63aa4e007853582dbbe8e2786c84cf1038657234))
* **livery:** track the theme livery last applied black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([74829dc](https://github.com/nikbrunner/black-atom/commit/74829dc22c377f17df12c3b9edfc611b1c8921e8))
* **nvim:** self-contained colorschemes in colors/, runtime reads the config global black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([f2be053](https://github.com/nikbrunner/black-atom/commit/f2be05379a8a446adc7b62c91d4f51984e0e6d7f))
* root dev, dev:adapters, dev:monitor, dev:livery tasks black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([1c667f5](https://github.com/nikbrunner/black-atom/commit/1c667f51ae85376dad8bfcf2bac38e0968e0cd04))


### Refactors

* **core:** generate into adapters/ in-tree, no git side effects black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([cf9c35c](https://github.com/nikbrunner/black-atom/commit/cf9c35ccb509b5b7a1b98660d08d131c35b2bfe3))
* **core:** one generate task over the in-tree adapters black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([e992766](https://github.com/nikbrunner/black-atom/commit/e992766d7f383efac24a1b643efb72adc028e0a8))
* **ghostty:** centralize collection templates and update colors ([44ba8c4](https://github.com/nikbrunner/black-atom/commit/44ba8c45a35cb4b13b7d8e1206e46806bd3e0d7d))
* **livery:** drop the theme download path black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([c89ac19](https://github.com/nikbrunner/black-atom/commit/c89ac19f5c7fa0fbc5611c427750d685634c5450))
* **livery:** split livery_core out of the tauri crate black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([8b9567b](https://github.com/nikbrunner/black-atom/commit/8b9567b418f009a525f39de339247aaee9fd7354))


### Bug Fixes

* **core:** watcher reports failed adapters, CLI awaits generate black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([5e2e5d4](https://github.com/nikbrunner/black-atom/commit/5e2e5d45ec959c9a767d770d683400c08559b6a6))
* **dev:** take the whole process group down on exit black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([dfdf7f4](https://github.com/nikbrunner/black-atom/commit/dfdf7f4b861c4aa75367d9e54ddbf40c816feb9c))
* **livery:** apply system appearance from the CLI black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([32b3a6a](https://github.com/nikbrunner/black-atom/commit/32b3a6a4ef1d2dc56a74be7ee673e6f3f38c9df0))
* **livery:** expose get_active_theme through the dev bridge black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([083298d](https://github.com/nikbrunner/black-atom/commit/083298d3265c7f1f6c8614155f0e494682539607))
* **livery:** review fixes for the bundled-themes livery black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([f93e181](https://github.com/nikbrunner/black-atom/commit/f93e181a0e9f08c88ce403def0236de557f59be1))
* **livery:** symlink ancestors resolve before any mkdir; migration copies through a private temp file black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([f6864bd](https://github.com/nikbrunner/black-atom/commit/f6864bdea13dc3d3e6e56344f4f1d5a902f7f1a5))
* **livery:** time out stalled Neovim reloads black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([9a2152f](https://github.com/nikbrunner/black-atom/commit/9a2152fbf507ed02994b5823aa03423468356e7e))
* **livery:** write the apps in config.json in a stable order black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([04a3dfc](https://github.com/nikbrunner/black-atom/commit/04a3dfceab21e5554f0832394ce9dcf35ee882e0))
* **livery:** write theme symlinks relative to where the link lives black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([8bb3138](https://github.com/nikbrunner/black-atom/commit/8bb31388f400a78c4f44fb628f1c77fdb2e55500))


### Documentation

* cleanup checklist for after the test pass black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([1e1cf63](https://github.com/nikbrunner/black-atom/commit/1e1cf6323de92cf148597595197b4ca7028af387))
* dots inventory in CLEANUP.md before archiving old repos black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([a0ffc6a](https://github.com/nikbrunner/black-atom/commit/a0ffc6aac8aa1e473129a4bdb5199de3d609dac8))
* drop HOW_TO_TEST.md after sign-off black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([4915404](https://github.com/nikbrunner/black-atom/commit/49154043a9476038cb20561b306ccb27276f53c8))
* how to install the livery CLI for testing black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([d777316](https://github.com/nikbrunner/black-atom/commit/d777316a180f70e86da274fe51e83654121b865e))
* one glossary and one set of agent instructions at the root ([1af514b](https://github.com/nikbrunner/black-atom/commit/1af514b568bc71f086d89746639e561d38bc2520))
* READMEs for the tree as it is black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([7053ff1](https://github.com/nikbrunner/black-atom/commit/7053ff10f1b06f999336c163d4a2a39928232dfd))
* root CLAUDE.md and scoped livery AGENTS.md black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([528c523](https://github.com/nikbrunner/black-atom/commit/528c523ef1b33e1fecab2a0cdb2284b777952731))
* six workflow skills for the monorepo black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([84b679d](https://github.com/nikbrunner/black-atom/commit/84b679d4126accd6f75707456ac44784ece3a84f))


### Performance

* **livery:** parallelize CLI apply black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([187524d](https://github.com/nikbrunner/black-atom/commit/187524d5bd88e3cd1e905041fbb5555a06f6ca37))


### CI

* **core:** palette-from-image tests skip when magick is not installed; deno ignores target/ black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([71e0054](https://github.com/nikbrunner/black-atom/commit/71e0054c33627c3755f2191d4e23bcb2843ce4ad))
* one workflow for deno and cargo checks black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([7cc5dd1](https://github.com/nikbrunner/black-atom/commit/7cc5dd1ec1086c96172ee4961a7810022930b5d4))
* release-please for livery and core, versions unchanged black-atom-industries/livery[#68](https://github.com/nikbrunner/black-atom/issues/68) ([c6e6b78](https://github.com/nikbrunner/black-atom/commit/c6e6b78a304dd94e8af14667e8bbf8a73a817f28))
