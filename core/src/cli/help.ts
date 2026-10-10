import { styleText } from "node:util";

/**
 * Display help information about commands and usage
 */
export default function help(): void {
    console.log(`Usage:
  node core/src/tasks/generate.ts                            (from the repo root)
  node ../../core/src/cli/index.ts generate [--watch] (inside an adapter directory)

Commands:
  ${styleText("yellow", "generate")}        Generate theme files from templates
    ${styleText("dim", "Options:")}
    ${styleText("cyan", "--watch, -w")}       Watch for changes and regenerate themes

  ${styleText("cyan", "--help, -h")}        Show this help message
`);
}
