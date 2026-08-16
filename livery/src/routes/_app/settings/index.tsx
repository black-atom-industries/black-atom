import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/")({
    beforeLoad: () => {
        throw Route.redirect({ to: "/settings/adapters" });
    },
});
