import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    return (
        <main>
            <h1>Black Atom Industries</h1>
        </main>
    );
}
