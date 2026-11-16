import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { addDevRoutes } from "./dev/dev-routes.ts";
import { routeTree } from "./routeTree.gen.ts";

export function getRouter() {
    if (import.meta.env.DEV) addDevRoutes(routeTree);
    const queryClient = new QueryClient();
    const router = createRouter({
        routeTree,
        context: { queryClient },
        scrollRestoration: true,
        defaultPreload: "intent",
    });
    setupRouterSsrQueryIntegration({ router, queryClient });
    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
