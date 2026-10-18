import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useTheme } from "../../queries/themes";
import { Placeholder } from "../../components/placeholder";
import { Page } from "../../components/ui-preview/page";
import { Section } from "../../components/ui-preview/section";
import { SectionTitle } from "../../components/ui-preview/section-title";
import { SyntaxTokenTree } from "../../components/syntax-preview/syntax-token-tree";
import { EditorFrame } from "../../components/syntax-preview/editor-frame";
import type { EditorFile } from "../../components/syntax-preview/editor-frame";
import { SyntaxPreviewLayout } from "../../components/syntax-preview/syntax-preview-layout";
import { TypeScriptSnippet } from "../../partials/syntax-preview/snippets/typescript";
import { RustSnippet } from "../../partials/syntax-preview/snippets/rust";
import { PythonSnippet } from "../../partials/syntax-preview/snippets/python";
import { GoSnippet } from "../../partials/syntax-preview/snippets/go";
import { ReactTsxSnippet } from "../../partials/syntax-preview/snippets/react-tsx";
import { HtmlSnippet } from "../../partials/syntax-preview/snippets/html";
import { CssSnippet } from "../../partials/syntax-preview/snippets/css";

export const Route = createFileRoute("/preview/syntax")({
    component: Component,
});

function Component() {
    const { themeKey } = useSearch({ from: "__root__" });
    const { data: theme, isLoading } = useTheme(themeKey);

    if (isLoading || !theme) {
        return (
            <Placeholder minHeight={200}>
                <p>Loading…</p>
            </Placeholder>
        );
    }

    return (
        <Page>
            <Section>
                <SectionTitle>
                    {theme.meta.collection.label} :: {theme.meta.name}
                </SectionTitle>
                <SyntaxPreviewLayout
                    sidebar={<SyntaxTokenTree syntax={theme.syntax} />}
                    main={<EditorFrame files={files} />}
                />
            </Section>
        </Page>
    );
}

const files: EditorFile[] = [
    {
        key: "typescript",
        file: "processor.ts",
        filetype: "typescript",
        content: <TypeScriptSnippet />,
        state: {
            cursor: { line: 22, col: 4 },
            signs: { 10: "add", 11: "add", 21: "modify" },
            search: [
                { line: 18, col: 8, length: 7 },
                { line: 22, col: 4, length: 7 },
                { line: 25, col: 9, length: 7 },
            ],
            diagnostic: {
                line: 11,
                message: "'isDebug' is declared but never read",
                severity: "warn",
            },
        },
    },
    {
        key: "rust",
        file: "config.rs",
        filetype: "rust",
        content: <RustSnippet />,
        state: { cursor: { line: 28, col: 4 }, signs: { 17: "modify", 23: "add" } },
    },
    {
        key: "python",
        file: "user.py",
        filetype: "python",
        content: <PythonSnippet />,
        state: { cursor: { line: 16, col: 4 }, signs: { 12: "add" } },
    },
    {
        key: "go",
        file: "server.go",
        filetype: "go",
        content: <GoSnippet />,
        state: {
            cursor: { line: 27, col: 2 },
            signs: { 30: "add", 31: "add", 32: "add", 33: "add" },
        },
    },
    {
        key: "react",
        file: "badge.tsx",
        filetype: "typescriptreact",
        content: <ReactTsxSnippet />,
        state: {
            cursor: { line: 12, col: 6 },
            signs: { 9: "add", 12: "modify", 15: "delete" },
            search: [
                { line: 9, col: 9, length: 8 },
                { line: 13, col: 17, length: 8 },
                { line: 22, col: 7, length: 8 },
            ],
            selection: { line: 20, col: 8, length: 16 },
            diagnostic: {
                line: 22,
                message: "Property 'Detail' does not exist on type 'typeof Badge'",
                severity: "negative",
            },
            completion: [
                { label: "preventDefault", kind: "method" },
                { label: "persist", kind: "method" },
                { label: "pageX", kind: "property" },
                { label: "pageY", kind: "property" },
            ],
        },
    },
    {
        key: "html",
        file: "index.html",
        filetype: "html",
        content: <HtmlSnippet />,
        state: { cursor: { line: 18, col: 6 }, signs: { 19: "modify" } },
    },
    {
        key: "css",
        file: "container.css",
        filetype: "css",
        content: <CssSnippet />,
        state: {
            cursor: { line: 11, col: 2 },
            signs: { 13: "add", 14: "add", 15: "add", 16: "add" },
        },
    },
];
