/**
 * @module
 *
 * CLI entrypoint for Black Atom Core theme generation.
 *
 * Run from an adapter directory to generate platform-specific theme files
 * from templates and core theme definitions.
 *
 * @example
 * ```sh
 * deno task generate
 * deno run -A ../../core/src/cli/index.ts generate --watch
 * ```
 */

import generate from "./generate.ts";
import help from "./help.ts";

if (import.meta.main) {
    const command = Deno.args[0];
    const options = Deno.args.slice(1);

    switch (command) {
        case "generate":
            await generate(options);
            break;

        case "-h":
        case "--help":
            help();
            break;

        default:
            help();
            Deno.exit(1);
    }
}
