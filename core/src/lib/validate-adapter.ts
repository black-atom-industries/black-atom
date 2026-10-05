import * as z from "zod";
import type * as Theme from "../types/theme.ts";

/**
 * Factory function that creates the adapter config schema
 * @param themeKeys - Array of valid theme keys to validate against
 * @returns Zod schema for adapter configuration
 */
export function createAdapterConfigSchema(themeKeys: readonly string[]) {
    const collectionConfigSchema = z.object({
        template: z.union([z.string(), z.array(z.string()).min(1)]),
        output: z.string().optional(),
        themes: z.array(z.enum(themeKeys as unknown as [string, ...string[]])).min(1),
    });

    // Create a type-safe collections schema that requires all CollectionKey values
    const collectionEntries: Record<Theme.CollectionKey, typeof collectionConfigSchema> = {
        default: collectionConfigSchema,
        jpn: collectionConfigSchema,
        facility: collectionConfigSchema,
        terra: collectionConfigSchema,
        clay: collectionConfigSchema,
        minium: collectionConfigSchema,
        mono: collectionConfigSchema,
    };

    const collectionsSchema = z.object(collectionEntries).partial();

    return z.object({
        $schema: z.string(),
        enabled: z.boolean().optional().default(true),
        postGenerate: z.string().optional(),
        collections: collectionsSchema,
    });
}

export type AdapterConfig = z.infer<ReturnType<typeof createAdapterConfigSchema>>;
