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
 * node ../../core/src/cli/index.ts generate
 * node ../../core/src/cli/index.ts generate --watch
 * ```
 */

import process from "node:process";
import generate from "./generate.ts";
import help from "./help.ts";

if (import.meta.main) {
    const command = process.argv[2];
    const options = process.argv.slice(3);

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
            process.exit(1);
    }
}
