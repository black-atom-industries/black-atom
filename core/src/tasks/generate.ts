import { generateAllAdapters } from "./adapters/generate.ts";
import process from "node:process";
import log from "../lib/log.ts";

const results = await generateAllAdapters({ logErrors: true });
const errors = results.filter((r) => r.error);
if (errors.length > 0) {
    log.error(`${errors.length}/${results.length} adapters failed to generate`);
    process.exit(1);
}
log.success(`Generated ${results.length} adapters`);
