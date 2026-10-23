import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export default function Devtools() {
    const router = useRouter();
    return (
        <TanStackDevtools
            config={{ hideUntilHover: true, position: "bottom-left" }}
            plugins={[
                {
                    name: "TanStack Query",
                    render: <ReactQueryDevtoolsPanel client={router.options.context.queryClient} />,
                },
                {
                    name: "TanStack Router",
                    render: <TanStackRouterDevtoolsPanel router={router} />,
                },
            ]}
        />
    );
}
