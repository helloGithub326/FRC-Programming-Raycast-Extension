import { List, Cache, ActionPanel, Action } from "@raycast/api";
import { useState, useRef } from "react";

const cache = new Cache();
const SEARCH_TEXT_KEY = "searchText";

function htmlToText(html: string) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type ClassItem = {
    name: string;
    url: string;
    path: string;
    methods: Array<{ name: string; signature: string; url: string }>;
};

async function getDocumentation(onProgress: (current: number, total: number) => void) {
    try {
        const response = await fetch("https://github.wpilib.org/allwpilib/docs/release/java/allclasses-index.html", {
            method: "get"
        });
        const text = await response.text();
        const htmlText = text.replace(/^updateSearchIndex\(/, '').replace(/\);$/, '');

        const regex = /href="([^"]+\.html)"[^>]*>([^<]+)<\/a>/g;
        const classesList: ClassItem[] = [];
        let match;

        while ((match = regex.exec(htmlText)) !== null) {
            const relativePath = match[1];
            const className = match[2].trim();
            
            if (relativePath.startsWith('#')) continue;
            if (className.length <= 1) continue;

            classesList.push({
                name: className,
                url: `https://github.wpilib.org/allwpilib/docs/release/java/${relativePath}`,
                path: relativePath,
                methods: []
            });
        }

        const uniqueClasses = Array.from(new Map(classesList.map(item => [item.url, item])).values()).splice(4);
        const totalCount = uniqueClasses.length;

        let num = 0;
        for (const item of uniqueClasses) {
            try {
                const classResponse = await fetch(item.url, {
                    method: "get"
                });
                const classText = await classResponse.text();
                const classHtmlText = classText.replace(/^updateSearchIndex\(/, '').replace(/\);$/, '');
                const methodsList: { name: string; signature: string; description: string; url: string; }[] = [];

                const rowRegex = /<(tr|div)[^>]*(?:summary-table|row)[^>]*>([\s\S]*?)<\/\1>/gi;
                let rowMatch;

                while ((rowMatch = rowRegex.exec(classHtmlText)) !== null) {
                    const rowHtml = rowMatch[2];
                    const methodLinkMatch = /<a[^>]*href="#([^"]+\([^\)]*\))"[^>]*>([^<]+)<\/a>/i.exec(rowHtml);
                    if (!methodLinkMatch) {
                        continue;
                    }

                    const methodSignature = methodLinkMatch[1];
                    const methodName = methodLinkMatch[2].trim();
                    if (methodsList.some(m => m.signature === methodSignature)) {
                        continue;
                    }

                    let methodDescription = "";
                    const descMatch = /<(td|div)[^>]*(?:col-last|block|description)[^>]*>([\s\S]*?)<\/\1>/i.exec(rowHtml);
                    
                    if (descMatch && descMatch[2]) {
                        methodDescription = htmlToText(descMatch[2]);
                    }

                    methodsList.push({
                        name: methodName,
                        signature: methodSignature,
                        description: methodDescription,
                        url: `${item.url}#${methodSignature}`
                    });
                }
                item.methods = methodsList;

                num++;
                onProgress(num, totalCount);
            } catch (error) {
                console.log(error);
                return;
            }
        }

        return uniqueClasses;
    } catch (error) {
        console.log(error);
    }
}

function getClassMarkdown(item: ClassItem): string {
    let markdown = "";
    markdown += `## ${item.name}\n\n`;

    if (item.methods.length > 0) {
        markdown += `### Methods\n\n`;
        let previousName = "";
        let signature = "";

        for (const method of item.methods) {
            signature = method.signature;
            try {
                signature = decodeURIComponent(signature);
            } catch {
                signature = signature.replace(/%3Cinit%3E/gi, "<init>");
            }
            signature = signature.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            if (method.name != previousName) {
                markdown += `${method.name}:\n\n`;
            }
            markdown += `- ${signature}`;

            markdown += `\n\n`;
            previousName = method.name;
        }
    } else {
        markdown += `## No methods available.`;
    }

    return markdown;
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<any[] | null>(() => {
        const cachedDocs = cache.get("wpilibJavaDocumentation");
        if (typeof cachedDocs === "string") {
            try {
                return JSON.parse(cachedDocs);
            } catch (error) {
                return null;
            }
        }
        return cachedDocs ?? null;
    });

    const handleSearchChange = (text: string) => {
        setSearchText(text);
        cache.set(SEARCH_TEXT_KEY, text);
    };

    const fetchDocumentation = async () => {
        if (loading) return;

        setLoading(true);

        const docs = await getDocumentation((current, total) => {
            setSearchText(`Fetching docs: ${current} / ${total}`);
        });

        cache.set("wpilibJavaDocumentation", JSON.stringify(docs ?? []))
        setData(docs ?? []);
        setLoading(false);
        setSearchText("");
    };

    return (
        <List
            searchText={searchText}
            onSearchTextChange={handleSearchChange}
            filtering={true}
            searchBarPlaceholder="Search WPILib Documentation"
            isLoading={loading}
            isShowingDetail
            actions={
                <ActionPanel title="">
                    <Action
                        title="Fetch Documentation"
                        onAction={fetchDocumentation}
                    />
                </ActionPanel>
            }
        >
            {data && !loading && data.map(item => (
                <List.Item
                    key={item.url}
                    title={item.name}
                    accessories={[{ text: item.path.replace(".html", "") }]}
                    detail={<List.Item.Detail markdown={getClassMarkdown(item)} />}
                    actions={
                        <ActionPanel>
                            <Action.OpenInBrowser url={item.url} />
                            <Action
                                title="Fetch Documentation"
                                onAction={fetchDocumentation}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}