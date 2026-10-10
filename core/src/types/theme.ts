import type {
    CatalogCollectionKey,
    CatalogCollectionMeta,
    CatalogThemeKey,
    CatalogThemeKeysForCollection,
    themeCatalog,
} from "../themes/catalog.ts";
import type { HexColor } from "./colors.ts";

export type ThemeDefinition<
    ThemeKey extends string = string,
    CollectionKey extends string = string,
> = Colors & {
    meta: {
        key: ThemeKey;
        name: string;
        label: string;
        appearance: "light" | "dark";
        status: "development" | "release";
        collection: {
            key: CollectionKey;
            label: string;
            order: number;
        };
    };
};

export type CollectionDefinition<
    CollectionKey extends string,
    Themes extends Record<string, ThemeDefinition>,
> = {
    meta: {
        key: CollectionKey;
        label: string;
        order: number;
    };
    themes: Themes;
};

export type Key = CatalogThemeKey;
export type CollectionKey = CatalogCollectionKey;
export type CollectionMeta = CatalogCollectionMeta;
export type KeysForCollection<C extends CollectionKey> = CatalogThemeKeysForCollection<C>;
export type Meta = (typeof themeCatalog)[Key]["meta"];
export type MetaBase = Omit<Meta, "label">;

export interface Primaries {
    d10: HexColor;
    d20: HexColor;
    d30: HexColor;
    d40: HexColor;
    m10: HexColor;
    m20: HexColor;
    m30: HexColor;
    m40: HexColor;
    l10: HexColor;
    l20: HexColor;
    l30: HexColor;
    l40: HexColor;
}

export interface Accents {
    a10: HexColor;
    a20: HexColor;
    a30?: HexColor;
    a40?: HexColor;
}

export interface Palette {
    black: HexColor;
    gray: HexColor;
    darkRed: HexColor;
    red: HexColor;
    darkGreen: HexColor;
    green: HexColor;
    darkYellow: HexColor;
    yellow: HexColor;
    darkBlue: HexColor;
    blue: HexColor;
    darkMagenta: HexColor;
    magenta: HexColor;
    darkCyan: HexColor;
    cyan: HexColor;
    lightGray: HexColor;
    white: HexColor;
}

export interface Feedback {
    negative: HexColor;
    success: HexColor;
    info: HexColor;
    warning: HexColor;
}

interface UiBackground {
    default: HexColor;
    panel: HexColor;
    float: HexColor;
    active: HexColor;
    disabled: HexColor;
    hover: HexColor;
    selection: HexColor;
    search: HexColor;
    contrast: HexColor;
    negative: HexColor;
    warn: HexColor;
    info: HexColor;
    hint: HexColor;
    positive: HexColor;
    add: HexColor;
    delete: HexColor;
    modify: HexColor;
}

interface UiForeground {
    default: HexColor;
    subtle: HexColor;
    accent: HexColor;
    disabled: HexColor;
    contrast: HexColor;
    negative: HexColor;
    warn: HexColor;
    info: HexColor;
    hint: HexColor;
    positive: HexColor;
    add: HexColor;
    delete: HexColor;
    modify: HexColor;
}

export interface Ui {
    bg: UiBackground;
    fg: UiForeground;
}

export interface Syntax {
    variable: {
        default: HexColor;
        builtin: HexColor;
        parameter: HexColor;
        member: HexColor;
    };
    string: {
        default: HexColor;
        doc: HexColor;
        regexp: HexColor;
        escape: HexColor;
    };
    boolean: {
        default: HexColor;
    };
    number: {
        default: HexColor;
    };
    property: {
        default: HexColor;
    };
    constant: {
        default: HexColor;
        builtin: HexColor;
    };
    module: {
        default: HexColor;
    };
    type: {
        default: HexColor;
        builtin: HexColor;
    };
    attribute: {
        default: HexColor;
        builtin: HexColor;
    };
    func: {
        default: HexColor;
        builtin: HexColor;
        method: HexColor;
    };
    constructor: {
        default: HexColor;
    };
    operator: {
        default: HexColor;
    };
    keyword: {
        default: HexColor;
        import: HexColor;
        export: HexColor;
    };
    punctuation: {
        default: HexColor;
        delimiter: HexColor;
        bracket: HexColor;
        special: HexColor;
    };
    comment: {
        default: HexColor;
        doc: HexColor;
        todo: HexColor;
        error: HexColor;
        warn: HexColor;
        info: HexColor;
        hint: HexColor;
    };
    tag: {
        default: HexColor;
        builtin: HexColor;
        delimiter: HexColor;
        attribute: HexColor;
    };
    markup: {
        heading: {
            h1: HexColor;
            h2: HexColor;
            h3: HexColor;
            h4: HexColor;
            h5: HexColor;
            h6: HexColor;
        };
        list: {
            default: HexColor;
            checked: HexColor;
            unchecked: HexColor;
        };
        strong: HexColor;
        italic: HexColor;
        strikethrough: HexColor;
        quote: HexColor;
        math: HexColor;
        link: HexColor;
        code: {
            fg: HexColor;
            bg: HexColor;
        };
    };
}

export interface Colors {
    primaries: Primaries;
    accents: Accents;
    palette: Palette;
    feedback: Feedback;
    ui: Ui;
    syntax: Syntax;
}

export type CreatorContext = Pick<Colors, "primaries" | "accents" | "palette" | "feedback">;

export type Definition = (typeof themeCatalog)[Key];
export type DefinitionMap = Partial<Record<Key, Definition>>;
