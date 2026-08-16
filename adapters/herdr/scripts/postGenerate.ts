import { join } from "@std/path";

type Collection = {
  themes: string[];
};

type AdapterConfig = {
  collections: Record<string, Collection>;
};

const themesDir = "themes";
const generatedThemePattern = /^black-atom-.+\.toml$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readAdapterConfig(value: unknown): AdapterConfig {
  if (!isRecord(value) || !isRecord(value.collections)) {
    throw new Error("Adapter config must define collections");
  }

  const collections: Record<string, Collection> = {};
  for (const [name, collectionValue] of Object.entries(value.collections)) {
    if (!isRecord(collectionValue) || !Array.isArray(collectionValue.themes)) {
      throw new Error(`Collection ${name} must define themes`);
    }
    if (
      !collectionValue.themes.every((theme): theme is string =>
        typeof theme === "string"
      )
    ) {
      throw new Error(`Collection ${name} contains an invalid theme key`);
    }
    collections[name] = { themes: collectionValue.themes };
  }

  return { collections };
}

async function removeGeneratedFiles(collectionDir: string): Promise<void> {
  try {
    for await (const entry of Deno.readDir(collectionDir)) {
      if (!entry.isFile || !generatedThemePattern.test(entry.name)) {
        continue;
      }

      const theme = entry.name.slice(0, -".toml".length);
      if (!themeCollections.has(theme) || generatedThemeSet.has(theme)) {
        await Deno.remove(join(collectionDir, entry.name));
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

const rawConfig = JSON.parse(
  await Deno.readTextFile("black-atom-adapter.json"),
) as unknown;
const config = readAdapterConfig(rawConfig);
const themeCollections = new Map<string, string>();

for (
  const [collection, collectionConfig] of Object.entries(config.collections)
) {
  for (const theme of collectionConfig.themes) {
    if (themeCollections.has(theme)) {
      throw new Error(`Theme ${theme} belongs to more than one collection`);
    }
    themeCollections.set(theme, collection);
  }
}

const generatedThemes: string[] = [];
for await (const entry of Deno.readDir(themesDir)) {
  if (!entry.isFile || !generatedThemePattern.test(entry.name)) {
    continue;
  }

  const theme = entry.name.slice(0, -".toml".length);
  if (!themeCollections.has(theme)) {
    throw new Error(
      `Generated theme ${theme} is missing from black-atom-adapter.json`,
    );
  }
  generatedThemes.push(theme);
}

generatedThemes.sort();
const generatedThemeSet = new Set(generatedThemes);
const missingThemes = [...themeCollections.keys()].filter((theme) =>
  !generatedThemeSet.has(theme)
);
if (missingThemes.length > 0) {
  console.warn(
    `Generated themes missing from this core version: ${
      missingThemes.join(", ")
    }`,
  );
}

for (const collection of Object.keys(config.collections)) {
  const collectionDir = join(themesDir, collection);
  await Deno.mkdir(collectionDir, { recursive: true });
  await removeGeneratedFiles(collectionDir);
}

for (const theme of generatedThemes) {
  const collection = themeCollections.get(theme);
  if (!collection) {
    throw new Error(`No collection found for ${theme}`);
  }

  await Deno.rename(
    join(themesDir, `${theme}.toml`),
    join(themesDir, collection, `${theme}.toml`),
  );
}
