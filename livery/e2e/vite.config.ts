import { mergeConfig } from "vite";
import base from "../vite.config.ts";

// A deps cache of its own: the developer's Vite server on the same sources
// must never see this server re-optimize under it.
export default mergeConfig(base, { cacheDir: "e2e/.vite" });
