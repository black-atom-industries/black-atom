import type { ReactNode } from "react";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";

type Props = {
    /** Buttons and links under the scene, each on its own backing so they stay readable over any scene. */
    actions: ReactNode;
};

/** The studio page's hero: the black hole centred, the actions beneath it. */
export function HomeHero({ actions }: Props) {
    return (
        <Section variant="hero-centered" id="top" data-partial="HomeHero">
            <SceneAnchor variant="center-hole" />
            <Stack direction="row" gap="sm" justify="center" isWrapped>
                {actions}
            </Stack>
        </Section>
    );
}
