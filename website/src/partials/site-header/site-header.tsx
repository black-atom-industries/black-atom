import type { ReactElement } from "react";
import { BrandMark } from "#/components/brand-mark/index.ts";
import { HeaderBar } from "#/components/header-bar/index.ts";
import { NavLink } from "#/components/nav-link/index.ts";
import { Rule } from "#/components/rule/index.ts";
import { Stack } from "#/components/stack/index.ts";

export type NavItem = {
    label: string;
    number?: string;
    /** Placed after the divider. */
    isSecondary?: boolean;
    /** The link element, such as a router `<Link>`; it marks the current page with `aria-current`. */
    render: ReactElement;
};

type Props = {
    brand: { title: string; subtitle: string; render: ReactElement };
    navLabel: string;
    items: readonly NavItem[];
};

export function SiteHeader({ brand, navLabel, items }: Props) {
    const primary = items.filter((item) => !item.isSecondary);
    const secondary = items.filter((item) => item.isSecondary);

    return (
        <HeaderBar>
            <BrandMark title={brand.title} subtitle={brand.subtitle} render={brand.render} />
            <Stack
                render={<nav aria-label={navLabel} />}
                direction="row"
                gap="sm"
                isWrapped
                data-partial="SiteHeader"
            >
                {primary.map((item) => (
                    <NavLink key={item.label} number={item.number} render={item.render} isChip>
                        {item.label}
                    </NavLink>
                ))}
                {primary.length > 0 && secondary.length > 0 && <Rule orientation="vertical" />}
                {secondary.map((item) => (
                    <NavLink key={item.label} number={item.number} render={item.render} isChip>
                        {item.label}
                    </NavLink>
                ))}
            </Stack>
        </HeaderBar>
    );
}
