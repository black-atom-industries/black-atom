import { lazy, Suspense, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
    createRootRouteWithContext,
    HeadContent,
    Link,
    Outlet,
    retainSearchParams,
    rootRouteId,
    ScriptOnce,
    Scripts,
    useLocation,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { z } from "zod";
import { BackgroundLayer } from "#/background/background-layer.tsx";
import { blackAtom, blackAtomLinks } from "#/content/products/black-atom.ts";
import { iter } from "#/content/products/iter.ts";
import { radar } from "#/content/products/radar.ts";
import { studio } from "#/content/studio.ts";
import { useRouteBackgroundState } from "#/hooks/use-route-background-state.ts";
import { useSound } from "#/hooks/use-sound.ts";
import { useTheme } from "#/hooks/use-theme.ts";
import { fromShortKey, toShortKey } from "#/lib/theme-precedence.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { Dock } from "#/partials/dock/index.ts";
import { SiteFooter } from "#/partials/site-footer/index.ts";
import { SiteHeader } from "#/partials/site-header/index.ts";
import { SoundPanel } from "#/partials/sound-panel/index.ts";
import { ThemePanel } from "#/partials/theme-panel/index.ts";
import globalCss from "#/styles/global.css?url";
import { NotFoundPage, notFoundTitle } from "./-not-found-page.tsx";
import { themeScript } from "./-theme-script.ts";

const Devtools = import.meta.env.DEV ? lazy(() => import("#/devtools.tsx")) : () => null;

const rootSearchSchema = z.object({
    theme: z
        .string()
        .refine((shortKey) => fromShortKey(shortKey) !== undefined)
        .optional()
        .catch(undefined),
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    validateSearch: rootSearchSchema,
    search: {
        middlewares: [retainSearchParams(["theme"])],
    },
    head: ({ matches }) => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            {
                // A URL that matches no route ends at the root; a route's own not-found sets its title.
                title: matches.at(-1)?.routeId === rootRouteId ? notFoundTitle : studio.name,
            },
            { name: "description", content: studio.description },
        ],
        links: [
            { rel: "stylesheet", href: globalCss },
            { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        ],
    }),
    shellComponent: RootDocument,
    component: RootLayout,
    notFoundComponent: NotFoundPage,
});

function RootLayout() {
    const { theme, setTheme } = useTheme();
    const pathname = useLocation({ select: (location) => location.pathname });
    const backgroundState = useRouteBackgroundState();
    const isSoundAvailable = backgroundState.view === "hole" || backgroundState.view === "wide";
    const sound = useSound({ isAvailable: isSoundAvailable, theme });

    return (
        <>
            <BackgroundLayer theme={theme} />
            <SiteHeader
                brand={{
                    title: "Black Atom",
                    subtitle: "Industries",
                    render: <Link to="/" activeOptions={{ exact: true }} />,
                }}
                navLabel="Main"
                items={[
                    {
                        label: blackAtom.name,
                        number: blackAtom.number,
                        render: <Link to="/black-atom" />,
                    },
                    { label: iter.name, number: iter.number, render: <Link to="/iter" /> },
                    { label: radar.name, number: radar.number, render: <Link to="/radar" /> },
                    { label: "Changelog", isSecondary: true, render: <Link to="/changelog" /> },
                    { label: "About", isSecondary: true, render: <Link to="/about" /> },
                ]}
            />
            <Outlet />
            <SiteFooter
                columns={[
                    {
                        title: blackAtom.name,
                        links: [
                            {
                                label: "Overview",
                                render: <Link to="/black-atom" activeOptions={{ exact: true }} />,
                            },
                            {
                                label: "Themes",
                                render: (
                                    <Link
                                        to="/black-atom"
                                        hash="themes"
                                        activeOptions={{ exact: true, includeHash: true }}
                                    />
                                ),
                            },
                            { label: "Livery", render: <Link to="/black-atom/livery" /> },
                            { label: "Adapters ↗", render: <a href={blackAtomLinks.adapters} /> },
                        ],
                    },
                    {
                        title: "Neovim",
                        links: [
                            { label: iter.name, render: <Link to="/iter" /> },
                            { label: radar.name, render: <Link to="/radar" /> },
                        ],
                    },
                    {
                        title: "Studio",
                        links: [
                            { label: "About", render: <Link to="/about" /> },
                            { label: "Changelog", render: <Link to="/changelog" /> },
                            { label: "GitHub ↗", render: <a href={studio.githubUrl} /> },
                        ],
                    },
                ]}
                about={{ title: studio.name, text: studio.tagline }}
                copyright={studio.copyright}
                legalLabel="Legal"
                legalLinks={[
                    { label: "Impressum", render: <Link to="/impressum" /> },
                    { label: "Privacy", render: <Link to="/privacy" /> },
                ]}
            />
            <Dock
                themeLabel="Theme"
                closeLabel="Close"
                themePanel={
                    <ThemePanel
                        themeKey={theme.meta.key}
                        onSelect={setTheme}
                        sharePath={pathname}
                        documentation={{
                            label: "Theme documentation →",
                            render: (
                                <Link
                                    to="/black-atom/themes/$theme"
                                    params={{ theme: toShortKey(theme.meta.key) }}
                                />
                            ),
                        }}
                    />
                }
                soundLabel={isSoundAvailable ? "Sound" : undefined}
                soundPanel={
                    isSoundAvailable ? (
                        <SoundPanel settings={sound.settings} onChange={sound.onChange} />
                    ) : undefined
                }
            />
        </>
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
                <Analytics />
                <Suspense>
                    <Devtools />
                </Suspense>
                <Scripts />
            </body>
        </html>
    );
}
