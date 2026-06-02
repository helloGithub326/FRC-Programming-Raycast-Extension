import { List, Cache, ActionPanel, Action } from "@raycast/api";
import { useState, useEffect, useRef } from "react";
import WPILIB_DOCUMENTATION from "./wpilib-java-documentation.json"

const cache = new Cache();
const SEARCH_TEXT_KEY = "searchText";

async function getDocumentation(onProgress: (current: number, total: number) => void) {
    try {
        const response = await fetch("https://github.wpilib.org/allwpilib/docs/release/java/allclasses-index.html", {
            method: "get"
        });
        const text = await response.text();
        const htmlText = text.replace(/^updateSearchIndex\(/, '').replace(/\);$/, '');

        const regex = /href="([^"]+\.html)"[^>]*>([^<]+)<\/a>/g;
        const classesList = [];
        let match;

        while ((match = regex.exec(htmlText)) !== null) {
            const relativePath = match[1];
            const className = match[2].trim();
            
            if (relativePath.startsWith('#')) continue;
            if (className.length <= 1) continue;

            classesList.push({
                name: className,
                url: `https://github.wpilib.org/allwpilib/docs/release/java/${relativePath}`,
                path: relativePath
            });
        }

        const uniqueClasses = Array.from(new Map(classesList.map(item => [item.url, item])).values());
        const totalCount = uniqueClasses.length;

        let classResponse;
        let classText;
        let classHtmlText;

        let num = 0;
        for (const item of uniqueClasses) {
            try {
                classResponse = await fetch(item.url, {
                    method: "get"
                });
                classText = await classResponse.text();
                classHtmlText = text.replace(/^updateSearchIndex\(/, '').replace(/\);$/, '');

                num++;
                onProgress(num, totalCount);
            } catch (error) {
                console.log(error);
            }
        };

        return uniqueClasses;
    } catch (error) {
        console.log(error);
    }
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<any[] | null>(null);
    const hasFetched = useRef(false);

    const handleSearchChange = (text: string) => {
        setSearchText(text);
        cache.set(SEARCH_TEXT_KEY, text);
    };

    const fetchDocumentation = async () => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        setLoading(true);
        const docs = await getDocumentation((current, total) => {
            setSearchText(`Fetching docs: ${current} / ${total}`);
        });
        setData(docs ?? []);
        setLoading(false);
        setSearchText("");
    };

    return (
        <List
            searchText={searchText}
            onSearchTextChange={handleSearchChange}
            filtering={false}
            searchBarPlaceholder="Search WPILib Documentation"
            isShowingDetail
            isLoading={loading}
            actions={
                <ActionPanel title="Test Title">
                    <Action
                        title="Fetch Documentation"
                        onAction={fetchDocumentation}
                    />
                </ActionPanel>
            }
        >
            {data && data.map(item => (
                <List.Item
                    key={item.url}
                    title={item.name}
                    accessories={[{ text: item.path }]}
                    actions={
                        <ActionPanel>
                            <Action.OpenInBrowser url={item.url} />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}