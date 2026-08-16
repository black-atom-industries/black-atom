import type { ThemeProvisioning } from "../bindings.ts";

/**
 * One sentence per provisioning class — the settings row's explanation of
 * how an adapter gets its theme files. Definitions mirror ADAPTERS.md.
 */
export const provisioningCopy: Record<ThemeProvisioning, string> = {
    external:
        "Theme files are provided outside of livery, by a plugin, a binary, or you. Livery only switches between them.",
    linked:
        "Theme files ship with livery and are unpacked on first run, then symlinked into a location the app itself reads; switching selects one via a pointer in the app's config.",
    merged:
        "The app cannot read external theme files. Livery writes the theme's values into its config on every switch.",
};
