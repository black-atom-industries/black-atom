import type * as Theme from "../types/theme.ts";
import { traceSources } from "./trace-sources.ts";

type Creator<Value, Keys extends keyof Theme.Colors> =
    | Value
    | ((context: Pick<Theme.Colors, Keys>) => Value);

type Input = Pick<Theme.Colors, "primaries"> & {
    accents: Creator<Theme.Accents, "primaries">;
    palette: Creator<Theme.Palette, "primaries" | "accents">;
    feedback: Creator<Theme.Feedback, "primaries" | "accents" | "palette">;
    ui: Creator<Theme.Ui, "primaries" | "accents" | "palette" | "feedback">;
    syntax: Creator<Theme.Syntax, "primaries" | "accents" | "palette" | "feedback">;
};

function isCreator<Value, Context>(
    value: Value | ((context: Context) => Value),
): value is (context: Context) => Value {
    return typeof value === "function";
}

function resolve<Value, Context>(
    value: Value | ((context: Context) => Value),
    context: Context,
): Value {
    return isCreator(value) ? value(context) : value;
}

export function defineThemeColors(input: Input): Theme.Colors {
    const primaries = input.primaries;
    const accents = resolve(input.accents, { primaries });
    const palette = resolve(input.palette, { primaries, accents });
    const feedback = resolve(input.feedback, { primaries, accents, palette });
    const context = { primaries, accents, palette, feedback };

    return {
        ...context,
        ui: resolve(input.ui, context),
        syntax: resolve(input.syntax, context),
        sources: {
            ...trace("accents", input.accents, { primaries }),
            ...trace("palette", input.palette, { primaries, accents }),
            ...trace("feedback", input.feedback, { primaries, accents, palette }),
            ...trace("ui", input.ui, context),
            ...trace("syntax", input.syntax, context),
        },
    };
}

function trace<Value, Context extends object>(
    layer: string,
    value: Value | ((context: Context) => Value),
    context: Context,
): Theme.Sources {
    return isCreator(value) ? traceSources(layer, value, context) : {};
}
