import type * as Theme from "@black-atom/core";

/**
 * Repository paths of the files an adapter generates for one theme. Neovim keeps every theme flat
 * in `colors/`; Kagi generates one file per dark/light pair, named without the appearance.
 */
export function adapterFilePaths({
    adapterId,
    extensions,
    theme,
}: {
    adapterId: string;
    extensions: readonly string[];
    theme: Theme.Meta;
}): string[] {
    if (adapterId === "nvim") return [`adapters/nvim/colors/${theme.key}.lua`];

    const fileName =
        adapterId === "kagi" ? theme.key.slice(0, -`-${theme.appearance}`.length) : theme.key;
    return extensions.map(
        (extension) =>
            `adapters/${adapterId}/themes/${theme.collection.key}/${fileName}.${extension}`,
    );
}
