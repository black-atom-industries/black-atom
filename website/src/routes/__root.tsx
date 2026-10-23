import { lazy, Suspense, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import globalCss from "#/styles/global.css?url";

const Devtools = import.meta.env.DEV ? lazy(() => import("#/devtools.tsx")) : () => null;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
    return (
        <RootDocument>
            <Outlet />
        </RootDocument>
    );
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
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
