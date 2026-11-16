export const impressum = {
    title: "Impressum",
    description: "Impressum of Black Atom Industries.",
    sections: [
        {
            title: "Angaben gemäß § 5 DDG",
            address: [
                [{ placeholder: "[Full name]" }],
                ["Black Atom Industries"],
                [{ placeholder: "[Street and number]" }],
                [{ placeholder: "[Postcode and city]" }],
                ["Germany"],
            ],
            entries: [
                { title: "Kontakt", body: ["E-Mail: ", { placeholder: "[address]" }] },
                {
                    title: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
                    body: [{ placeholder: "[Full name, address as above]" }],
                },
            ],
        },
    ],
} as const;

export const privacy = {
    title: "Privacy",
    description:
        "How black-atom.industries handles your data: Vercel hosting, cookieless analytics, GitHub data fetched by the server, settings kept in your browser, self-hosted fonts.",
    sections: [
        { title: "Who is responsible", body: ["The person named in the Impressum."] },
        {
            title: "Hosting",
            body: [
                "The site is hosted by Vercel. When you open a page, Vercel processes your IP address and request data to deliver it and keeps server logs. ",
                { placeholder: "[Vercel's data processing terms and retention period.]" },
            ],
        },
        {
            title: "Visitor statistics",
            body: [
                "The site uses Vercel Web Analytics. It sets no cookies and stores no personal data; page views are counted with a daily rotating hash.",
            ],
        },
        {
            title: "Data from GitHub",
            body: [
                "Changelogs and commits are fetched from GitHub by the site's server, not by your browser. GitHub receives no data about you.",
            ],
        },
        {
            title: "Stored in your browser",
            body: [
                "Your theme and sound settings are kept in your browser's local storage so they stay when you come back. They never leave your device.",
            ],
        },
        {
            title: "Fonts",
            body: [
                "Fonts are served from this site. No requests go to Google or other font services.",
            ],
        },
        {
            title: "Your rights",
            body: [
                {
                    placeholder:
                        "[Rights under Art. 15–21 GDPR, right to complain to a supervisory authority.]",
                },
            ],
        },
    ],
} as const;
