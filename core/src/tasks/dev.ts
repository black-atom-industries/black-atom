/**
 * Watches themes and adapter templates, regenerating on change.
 *
 * Usage:
 *   npm run dev
 */

import { watch } from "./adapters/watch.ts";

await watch();
