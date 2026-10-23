import { Link } from "@tanstack/react-router";
import { Button } from "#/components/button/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";

export function NotFoundPage() {
    return (
        <main>
            <Section variant="page">
                <Stack gap="lg">
                    <Heading variant="display-sm">Not found</Heading>
                    <Text variant="lead" tone="subtle">
                        There is nothing at this address. The page may have moved, or the link has a
                        typo.
                    </Text>
                    <Stack direction="row" gap="xl" isWrapped>
                        <Button variant="cta" render={<Link to="/" />}>
                            Home
                        </Button>
                        <Button render={<Link to="/black-atom" hash="themes" />}>All themes</Button>
                    </Stack>
                </Stack>
            </Section>
        </main>
    );
}
