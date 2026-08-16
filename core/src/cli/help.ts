import * as colors from "@std/fmt/colors";

/**
 * Display help information about commands and usage
 */
export default function help(): void {
    console.log(`Usage:
  deno task generate                                 (inside an adapter directory, or at the repo root)
  deno run -A ../../core/src/cli/index.ts generate [--watch]

  The compiled binary (${colors.dim("deno task cli:compile")}) takes the same commands.

Commands:
  ${colors.yellow("generate")}        Generate theme files from templates
    ${colors.dim("Options:")}
    ${colors.cyan("--watch, -w")}       Watch for changes and regenerate themes

  ${colors.cyan("--help, -h")}        Show this help message
`);
}
