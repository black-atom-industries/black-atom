import process from "node:process";
import { generateDevelopment } from "../core/src/tasks/adapters/watch.ts";

const paths = process.argv.slice(2);
await generateDevelopment(paths.length ? paths : undefined);
