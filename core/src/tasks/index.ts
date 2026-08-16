import { generateAllRepositories } from "./adapters/generate.ts";
import log from "../lib/log.ts";

/**
 * Task runner for Deno tasks
 */
if (import.meta.main) {
    const taskName = Deno.args[0];

    switch (taskName) {
        case "adapters:gen": {
            log.info("Generating themes for adapters...");
            const results = await generateAllRepositories({ logErrors: true });
            const errors = results.filter((r) => r.error);
            if (errors.length > 0) {
                log.error(`${errors.length}/${results.length} adapters failed to generate`);
                Deno.exit(1);
            }
            log.success(`Generated ${results.length} adapters`);
            break;
        }

        default: {
            log.error(`Unknown task: ${taskName}`);
            log.info("Available tasks:");
            log.info(
                "  - adapters:gen: Generate themes for all adapters",
            );
            Deno.exit(1);
        }
    }
}
