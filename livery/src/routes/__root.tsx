import { createRootRoute, Outlet } from "@tanstack/react-router";
import { App } from "../components/layouts/app.ts";

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <App.Shell>
            <Outlet />
        </App.Shell>
    );
}
