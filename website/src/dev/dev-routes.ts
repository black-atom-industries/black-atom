import { createRoute, lazyRouteComponent, type AnyRoute } from "@tanstack/react-router";

const soundLabPath = "/dev/sound";
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
    // The router is created per request on the server and this module reloads on edits, so earlier
    // lab routes are recognised by path, not by identity.
    const devPaths: unknown[] = [soundLabPath];
    const children: AnyRoute[] = Array.isArray(root.children) ? root.children : [];
    root.addChildren([...children.filter((child) => !devPaths.includes(child.id)), soundLab]);
}
