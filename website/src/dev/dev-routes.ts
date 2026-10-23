import { createRoute, lazyRouteComponent, type AnyRoute } from "@tanstack/react-router";

const soundLabPath = "/dev/sound";
/** The router is created per request on the server; each creation replaces the previous lab route. */
let added: AnyRoute | undefined;

/**
 * Development-only pages, added to the generated tree in code so they never reach the route tree
 * file or the production build.
 */
export function addDevRoutes(root: AnyRoute) {
    const soundLab = createRoute({
        getParentRoute: () => root,
        path: soundLabPath,
        head: () => ({ meta: [{ title: "Sound lab" }] }),
        component: lazyRouteComponent(() => import("./sound-lab.tsx"), "SoundLab"),
    });
    const children: AnyRoute[] = Array.isArray(root.children) ? root.children : [];
    root.addChildren([...children.filter((child) => child !== added), soundLab]);
    added = soundLab;
}
