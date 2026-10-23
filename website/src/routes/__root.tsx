import { lazy, Suspense, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
    createRootRouteWithContext,
    HeadContent,
    Outlet,
    retainSearchParams,
    ScriptOnce,
    Scripts,
    useLocation,
} from "@tanstack/react-router";
import { z } from "zod";
import { useTheme } from "#/hooks/use-theme.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { Dock } from "#/partials/dock/index.ts";
import { ThemePanel } from "#/partials/theme-panel/index.ts";
import globalCss from "#/styles/global.css?url";
import { themeScript } from "./-theme-script.ts";

const Devtools = import.meta.env.DEV ? lazy(() => import("#/devtools.tsx")) : () => null;

const rootSearchSchema = z.object({
    theme: z.string().optional().catch(undefined),
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    validateSearch: rootSearchSchema,
    search: {
        middlewares: [retainSearchParams(["theme"])],
    },
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "Black Atom Industries" },
        ],
        links: [{ rel: "stylesheet", href: globalCss }],
    }),
    component: RootComponent,
});

function RootComponent() {
    const { theme, setTheme } = useTheme();
    const pathname = useLocation({ select: (location) => location.pathname });

    return (
        <RootDocument>
            <Outlet />
            <Dock
                themeLabel="Theme"
                closeLabel="Close"
                themePanel={
                    <ThemePanel
                        themeKey={theme.meta.key}
                        onSelect={setTheme}
                        sharePath={pathname}
                    />
                }
            />
        </RootDocument>
    );
}

function RootDocument({ children }: { children: ReactNode }) {
    const { theme } = useTheme();

    return (
        <html
            lang="en"
            data-theme={theme.meta.key}
            data-appearance={theme.meta.appearance}
            style={{ colorScheme: theme.meta.appearance, ...themeToCustomProperties(theme) }}
            suppressHydrationWarning
        >
            <head>
                <HeadContent />
                <ScriptOnce children={themeScript} />
            </head>
            <body>
                {children}
                <Suspense>
                    <Devtools />
                </Suspense>
                <Scripts />
            </body>
        </html>
    );
}
