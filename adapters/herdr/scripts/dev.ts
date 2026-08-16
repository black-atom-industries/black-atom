const watchPaths = ["themes", "black-atom-adapter.json"];
let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;
let queued = false;

async function generate(): Promise<void> {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  try {
    const command = new Deno.Command("deno", {
      args: ["task", "generate"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { code } = await command.output();
    if (code !== 0) {
      console.error(`Generate failed with exit code ${code}`);
    }
  } finally {
    running = false;
    if (queued) {
      queued = false;
      await generate();
    }
  }
}

function isRelevantChange(path: string): boolean {
  return path.includes(".template.") ||
    path.endsWith("black-atom-adapter.json");
}

await generate();

for await (const event of Deno.watchFs(watchPaths)) {
  if (event.kind !== "modify" && event.kind !== "create") {
    continue;
  }
  if (!event.paths.some(isRelevantChange)) {
    continue;
  }

  if (timer !== undefined) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = undefined;
    void generate();
  }, 300);
}
