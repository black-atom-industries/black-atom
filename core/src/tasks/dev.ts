/**
 * Watches themes and adapter templates, regenerating on change.
 *
 * Usage:
 *   deno task dev
 */

import { watch } from "./adapters/watch.ts";

await watch();
