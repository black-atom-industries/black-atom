import preview from "#/storybook/preview.tsx";
import { MediaFrame } from "./media-frame.tsx";

const placeholder = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#2a2f35"/><path d="M0 450 400 120 800 450" fill="#3d444c"/></svg>',
)}`;

const meta = preview.meta({
    title: "Components/MediaFrame",
    component: MediaFrame,
    args: {
        src: placeholder,
        alt: "The status drawer: moving through files previews each diff",
        width: 800,
        height: 450,
    },
    render: (args) => (
        <div style={{ maxWidth: 640 }}>
            <MediaFrame {...args} />
        </div>
    ),
});

export const Default = meta.story();

export const WithCaption = meta.story({
    args: { caption: "Moving through files previews each diff." },
});
